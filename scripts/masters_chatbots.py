import asyncio
import websockets
import json
import sqlite3
import os
import requests
import random
import time

GEMINI_KEY = None
try:
    with open('/home/james/SovereignOS/.env') as f:
        for line in f:
            if line.startswith('GEMINI_API_KEY='):
                GEMINI_KEY = line.strip().split('=', 1)[1]
except Exception:
    pass

GAME_TIME_MODEL = "gemini-2.5-flash"

def load_golf_fans():
    fans_list = []
    try:
        conn = sqlite3.connect('/home/james/SovereignOS/dna/sovereign_now.db')
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('''
            SELECT c.name, c.short_description, p.u_system_prompt, p.u_llm_engine, p.u_boggs_reactivity, c.operational_status, c.assigned_to, p.u_cadence
            FROM cmdb_ci c
            LEFT JOIN cmdb_ci_ai_persona p ON c.sys_id = p.sys_id
            WHERE c.sys_class_name = 'cmdb_ci_ai_persona' AND c.operational_status = 1 AND c.assigned_to = 'golf_room'
        ''')
        rows = c.fetchall()
        conn.close()
        
        for r in rows:
            name = str(r['name'])
            color = "#D4AF37" # Default Gold
            name_lower = name.lower()
            if "traditionalist" in name_lower: color = "#FFFFFF" # White
            elif "gambler" in name_lower: color = "#FF5910" # Orange
            elif "truther" in name_lower: color = "#FF0000" # Red (Tiger Sunday)
            elif "victim" in name_lower: color = "#006747" # Augusta Green
            
            fans_list.append({
                "name": name,
                "personality": str(r['short_description']),
                "model": GAME_TIME_MODEL,
                "color": color,
                "boggs_level": 2,
                "cadence": str(r['u_cadence']).lower() if r['u_cadence'] else "pacer"
            })
    except Exception as e:
        print(f"Error loading SNOW DB config: {e}")
    return fans_list

async def generate_response(model, prompt, system_instruction=None):
    if not GEMINI_KEY:
        print("NO GEMINI KEY")
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}"
        sys_text = system_instruction if system_instruction else "You are a golf fan in a fast live chat. One short sentence only. No quotes or brackets."
        
        payload = {
            "systemInstruction": {"parts": [{"text": sys_text}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.9}
        }
        res = await asyncio.to_thread(requests.post, url, json=payload, timeout=30)
        if res.status_code == 200:
            return res.json()["candidates"][0]["content"]["parts"][0]["text"].replace('\\n', ' ').strip()
    except Exception as e:
        print(f"[LLM Error on {model}]: {e}")
    return None

async def generate_commentary(model, prompt, user, color, websocket, sys_override=None):
    start = time.time()
    text = await generate_response(model, prompt, sys_override)
    if text:
        msg = {
            "type": "CHAT_MESSAGE",
            "user": user,
            "color": color,
            "text": text
        }
        await websocket.send(json.dumps(msg))
        print(f"[{user}] {text}")

def get_boggs_rule(fan, global_boggs, status_text=""):
    active_boggs = global_boggs
    if "hole in one" in status_text.lower() or "eagle" in status_text.lower():
        active_boggs = 5
        
    if active_boggs >= 5:
        return "CRITICAL INSTRUCTION: Boggs Level MAX. Maximum hype or panic. Type entirely in ALL CAPS. Maximum 30 words."
    elif active_boggs >= 4:
        return "CRITICAL INSTRUCTION: Boggs Level 4. Tense. Limit response to 2 sentences."
    else:
        return "CRITICAL INSTRUCTION: Boggs Level Low. Maintain a hushed, perfectly calm, and controlled conversational tone (Golf Voice). KEEP YOUR RESPONSE UNDER 15 WORDS."

async def chatbot_loop():
    uri = "ws://127.0.0.1:8009"
    while True:
        try:
            async with websockets.connect(uri) as websocket:
                print("Masters MARD Engine Connected to Relay (Port 8009)!")
                
                last_status = ""
                
                async for message in websocket:
                    data = json.loads(message)
                    active_fans = load_golf_fans()
                    
                    if data.get("type") == "STATE_UPDATE":
                        state = data.get("data", {})
                        status = state.get("status_msg", "")
                        global_boggs = state.get("boggs_level", 2)
                        
                        if status and status != last_status:
                            last_status = status
                            print(f"[PLAY INTERCEPT] Reaction to: {status}")
                            
                            for fan in active_fans:
                                cadence = fan.get("cadence", "pacer")
                                
                                trigger_chance = 0.0
                                if "hole in one" in status.lower() or "eagle" in status.lower() or "bogey" in status.lower():
                                    trigger_chance = 1.0 # High tension
                                elif cadence == "lurker": trigger_chance = 0.1
                                elif cadence == "pacer": trigger_chance = 0.4
                                else: trigger_chance = 0.7 # yapper
                                
                                if random.random() <= trigger_chance:
                                    boggs_rule = get_boggs_rule(fan, global_boggs, status)
                                    prompt = f"System Persona: You are '{fan['name']}'. '{fan['personality']}'. {boggs_rule} Provide a golf chat reaction to this update: {status}"
                                    asyncio.create_task(generate_commentary(fan['model'], prompt, fan['name'], fan['color'], websocket, sys_override=fan.get("personality")))
                                    
        except websockets.exceptions.ConnectionClosedError:
            print("Chatbot Disconnected...")
        except Exception as e:
            print(f"Chatbot Error: {e}")
        finally:
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(chatbot_loop())
