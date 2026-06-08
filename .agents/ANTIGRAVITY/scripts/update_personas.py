import sqlite3
import os
import uuid

db_path = '/home/james/SovereignOS/sovereign_now.db'
md_dir = '/home/james/SovereignOS/dna/agents/personas'

personas_to_load = [
    ('dot', 'dot.md', 'Dot'),
    ('barf', 'barf.md', 'Barf'),
    ('7_train_terry', '7_train_terry.md', 'Terry'),
    ('uncle_stevie_stan', 'uncle_stevie_stan.md', 'Stan'),
    ('wardy', 'wardy.md', 'Wardy'),
    ('battery_chucker', 'battery_chucker.md', 'Battery Chucker')
]

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

for user_name, filename, display_name in personas_to_load:
    file_path = os.path.join(md_dir, filename)
    with open(file_path, 'r') as f:
        prompt = f.read()

    # Check if user exists in sys_user
    cursor.execute("SELECT sys_id FROM sys_user WHERE user_name = ?", (user_name,))
    row = cursor.fetchone()
    
    if row:
        sys_id = row[0]
        cursor.execute("UPDATE sys_user SET active = 1, first_name = ? WHERE sys_id = ?", (display_name, sys_id))
    else:
        sys_id = str(uuid.uuid4())
        cursor.execute("INSERT INTO sys_user (sys_id, user_name, first_name, active) VALUES (?, ?, ?, 1)", (sys_id, user_name, display_name))

    # Update or insert into cmdb_ci_ai_persona
    cursor.execute("SELECT sys_id FROM cmdb_ci_ai_persona WHERE sys_id = ?", (sys_id,))
    if cursor.fetchone():
        cursor.execute("UPDATE cmdb_ci_ai_persona SET u_system_prompt = ? WHERE sys_id = ?", (prompt, sys_id))
    else:
        cursor.execute("INSERT INTO cmdb_ci_ai_persona (sys_id, u_system_prompt, u_llm_engine) VALUES (?, ?, 'gemini-1.5-flash')", (sys_id, prompt))

conn.commit()
conn.close()
print("Database updated successfully.")
