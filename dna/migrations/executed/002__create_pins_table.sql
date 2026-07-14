-- Database Migration: Create ui_pins table
-- Created at: 2026-07-02
CREATE TABLE IF NOT EXISTS ui_pins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_pk TEXT,
    x_pct REAL NOT NULL,
    y_pct REAL NOT NULL,
    author TEXT,
    comment TEXT,
    timestamp TEXT NOT NULL,
    status TEXT DEFAULT 'active'
);
