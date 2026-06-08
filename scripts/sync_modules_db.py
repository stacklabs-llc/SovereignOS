import sqlite3
import uuid

DB_PATH = '/home/james/SovereignOS/dna/sovereign_now.db'

def run():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # 1. Add category column if not exists
    try:
        c.execute("ALTER TABLE sys_module ADD COLUMN category TEXT DEFAULT 'utility'")
        print("Added category column to sys_module table.")
    except sqlite3.OperationalError:
        print("category column already exists in sys_module.")

    # 2. Add port column if not exists
    try:
        c.execute("ALTER TABLE sys_module ADD COLUMN port INTEGER")
        print("Added port column to sys_module table.")
    except sqlite3.OperationalError:
        print("port column already exists in sys_module.")

    # 3. Define all standard apps/stacks/utilities/configs
    apps = [
        # Active Stacks (6)
        ('fanstack', 'FanStack', 'Sovereign Portal', 'F', '#38bdf8', 1, 'stack', 3009),
        ('samtracker', 'SamTracker', 'Six Dinner Sam', 'S', '#fbbf24', 1, 'stack', 3004),
        ('catnipwars', 'Catnip Wars', 'Syndicate Sandbox', 'C', '#10b981', 1, 'stack', 7300),
        ('aethervet', 'AetherVet', 'Veterinary Portal', '🩺', '#a78bfa', 1, 'stack', 3015),
        ('anvil_twine', 'Anvil & Twine', 'Hardware & Craftsmanship', '🛠️', '#f59e0b', 1, 'stack', 3022),
        ('gonzas', 'Gonzas Convenience & Cantina', 'Convenience Store & Cantina', '🏪', '#ff007f', 1, 'stack', 3016),

        # Inactive / Decommissioned Stacks (5)
        ('wild_paws', 'Wild Paws Rescue', 'Art Rescue Sanctuary', '🐾', '#f59e0b', 0, 'stack', 3008),
        ('spite_slice', 'Spite Slice', 'Culinary Vengeance', '🍕', '#ef4444', 0, 'stack', 3019),
        ('card_turpey', 'Card Turpey', 'Predictive Memorabilia', '🃏', '#fb923c', 0, 'stack', 3016),
        ('inkwell_irony', 'Inkwell & Irony', 'Investigations', '🖋️', '#a1a1aa', 0, 'stack', 3018),
        ('stacklabs', 'StackLabs LLC', 'Edge-Native Bare-Metal Software Foundry', '💻', '#00d4ff', 1, 'stack', 3000),

        # Utilities (including converted former Stacks)
        ('gardenstack', 'GardenStack', 'Horticulture AI', '🌱', '#10b981', 1, 'utility', 3017),
        ('sovereign_cinema', 'Sovereign Cinema', 'Streaming Portal', '🎬', '#8b5cf6', 1, 'utility', 8085),
        ('sovereign_sports', 'Sovereign Sports', 'Live Stream Command', '🛡️', '#00f0ff', 1, 'utility', 3010),
        ('argus', 'ARGUS Nexus', 'Surveillance Grid', '👁️', '#66fcf1', 1, 'utility', None),
        ('itsm', 'ITSM Operations', 'SDLC & Incidents', '🔧', '#ff0033', 1, 'utility', None),
        ('persona_center', 'Advocate Command Center', 'Deployment & Visuals', '👥', '#059669', 1, 'utility', None),
        ('cinema_remote', 'Cinema Remote', 'Theater Control', '📱', '#6366f1', 1, 'utility', None),
        ('detractor_mailbag', 'Detractor Mailbag', 'Reddit Hate Triage', '🔥', '#f43f5e', 1, 'utility', None),
        ('highlight_heist', 'Universal Media Ingestor', 'Video Downloader', '📥', '#a855f7', 1, 'utility', None),
        ('prospectus', 'Investor Prospectus', 'Confidential Deck', '📄', '#38bdf8', 1, 'utility', None),
        ('presence', 'Telepresence Hub', 'Live Caller Grid', '📞', '#00d4aa', 1, 'utility', None),
        ('voice', 'Voice Heal', 'System Self-Recovery', '🎙️', '#d97706', 1, 'utility', None),
        ('town_simulation', 'Town Square', 'Stack Simulation', '🏡', '#fbbf24', 1, 'utility', None),
        ('holodex', 'Sovereign HoloDex', 'Video Synthesis Engine', '✨', '#a855f7', 1, 'utility', None),
        ('storyboard_deck', 'Storyboard Deck', 'Sequence Planner', '📋', '#38bdf8', 1, 'utility', None),
        ('savant_query', 'Savant Oracle', 'SQL Data Analytics', '📊', '#66fcf1', 1, 'utility', None),
        ('vocal_matrix', 'Vocal Matrix', 'Voice Synthesis Engine', '🗣️', '#f59e0b', 1, 'utility', None),
        ('scruffys', "Scruffy's Tavern", 'Live Chat & Advocate Interactions', '🍻', '#38bdf8', 1, 'utility', 3002),
        ('the_skew', 'The Skew (Live)', 'Daytime Sports Talk & Debate', '🎙️', '#a855f7', 1, 'utility', 8001),
        ('hot_takes', 'Hot Takes', 'High-Intensity Advocate Rants', '🔥', '#ef4444', 1, 'utility', 8000),
        ('stream_sniper', 'Stream Sniper', 'Live Target Acquisition', '🎯', '#f43f5e', 1, 'utility', 5056),
        ('rom_gallery', 'Sovereign Watch Party', 'ROM & Video Archive', '📼', '#fbbf24', 1, 'utility', 3004),
        ('artifact_gallery', 'Media Vault Matrix', 'Consolidated Artifacts', '📦', '#a855f7', 1, 'utility', None),
        ('promo_inbox', 'The Cosmic Sieve', 'Incoming Brand & Agent Messages', '📬', '#38bdf8', 1, 'utility', None),
        ('optical_ingest', 'Optical Ingest Console', 'Advocate Intake Stream', '📷', '#10b981', 1, 'utility', None),
        ('roll_call', 'Daily Roll Call', 'Morning Agent Check-In', '📋', '#fbbf24', 1, 'utility', 8000),
        ('model_arena', 'Model Battle Arena', 'LLM Performance Testing', '⚔️', '#ef4444', 1, 'utility', None),

        # Configurations
        ('app_directory', 'System Control', 'Sovereign Configuration Hub', '❖', '#ffffff', 1, 'config', 3016),
        ('system_config', 'System Config', 'Theme · Telemetry · More', '⚙️', '#ffffff', 1, 'config', None),
        ('env_indicator', 'Active Env', 'Active Environment', '🖥️', '#38bdf8', 1, 'config', None),
        ('stack_seeder', 'Stack Seeder', 'Brand Onboarding', '🌱', '#10b981', 1, 'config', None)
    ]

    for m_name, d_name, desc, icon, color, active, cat, port in apps:
        # Check if exists
        c.execute("SELECT id FROM sys_module WHERE module_name=?", (m_name,))
        row = c.fetchone()
        if row:
            c.execute("""
                UPDATE sys_module
                SET display_name=?, description=?, icon=?, color=?, active=?, category=?, port=?
                WHERE module_name=?
            """, (d_name, desc, icon, color, active, cat, port, m_name))
        else:
            c.execute("""
                INSERT INTO sys_module (id, module_name, display_name, description, icon, color, active, category, port)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (uuid.uuid4().hex, m_name, d_name, desc, icon, color, active, cat, port))

    # 4. Make sure bistro is deleted
    c.execute("DELETE FROM sys_module WHERE module_name='bistro'")
    c.execute("DELETE FROM cmdb_ci WHERE name LIKE '%bistro%'")

    # 5. Seed default m2m_stack_utility links for fanstack
    fanstack_utilities = [
        'scruffys', 'the_skew', 'hot_takes', 'stream_sniper',
        'holodex', 'rom_gallery', 'artifact_gallery',
        'persona_center', 'promo_inbox', 'savant_query',
        'optical_ingest', 'roll_call', 'model_arena'
    ]
    for util in fanstack_utilities:
        c.execute("SELECT active FROM m2m_stack_utility WHERE stack_module_name='fanstack' AND utility_module_name=?", (util,))
        row = c.fetchone()
        if row is None:
            c.execute("INSERT INTO m2m_stack_utility (stack_module_name, utility_module_name, active) VALUES ('fanstack', ?, 1)", (util,))
        else:
            c.execute("UPDATE m2m_stack_utility SET active=1 WHERE stack_module_name='fanstack' AND utility_module_name=?", (util,))

    conn.commit()
    conn.close()
    print("Database sync completed successfully!")

if __name__ == '__main__':
    run()
