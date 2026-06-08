import asyncio
import sqlite3
import uuid
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import uvicorn
import os
import websockets
import json

async def broadcast_sync():
    try:
        async with websockets.connect("ws://127.0.0.1:8008") as ws:
            await ws.send(json.dumps({"action": "SYNC_DB_PERSONAS"}))
            print("[SYNC] Broadcast sent to FanStack Mesh.")
    except Exception as e:
        print(f"[SYNC] Error broadcasting update: {e}")

app = FastAPI(title="Sovereign Persona Foundry API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = '/home/james/SovereignOS/dna/sovereign_now.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

class Persona(BaseModel):
    name: str
    team: str
    deployment_zone: str
    llm_engine: str
    boggs_reactivity: str
    cadence: str
    system_prompt: str
    status: int = 1

class ParsePayload(BaseModel):
    payload: str

@app.get("/api/personas")
async def get_personas():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT c.sys_id, c.name, c.operational_status, c.assigned_to as team, 
               p.u_deployment_zone as deployment_zone, p.u_llm_engine as llm_engine, 
               p.u_boggs_reactivity as boggs_reactivity, p.u_cadence as cadence, 
               p.u_system_prompt as system_prompt
        FROM cmdb_ci c
        JOIN cmdb_ci_ai_persona p ON c.sys_id = p.sys_id
        WHERE c.sys_class_name = 'cmdb_ci_ai_persona'
    """)
    rows = c.fetchall()
    conn.close()
    return {"personas": [dict(r) for r in rows]}

class M2MRequest(BaseModel):
    persona: str
    game_pk: str
    action: str
    reason: str = "Conduct Detrimental to the Sovereign Mesh" 

@app.post("/api/m2m_room")
async def update_m2m_room(req: M2MRequest):
    conn = get_db()
    c = conn.cursor()
    try:
        new_zone = req.game_pk if req.action == 'add' else 'BENCHED'
        c.execute("UPDATE cmdb_ci_ai_persona SET u_deployment_zone = ? WHERE sys_id IN (SELECT sys_id FROM sys_user WHERE user_name = ?)", (new_zone, req.persona))
        
        c.execute("SELECT id FROM persona WHERE user_name = ?", (req.persona,))
        p_row = c.fetchone()
        
        if req.action == 'remove':
            c.execute("DELETE FROM m2m_persona_room WHERE persona = ? AND room = ?", (req.persona, req.game_pk))
            if p_row:
                c.execute("UPDATE game_persona SET seat_state = 'benched' WHERE persona_id = ? AND game_pk = ?", (p_row['id'], req.game_pk))
            
            # THROW THEM IN THE VAULT (AWAITING 16 BARS)
            c.execute('''
                INSERT INTO sys_penalty_logs (persona, room, offense_reason, sixteen_bars)
                VALUES (?, ?, ?, NULL)
            ''', (req.persona, req.game_pk, req.reason))
        else:
            c.execute("DELETE FROM m2m_persona_room WHERE persona = ?", (req.persona,))
            prompt_overlay = f"Current Matchup Context: Deployed to Game {req.game_pk}."
            m2m_sys_id = uuid.uuid4().hex
            c.execute("INSERT INTO m2m_persona_room (sys_id, persona, room, prompt_overlay) VALUES (?, ?, ?, ?)", (m2m_sys_id, req.persona, req.game_pk, prompt_overlay))
            if p_row:
                c.execute("INSERT OR REPLACE INTO game_persona (game_pk, persona_id, seat_state, overlay) VALUES (?, ?, 'active', ?)", (req.game_pk, p_row['id'], prompt_overlay))
        
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        
    await broadcast_sync()
    return {"status": "success"}

@app.post("/api/personas")
async def create_persona(p: Persona):
    conn = get_db()
    c = conn.cursor()
    new_id = uuid.uuid4().hex
    try:
        c.execute("""
            INSERT INTO cmdb_ci (sys_id, name, sys_class_name, short_description, operational_status, assigned_to)
            VALUES (?, ?, 'cmdb_ci_ai_persona', ?, ?, ?)
        """, (new_id, p.name, p.name, p.status, p.team))
        
        c.execute("""
            INSERT INTO cmdb_ci_ai_persona (sys_id, u_llm_engine, u_system_prompt, u_deployment_zone, u_boggs_reactivity, u_cadence)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (new_id, p.llm_engine, p.system_prompt, p.deployment_zone, p.boggs_reactivity, p.cadence))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    await broadcast_sync()
    return {"status": "success", "id": new_id}

