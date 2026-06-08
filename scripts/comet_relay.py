import asyncio
import json
import sqlite3
import os
import websockets
import aiohttp
from datetime import datetime

DB_PATH = "/home/james/SovereignOS/dna/sovereign_now.db"
PORT = 8015
SDLC_PORTAL_URL = "http://localhost:8095/api/tickets"

clients = set()

def query_db(query, args=(), one=False, commit=False):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    try:
        cur.execute(query, args)
        if commit:
            conn.commit()
            lastrowid = cur.lastrowid
            return lastrowid
        rv = cur.fetchall()
        return (rv[0] if rv else None) if one else rv
    finally:
        conn.close()

async def get_initial_state():
    # Fetch recent messages (last 50)
    msg_rows = query_db("""
        SELECT id, sender_id, message_text, channel_name, created_at 
        FROM comet_messages 
        ORDER BY created_at ASC 
        LIMIT 50
    """)
    messages = []
    for r in msg_rows:
        messages.append({
            "id": r["id"],
            "sender_id": r["sender_id"],
            "message_text": r["message_text"],
            "channel_name": r["channel_name"],
            "created_at": r["created_at"]
        })

    # Fetch active grocery items
    groc_rows = query_db("""
        SELECT id, item_name, quantity, status, compiled_at 
        FROM comet_grocery_lists 
        WHERE status != 'DELETED'
        ORDER BY compiled_at ASC
    """)
    groceries = []
    for r in groc_rows:
        groceries.append({
            "id": r["id"],
            "item_name": r["item_name"],
            "quantity": r["quantity"],
            "status": r["status"],
            "compiled_at": r["compiled_at"]
        })

    # Fetch active priority alerts
    alert_rows = query_db("""
        SELECT id, alert_type, status, sys_ticket_id 
        FROM comet_priority_alerts 
        WHERE status = 'ACTIVE'
    """)
    alerts = []
    for r in alert_rows:
        alerts.append({
            "id": r["id"],
            "alert_type": r["alert_type"],
            "status": r["status"],
            "sys_ticket_id": r["sys_ticket_id"]
        })

    return {
        "type": "state",
        "messages": messages,
        "groceries": groceries,
        "alerts": alerts
    }

async def broadcast(message):
    if not clients:
        return
    payload = json.dumps(message)
    await asyncio.gather(*[client.send(payload) for client in clients], return_exceptions=True)

