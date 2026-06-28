import asyncio
import json
import time
import websockets
import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles

# --- FASTAPI PROXY SERVER (PORT 8001) ---
fastapi_app = FastAPI(title="Masters Proxy Server")

from fastapi.middleware.cors import CORSMiddleware
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Relay State
clients = set()
chat_history = []

state = {
    "status_msg": "Awaiting Masters Telemetry...",
    "leaderboard": [],
    "event_name": "The Masters",
    "event_status": "Scheduled",
    "boggs_level": 2,
    "mard_engine": True
}

async def broadcast_state(force_global=False):
    if not clients: return
    msg = json.dumps({"type": "STATE_UPDATE", "data": state, "force_global": force_global})
    for c in list(clients):
        try: await c.send(msg)
        except: 
            clients.remove(c)

async def handle_client(ws):
    clients.add(ws)
    print("New Butler Cabin visualizer node connected!")
    await ws.send(json.dumps({"type": "STATE_UPDATE", "data": state}))
    await ws.send(json.dumps({"type": "CHAT_HISTORY", "messages": list(chat_history)}))
    
    try:
        async for message in ws:
            data = json.loads(message)
            
            if data.get("type") == "CHAT_MESSAGE":
                user = data.get("user", "")
                text = data.get("text", "")
                
                chat_msg = {"type": "CHAT_MESSAGE", "user": user, "color": data.get("color"), "text": text, "timestamp": time.strftime("%H:%M:%S")}
                out_msg = json.dumps(chat_msg)
                
                chat_history.append(chat_msg)
                if len(chat_history) > 100:
                    chat_history.pop(0)
                
                for c in list(clients):
                    try: await c.send(out_msg)
                    except: pass
            
            if data.get("type") == "CMD_SYNC_STATE":
                sync_data = data.get("data", {})
                
                state["timestamp"] = time.strftime("%H:%M:%S")
                state["status_msg"] = sync_data.get("status_msg", state["status_msg"])
                state["leaderboard"] = sync_data.get("leaderboard", state.get("leaderboard", []))
                state["event_name"] = sync_data.get("event_name", state.get("event_name", ""))
                state["event_status"] = sync_data.get("event_status", state.get("event_status", ""))
                state["boggs_level"] = sync_data.get("boggs_level", state.get("boggs_level", 2))
                
                await broadcast_state()

            if data.get("type") == "trigger_event":
                out_msg = json.dumps(data)
                for c in list(clients):
                    try: await c.send(out_msg)
                    except: pass

    except Exception as e:
        print("Disconnection:", e)
    finally:
        if ws in clients: clients.remove(ws)


@fastapi_app.websocket("/ws")
async def websocket_proxy(websocket: WebSocket):
    await websocket.accept()
    async with websockets.connect("ws://127.0.0.1:8009") as remote:
        async def forward_to_remote():
            try:
                while True:
                    data = await websocket.receive_text()
                    await remote.send(data)
            except:
                pass

        async def forward_to_client():
            try:
                async for message in remote:
                    await websocket.send_text(message)
            except:
                pass

        await asyncio.gather(forward_to_remote(), forward_to_client())

from pydantic import BaseModel
class CastRequest(BaseModel):
    url: str

@fastapi_app.post("/api/cast_tv/{tv_ip}")
async def cast_to_tv(tv_ip: str, req: CastRequest):
    import os
    print(f"Casting to {tv_ip}: {req.url}")
    # connect to adb
    os.system(f"adb connect {tv_ip}")
    # push the url intent
    os.system(f"adb -s {tv_ip}:5555 shell am start -a android.intent.action.VIEW -d \"{req.url}\"")
    return {"status": "casted", "ip": tv_ip, "url": req.url}

@fastapi_app.post("/api/sim/pause")
async def pause_sim():
    import os
    os.system("touch /tmp/masters_sim.paused")
    return {"status": "paused"}

@fastapi_app.post("/api/sim/play")
async def play_sim():
    import os
    os.system("rm -f /tmp/masters_sim.paused")
    return {"status": "playing"}

fastapi_app.mount("/", StaticFiles(directory="/home/james/SovereignOS", html=True), name="static")

async def run_fastapi():
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=8001, log_level="warning")
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    print("🚀 Masters Relay booting on 0.0.0.0:8009...")
    print("🚀 Masters Proxy Server booting on 0.0.0.0:8001 (Serving HTML & /ws)...")
    
    asyncio.create_task(run_fastapi())
    
    async with websockets.serve(handle_client, "0.0.0.0", 8009):
         await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
