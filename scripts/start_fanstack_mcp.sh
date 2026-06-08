#!/bin/bash
cd /home/james/SovereignOS
source .venv/bin/activate
exec python scripts/fanstack_mcp_server.py
