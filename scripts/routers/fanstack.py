from fastapi import APIRouter, Request, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import sqlite3, os, re, uuid, time, json, subprocess, asyncio, aiohttp, shutil
from datetime import datetime, timedelta, timezone
from core.db import DB_PATH, get_db
from core.security import get_current_user, require_pilot, require_manager_or_pilot, security
from core.utils import _et_game_date

router = APIRouter()

# ── End Game Log Export API ────────────────────────────────────────────────────


@router.get("/api/hot_takes")
async def get_hot_takes(persona: str = None, limit: int = 50):
    """Retrieve persisted hot takes from sovereign_now.db."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    if persona:
        cur.execute("SELECT * FROM hot_takes WHERE persona = ? ORDER BY created_at DESC LIMIT ?", (persona, limit))
    else:
        cur.execute("SELECT * FROM hot_takes ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"hot_takes": rows}

@router.post("/api/rooms/{game_pk}/injections")
async def add_room_injection(game_pk: str, data: dict):
    """
    Pilot manual injection endpoint for related lists satirical or breaking drops.
    """
    import uuid
    import sqlite3
    from fastapi import HTTPException
    
    injection_type = data.get("injection_type", "satirical")
    headline = data.get("headline", "Manual Drop")
    content = data.get("content", "")
    weight = float(data.get("weight", 1.0))
    
    if not content:
        raise HTTPException(status_code=400, detail="Content is required")
        
    sys_id = str(uuid.uuid4())
    
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA busy_timeout = 30000")
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO room_lore_injections (sys_id, game_pk, injection_type, headline, content, weight, active, used_count)
            VALUES (?, ?, ?, ?, ?, ?, 1, 0)
        """, (sys_id, game_pk, injection_type, headline, content, weight))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
        
    conn.close()
    return {"status": "success", "sys_id": sys_id}
# ── End Hot Takes Service ─────────────────────────────────────────────────────



@router.get("/api/mlb/games")
async def get_mlb_games(
    date: str = None,
    days: int = None,
    all: bool = False
):
    """
    Returns games from mlb_schedule for use in the Deployment Zone dropdown.
    - Default: today's Scheduled/Pre-Game/In Progress games only
    - ?date=YYYY-MM-DD  → specific date
    - ?days=7           → today + next N days (rolling window for advance setup)
    - ?all=true         → full season (use sparingly — 2437 rows)
    Postponed, Suspended, and Cancelled games are always excluded.
    """
    from datetime import date as dt_date, timedelta
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    skip_statuses = ("'Postponed'", "'Suspended'", "'Cancelled'", "'Cancelled by Rain'")
    skip_clause = f"AND status NOT IN ({','.join(skip_statuses)})"

    if all:
        c.execute(f"""
            SELECT game_pk, game_date, away_team, home_team, venue, status
            FROM mlb_schedule {skip_clause}
            ORDER BY game_date, game_pk
        """)
    elif date:
        c.execute(f"""
            SELECT game_pk, game_date, away_team, home_team, venue, status
            FROM mlb_schedule WHERE game_date=? {skip_clause}
            ORDER BY game_pk
        """, (date,))
    elif days:
        today = _et_game_date()
        from datetime import date as _d
        end   = (_d.fromisoformat(today) + timedelta(days=days)).isoformat()
        c.execute(f"""
            SELECT game_pk, game_date, away_team, home_team, venue, status
            FROM mlb_schedule WHERE game_date BETWEEN ? AND ? {skip_clause}
            ORDER BY game_date, game_pk
        """, (today, end))
    else:
        today = _et_game_date()
        c.execute(f"""
            SELECT game_pk, game_date, away_team, home_team, venue, status
            FROM mlb_schedule WHERE game_date=? {skip_clause}
            ORDER BY game_pk
        """, (today,))

    rows = c.fetchall()
    conn.close()
    return {
        "status": "success",
        "count": len(rows),
        "games": [
            {
                "game_pk":   r["game_pk"],
                "game_date": r["game_date"],
                "label":     f"{r['game_pk']} — {r['away_team']} @ {r['home_team']}",
                "away_team": r["away_team"],
                "home_team": r["home_team"],
                "venue":     r["venue"],
                "status":    r["status"],
            }
            for r in rows
        ]
    }

@router.get("/api/teams")
async def get_teams():
    """Returns distinct MLB team codes from the persona table (SSOT for team dropdowns).

    NOTE: this file previously had TWO definitions of this route with different logic --
    one querying cmdb_ci/cmdb_ci_ai_persona (which was actually live, since FastAPI uses
    the first-registered match), and one querying the `persona` table (which was dead code
    and never executed). The `persona` table is what every other route in personas.py
    actually reads/writes, so that's the version kept here. If /api/teams was returning
    different team codes than you expected before this refactor, this is why -- verify
    against your live DB before treating this as final.
    """
    with get_db() as conn:
        cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT team AS assigned_to
            FROM persona
            WHERE team IS NOT NULL
              AND team != ''
              AND length(team) BETWEEN 2 AND 3
              AND team = upper(team)
              AND team NOT GLOB '*[^A-Z]*'
            ORDER BY team
        """)
        teams = [row["assigned_to"] for row in cur.fetchall()]
    return {"teams": teams}

class OverlayRule(BaseModel):
    rule_name: str
    trigger_condition: str
    overlay_action: str
    active: int = 1

@router.get("/api/sys_overlay_registry")
async def get_overlay_rules():
    """Retrieve all registered condition rules."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM sys_overlay_registry ORDER BY created_at DESC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"status": "success", "rules": rows}

@router.post("/api/sys_overlay_registry")
async def register_overlay_rule(rule: OverlayRule):
    """Register and persist a new condition rule."""
    import uuid
    from datetime import datetime
    sys_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO sys_overlay_registry (sys_id, rule_name, trigger_condition, overlay_action, active, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (sys_id, rule.rule_name, rule.trigger_condition, rule.overlay_action, rule.active, created_at))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
    conn.close()
    return {"status": "success", "sys_id": sys_id}

@router.delete("/api/sys_overlay_registry/{sys_id}")
async def delete_overlay_rule(sys_id: str):
    """Delete a registered condition rule by sys_id."""
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM sys_overlay_registry WHERE sys_id = ?", (sys_id,))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
    conn.close()
    return {"status": "success", "message": f"Deleted rule {sys_id}"}


