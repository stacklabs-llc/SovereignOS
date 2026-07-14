from fastapi import APIRouter, Request, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import sqlite3, os, re, uuid, time, json, subprocess, asyncio, aiohttp, shutil
from datetime import datetime, timedelta, timezone
from core.db import DB_PATH, get_db
from fastapi.security import HTTPAuthorizationCredentials
from core.security import (
    get_current_user, require_pilot, require_manager_or_pilot, security, _decode_token,
)

router = APIRouter()


@router.get("/api/personas")
async def list_personas(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = None
    if credentials:
        try:
            user = _decode_token(credentials.credentials)
        except Exception:
            pass

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        # Pilot/admin or anonymous sees everything
        if not user or user.get("role") in ("pilot", "admin"):
            rows = conn.execute(
                "SELECT * FROM persona ORDER BY team, user_name"
            ).fetchall()
        else:
            role_team_map = {
                "garden_client": "WEEDSTACK",
                "creator": "WEEDSTACK",
            }
            team = role_team_map.get(user.get("role"))
            if not team:
                raise HTTPException(status_code=403, detail="No persona access for this role")
            rows = conn.execute(
                "SELECT * FROM persona WHERE team = ? ORDER BY user_name",
                (team,)
            ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@router.get("/api/personas/teams")
async def list_persona_teams(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = None
    if credentials:
        try:
            user = _decode_token(credentials.credentials)
        except Exception:
            pass

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        if not user or user.get("role") in ("pilot", "admin"):
            rows = conn.execute(
                "SELECT DISTINCT team FROM persona ORDER BY team"
            ).fetchall()
            teams = [r["team"] for r in rows if r["team"]]
        else:
            role_team_map = {
                "garden_client": "WEEDSTACK",
                "creator": "WEEDSTACK",
            }
            team = role_team_map.get(user.get("role"))
            teams = [team] if team else []
        return {"teams": teams}
    finally:
        conn.close()

@router.get("/api/personas/print_dossier")
async def print_dossier_pdf(ids: str = None, background_tasks: BackgroundTasks = None):
    """Thin wrapper -- actual rendering logic lives in pdf/renderers.py (was 753 lines inline here)."""
    from pdf.renderers import print_dossier_pdf as _render
    return await _render(ids, background_tasks)



@router.get("/api/personas/{persona_id}")
async def get_persona(persona_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = None
    if credentials:
        try:
            user = _decode_token(credentials.credentials)
        except Exception:
            pass

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        row = conn.execute(
            "SELECT * FROM persona WHERE id = ? OR user_name = ?", (persona_id, persona_id)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        # Enforce scoping if authenticated
        if user and user.get("role") not in ("pilot", "admin"):
            role_team_map = {"garden_client": "WEEDSTACK", "creator": "WEEDSTACK"}
            allowed_team = role_team_map.get(user.get("role"))
            if row["team"] != allowed_team:
                raise HTTPException(status_code=403, detail="You do not have access to this persona")
                
        return dict(row)
    finally:
        conn.close()

@router.get("/api/persona_image/{persona_id}")
async def get_persona_image(persona_id: str):
    import base64, sqlite3 as _sq, glob, os
    from fastapi.responses import Response, FileResponse, RedirectResponse
    
    # 0. Check if persona_id itself consists of digits. If so, redirect directly to MLB static.
    if persona_id.isdigit():
        return RedirectResponse(
            f"https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/{persona_id}/headshot/67/current"
        )
        
    safe_id = persona_id.lower().replace(" ", "_")
    requested_norm = persona_id.lower().replace(" ", "").replace("_", "").replace("-", "")
    
    # 1. Try DB first (canonical source of truth)
    matched_row = None
    try:
        con = _sq.connect(DB_PATH)
        rows = con.execute("SELECT avatar_blob, avatar_url, user_name, id FROM persona").fetchall()
        con.close()
        
        # 1a. Exact match
        for r in rows:
            db_user_norm = r[2].lower().replace(" ", "").replace("_", "").replace("-", "") if r[2] else ""
            db_id_norm = r[3].lower().replace(" ", "").replace("_", "").replace("-", "") if r[3] else ""
            if requested_norm == db_user_norm or requested_norm == db_id_norm:
                matched_row = r
                break
                
        # 1b. Fuzzy match
        if not matched_row:
            for r in rows:
                db_user_norm = r[2].lower().replace(" ", "").replace("_", "").replace("-", "") if r[2] else ""
                db_id_norm = r[3].lower().replace(" ", "").replace("_", "").replace("-", "") if r[3] else ""
                if (db_user_norm and (db_user_norm.startswith(requested_norm) or requested_norm.startswith(db_user_norm))) or \
                   (db_id_norm and (db_id_norm.startswith(requested_norm) or requested_norm.startswith(db_id_norm))):
                    matched_row = r
                    break
    except Exception as e:
        print(f"[persona_image] DB lookup error: {e}")
        
    if matched_row:
        # If DB blob exists, serve it
        if matched_row[0]:
            try:
                blob_data = matched_row[0]
                if blob_data.startswith('data:'):
                    header, b64 = blob_data.split(',', 1)
                    mime = header.split(':')[1].split(';')[0]
                else:
                    b64 = blob_data
                    mime = 'image/png'
                return Response(content=base64.b64decode(b64), media_type=mime)
            except Exception as e:
                print(f"[persona_image] error decoding base64 blob: {e}")
                
        # If DB url exists, try to serve file from disk
        if matched_row[1]:
            raw_url = matched_row[1].lstrip("/")
            for base_dir in [
                "/home/james/SovereignOS",
                "/home/james/SovereignOS/archive_quarantine_eon1",
                "/home/james/SovereignOS/avatars",
                "/home/james/SovereignOS/15_FanStack/public"
            ]:
                candidate = os.path.normpath(os.path.join(base_dir, raw_url))
                if os.path.exists(candidate) and os.path.isfile(candidate):
                    return FileResponse(candidate)
                    
    # 2. Fall back to filesystem search
    search_dirs = [
        "/home/james/SovereignOS/avatars",
        "/home/james/SovereignOS/archive_quarantine_eon1",
        "/home/james/SovereignOS/15_FanStack/public/avatars",
        "/home/james/SovereignOS/dna/media/avatars",
        "/home/james/SovereignOS/dna/media/character_maps"
    ]
    
    for search_dir in search_dirs:
        if not os.path.exists(search_dir):
            continue
            
        # 2a. Direct file check
        for f in glob.glob(os.path.join(search_dir, f"{safe_id}.*")):
            if f.lower().endswith(('.jpg','.jpeg','.png','.jfif','.webp','.svg')):
                return FileResponse(f)
                
        # 2b. Subdirectory check - prioritize files containing 'avatar'
        sub_dir = os.path.join(search_dir, safe_id)
        files_in_sub = []
        if os.path.isdir(sub_dir):
            files_in_sub = glob.glob(os.path.join(sub_dir, "*"))
            for f in files_in_sub:
                if 'avatar' in os.path.basename(f).lower() and f.lower().endswith(('.jpg','.jpeg','.png','.jfif','.webp','.svg')):
                    return FileResponse(f)
                    
        # 2c. Walk search - prioritize files containing 'avatar'
        found_walk_files = []
        for root, dirs, files in os.walk(search_dir):
            depth = root[len(search_dir):].count(os.sep)
            if depth > 1:
                continue
            for file in files:
                file_norm = os.path.splitext(file)[0].lower().replace(" ", "").replace("_", "").replace("-", "")
                if file_norm == requested_norm or file_norm.startswith(requested_norm) or requested_norm.startswith(file_norm):
                    f = os.path.join(root, file)
                    if f.lower().endswith(('.jpg','.jpeg','.png','.jfif','.webp','.svg')):
                        found_walk_files.append(f)
                        
        for f in found_walk_files:
            if 'avatar' in os.path.basename(f).lower():
                return FileResponse(f)
                
        # 2d. Subdirectory check fallback (any image)
        if os.path.isdir(sub_dir):
            for f in files_in_sub:
                if f.lower().endswith(('.jpg','.jpeg','.png','.jfif','.webp','.svg')):
                    return FileResponse(f)
                    
        # 2e. Walk search fallback (any image)
        if found_walk_files:
            return FileResponse(found_walk_files[0])

    # 3. Fall back to mlb_rosters table matching name
    try:
        search_name = safe_id.replace("_", " ")
        con = _sq.connect(DB_PATH)
        row = con.execute(
            "SELECT sys_id FROM mlb_rosters WHERE LOWER(player_name) = ?",
            (search_name,)
        ).fetchone()
        con.close()
        if row and row[0]:
            sys_id = row[0]
            numeric_id = "".join([c for c in sys_id if c.isdigit()])
            if numeric_id:
                return RedirectResponse(
                    f"https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/{numeric_id}/headshot/67/current"
                )
    except Exception as e:
        print(f"[persona_image] MLB roster lookup error: {e}")
        
    # 4. Final fallback: return the no_clue placeholder
    fallback_path = "/home/james/SovereignOS/archive_quarantine_eon1/no_clue.jpg"
    if os.path.exists(fallback_path):
        return FileResponse(fallback_path)
        
    raise HTTPException(status_code=404, detail="Image not found")


@router.post("/api/persona_image/{persona_id}")
async def upload_persona_image_blob(persona_id: str, file: UploadFile = File(...)):
    """Store avatar as base64 blob in persona.avatar_blob — no filesystem, no rebuild needed."""
    import base64, sqlite3 as _sq
    safe_id = persona_id.lower().replace(" ", "_")
    raw = await file.read()
    mime = file.content_type or 'image/png'
    b64 = base64.b64encode(raw).decode('utf-8')
    data_url = f"data:{mime};base64,{b64}"
    avatar_path = f"/api/persona_image/{safe_id}"
    con = _sq.connect(DB_PATH)
    updated = con.execute(
        "UPDATE persona SET avatar_blob = ?, avatar_url = ? WHERE LOWER(user_name) = ? OR LOWER(id) = ?",
        (data_url, avatar_path, safe_id, safe_id)
    ).rowcount
    if updated > 0:
        con.execute(
            "UPDATE sys_user SET avatar_url = ? WHERE sys_id = (SELECT id FROM persona WHERE LOWER(user_name) = ? OR LOWER(id) = ?)",
            (avatar_path, safe_id, safe_id)
        )
    con.commit()
    con.close()
    if updated == 0:
        raise HTTPException(status_code=404, detail=f"Persona '{persona_id}' not found")
    return {"status": "success", "user_name": safe_id, "avatar_url": avatar_path}


@router.get("/api/personas/{user_name}/posts")
async def get_persona_posts(user_name: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = None
    if credentials:
        try:
            user = _decode_token(credentials.credentials)
        except Exception:
            pass

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        # Check access: non-pilots can only view their own team's personas' posts
        if user and user.get("role") not in ("pilot", "admin"):
            role_team_map = {"garden_client": "WEEDSTACK", "creator": "WEEDSTACK"}
            allowed_team = role_team_map.get(user.get("role"))
            
            p = conn.execute("SELECT team FROM persona WHERE user_name = ?", (user_name,)).fetchone()
            if not p or p["team"] != allowed_team:
                raise HTTPException(status_code=403, detail="You do not have access to this persona's posts")
        
        rows = conn.execute(
            "SELECT text, created_at, game_pk FROM game_chat WHERE persona = ? ORDER BY id DESC LIMIT 5",
            (user_name,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@router.patch("/api/personas/{persona_id}")
async def update_persona(persona_id: str, request: Request, user=Depends(get_current_user)):
    data = await request.json()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        # Check if the persona exists
        existing = conn.execute(
            "SELECT id, team, boggs_level FROM persona WHERE id = ? OR user_name = ?", (persona_id, persona_id)
        ).fetchone()

        if not existing:
            raise HTTPException(status_code=404, detail="Persona not found")

        # Non-pilots can only edit their own team's personas
        if user.get("role") not in ("pilot", "admin"):
            role_team_map = {"garden_client": "WEEDSTACK", "creator": "WEEDSTACK"}
            allowed_team = role_team_map.get(user.get("role"))
            if existing["team"] != allowed_team:
                raise HTTPException(
                    status_code=403,
                    detail="You do not have permission to edit this persona"
                )

        # Map frontend key style
        field_map = {
            "user_name":               "user_name",
            "first_name":              "display_name",
            "assigned_to":             "team",
            "u_system_prompt":         "system_prompt",
            "u_cadence":               "cadence",
            "u_boggs_reactivity":      "boggs_level",
            "u_behavior_expectations": "behavior_notes",
            "u_deep_lore":             "deep_lore",
            "u_governance_boundaries": "governance",
            "color":                   "color",
            "email_alias":             "email_alias",
            "avatar_url":              "avatar_url",
            "active":                  "active",
        }

        updates = {}
        for k, v in data.items():
            col = field_map.get(k) or k
            updates[col] = v

        # Restrict which fields non-pilots can update
        NON_PILOT_EDITABLE = {"display_name", "avatar_url", "boggs_level"}

        if user.get("role") not in ("pilot", "admin"):
            updates = {k: v for k, v in updates.items() if k in NON_PILOT_EDITABLE}

            # Cap boggs_level at 3 for non-pilots
            if "boggs_level" in updates and updates["boggs_level"] is not None:
                updates["boggs_level"] = min(int(updates["boggs_level"]), 3)

        if not updates:
            return {"status": "no_changes"}

        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [existing["id"]]
        conn.execute(f"UPDATE persona SET {set_clause} WHERE id = ?", values)
        conn.commit()
        return {"status": "updated", "persona_id": existing["id"]}
    finally:
        conn.close()


@router.get("/api/style_registry")
async def get_style_registry():
    import json
    config_path = "/home/james/SovereignOS/config/style_registry.json"
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"[style_registry] Error reading config: {e}")
    
    # Fallback registry if file is missing or corrupted
    return {
        "styles": [
            {
                "id": "90s_cardboard_comic",
                "display_name": "90s Cardboard Comic",
                "prompt_tokens": "Hand-drawn ink line-art contours, Calvin and Hobbes style, soft watercolor washes, hand-drawn dialogue bubbles, cardboard and duct tape textures, cozy 90s treehouse aesthetic",
                "reference_asset": "image_35b3f6.jpg",
                "best_use_case": "Core FanStack advocate series & Smyrna Heights neighborhood sandbox"
            }
        ]
    }

