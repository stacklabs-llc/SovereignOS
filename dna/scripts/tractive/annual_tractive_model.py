import os
import glob
import math
import numpy as np
import pandas as pd
import gpxpy
from hmmlearn import hmm
import matplotlib.pyplot as plt
import seaborn as sns
import geopandas as gpd
from shapely.geometry import Point
from sklearn.cluster import KMeans
import contextily as cx

def haversine(lat1, lon1, lat2, lon2):
    if pd.isna(lat1) or pd.isna(lat2):
        return 0.0
    R = 6371000  # radius of Earth in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def simulate_paths(start_lat, start_lon, transmat, means, covars, num_paths=100, steps=100):
    states = [0, 1, 2]
    all_lons = []
    all_lats = []
    
    # 0=Resting, 1=Patrolling, 2=Hunting (assuming ordered)
    for p in range(num_paths):
        lat, lon = start_lat, start_lon
        current_state = 0 # start at rest
        
        path_lons = [lon]
        path_lats = [lat]
        
        for s in range(steps):
            # Transition
            current_state = np.random.choice(states, p=transmat[current_state])
            
            # Predict a speed log 
            speed_log = np.random.normal(means[current_state][0], math.sqrt(covars[current_state][0][0]))
            speed = max(0, np.expm1(speed_log))  # back from log1p
            
            # Approximate displacement in rough lat/lon degrees (speed * time step ~ pseudo distance)
            # Assume each step is roughly 5 mins (300s)
            dist_meters = speed * 300
            
            # Random direction
            angle = np.random.uniform(0, 2*math.pi)
            
            # Convert meters to degrees roughly
            dx_deg = (dist_meters * math.sin(angle)) / 111320.0
            dy_deg = (dist_meters * math.cos(angle)) / 110540.0
            
            lon += dx_deg
            lat += dy_deg
            
            path_lons.append(lon)
            path_lats.append(lat)
            
        all_lons.extend(path_lons)
        all_lats.extend(path_lats)
        
    return all_lats, all_lons

