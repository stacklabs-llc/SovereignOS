#!/usr/bin/env python3
import sqlite3

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get current values
    cursor.execute("SELECT deep_lore, governance FROM persona WHERE user_name = 'the_chop_shop'")
    row = cursor.fetchone()
    if not row:
        print("[ERROR] the_chop_shop persona not found in database.")
        return

    deep_lore, governance = row

    # Moderate deep_lore
    old_lament = '*   Anyone who refers to the stadium as "Truist Park" without a preceding sigh or a lament for "Turner Field" or "The Ted." A sign of a truly misguided soul.'
    new_lament = '*   Those who prefer classic stadium names over modern naming rights. A mild annoyance in modern baseball.'
    
    if old_lament in deep_lore:
        deep_lore = deep_lore.replace(old_lament, new_lament)
        print("[SUCCESS] Moderated Truist Park lament in deep_lore.")
    else:
        # Fallback substring replace in case of minor formatting variations
        substring = 'Anyone who refers to the stadium as "Truist Park" without a preceding sigh'
        if substring in deep_lore:
            lines = deep_lore.splitlines()
            for i, line in enumerate(lines):
                if substring in line:
                    lines[i] = new_lament
                    print(f"[SUCCESS] Moderated Truist Park lament line in deep_lore via substring match.")
            deep_lore = "\n".join(lines)
        else:
            print("[WARNING] Truist Park lament not found in deep_lore (already modified?).")

    # Moderate governance
    old_rule = '    *   Any instance of the_chop_shop referring to "Truist Park" as anything other than "the new park," "the stadium," or "not Turner Field" should be flagged for review. A positive reference to the current stadium name is highly suspicious.'
    if old_rule in governance:
        governance = governance.replace(old_rule, '')
        governance = governance.replace('\n\n\n', '\n\n')
        print("[SUCCESS] Moderated Truist Park safety rule in governance.")
    else:
        substring = 'Any instance of the_chop_shop referring to "Truist Park"'
        if substring in governance:
            lines = governance.splitlines()
            for i, line in enumerate(lines):
                if substring in line:
                    lines[i] = ''
                    print(f"[SUCCESS] Moderated Truist Park safety rule line in governance via substring match.")
            governance = "\n".join(lines)
            governance = governance.replace('\n\n\n', '\n\n')
        else:
            print("[WARNING] Truist Park safety rule not found in governance (already modified?).")

    # Update database
    cursor.execute("UPDATE persona SET deep_lore = ?, governance = ? WHERE user_name = 'the_chop_shop'", (deep_lore, governance))
    conn.commit()
    conn.close()
    print("[MIGRATION DONE] Database updated successfully for the_chop_shop.")

if __name__ == '__main__':
    main()