async def create_clio_ticket(alert_type):
    payload = {
        "ticket_type": "Incident",
        "title": f"Comet Priority Alert: {alert_type}",
        "description": f"Priority assistance alert for '{alert_type}' raised from mid-century Toon Town Sputnik messenger console.",
        "status": "OPEN",
        "priority": "P1",
        "assigned_to": "Pilot",
        "affected_ci": "comet_messenger"
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(SDLC_PORTAL_URL, json=payload, timeout=5) as resp:
                if resp.status in (200, 201):
                    res_data = await resp.json()
                    ticket_id = res_data.get("id")
                    print(f"[CLIO TICKET CREATED] Ticket ID: {ticket_id}")
                    return ticket_id
                else:
                    print(f"[CLIO TICKET ERROR] Failed with status {resp.status}")
    except Exception as e:
        print(f"[CLIO TICKET EXCEPTION] Failed to connect to SDLC Portal: {e}")
    return None

async def resolve_clio_ticket(ticket_id):
    if not ticket_id:
        return
    payload = {
        "status": "RESOLVED",
        "work_notes": "Resolved automatically from Comet Messenger."
    }
    try:
        async with aiohttp.ClientSession() as session:
            async with session.put(f"{SDLC_PORTAL_URL}/{ticket_id}", json=payload, timeout=5) as resp:
                if resp.status in (200, 201):
                    print(f"[CLIO TICKET RESOLVED] Ticket ID: {ticket_id}")
                else:
                    print(f"[CLIO TICKET RESOLVE ERROR] Failed with status {resp.status}")
    except Exception as e:
        print(f"[CLIO TICKET RESOLVE EXCEPTION] Failed to resolve: {e}")

async def handle_client(websocket):
    clients.add(websocket)
    print(f"[WS CLIENT CONNECTED] Total clients: {len(clients)}")
    try:
        # Send initial state
        state = await get_initial_state()
        await websocket.send(json.dumps(state))

        async for message_str in websocket:
            try:
                data = json.loads(message_str)
            except Exception as e:
                print(f"[WS JSON ERROR] {e}")
                continue

            msg_type = data.get("type")

            if msg_type == "chat":
                sender_id = data.get("sender_id", "Anonymous")
                message_text = data.get("message_text", "")
                channel_name = data.get("channel_name", "general")
                created_at = datetime.now().isoformat()
                
                new_id = query_db("""
                    INSERT INTO comet_messages (sender_id, message_text, channel_name, created_at)
                    VALUES (?, ?, ?, ?)
                """, (sender_id, message_text, channel_name, created_at), commit=True)
                
                await broadcast({
                    "type": "chat",
                    "id": new_id,
                    "sender_id": sender_id,
                    "message_text": message_text,
                    "channel_name": channel_name,
                    "created_at": created_at
                })

            elif msg_type == "grocery_add":
                item_name = data.get("item_name", "")
                quantity = data.get("quantity", "1")
                compiled_at = datetime.now().isoformat()
                
                new_id = query_db("""
                    INSERT INTO comet_grocery_lists (item_name, quantity, status, compiled_at)
                    VALUES (?, ?, 'PENDING', ?)
                """, (item_name, quantity, compiled_at), commit=True)
                
                await broadcast({
                    "type": "grocery_add",
                    "id": new_id,
                    "item_name": item_name,
                    "quantity": quantity,
                    "status": "PENDING",
                    "compiled_at": compiled_at
                })

            elif msg_type == "grocery_toggle":
                item_id = data.get("id")
                new_status = data.get("status", "COMPLETED")
                
                query_db("""
                    UPDATE comet_grocery_lists
                    SET status = ?
                    WHERE id = ?
                """, (new_status, item_id), commit=True)
                
                await broadcast({
                    "type": "grocery_toggle",
                    "id": item_id,
                    "status": new_status
                })

            elif msg_type == "priority_alert":
                alert_type = data.get("alert_type", "General")
                
                # Submit incident ticket to Clio
                ticket_id = await create_clio_ticket(alert_type)
                
                new_id = query_db("""
                    INSERT INTO comet_priority_alerts (alert_type, status, sys_ticket_id)
                    VALUES (?, 'ACTIVE', ?)
                """, (alert_type, ticket_id), commit=True)
                
                await broadcast({
                    "type": "priority_alert",
                    "id": new_id,
                    "alert_type": alert_type,
                    "status": "ACTIVE",
                    "sys_ticket_id": ticket_id
                })

            elif msg_type == "priority_resolve":
                alert_id = data.get("id")
                
                # Fetch ticket ID to close it
                row = query_db("SELECT sys_ticket_id FROM comet_priority_alerts WHERE id = ?", (alert_id,), one=True)
                ticket_id = row["sys_ticket_id"] if row else None
                
                if ticket_id:
                    await resolve_clio_ticket(ticket_id)
                
                query_db("""
                    UPDATE comet_priority_alerts
                    SET status = 'RESOLVED'
                    WHERE id = ?
                """, (alert_id,), commit=True)
                
                await broadcast({
                    "type": "priority_resolve",
                    "id": alert_id,
                    "status": "RESOLVED"
                })

    except websockets.exceptions.ConnectionClosed as e:
        print(f"[WS CLIENT DISCONNECTED] {e}")
    finally:
        clients.remove(websocket)

async def main():
    print(f"📡 Starting Comet Relay WebSockets Server on Port {PORT}...")
    async with websockets.serve(handle_client, "0.0.0.0", PORT):
        await asyncio.Future() # run forever

if __name__ == "__main__":
    asyncio.run(main())
