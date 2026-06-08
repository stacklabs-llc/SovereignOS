import requests
import time
import sys

SONARR_API_KEY = "3a86bddfeefa4c93b104f33a534ffb72"
SONARR_URL = "http://localhost:8989/api/v3"
HEADERS = {"X-Api-Key": SONARR_API_KEY, "Content-Type": "application/json"}

SABNZBD_API_KEY = "4ee070eb74734e9f9f02143533be6bdd"
NZBGEEK_API_KEY = "otB20wrndLCsNuwN6B8aeEB20ZkglNv5"

print("Waiting for Sonarr...")
for _ in range(15):
    try:
        r = requests.get(f"{SONARR_URL}/system/status", headers=HEADERS)
        if r.status_code == 200:
            break
    except:
        pass
    time.sleep(2)
else:
    print("Sonarr failed to start")
    sys.exit(1)

print("Configuring Indexer...")
indexer_payload = {
    "enableRss": True,
    "enableAutomaticSearch": True,
    "enableInteractiveSearch": True,
    "supportsRss": True,
    "supportsSearch": True,
    "protocol": "usenet",
    "name": "NZBGeek",
    "fields": [
        {"name": "baseUrl", "value": "https://api.nzbgeek.info"},
        {"name": "apiPath", "value": "/api"},
        {"name": "apiKey", "value": NZBGEEK_API_KEY},
        {"name": "categories", "value": [5030, 5040]}
    ],
    "implementationName": "Newznab",
    "implementation": "Newznab",
    "configContract": "NewznabSettings",
    "priority": 1
}
requests.post(f"{SONARR_URL}/indexer", headers=HEADERS, json=indexer_payload)

print("Configuring Download Client...")
client_payload = {
    "enable": True,
    "protocol": "usenet",
    "priority": 1,
    "removeCompletedDownloads": True,
    "removeFailedDownloads": True,
    "name": "SABnzbd",
    "fields": [
        {"name": "host", "value": "sabnzbd"},
        {"name": "port", "value": 8080},
        {"name": "useSsl", "value": False},
        {"name": "apiKey", "value": SABNZBD_API_KEY},
        {"name": "tvCategory", "value": "tv"}
    ],
    "implementationName": "SABnzbd",
    "implementation": "Sabnzbd",
    "configContract": "SabnzbdSettings"
}
requests.post(f"{SONARR_URL}/downloadclient", headers=HEADERS, json=client_payload)

print("Adding Root Folder...")
root_folder_payload = {"path": "/media_vault"}
requests.post(f"{SONARR_URL}/rootfolder", headers=HEADERS, json=root_folder_payload)

print("Fetching profiles...")
qualities = requests.get(f"{SONARR_URL}/qualityprofile", headers=HEADERS).json()
quality_id = qualities[0]['id']

print("Adding Series...")
series_payload = {
    "title": "The Handmaid's Tale",
    "seasons": [{"seasonNumber": 4, "monitored": True}],
    "path": "/media_vault/The Handmaid's Tale",
    "qualityProfileId": quality_id,
    "languageProfileId": 1,
    "tvdbId": 321239,
    "monitored": True,
    "seasonFolder": True,
    "seriesType": "standard",
    "addOptions": {
        "searchForMissingEpisodes": True
    }
}
r = requests.post(f"{SONARR_URL}/series", headers=HEADERS, json=series_payload)
print(f"Series added: {r.status_code} {r.text}")
