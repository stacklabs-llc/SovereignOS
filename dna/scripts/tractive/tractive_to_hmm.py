import os
import math
import numpy as np
import pandas as pd
import gpxpy
from hmmlearn import hmm
import matplotlib.pyplot as plt
import seaborn as sns
import geopandas as gpd
from shapely.geometry import Point
import contextily as cx

def calculate_bearing(lat1, lon1, lat2, lon2):
    # Calculate bearing between two lat/lon coordinates
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1
    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - (math.sin(lat1) * math.cos(lat2) * math.cos(dlon))
    initial_bearing = math.atan2(x, y)
    return math.degrees(initial_bearing)

def main():
    print("Loading GPX Ground Truth Data...")
    gpx_path = '/home/james/SovereignOS/dna/ci/TRACTIVE_GROUND_TRUTH/03312026_04072026.gpx'
    output_png = '/home/james/SovereignOS/dna/ci/TRACTIVE_GROUND_TRUTH/metsy_prediction.png'
    
    with open(gpx_path, 'r') as f:
        gpx = gpxpy.parse(f)
        
    records = []
    
    # Flatten GPX into flat records
    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                records.append({
                    'time': point.time,
                    'lat': point.latitude,
                    'lon': point.longitude,
                    'ele': point.elevation,
                    'speed': point.speed if point.speed is not None else 0.0
                })
                
    df = pd.DataFrame(records)
    if 'time' in df:
        df['time'] = pd.to_datetime(df['time'], utc=True)
        df.sort_values('time', inplace=True)
        df.reset_index(drop=True, inplace=True)
    
    print(f"Extracted {len(df)} points from GPX.")
    
    # Calculate distance and speed if missing from GPX points directly
    # Haversine distance setup
    df['lat_shift'] = df['lat'].shift(1)
    df['lon_shift'] = df['lon'].shift(1)
    df['time_shift'] = df['time'].shift(1)
    
    def haversine(lat1, lon1, lat2, lon2):
        if pd.isna(lat1) or pd.isna(lat2):
            return 0.0
        R = 6371000  # radius of Earth in meters
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
    df['dist'] = df.apply(lambda row: haversine(row['lat_shift'], row['lon_shift'], row['lat'], row['lon']), axis=1)
    df['dt'] = (df['time'] - df['time_shift']).dt.total_seconds()
    
    # Fallback to calculated speed if empty
    df['calc_speed'] = np.where(df['dt'] > 0, df['dist'] / df['dt'], 0)
    # Average speed feature
    df['feature_speed'] = df['calc_speed'].fillna(0.0)
    
    # Smooth speed over 3 periods
    df['feature_speed'] = df['feature_speed'].rolling(3, min_periods=1).mean()
    
    # 2. HMM Implementation
    print("Training the Hidden Markov Model (HMM)...")
    # Log transform speed + add a tiny bit of noise to prevent stationary distribution collapse
    X = np.log1p(df[['feature_speed']].values)
    
    # We define 3 states: Resting (The Blue Knot), Patrolling, Hunting
    model = hmm.GaussianHMM(n_components=3, covariance_type="diag", n_iter=100, random_state=42)
    model.fit(X)
    hidden_states = model.predict(X)
    df['state'] = hidden_states
    
    # Sort states by their means so State 0=Resting, 1=Patrolling, 2=Hunting
    means = model.means_.flatten()
    order = np.argsort(means)
    state_mapping = {order[0]: "Resting", order[1]: "Patrolling", order[2]: "Hunting"}
    df['behavior'] = df['state'].map(state_mapping)
    
    # The Transition Matrix
    transmat = model.transmat_
    transmat_reordered = np.zeros_like(transmat)
    for i in range(3):
        for j in range(3):
            transmat_reordered[i, j] = transmat[order[i], order[j]]

    labels = ["Resting", "Patrolling", "Hunting"]

    print("HMM Transition Matrix:")
    for i in range(3):
        print(f"From {labels[i]}:", [f"{p:.2%}" for p in transmat_reordered[i]])
        
    print("Generating the KDE Heatmap (95% Home Range) & Plotting...")
    
    # 3. Visualization mapping
    # Convert lat/lon into geopandas geometries
    geometry = [Point(xy) for xy in zip(df['lon'], df['lat'])]
    gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326")
    
    # Convert to Web Mercator for better map scaling (EPSG:3857)
    gdf = gdf.to_crs(epsg=3857)
    
    # Set up matplotlib figure
    fig, ax = plt.subplots(figsize=(12, 12))
    
    # KDE Plot for the "Blue Knot" encamped areas
    # Get X and Y coordinates out of GeoDataFrame
    gdf['x'] = gdf.geometry.x
    gdf['y'] = gdf.geometry.y
    sns.kdeplot(
        x=gdf['x'], y=gdf['y'], 
        levels=[0.05, 0.50, 1.0],  # 95% home range boundaries
        fill=True, alpha=0.4, cmap='Blues', ax=ax, zorder=2
    )

    # State colors overlay
    colors = {"Resting": "blue", "Patrolling": "gray", "Hunting": "red"}
    for b_type in ["Resting", "Patrolling", "Hunting"]:
        subset = gdf[gdf['behavior'] == b_type]
        if len(subset) > 0:
            ax.scatter(subset['x'], subset['y'], c=colors[b_type], label=b_type, s=8, alpha=0.6, zorder=3)
            
    try:
        cx.add_basemap(ax, source=cx.providers.OpenStreetMap.Mapnik)
    except Exception as e:
        print(f"Failed to add OpenStreetMap basemap: {e}")
            
    ax.legend()
    ax.set_title("Metsy Matrix: Feline Predictive Markov Model\n(95% Home Range & Behavior Classifications)", fontsize=16)
    
    # Render Transition matrix text on plot
    trans_text = "Markov Transition Probabilities:\n"
    for i in range(3):
        trans_text += f"{labels[i]} -> "
        for j in range(3):
            trans_text += f"{labels[j]}: {transmat_reordered[i,j]:.2f} | "
        trans_text = trans_text[:-2] + "\n"
        
    props = dict(boxstyle='round', facecolor='white', alpha=0.8)
    ax.text(0.02, 0.98, trans_text, transform=ax.transAxes, fontsize=10,
            verticalalignment='top', bbox=props, zorder=4)

    # Hide X and Y axes limits for aesthetic viewing
    ax.set_xticks([])
    ax.set_yticks([])

    plt.tight_layout()
    plt.savefig(output_png, dpi=200, bbox_inches='tight')
    print(f"Successfully generated prediction map at: {output_png}")

if __name__ == "__main__":
    main()
