import requests
url = "https://statsapi.mlb.com/api/v1.1/game/823206/feed/live"
data = requests.get(url).json()
away = data['gameData']['teams']['away']['abbreviation']
home = data['gameData']['teams']['home']['abbreviation']
print(f"Away: {away}, Home: {home}")
