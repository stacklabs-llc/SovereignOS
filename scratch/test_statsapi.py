import requests
import json

url = "https://statsapi.mlb.com/api/v1.1/game/823206/feed/live"
res = requests.get(url)
if res.status_code == 200:
    data = res.json()
    venue = data.get("gameData", {}).get("venue", {})
    print("Venue dict:")
    print(json.dumps(venue, indent=2))
else:
    print(f"Failed to fetch: {res.status_code}")
