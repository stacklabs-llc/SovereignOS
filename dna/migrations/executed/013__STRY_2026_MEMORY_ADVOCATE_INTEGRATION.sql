BEGIN TRANSACTION;

-- 1. Create Relational Memory Tables
CREATE TABLE IF NOT EXISTS sys_user_persona (
    persona_id VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100),
    model_engine VARCHAR(50) DEFAULT 'gemini-2.5-flash',
    language_restriction VARCHAR(20) DEFAULT 'PG'
);

CREATE TABLE IF NOT EXISTS cmdb_ci_game_room (
    game_pk INT PRIMARY KEY,
    home_team VARCHAR(10),
    away_team VARCHAR(10),
    game_date DATE
);

CREATE TABLE IF NOT EXISTS m2m_persona_room_ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    persona_id VARCHAR(50) REFERENCES sys_user_persona(persona_id),
    game_pk INT REFERENCES cmdb_ci_game_room(game_pk),
    inning INT NOT NULL,
    half_inning VARCHAR(6) NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    comment_text TEXT NOT NULL,
    semantic_summary VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_ledger_lookup 
ON m2m_persona_room_ledger (game_pk, persona_id, inning DESC);

-- 2. Register New Advocates in sys_user_persona
INSERT OR REPLACE INTO sys_user_persona (persona_id, display_name, model_engine, language_restriction)
VALUES 
('shea_vintage', 'Vintage Shea Val', 'gemini-2.5-flash', 'PG'),
('bucky_dent_blues', 'Bucky Dent Blues', 'gemini-2.5-flash', 'DEGENERATE');

COMMIT;
