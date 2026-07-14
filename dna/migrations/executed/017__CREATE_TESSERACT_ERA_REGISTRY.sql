BEGIN TRANSACTION;

-- Table to map historical uniform eras and their rendering tokens
CREATE TABLE IF NOT EXISTS u_tesseract_era_registry (
    sys_id TEXT PRIMARY KEY,
    u_era_key TEXT NOT NULL UNIQUE,       -- e.g., '1900', '1920', '1940', '1970'
    u_era_label TEXT NOT NULL,
    u_texture_normal_map TEXT,           -- Path to R3F normal texture
    u_material_sheen REAL DEFAULT 0.0,   -- Matte wool (0.0) vs Polyester double-knit (0.8)
    u_mesh_profile TEXT DEFAULT 'classic'-- 'classic', 'button_down', 'sleeveless', 'baggy'
);

-- Register the 7 distinct uniform eras
INSERT OR REPLACE INTO u_tesseract_era_registry (sys_id, u_era_key, u_era_label, u_texture_normal_map, u_material_sheen, u_mesh_profile)
VALUES
('E1', '1900', '1900s-1910s: Heavy Wool', '/textures/heavy_wool_normal.png', 0.0, 'classic'),
('E2', '1920', '1920s-1930s: Zippers', '/textures/flat_wool_normal.png', 0.1, 'zipper_front'),
('E3', '1940', '1940s-1950s: Sleeveless Vests', '/textures/synthetic_blend_normal.png', 0.2, 'sleeveless_vest'),
('E4', '1960', '1960s: Double-Knits & Names', '/textures/orlon_blend_normal.png', 0.3, 'button_down'),
('E5', '1970', '1970s: Polyester Revolution', '/textures/polyester_sheen_normal.png', 0.8, 'elastic_beltless'),
('E6', '1980', '1980s-1990s: Baggy Retro', '/textures/retro_cotton_normal.png', 0.2, 'baggy_loose'),
('E7', '2000', '2000s-Present: Performance Wear', '/textures/micro_mesh_normal.png', 0.4, 'form_fitting');

COMMIT;
