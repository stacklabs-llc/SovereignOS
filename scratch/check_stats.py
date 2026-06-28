import requests
import json

url = "https://statsapi.mlb.com/api/v1.1/game/823206/feed/live"
res = requests.get(url)
if res.status_code == 200:
    data = res.json()
    plays = data.get("liveData", {}).get("plays", {})
    current_play = plays.get("currentPlay", {})
    matchup = current_play.get("matchup", {})
    print("Matchup dict keys:")
    print(list(matchup.keys()))
    print("Matchup detail:")
    print(json.dumps(matchup, indent=2))
else:
    print("Failed")
