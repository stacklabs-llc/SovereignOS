import sqlite3

DB_PATH = '/home/james/SovereignOS/dna/sovereign_now.db'

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    print("--- Unique teams in persona table ---")
    cursor.execute("SELECT DISTINCT team FROM persona")
    print([r['team'] for r in cursor.fetchall()])
    
    print("\n--- Unique assigned_to in cmdb_ci table ---")
    cursor.execute("SELECT DISTINCT assigned_to FROM cmdb_ci")
    print([r['assigned_to'] for r in cursor.fetchall()])
    
    print("\n--- Diamondbacks personas in persona table ---")
    cursor.execute("SELECT user_name, team FROM persona WHERE user_name LIKE '%drinker%' OR user_name LIKE '%burnes%'")
    for r in cursor.fetchall():
        print(f"{r['user_name']}: {r['team']}")
        
    conn.close()

if __name__ == '__main__':
    main()