@app.put("/api/personas/{sys_id}")
async def update_persona(sys_id: str, p: dict):
    conn = get_db()
    c = conn.cursor()
    try:
        if "status" in p:
            c.execute("UPDATE cmdb_ci SET operational_status = ? WHERE sys_id = ?", (p["status"], sys_id))
        
        updates = []
        params = []
        if "boggs_reactivity" in p:
            updates.append("u_boggs_reactivity = ?")
            params.append(p["boggs_reactivity"])
        if "cadence" in p:
            updates.append("u_cadence = ?")
            params.append(p["cadence"])
        if "llm_engine" in p:
            updates.append("u_llm_engine = ?")
            params.append(p["llm_engine"])
        if "system_prompt" in p:
            updates.append("u_system_prompt = ?")
            params.append(p["system_prompt"])
        if "deployment_zone" in p:
            updates.append("u_deployment_zone = ?")
            params.append(p["deployment_zone"])
        if "context_grounding_ref" in p:
            updates.append("u_context_grounding_ref = ?")
            params.append(p["context_grounding_ref"])
            
        if updates:
            params.append(sys_id)
            query = f"UPDATE cmdb_ci_ai_persona SET {', '.join(updates)} WHERE sys_id = ?"
            c.execute(query, tuple(params))
            
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
    await broadcast_sync()
    return {"status": "success"}

