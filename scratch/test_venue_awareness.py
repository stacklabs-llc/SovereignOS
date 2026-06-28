import sys
sys.path.insert(0, '/home/james/SovereignOS/scripts')

from fanstack_chatbots import build_dynamic_system_instruction

def run_test():
    print("=== TESTING VENUE-AWARENESS PROMPT COMPILATION ===")
    
    # 1. Mock Game State (Mets vs Phillies at Citi Field)
    game_state = {
        "away_team": "PHI",
        "home_team": "NYM",
        "venue_name": "Citi Field",
        "venue_location": "Flushing, NY",
        "away_score": 3,
        "home_score": 4,
        "inning": "Top 7th",
        "outs": 1,
        "balls": 2,
        "strikes": 1,
        "status_msg": "Runner on first"
    }

    # 2. Mock Terry (Mets Fan - Home Team)
    terry = {
        "name": "7_train_terry",
        "team": "NYM",
        "personality": "You are Terry. You love the Mets.",
        "boggs_level": 2
    }

    # 3. Mock Ghost (Phillies Fan - Away Team)
    ghost = {
        "name": "2008_ghost",
        "team": "PHI",
        "personality": "You are 2008_ghost. You love the Phillies.",
        "boggs_level": 2
    }

    # 4. Mock Phanatic (Phillies Mascot/Fan - Away Team)
    phanatic = {
        "name": "phanatic",
        "team": "PHI",
        "personality": "You are phanatic. You represent the Phillies.",
        "boggs_level": 2
    }

    # Compile and inspect
    print("\n--- TERRY (HOME: Mets fan at Citi Field) ---")
    terry_prompt = build_dynamic_system_instruction(terry, False, True, False, game_state=game_state)
    print(terry_prompt[-300:])  # Print the end of prompt where directives are appended
    
    print("\n--- GHOST (AWAY: Phillies fan at Citi Field) ---")
    ghost_prompt = build_dynamic_system_instruction(ghost, False, True, False, game_state=game_state)
    print(ghost_prompt[-450:])
    
    print("\n--- PHANATIC (AWAY: Phillies fan at Citi Field) ---")
    phanatic_prompt = build_dynamic_system_instruction(phanatic, False, True, False, game_state=game_state)
    print(phanatic_prompt[-450:])

    # Assertions
    assert "HOME-FIELD PRIDE DIRECTIVE" in terry_prompt
    assert "Citi Field" in terry_prompt
    assert "VISITING ANTAGONIST DIRECTIVE" in ghost_prompt
    assert "Citi Field" in ghost_prompt
    assert "STRICTLY FORBIDDEN from claiming home-field advantage or saying things like 'our house'" in phanatic_prompt
    
    print("\n✅ Prompt compilation tests passed successfully!")

if __name__ == "__main__":
    run_test()
