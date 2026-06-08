#!/bin/bash
# sovereign_rip.sh - Fast context grab utility
# Run this from the terminal instead of asking an AI proxy

CLAUDE_SESSION_DIR=$(find /home/james/SovereignOS/dna/agents/CLAUDE/active_sessions -maxdepth 1 -type d -printf "%T@ %p\n" | sort -n | tail -1 | cut -d' ' -f2)

echo "[*] Grabbing active Tailscale map..."
tailscale status > /tmp/ts_status.txt
echo -e "# Live Tailscale Status\n\`\`\`\n$(cat /tmp/ts_status.txt)\n\`\`\`\n" > "$CLAUDE_SESSION_DIR/TAILSCALE_CONTEXT.md"
cat /home/james/SovereignOS/sync_tailscale_cmdb.py >> "$CLAUDE_SESSION_DIR/TAILSCALE_CONTEXT.md"

echo "[*] Grabbing SDLC Tickets..."
sqlite3 -markdown /home/james/SovereignOS/scripts/sovereign_sdlc.db "SELECT id, title, status, priority, description FROM tickets WHERE status != 'CLOSED' AND status != 'RESOLVED' ORDER BY priority ASC, id DESC;" > "$CLAUDE_SESSION_DIR/SDLC_TICKETS_EXPORT.md"

echo "[*] All data securely ripped to latest active session:"
echo "--> $CLAUDE_SESSION_DIR"