@app.post("/api/personas/{sys_id}/generate_avatar")
async def generate_avatar(sys_id: str):
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT c.name, p.u_avatar_prompt 
        FROM cmdb_ci c 
        JOIN cmdb_ci_ai_persona p ON c.sys_id = p.sys_id 
        WHERE c.sys_id = ?
    """, (sys_id,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Persona not found in CMDB")
        
    persona_name = row["name"]
    prompt = row["u_avatar_prompt"] if row["u_avatar_prompt"] else f"High quality cinematic 8k profile picture portrait of {persona_name}"
    
    from dotenv import load_dotenv
    import requests
    import base64
    
    load_dotenv()
    nb_api_key = os.getenv("NANO_BANANA_API_KEY", "mock_key")
    nb_endpoint = os.getenv("NANO_BANANA_ENDPOINT", "https://api.banana.dev/v2/generate")
    
    print(f"[NANO BANANA 2] Forging avatar for {persona_name}. Prompt: {prompt}")
    
    # ── MOCK REST CALL TO NANO BANANA 2 ──
    # Replace with real endpoint implementation & payload structure when live
    try:
        # resp = requests.post(
        #     nb_endpoint,
        #     json={"prompt": prompt, "model": "nano-banana-v2"},
        #     headers={"Authorization": f"Bearer {nb_api_key}"},
        #     timeout=15
        # )
        # resp.raise_for_status()
        # image_b64 = resp.json().get("image_b64")
        # image_data = base64.b64decode(image_b64)
        
        # Simulating external REST latency...
        await asyncio.sleep(1.5)
        
        # Dummy transparent pixel for offline testing & UI validation
        image_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=")
    except Exception as e:
        print(f"[NANO BANANA 2 ERROR] {e}")
        raise HTTPException(status_code=500, detail="Avatar synthesis failed via Nano Banana 2 API.")

    os.makedirs("/home/james/SovereignOS/dna/media/avatars", exist_ok=True)
    file_path = f"/home/james/SovereignOS/dna/media/avatars/{persona_name}.png"
    
    with open(file_path, "wb") as f:
        f.write(image_data)
        
    print(f"[UI ACTION] Persona '{persona_name}' avatar saved to {file_path}")
    
    return {"status": "success", "file": file_path, "message": "Avatar synthesis successful."}

@app.post("/api/personas/parse")
async def parse_gwen_payload(payload: ParsePayload):
    text = payload.payload
    
    # Simple regex to split by numbered lines, e.g. "1. bronx_bureaucrat"
    # Or just iterate line by line
    text = text.replace('\\n', '\n')
    lines = text.split('\n')
    
    personas = []
    current_persona = None
    prompt_lines = []
    
    def save_current():
        if current_persona and current_persona.get("name"):
            current_persona["system_prompt"] = "\n".join(prompt_lines).strip()
            # Defaults
            if "team" not in current_persona: current_persona["team"] = current_gonzo_team or "Unknown"
            if "deployment_zone" not in current_persona: current_persona["deployment_zone"] = ""
            if "llm_engine" not in current_persona: current_persona["llm_engine"] = "gemini-flash"
            if "boggs_reactivity" not in current_persona: current_persona["boggs_reactivity"] = "medium"
            if "cadence" not in current_persona: current_persona["cadence"] = "pacer"
            personas.append(current_persona)
            
    name_regex = re.compile(r'^\d+\.\s+([a-zA-Z0-9_-]+)')
    gonzo_team_regex = re.compile(r'^####\s+(.*)')
    gonzo_name_regex = re.compile(r'^>\s+\*\*(?:`?)([a-zA-Z0-9_-]+)(?:`?)\*\*(?:\s+(.*))?')
    
    current_gonzo_team = ""
            
    for line in lines:
        line_s = line.strip()
        
        team_match = gonzo_team_regex.match(line_s)
        if team_match:
            # Extract team abbreviation or full name
            full_match = team_match.group(1).strip()
            if "(" in full_match and ")" in full_match:
                current_gonzo_team = full_match.split("(")[1].split(")")[0]
            else:
                current_gonzo_team = full_match
            continue
            
        gwen_match = name_regex.match(line_s)
        gonzo_match = gonzo_name_regex.match(line_s)
        
        if gwen_match:
            save_current()
            current_persona = {"name": gwen_match.group(1)}
            prompt_lines = []
        elif gonzo_match:
            save_current()
            current_persona = {"name": gonzo_match.group(1)}
            prompt_lines = []
            if gonzo_match.group(2):
                prompt_lines.append(gonzo_match.group(2))
        elif current_persona:
            if line_s.startswith("Team Allegiance:"):
                current_persona["team"] = line_s.split(":", 1)[1].strip()
            elif line_s.startswith("Deployment Zone:"):
                current_persona["deployment_zone"] = line_s.split(":", 1)[1].strip()
            elif line_s.startswith("LLM Engine:"):
                current_persona["llm_engine"] = line_s.split(":", 1)[1].strip()
            elif line_s.startswith("Boggs Reactivity:"):
                current_persona["boggs_reactivity"] = line_s.split(":", 1)[1].strip()
            elif line_s.startswith("Cadence:"):
                current_persona["cadence"] = line_s.split(":", 1)[1].strip()
            elif line_s == "" or line_s.startswith("---") or line_s.startswith("json") or line_s.startswith("{") or line_s.startswith("*"):
                pass # Ignore artifact cruft
            else:
                # Handle blockquotes in Gonzo format
                if line_s.startswith("> "):
                    line_s = line_s[2:]
                prompt_lines.append(line_s)
                
    save_current()
    
    # Now insert them safely
    conn = get_db()
    c = conn.cursor()
    inserted_count = 0
    try:
        for p in personas:
            # check if exists
            c.execute("SELECT sys_id FROM cmdb_ci WHERE name = ?", (p["name"],))
            existing = c.fetchone()
            if existing: continue # skip existing
            
            new_id = uuid.uuid4().hex
            c.execute("""
                INSERT INTO cmdb_ci (sys_id, name, sys_class_name, short_description, operational_status, assigned_to)
                VALUES (?, ?, 'cmdb_ci_ai_persona', ?, ?, ?)
            """, (new_id, p["name"], p["name"], 1, p["team"]))
            
            c.execute("""
                INSERT INTO cmdb_ci_ai_persona (sys_id, u_llm_engine, u_system_prompt, u_deployment_zone, u_boggs_reactivity, u_cadence)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (new_id, p["llm_engine"], p["system_prompt"], p["deployment_zone"], p["boggs_reactivity"], p["cadence"]))
            inserted_count += 1
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
        
    return {"status": "success", "parsed_count": len(personas), "inserted_count": inserted_count}

@app.get("/api/now/table/sys_user")
def get_sys_users(sysparm_query: str = None):
    conn = get_db()
    c = conn.cursor()
    try:
        sql = "SELECT * FROM sys_user"
        params = []
        if sysparm_query and "user_name=" in sysparm_query:
            username = sysparm_query.split("user_name=")[1].split("&")[0]
            sql += " WHERE user_name = ?"
            params.append(username)
        elif sysparm_query and "sys_id=" in sysparm_query:
            sys_id = sysparm_query.split("sys_id=")[1].split("&")[0]
            sql += " WHERE sys_id = ?"
            params.append(sys_id)
        
        c.execute(sql, tuple(params))
        rows = [dict(r) for r in c.fetchall()]
        return {"result": rows}
    finally:
        conn.close()

@app.get("/api/now/table/sys_user/{sys_id}")
def get_sys_user(sys_id: str):
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute("SELECT * FROM sys_user WHERE sys_id = ?", (sys_id,))
        row = c.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Sys ID not found")
        return {"result": dict(row)}
    finally:
        conn.close()

