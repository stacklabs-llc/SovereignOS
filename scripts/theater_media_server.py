import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import hashlib

app = FastAPI(title="Sovereign Cinema Media Server")

# Allow CORS for the kiosk
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the media vault natively, StaticFiles supports HTTP Range (206 Partial Content) out of the box
MEDIA_VAULT_PATH = "/home/james/SovereignOS/media_vault"

if not os.path.exists(MEDIA_VAULT_PATH):
    print(f"CRITICAL: Media Vault not found at {MEDIA_VAULT_PATH}")
    # Create it so it doesn't crash
    os.makedirs(MEDIA_VAULT_PATH, exist_ok=True)

@app.get("/api/media/{category}")
def get_media(category: str):
    valid_categories = {"tv_shows": "TV_Shows", "movies": "Movies"}
    if category.lower() not in valid_categories:
        return {"error": "Invalid category"}
        
    search_paths = []
    if category.lower() == "movies":
        search_paths.append(os.path.join(MEDIA_VAULT_PATH, "Movies"))
    else:
        search_paths.append(os.path.join(MEDIA_VAULT_PATH, "TV_Shows"))
        # Sonarr is dropping root folders directly into media_vault
        for d in os.listdir(MEDIA_VAULT_PATH):
            full_path = os.path.join(MEDIA_VAULT_PATH, d)
            if os.path.isdir(full_path) and d not in ["Movies", "TV_Shows"] and not d.startswith("0"):
                search_paths.append(full_path)
                
    items = []
    for folder_path in search_paths:
        if not os.path.exists(folder_path):
            continue
        for root, dirs, files in os.walk(folder_path, followlinks=True):
            for file in files:
                if file.endswith(('.mp4', '.mkv', '.avi')):
                    rel_path = os.path.relpath(os.path.join(root, file), MEDIA_VAULT_PATH)
                    items.append({
                        "id": file,
                        "title": os.path.splitext(file)[0].replace(".", " "),
                        "video_url": f"/stream/{rel_path}",
                        "image": f"/01_Assets/Images/poster_{(int(hashlib.md5(file.encode()).hexdigest(), 16) % 3) + 1}.png" 
                    })
    return items

app.mount("/", StaticFiles(directory=MEDIA_VAULT_PATH), name="media_vault")

if __name__ == "__main__":
    print("Initializing Sovereign Cinema Media Streaming Engine on port 8085...")
    uvicorn.run(app, host="0.0.0.0", port=8085, access_log=False)