def main():
    print("Initiating FMJ Protocol: Aggregating Annual Telemetry...")
    base_dir = '/home/james/SovereignOS/dna/ci/TRACTIVE_GROUND_TRUTH'
    gpx_files = glob.glob(os.path.join(base_dir, '*.gpx'))
    
    records = []
    for gfile in gpx_files:
        print(f"Parsing {os.path.basename(gfile)}...")
        with open(gfile, 'r') as f:
            try:
                gpx = gpxpy.parse(f)
                for track in gpx.tracks:
                    for segment in track.segments:
                        for p in segment.points:
                            records.append({
                                'time': p.time,
                                'lat': p.latitude,
                                'lon': p.longitude,
                                'speed': p.speed
                            })
            except Exception as e:
                print(f"Skipping a bad track in {gfile}: {e}")
                
    df = pd.DataFrame(records)
    df = df.dropna(subset=['time']) # Only keep rows with valid time
    df['time'] = pd.to_datetime(df['time'], utc=True)
    df = df.sort_values('time').reset_index(drop=True)
    
    print(f"Aggregation Complete: {len(df)} total data points.")
    
    # Precompute distance and naive speed features
    df['lat_shift'] = df['lat'].shift(1)
    df['lon_shift'] = df['lon'].shift(1)
    df['time_shift'] = df['time'].shift(1)
    df['dt'] = (df['time'] - df['time_shift']).dt.total_seconds()
    
    # We use a vectorized haversine approx for speed
    def vec_haversine(lat1, lon1, lat2, lon2):
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2.0)**2
        c = 2 * np.arcsin(np.sqrt(a))
        return 6371000 * c
        
    distances = vec_haversine(df['lat_shift'].values, df['lon_shift'].values, df['lat'].values, df['lon'].values)
    calc_speeds = np.where(df['dt'].values > 0, distances / df['dt'].values, 0)
    df['speed'] = np.where(pd.notna(df['speed']), df['speed'], calc_speeds)
    df['speed'] = df['speed'].fillna(0)
    
    # Harmonic Features
    df['day_of_year'] = df['time'].dt.dayofyear
    df['sin_time'] = np.sin(2 * np.pi * df['day_of_year'] / 365.0)
    df['cos_time'] = np.cos(2 * np.pi * df['day_of_year'] / 365.0)
    
    # Train Seasonal HMM
    print("Training the Harmonic Hidden Markov Model (HMM)...")
    df['feature_speed'] = pd.Series(df['speed']).rolling(3, min_periods=1).mean()
    X = np.column_stack([
         np.log1p(df['feature_speed'].values),
         df['sin_time'].values,
         df['cos_time'].values
    ])
    
    model = hmm.GaussianHMM(n_components=3, covariance_type="diag", n_iter=50, random_state=42)
    model.fit(X)
    hidden_states = model.predict(X)
    df['state'] = hidden_states
    
    # Sorting states by speed mean exactly like earlier script
    means = model.means_[:, 0]  # First column is log_speed
    order = np.argsort(means)
    state_mapping = {order[0]: "Resting", order[1]: "Patrolling", order[2]: "Hunting"}
    df['behavior'] = df['state'].map(state_mapping)
    
    print("Seasonal Model Fit. Finding April 'High-Probability' Hideouts...")
    # Hideout Identification for April
    april_df = df[(df['time'].dt.month == 4) & (df['behavior'] == 'Resting')]
    if len(april_df) > 0:
        km = KMeans(n_clusters=3, random_state=42, n_init=10)
        km.fit(april_df[['lat', 'lon']])
        centers = km.cluster_centers_
        print("Top 3 April Hideout Coordinates (Lat, Lon):")
        with open("/home/james/SovereignOS/dna/ci/top_hideouts.txt", "w") as th:
            for i, c in enumerate(centers):
                print(f"Hideout {i+1}: {c[0]:.6f}, {c[1]:.6f}")
                th.write(f"Hideout {i+1}: {c[0]:.6f}, {c[1]:.6f}\n")
    
    print("Generating ELI5 Generative Cloud Visual...")
    
    # Monte Carlo simulation logic
    last_point = df.iloc[-1]
    last_lat, last_lon = last_point['lat'], last_point['lon']
    
    sim_lats, sim_lons = simulate_paths(
        start_lat=last_lat, start_lon=last_lon, 
        transmat=model.transmat_, 
        means=model.means_, covars=model.covars_,
        num_paths=300, steps=100
    )
    
    sim_df = pd.DataFrame({'lat': sim_lats, 'lon': sim_lons})
    sim_geom = [Point(xy) for xy in zip(sim_df['lon'], sim_df['lat'])]
    sgdf = gpd.GeoDataFrame(sim_df, geometry=sim_geom, crs="EPSG:4326").to_crs(epsg=3857)
    sgdf['x'] = sgdf.geometry.x
    sgdf['y'] = sgdf.geometry.y

    # Main plot GeoDataFrame
    geometry = [Point(xy) for xy in zip(df['lon'], df['lat'])]
    gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326").to_crs(epsg=3857)
    gdf['x'] = gdf.geometry.x
    gdf['y'] = gdf.geometry.y
    
    fig, axes = plt.subplots(1, 2, figsize=(20, 10))
    fig.patch.set_facecolor('#1a1a2e')  # Dark space background for fun contrast
    
    # PLOT 1: ANNUAL BASELINE
    ax = axes[0]
    ax.set_facecolor('#1a1a2e')
    # Downsample for KDE performance
    plot_gdf = gdf.sample(min(10000, len(gdf)), random_state=42)
    sns.kdeplot(x=plot_gdf['x'], y=plot_gdf['y'], cmap='magma', fill=True, alpha=0.6, ax=ax, zorder=2)
    try:
        cx.add_basemap(ax, source=cx.providers.CartoDB.DarkMatter)
    except:
        pass
    ax.set_xticks([]); ax.set_yticks([])
    ax.set_title("12-Month Historical Density (Where She Spent The Year)", color="white", fontsize=18)
    
    # PLOT 2: MONTE CARLO ELI5
    ax2 = axes[1]
    ax2.set_facecolor('#1a1a2e')
    # Plot the predicted path heatmap in glowing neon colors
    plot_sgdf = sgdf.sample(min(5000, len(sgdf)), random_state=42)
    sns.kdeplot(x=plot_sgdf['x'], y=plot_sgdf['y'], cmap='plasma', fill=True, alpha=0.7, ax=ax2, zorder=2)
    # Mark the start location prominently
    start_pt = gpd.GeoSeries([Point(last_lon, last_lat)], crs="EPSG:4326").to_crs(epsg=3857)
    ax2.scatter(start_pt.x, start_pt.y, color='#00ffcc', s=300, marker='*', edgecolor='black', zorder=5, label='Last Known Location')
    
    try:
        cx.add_basemap(ax2, source=cx.providers.CartoDB.DarkMatter)
    except:
        pass
    ax2.legend(facecolor='black', labelcolor='white')
    ax2.set_xticks([]); ax2.set_yticks([])
    ax2.set_title("The 'Space Madness' Prediction Cloud (Next 24 Hours)", color="white", fontsize=18)
    
    fig.suptitle("Metsy Matrix FMJ: Annual Baseline vs Predicted Temporal Trajectory", color="#00ffcc", fontsize=24, y=1.02)
    plt.tight_layout()
    
    out_img = '/home/james/SovereignOS/dna/ci/TRACTIVE_GROUND_TRUTH/annual_vs_weekly.png'
    plt.savefig(out_img, dpi=200, bbox_inches='tight', facecolor='#1a1a2e')
    print(f"Mission Accomplished. ELI5 map dropped at {out_img}")

if __name__ == "__main__":
    main()
