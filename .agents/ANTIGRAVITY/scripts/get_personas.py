import sqlite3, json
try:
    conn = sqlite3.connect('file:/home/james/SovereignOS/sovereign_now.db?mode=ro', uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    usernames = ['dot', 'barf', '7_train_terry', 'uncle_stevie_stan', 'wardy', 'batterychucker']
    placeholders = ','.join(['?']*len(usernames))
    
    # Query 1: from sys_user
    cursor.execute(f"SELECT sys_id, user_name, active FROM sys_user WHERE LOWER(user_name) IN ({placeholders})", usernames)
    su_rows = cursor.fetchall()
    su_data = [dict(r) for r in su_rows]
    print(f"SYS_USER ROWS: {json.dumps(su_data, indent=2)}")
    
    # Query 2: Get corresponding cmdb_ci_ai_persona records
    sys_ids = [r['sys_id'] for r in su_data]
    if sys_ids:
        pl = ','.join(['?']*len(sys_ids))
        cursor.execute(f"SELECT * FROM cmdb_ci_ai_persona WHERE sys_id IN ({pl})", sys_ids)
        p_rows = cursor.fetchall()
        p_data = [dict(r) for r in p_rows]
        print(f"PERSONA ROWS: {json.dumps(p_data, indent=2)}")
except Exception as e:
    print(f"ERROR: {e}")
