import schema_gate
import asyncio
import sqlite3
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sovereign_knot import SovereignKnotEngine, StateFractureError, DB_PATH

app = FastAPI(title="Decoupled Sovereign Knot Core Showcase")
engine = SovereignKnotEngine(DB_PATH)

class SimulationResponse(BaseModel):
    status: str
    message: str

def update_db_voltage(voltage: float):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE sys_variable SET status_value = ?, last_verified_timestamp = datetime('now') WHERE variable_key = 'PW'", (voltage,))
        conn.commit()
    finally:
        conn.close()

@app.post("/api/simulate_fracture", response_model=SimulationResponse)
async def simulate_fracture():
    """Drops the power purity voltage to 4.7V, causing a State Fracture."""
    update_db_voltage(4.7)
    # Trigger consensus evaluation to register breadcrumb and print to console immediately
    try:
        engine.evaluate_consensus()
    except StateFractureError:
        pass
    return SimulationResponse(status="FRACTURED", message="Voltage dropped to 4.7V. State Fracture triggered.")

@app.post("/api/simulate_recovery", response_model=SimulationResponse)
async def simulate_recovery():
    """Restores the power purity voltage to 5.1V, recovering the consensus."""
    update_db_voltage(5.1)
    # Trigger consensus evaluation to register breadcrumb immediately
    try:
        engine.evaluate_consensus()
    except StateFractureError:
        pass
    return SimulationResponse(status="NOMINAL", message="Voltage restored to 5.1V. Consensus recovered.")

@app.websocket("/ws/consensus")
async def websocket_consensus(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket client connected to /ws/consensus")
    try:
        while True:
            # 1. Run engine evaluation to ensure breadcrumbs are logged and rules are executed
            s_score = 0.0
            status_text = "FRACTURED"
            try:
                s_score, status_text = engine.evaluate_consensus()
            except StateFractureError:
                pass

            # 2. Extract current raw variables and calculate statuses to send to client
            variables = engine.get_variables()
            a_val = variables.get("A", 0.0)
            pw_val = variables.get("PW", 0.0)
            t_val = variables.get("T", 0.0)
            c_val = variables.get("C", 0.0)
            pi_val = variables.get("PI", 0.0)

            payload = {
                "variables": {
                    "A": a_val,
                    "PW": pw_val,
                    "T": t_val,
                    "C": c_val,
                    "PI": pi_val
                },
                "status": {
                    "A": 1.0 if a_val >= 1.0 else 0.0,
                    "PW": 1.0 if (5.05 <= pw_val <= 5.15) else 0.0,
                    "T": 1.0 if t_val >= 1.0 else 0.0,
                    "C": 1.0 if c_val >= 1.0 else 0.0,
                    "PI": 1.0 if pi_val >= 1.0 else 0.0
                },
                "s_score": s_score,
                "overall_status": status_text
            }

            await websocket.send_json(payload)
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

@app.get("/", response_class=HTMLResponse)
async def serve_dashboard():
    index_path = os.path.join(os.path.dirname(__file__), "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            return f.read()
    return HTMLResponse("index.html not found.", status_code=404)
