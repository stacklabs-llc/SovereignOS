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


class PinCreate(BaseModel):
    game_pk: str
    x_pct: float
    y_pct: float
    author: str
    comment: str


@router.get("/api/pins")
async def get_pins(game_pk: str = None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    if game_pk:
        cur.execute("SELECT * FROM ui_pins WHERE game_pk = ? AND status = 'active' ORDER BY timestamp DESC", (game_pk,))
    else:
        cur.execute("SELECT * FROM ui_pins WHERE status = 'active' ORDER BY timestamp DESC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return {"status": "success", "pins": rows}


@router.post("/api/pins")
async def create_pin(pin: PinCreate):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    timestamp = datetime.now().isoformat()
    try:
        cur.execute("""
            INSERT INTO ui_pins (game_pk, x_pct, y_pct, author, comment, timestamp, status)
            VALUES (?, ?, ?, ?, ?, ?, 'active')
        """, (pin.game_pk, pin.x_pct, pin.y_pct, pin.author, pin.comment, timestamp))
        conn.commit()
        pin_id = cur.lastrowid
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
    conn.close()
    return {"status": "success", "id": pin_id, "timestamp": timestamp}


@router.delete("/api/pins/{pin_id}")
async def delete_pin(pin_id: int):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM ui_pins WHERE id = ?", (pin_id,))
        conn.commit()
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))
    conn.close()
    return {"status": "success", "message": f"Deleted pin {pin_id}"}


def resolve_player_id(player_val: str) -> int:
    if not player_val:
        return None
    try:
        return int(player_val)
    except ValueError:
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT sys_id FROM mlb_rosters WHERE player_name = ? COLLATE NOCASE LIMIT 1", (player_val,))
        row = cur.fetchone()
        conn.close()
        if row:
            match = re.search(r'\d+', row[0])
            if match:
                return int(match.group())
    return None


@router.get("/api/sports/telemetry/matchup-prediction")
async def get_matchup_prediction_api(batter: str, pitcher: str):
    """
    Exposes matchup predictive odds.
    """
    batter_id = resolve_player_id(batter)
    pitcher_id = resolve_player_id(pitcher)

    if not batter_id or not pitcher_id:
        return {
            "source": "invalid-players",
            "total_matchups": 0,
            "strikeout_prob": 22.0,
            "hit_prob": 25.0,
            "walk_prob": 8.0
        }

    intelligence_db = "/home/james/SovereignOS/sovereign_intelligence.db"
    conn = sqlite3.connect(intelligence_db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    try:
        # 1. Try head-to-head matchup history
        cur.execute("""
            SELECT
                COUNT(*) as total_matchups,
                COUNT(*) FILTER (WHERE events = 'strikeout') * 100.0 / COUNT(*) as strikeout_prob,
                COUNT(*) FILTER (WHERE events IN ('single', 'double', 'triple', 'home_run')) * 100.0 / COUNT(*) as hit_prob,
                COUNT(*) FILTER (WHERE events = 'walk') * 100.0 / COUNT(*) as walk_prob
            FROM statcast_pitches
            WHERE batter = ? AND pitcher = ?;
        """, (batter_id, pitcher_id))
        row = cur.fetchone()

        if row and row["total_matchups"] > 0:
            return {
                "source": "head-to-head",
                "total_matchups": row["total_matchups"],
                "strikeout_prob": round(row["strikeout_prob"], 1) if row["strikeout_prob"] is not None else 0.0,
                "hit_prob": round(row["hit_prob"], 1) if row["hit_prob"] is not None else 0.0,
                "walk_prob": round(row["walk_prob"], 1) if row["walk_prob"] is not None else 0.0
            }

        # 2. If no head-to-head, get pitcher's dominant pitch type
        cur.execute("""
            SELECT pitch_name, COUNT(*) as c
            FROM statcast_pitches
            WHERE pitcher = ? AND pitch_name IS NOT NULL AND pitch_name != '' AND pitch_name != '---'
            GROUP BY pitch_name
            ORDER BY c DESC
            LIMIT 1
        """, (pitcher_id,))
        p_row = cur.fetchone()

        dominant_pitch = p_row["pitch_name"] if p_row else None

        if dominant_pitch:
            # Try batter's splits against this dominant pitch type
            cur.execute("""
                SELECT
                    COUNT(*) as total_matchups,
                    COUNT(*) FILTER (WHERE events = 'strikeout') * 100.0 / COUNT(*) as strikeout_prob,
                    COUNT(*) FILTER (WHERE events IN ('single', 'double', 'triple', 'home_run')) * 100.0 / COUNT(*) as hit_prob,
                    COUNT(*) FILTER (WHERE events = 'walk') * 100.0 / COUNT(*) as walk_prob
                FROM statcast_pitches
                WHERE batter = ? AND pitch_name = ?;
            """, (batter_id, dominant_pitch))
            b_row = cur.fetchone()

            if b_row and b_row["total_matchups"] > 0:
                return {
                    "source": f"splits_vs_{dominant_pitch}",
                    "total_matchups": b_row["total_matchups"],
                    "strikeout_prob": round(b_row["strikeout_prob"], 1) if b_row["strikeout_prob"] is not None else 0.0,
                    "hit_prob": round(b_row["hit_prob"], 1) if b_row["hit_prob"] is not None else 0.0,
                    "walk_prob": round(b_row["walk_prob"], 1) if b_row["walk_prob"] is not None else 0.0
                }

        # 3. Fallback: Batter's overall splits against all pitch types
        cur.execute("""
            SELECT
                COUNT(*) as total_matchups,
                COUNT(*) FILTER (WHERE events = 'strikeout') * 100.0 / COUNT(*) as strikeout_prob,
                COUNT(*) FILTER (WHERE events IN ('single', 'double', 'triple', 'home_run')) * 100.0 / COUNT(*) as hit_prob,
                COUNT(*) FILTER (WHERE events = 'walk') * 100.0 / COUNT(*) as walk_prob
            FROM statcast_pitches
            WHERE batter = ?;
        """, (batter_id,))
        fallback_row = cur.fetchone()

        if fallback_row and fallback_row["total_matchups"] > 0:
            return {
                "source": "batter-overall",
                "total_matchups": fallback_row["total_matchups"],
                "strikeout_prob": round(fallback_row["strikeout_prob"], 1) if fallback_row["strikeout_prob"] is not None else 0.0,
                "hit_prob": round(fallback_row["hit_prob"], 1) if fallback_row["hit_prob"] is not None else 0.0,
                "walk_prob": round(fallback_row["walk_prob"], 1) if fallback_row["walk_prob"] is not None else 0.0
            }

        # 4. Final safety fallback
        return {
            "source": "league-average",
            "total_matchups": 0,
            "strikeout_prob": 22.0,
            "hit_prob": 25.0,
            "walk_prob": 8.0
        }

    except Exception as e:
        print(f"[API_PREDICTION_ERROR] {e}")
        return {
            "source": "error-fallback",
            "total_matchups": 0,
            "strikeout_prob": 22.0,
            "hit_prob": 25.0,
            "walk_prob": 8.0
        }
    finally:
        conn.close()