@app.put("/api/now/table/sys_user/{sys_id}")
async def put_sys_user(sys_id: str, request: Request):
    payload = await request.json()
    conn = get_db()
    c = conn.cursor()
    try:
        updates = []
        params = []
        for k, v in payload.items():
            updates.append(f"{k} = ?")
            params.append(v)
            
        if updates:
            params.append(sys_id)
            c.execute(f"UPDATE sys_user SET {', '.join(updates)}, sys_updated_on = CURRENT_TIMESTAMP WHERE sys_id = ?", tuple(params))
            conn.commit()
            
            # Immediately Broadcast the sync to chatbots so the change kicks in
            await broadcast_sync()
            
        return {"result": {"sys_id": sys_id, "status": "updated"}}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/api/now/table/{table}")
def get_now_table(table: str, sysparm_query: str = None):
    conn = get_db()
    c = conn.cursor()
    try:
        if not re.match(r'^[a-zA-Z0-9_]+$', table):
            raise HTTPException(status_code=400, detail="Invalid table name")
            
        sql = f"SELECT * FROM {table}"
        params = []
        if sysparm_query and "user_name=" in sysparm_query:
            username = sysparm_query.split("user_name=")[1].split("&")[0]
            sql += " WHERE user_name = ?"
            params.append(username)
        elif sysparm_query and "sys_id=" in sysparm_query:
            sys_id = sysparm_query.split("sys_id=")[1].split("&")[0]
            sql += " WHERE sys_id = ?"
            params.append(sys_id)
        
        c.execute(sql, tuple(params))
        rows = [dict(r) for r in c.fetchall()]
        return {"result": rows}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))
    finally:
        conn.close()

@app.post("/api/now/table/{table}")
async def post_now_table(table: str, req: Request):
    payload = await req.json()
    if table == "persona" and "email_alias" not in payload:
        p_name = payload.get("user_name") or payload.get("name") or payload.get("display_name") or ""
        persona_slug = p_name.lower().replace(' ', '').replace('_', '')
        payload["email_alias"] = f"sovereign.fanstack+{persona_slug}@gmail.com"
    conn = get_db()
    c = conn.cursor()
    try:
        if not re.match(r'^[a-zA-Z0-9_]+$', table):
            raise HTTPException(status_code=400, detail="Invalid table name")
            
        cols = []
        vals = []
        qs = []
        
        if "sys_id" not in payload:
            import uuid
            sys_id = uuid.uuid4().hex
            cols.append("sys_id")
            vals.append(sys_id)
            qs.append("?")
        else:
            sys_id = payload["sys_id"]
            
        for k, v in payload.items():
            cols.append(k)
            vals.append(v)
            qs.append("?")
            
        # Add timestamp defaults for ServiceNow parity
        import datetime
        now = datetime.datetime.utcnow().isoformat()
        if "sys_created_on" not in payload:
            cols.append("sys_created_on")
            vals.append(now)
            qs.append("?")
        if "sys_updated_on" not in payload:
            cols.append("sys_updated_on")
            vals.append(now)
            qs.append("?")
            
        sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(qs)})"
        c.execute(sql, tuple(vals))
        conn.commit()
        await broadcast_sync()
        return {"result": {"sys_id": sys_id, "status": "inserted"}}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.put("/api/now/table/{table}/{sys_id}")
async def put_now_table(table: str, sys_id: str, req: Request):
    payload = await req.json()
    if table == "persona" and ("user_name" in payload or "email_alias" not in payload):
        p_name = payload.get("user_name")
        if p_name:
            persona_slug = p_name.lower().replace(' ', '').replace('_', '')
            payload["email_alias"] = f"sovereign.fanstack+{persona_slug}@gmail.com"
    conn = get_db()
    c = conn.cursor()
    try:
        if not re.match(r'^[a-zA-Z0-9_]+$', table):
            raise HTTPException(status_code=400, detail="Invalid table name")
            
        updates = []
        params = []
        for k, v in payload.items():
            if k not in ["sys_id", "sys_created_on", "number"]: # Protect key fields
                updates.append(f"{k} = ?")
                params.append(v)
                
        if updates:
            import datetime
            now = datetime.datetime.utcnow().isoformat()
            updates.append("sys_updated_on = ?")
            params.append(now)
            params.append(sys_id)
            
            sql = f"UPDATE {table} SET {', '.join(updates)} WHERE sys_id = ?"
            c.execute(sql, tuple(params))
            conn.commit()
            await broadcast_sync()
            
        return {"result": {"sys_id": sys_id, "status": "updated"}}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Sovereign Persona Foundry Engine initializing on Port 8096...")
    uvicorn.run(app, host="0.0.0.0", port=8096)
