#!/bin/bash
cd /home/james/SovereignOS

echo "Starting missing services..."

if ! sudo ss -tulpn | grep -q ":8082 "; then
    echo "Starting CMDB API on 8082..."
    nohup python3 scripts/cmdb_server.py > /tmp/cmdb_server.log 2>&1 &
fi

if ! sudo ss -tulpn | grep -q ":8088 "; then
    echo "Starting Dead Drop Server on 8088..."
    nohup python3 scripts/dead_drop_server.py > /tmp/dead_drop.log 2>&1 &
fi

if ! sudo ss -tulpn | grep -q ":8081 "; then
    echo "Starting Argus Vision on 8081..."
    nohup python3 scripts/dynamic_argus_fix.py > /tmp/argus.log 2>&1 &
fi

if ! sudo ss -tulpn | grep -q ":5052 "; then
    echo "Starting Omega Gate UAT Dashboard on 5052..."
    nohup python3 dna/dropzone/daily_23042026/uat_live_checker.py > /tmp/uat.log 2>&1 &
fi

if ! sudo ss -tulpn | grep -q ":5051 "; then
    echo "Starting Live Edge DVR on 5051..."
    nohup python3 scripts/dvr_controller_v2.py > /tmp/dvr_5051.log 2>&1 &
fi

if ! sudo ss -tulpn | grep -q ":5056 "; then
    echo "Starting Stream Sniper Daemon on 5056..."
    nohup python3 scripts/stream_sniper_daemon.py > /tmp/stream_sniper.log 2>&1 &
fi

echo "All missing services initiated."

if ! sudo ss -tulpn | grep -q ":5007 "; then
    echo "Starting Scruffys Bar Server on 5007..."
    nohup python3 scripts/scruffys_bar_server.py > /tmp/scruffys_bar.log 2>&1 &
fi

if ! sudo ss -tulpn | grep -q ":3007 "; then
    echo "Starting Eileens Portal on 3007..."
    cd /home/james/SovereignOS/17_EileensPortal && nohup npm run dev -- --host --port 3007 > /tmp/eileens_portal.log 2>&1 &
    cd /home/james/SovereignOS
fi

if ! sudo ss -tulpn | grep -q ":3008 "; then
    echo "Starting Barbs Portal on 3008..."
    cd /home/james/SovereignOS/18_BarbsPortal && nohup npm run dev -- --host --port 3008 > /tmp/barbs_portal.log 2>&1 &
    cd /home/james/SovereignOS
fi

if ! sudo ss -tulpn | grep -q ":8012 "; then
    echo "Starting Sovereign Mesh Relay on 8012..."
    nohup python3 scripts/sovereign_mesh_relay.py > /tmp/sovereign_mesh_relay.log 2>&1 &
fi
