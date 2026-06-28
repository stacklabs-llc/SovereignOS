import requests
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqYW1lcyIsInJvbGUiOiJwaWxvdCIsImRpc3BsYXlfbmFtZSI6IkphbWVzIiwibW9kdWxlcyI6W10sImV4cCI6MTc4MDY4Mzk3M30.EHWmcjX59cfitT1y0f92I7WAn73x5ayRrO_IrECcDPY"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}

payload = {
    "brand_name": "Catnip Syndicate",
    "bar_question": "Catnip Syndicate is a rebellious, high-society underground catnip smuggling operation. At the bar, it orders a glass of premium cream with catnip dust, plays 90s alternative rock on the jukebox, and lectures everyone on feline sovereignty.",
    "audience": "Discerning cats and syndicate members",
    "conviction": "Organic catnip is a basic feline right",
    "rivals": "Greta's AetherVet clinic and standard corporate veterinary calming agents",
    "aesthetic": "gritty, street-art, premium organic feltboard",
    "content_sources": ["Catnip Syndicate Sandbox Triggers"],
    "extra_lore": "Secretly smuggles vet-grade calming pheromones using buster's keys.",
    "enable_heel": True,
    "heel_name": "Greta the Vet",
    "heel_handle": "catnip_greta",
    "heel_trait": "Adversarial, medically rigid, hates smuggling",
    "heel_heresy_stance": "Unregulated catnip causes behavioral issues in cats; follow clinical guidelines.",
    "heel_volatility": 2.5
}

print("Sending brand onboard request...")
response = requests.post("http://127.0.0.1:8090/api/brand/onboard", headers=headers, json=payload)
print(f"Status Code: {response.status_code}")
try:
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(response.text)
