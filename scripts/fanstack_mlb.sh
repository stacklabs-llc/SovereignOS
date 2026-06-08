#!/bin/bash

PYTHON_SCRIPT="/home/james/SovereignOS/scripts/deploy_game_room.py"

if [ "$1" == "today" ]; then
    echo "Fetching today's MLB schedule..."
    python3 -c "
import requests
import datetime
today = datetime.datetime.now().strftime('%Y-%m-%d')
try:
    res = requests.get(f'https://statsapi.mlb.com/api/v1/schedule?sportId=1&date={today}', timeout=5).json()
    games = res.get('dates', [{}])[0].get('games', [])
    if not games:
        print('No games scheduled for today.')
    for g in games:
        pk = g['gamePk']
        away = g['teams']['away']['team'].get('name', 'AWAY')[:3].upper()
        home = g['teams']['home']['team'].get('name', 'HOME')[:3].upper()
        status = g['status']['detailedState']
        time = g.get('gameDate', '')[11:16] + ' Zulu' # Display roughly
        print(f'{pk} : {away} @ {home} - {status} ({time})')
except Exception as e:
    print('Failed to load schedule:', e)
"
    exit 0
fi

if [ -z "$1" ]; then
    echo "FanStack MLB Operations Pipeline"
    echo "Usage:"
    echo "  ./fanstack_mlb.sh today"
    echo "  ./fanstack_mlb.sh <GAME_PK> [--chaos]"
    exit 1
fi

GAME_PK="$1"
shift

echo "Running Yardbarker Entropy Pump to refresh ambient context..."
python3 "/home/james/SovereignOS/scripts/yardbarker_entropy_pump.py"
echo "------------------------------------------------------------"

python3 "$PYTHON_SCRIPT" "$GAME_PK" "$@"
