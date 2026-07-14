-- ==============================================================================
-- Sovereign OS: Schema Migration - Create compliance_audit_trail Table
-- Path: /home/james/SovereignOS/dna/migrations/incoming/012__create_compliance_audit_trail.sql
-- ==============================================================================

CREATE TABLE IF NOT EXISTS compliance_audit_trail (
    audit_id VARCHAR(36) PRIMARY KEY,
    game_pk VARCHAR(20) NOT NULL,
    persona_id VARCHAR(50) NOT NULL,
    violation_type VARCHAR(100) NOT NULL,
    rejected_text TEXT NOT NULL,
    temperature REAL DEFAULT 0.9,
    sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_persona_room_validation 
ON compliance_audit_trail (persona_id, game_pk);
