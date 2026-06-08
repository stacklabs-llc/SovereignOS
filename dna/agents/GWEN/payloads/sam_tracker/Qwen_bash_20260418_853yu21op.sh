# 1. Purge legacy backend reference
sed -i 's|ws://.*:8080|ws://192.168.1.73:8008/mard/telemetry|g' app.js

# 2. Deploy Greeble Campaign assets to Media Vault
rsync -av ./greeble-campaign/ /dna/media/ --exclude='*.psd'

# 3. Register V2 route in M.A.R.D. Engine
echo "ROUTE /sam-v2 → /home/james/SovereignOS/public/sam-v2/" >> /etc/mard/routes.conf

# 4. CMDB schema update for Sam node (.172)
sqlite3 sovereign_now.db <<EOF
UPDATE nodes SET 
  ui_version = 'v2-mesh',
  theme_engine = 'flow-hotswap',
  frm_threshold = 0.85,
  Ω_protected = 1
WHERE node_id = '.172';
EOF

# 5. Chin-3 Audit pre-deploy
./chin3-audit.sh --target sam-tracker --quarantine firebase-artifacts