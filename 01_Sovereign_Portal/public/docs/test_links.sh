#!/bin/bash
urls=(
  "https://192.168.1.183:5052"
  "https://192.168.1.183:3000"
  "https://192.168.1.183:3000/?room=starter"
  "https://192.168.1.183:3000/?room=the_skew"
  "https://192.168.1.183:3000/?room=holodex"
  "https://192.168.1.183:3002"
  "https://192.168.1.183:8081"
  "https://192.168.1.183:3000/science_vessel_dashboard.html"
  "https://192.168.1.183:3000/afk_commlink.html"
  "https://100.123.68.9:5052"
  "https://100.123.68.9:3000"
  "https://100.123.68.9:3002"
  "https://100.123.68.9:8081"
  "https://sov73.taila01894.ts.net/"
  "https://sov73.taila01894.ts.net/mba_pitch.html"
  "https://sov73.taila01894.ts.net/sean.html"
  "https://sov73.taila01894.ts.net/afk_commlink.html"
)

for url in "${urls[@]}"; do
  echo -n "$url : "
  curl -k -s -o /dev/null -w "%{http_code}" --max-time 3 "$url"
  echo ""
done
