import re
import json

export_file = '/home/james/SovereignOS/dna/vault/personas/sovereign_personas_export_02.md'
out_file = '/home/james/SovereignOS/scratch/parsed_teams.json'

def parse():
    with open(export_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Split by ## username
    sections = re.split(r'\n##\s+', content)
    mappings = {}
    for sec in sections[1:]:
        lines = sec.split('\n')
        username = lines[0].strip().lower()
        
        # Find Team
        team = None
        for line in lines[1:]:
            m = re.search(r'\*\*Team:\*\*\s*([a-zA-Z0-9_-]+)', line)
            if m:
                team = m.group(1).strip()
                break
        if username and team:
            mappings[username] = team
            
    with open(out_file, 'w') as f:
        json.dump(mappings, f, indent=2)
        
    print(f"Parsed {len(mappings)} personas from export.")

if __name__ == '__main__':
    parse()
