#!/usr/bin/env python3
import sqlite3

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT governance FROM persona WHERE user_name = 'the_chop_shop'")
    row = cursor.fetchone()
    if not row:
        print("[ERROR] the_chop_shop persona not found in database.")
        return

    governance = row[0]

    substring = 'referring to "Truist Park"'
    if substring in governance:
        lines = governance.splitlines()
        new_lines = []
        for line in lines:
            if substring in line:
                print(f"[SUCCESS] Removing Truist Park governance line: {line}")
                continue
            new_lines.append(line)
        governance = "\n".join(new_lines)
        governance = governance.replace('\n\n\n', '\n\n')
    else:
        print("[WARNING] Truist Park safety rule not found in governance.")

    # Update database
    cursor.execute("UPDATE persona SET governance = ? WHERE user_name = 'the_chop_shop'", (governance,))
    conn.commit()
    conn.close()
    print("[MIGRATION DONE] Database updated successfully for the_chop_shop governance.")

if __name__ == '__main__':
    main()
