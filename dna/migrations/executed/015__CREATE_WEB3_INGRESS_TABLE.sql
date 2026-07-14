CREATE TABLE IF NOT EXISTS u_web3_pricing_ingress (
    sys_id TEXT PRIMARY KEY,
    u_timestamp_clio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    u_token_pair TEXT NOT NULL,
    u_source_exchange TEXT NOT NULL,
    u_target_exchange TEXT NOT NULL,
    u_price_delta REAL NOT NULL,
    u_estimated_gas REAL NOT NULL,
    u_processed INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_web3_unprocessed_rifts 
ON u_web3_pricing_ingress (u_processed, u_price_delta DESC);
