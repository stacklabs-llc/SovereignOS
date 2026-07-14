import sqlite3
import os

db_path = '/home/james/SovereignOS/dna/sovereign_now.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("Migrating sys_user avatar_urls to dynamic endpoint...")
cur.execute("SELECT user_name, avatar_url FROM sys_user WHERE avatar_url IS NOT NULL;")
sys_users = cur.fetchall()

sys_user_updated = 0
for username, avatar_url in sys_users:
    if avatar_url.startswith('https://') or avatar_url.startswith('/api/'):
        continue
    # Update to dynamic path
    new_url = f"/api/persona_image/{username}"
    cur.execute("UPDATE sys_user SET avatar_url = ? WHERE user_name = ?;", (new_url, username))
    sys_user_updated += 1

print("Migrating persona avatar_urls to dynamic endpoint...")
cur.execute("SELECT user_name, avatar_url FROM persona WHERE avatar_url IS NOT NULL;")
personas = cur.fetchall()

personas_updated = 0
for username, avatar_url in personas:
    if avatar_url.startswith('https://') or avatar_url.startswith('/api/'):
        continue
    # Update to dynamic path
    new_url = f"/api/persona_image/{username}"
    cur.execute("UPDATE persona SET avatar_url = ? WHERE user_name = ?;", (new_url, username))
    personas_updated += 1

conn.commit()
conn.close()

print(f"Migration completed. Updated {sys_user_updated} sys_user records and {personas_updated} persona records.")
