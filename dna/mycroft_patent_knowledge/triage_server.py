import json
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="The Cosmic Sieve", description="Kramerica Industries Triage Valve")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

STAGING_FILE = "/home/james/SovereignOS/scripts/promo_staging.json"
CONTEXT_FILE = "/home/james/SovereignOS/scripts/fanstack_live_context.txt"

class ActionPayload(BaseModel):
    action: str
    persona: str | None = None

def load_promos():
    if not os.path.exists(STAGING_FILE): return []
    try:
        with open(STAGING_FILE, "r") as f: return json.load(f)
    except: return []

def save_promos(promos):
    with open(STAGING_FILE, "w") as f: json.dump(promos, f, indent=4)

@app.get("/")
def serve_ui():
    return FileResponse("/home/james/SovereignOS/scripts/promo_triage_desk.html")

@app.get("/api/promos")
def get_promos():
    return load_promos()

@app.post("/api/promos/{promo_id}/action")
def action_promo(promo_id: str, payload: ActionPayload):
    promos = load_promos()
    target = next((p for p in promos if p["id"] == promo_id), None)
    if not target: raise HTTPException(404, "Promo not found in Sieve")
    
    if payload.action == "inject_global":
        with open(CONTEXT_FILE, "a") as f:
            f.write("\n" + target["raw_text"])
    elif payload.action == "target_persona":
        bot_name = payload.persona.upper()
        special_text = f"[DIRECTIVE FOR {bot_name} ONLY] {target['raw_text']}"
        with open(CONTEXT_FILE, "a") as f:
            f.write("\n" + special_text)
    
    # Remove from staging (Jettison just removes it without writing to context)
    promos = [p for p in promos if p["id"] != promo_id]
    save_promos(promos)
    return {"status": "success"}

if __name__ == "__main__":
    print("🌌 THE COSMIC SIEVE is listening on http://0.0.0.0:8091")
    uvicorn.run(app, host="0.0.0.0", port=8091)
