from fastapi import APIRouter, Request, HTTPException, Depends, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import sqlite3, os, re, uuid, time, json, subprocess, asyncio, aiohttp, shutil
from datetime import datetime, timedelta, timezone
import bcrypt
from core.db import DB_PATH, get_db
from core.security import (
    get_current_user, require_pilot, require_manager_or_pilot, security,
    _check_rate_limit, _get_user_from_db, _get_user_modules, _create_token, _decode_token,
)

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str

class ProvisionRequest(BaseModel):
    username: str
    password: str
    display_name: str = ""
    role: str = "guest"
    email: str = ""

@router.post("/api/auth/login")
async def auth_login(req: LoginRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    _check_rate_limit(client_ip)
    user = _get_user_from_db(req.username)
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    modules = _get_user_modules(user["user_name"])
    token = _create_token(user["user_name"], user["role"] or "guest", user["display_name"] or user["user_name"], modules)
    
    # Highly visible log alert for tracking external access
    print(f"\n\n=======================================================")
    print(f"[TARGET ACQUIRED] User '{user['user_name']}' successfully logged in!")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"IP Address: {client_ip}")
    print(f"=======================================================\n\n", flush=True)
    
    return {"token": token, "user_name": user["user_name"], "role": user["role"], "display_name": user["display_name"], "modules": modules}

@router.get("/api/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    # Always fetch fresh data from DB so profile edits are immediate
    db_user = _get_user_from_db(user["sub"])
    
    # Fetch user preferences
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT name, value FROM sys_user_preference WHERE user_name=?", (user["sub"],))
    prefs = {row[0]: row[1] for row in c.fetchall()}
    conn.close()
    
    res_data = {
        "user_name": user["sub"],
        "role": user["role"],
        "display_name": user["display_name"],
        "modules": user.get("modules", []),
        "os_theme": prefs.get("os_theme", ""),
        "entropy_level": int(prefs.get("entropy_level", "5")),
        "procedural_avatars": prefs.get("procedural_avatars", "false").lower() == "true",
        "kiosk_projection": prefs.get("kiosk_projection", "false").lower() == "true",
        "desk_relic": prefs.get("desk_relic", ""),
        "introduction": "",
    }
    if db_user:
        res_data["user_name"] = db_user["user_name"]
        res_data["role"] = db_user["role"]
        res_data["display_name"] = db_user["display_name"]
        res_data["avatar_url"] = db_user.get("avatar_url")
        res_data["favorite_team"] = db_user.get("favorite_team")
        res_data["introduction"] = db_user.get("introduction") or ""
        res_data["u_nap_mist_balance"] = db_user.get("u_nap_mist_balance") or 0
        res_data["u_layout_configuration"] = db_user.get("u_layout_configuration")
        
    return res_data

@router.post("/api/auth/logout")
async def auth_logout():
    return {"status": "logged_out"}

@router.post("/api/auth/provision_user")
async def provision_user(req: ProvisionRequest, pilot: dict = Depends(require_pilot)):
    """Pilot-only: create or update a guest account."""
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    pw_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt(rounds=12)).decode()
    display = req.display_name or req.username
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT sys_id FROM sys_user WHERE user_name=?", (req.username,))
    existing = c.fetchone()
    if existing:
        c.execute("UPDATE sys_user SET password_hash=?, role=?, display_name=?, active=1, email=? WHERE user_name=?",
                  (pw_hash, req.role, display, req.email, req.username))
        action = "updated"
    else:
        c.execute("INSERT INTO sys_user (sys_id, user_name, display_name, role, password_hash, active, email) VALUES (?,?,?,?,?,1,?)",
                  (uuid.uuid4().hex, req.username, display, req.role, pw_hash, req.email))
        action = "created"
    conn.commit()
    conn.close()
    return {"status": "success", "action": action, "username": req.username}

@router.post("/api/auth/change_password")
async def change_password(req: LoginRequest, user: dict = Depends(get_current_user)):
    """Authenticated user can change their own password."""
    if user["sub"] != req.username and user.get("role") != "pilot":
        raise HTTPException(status_code=403, detail="Cannot change another user's password")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    pw_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt(rounds=12)).decode()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE sys_user SET password_hash=? WHERE user_name=?", (pw_hash, req.username))
    conn.commit()
    conn.close()
    return {"status": "success"}

class UpdateUserRequest(BaseModel):
    username: str
    new_username: str = ""
    role: str = ""
    display_name: str = ""
    email: str = ""
    new_password: str = ""
    avatar_url: str = ""
    favorite_team: str = ""
    os_theme: str = ""
    entropy_level: int = 5
    procedural_avatars: bool = False
    kiosk_projection: bool = False
    introduction: str = ""
    desk_relic: str = ""
    first_name: str = ""
    last_name: str = ""
    title: str = ""
    department: str = ""
    city: str = ""

# ----------------------------------------------------
# PILOT RBAC ADMIN ENDPOINTS (PHASE 4)
# ----------------------------------------------------

class SetRoleRequest(BaseModel):
    username: str
    role: str

class ToggleUserRequest(BaseModel):
    username: str

@router.get("/api/admin/users")
async def admin_list_users(pilot: dict = Depends(require_pilot)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT user_name, display_name, role, active, email FROM sys_user")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/api/admin/roles")
async def admin_list_roles(pilot: dict = Depends(require_pilot)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT name, display_name, description, can_be_disabled FROM sys_role")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/api/admin/permissions")
async def admin_list_permissions(pilot: dict = Depends(require_pilot)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT role, service_name, port, access_level FROM sys_role_permission")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/api/admin/set-role")
async def admin_set_role(req: SetRoleRequest, pilot: dict = Depends(require_pilot)):
    if req.username == pilot.get("sub") and req.role != "pilot":
        raise HTTPException(status_code=400, detail="Pilot cannot demote themselves")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Check if role exists
    c.execute("SELECT name FROM sys_role WHERE name=?", (req.role,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Role does not exist")
    c.execute("UPDATE sys_user SET role=? WHERE user_name=?", (req.role, req.username))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"Role for user {req.username} set to {req.role}"}

@router.post("/api/admin/disable")
async def admin_disable_user(req: ToggleUserRequest, pilot: dict = Depends(require_pilot)):
    if req.username == pilot.get("sub"):
        raise HTTPException(status_code=400, detail="Pilot cannot disable their own account")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE sys_user SET active=0 WHERE user_name=?", (req.username,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"User {req.username} disabled"}

@router.post("/api/admin/enable")
async def admin_enable_user(req: ToggleUserRequest, pilot: dict = Depends(require_pilot)):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE sys_user SET active=1 WHERE user_name=?", (req.username,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"User {req.username} enabled"}

@router.get("/api/auth/users")
async def list_users(pilot: dict = Depends(require_pilot)):
    """Pilot-only: list all auth-enabled users."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    # Fetch all user preferences in one pass
    c.execute("SELECT user_name, name, value FROM sys_user_preference")
    pref_rows = c.fetchall()
    prefs_by_user = {}
    for r in pref_rows:
        uname = r["user_name"]
        if uname not in prefs_by_user:
            prefs_by_user[uname] = {}
        prefs_by_user[uname][r["name"]] = r["value"]
        
    c.execute("""
        SELECT user_name, display_name, role, active, first_name, last_name,
               city, department, title, email, avatar_url, favorite_team, introduction, u_nap_mist_balance,
               CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END as has_password
        FROM sys_user
        WHERE password_hash IS NOT NULL
        GROUP BY user_name
        ORDER BY role DESC, user_name
    """)
    raw_users = c.fetchall()
    
    rows = []
    for r in raw_users:
        d = dict(r)
        uname = d["user_name"]
        uprefs = prefs_by_user.get(uname, {})
        d["os_theme"] = uprefs.get("os_theme", "")
        d["entropy_level"] = int(uprefs.get("entropy_level", "5"))
        d["procedural_avatars"] = uprefs.get("procedural_avatars", "false").lower() == "true"
        d["kiosk_projection"] = uprefs.get("kiosk_projection", "false").lower() == "true"
        d["desk_relic"] = uprefs.get("desk_relic", "")
        rows.append(d)
        
    conn.close()
    return {"status": "success", "users": rows}

@router.post("/api/auth/update_user")
async def update_user(req: UpdateUserRequest, pilot: dict = Depends(require_pilot)):
    """Pilot-only: update profile, username, role, and/or reset password for any user."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    target_username = req.username
    if req.display_name:
        c.execute("UPDATE sys_user SET display_name=? WHERE user_name=?", (req.display_name, target_username))
    if req.email is not None:
        c.execute("UPDATE sys_user SET email=? WHERE user_name=?", (req.email, target_username))
    if req.role:
        c.execute("UPDATE sys_user SET role=? WHERE user_name=?", (req.role, target_username))
    if req.first_name is not None:
        c.execute("UPDATE sys_user SET first_name=? WHERE user_name=?", (req.first_name, target_username))
    if req.last_name is not None:
        c.execute("UPDATE sys_user SET last_name=? WHERE user_name=?", (req.last_name, target_username))
    if req.title is not None:
        c.execute("UPDATE sys_user SET title=? WHERE user_name=?", (req.title, target_username))
    if req.department is not None:
        c.execute("UPDATE sys_user SET department=? WHERE user_name=?", (req.department, target_username))
    if req.city is not None:
        c.execute("UPDATE sys_user SET city=? WHERE user_name=?", (req.city, target_username))
    if req.avatar_url is not None:
        c.execute("UPDATE sys_user SET avatar_url=? WHERE user_name=?", (req.avatar_url, target_username))
    if req.favorite_team is not None:
        c.execute("UPDATE sys_user SET favorite_team=? WHERE user_name=?", (req.favorite_team, target_username))
    if req.introduction is not None:
        c.execute("UPDATE sys_user SET introduction=? WHERE user_name=?", (req.introduction, target_username))
    if req.new_username and req.new_username != req.username:
        c.execute("UPDATE sys_user SET user_name=? WHERE user_name=?", (req.new_username, target_username))
        c.execute("UPDATE sys_user_preference SET user_name=? WHERE user_name=?", (req.new_username, target_username))
        target_username = req.new_username
    if req.new_password:
        if len(req.new_password) < 8:
            conn.close()
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        pw_hash = bcrypt.hashpw(req.new_password.encode(), bcrypt.gensalt(rounds=12)).decode()
        c.execute("UPDATE sys_user SET password_hash=? WHERE user_name=?", (pw_hash, target_username))
        
    # Save custom Read the Room protocol preferences
    for pref_name, pref_val in [
        ("os_theme", req.os_theme),
        ("entropy_level", str(req.entropy_level)),
        ("procedural_avatars", "true" if req.procedural_avatars else "false"),
        ("kiosk_projection", "true" if req.kiosk_projection else "false"),
        ("desk_relic", req.desk_relic)
    ]:
        if pref_val is not None and pref_val != "":
            c.execute("SELECT sys_id FROM sys_user_preference WHERE user_name=? AND name=?", (target_username, pref_name))
            row = c.fetchone()
            if row:
                c.execute("UPDATE sys_user_preference SET value=?, sys_updated_on=datetime('now') WHERE sys_id=?", (str(pref_val), row[0]))
            else:
                import uuid
                c.execute("INSERT INTO sys_user_preference (sys_id, user_name, name, value, sys_updated_on) VALUES (?, ?, ?, ?, datetime('now'))", (uuid.uuid4().hex, target_username, pref_name, str(pref_val)))
                
    conn.commit()
    conn.close()
    return {"status": "success"}


@router.post("/api/auth/upload_avatar")
async def upload_avatar(username: str, file: UploadFile = File(...), pilot: dict = Depends(require_pilot)):
    import os
    import re
    import base64
    import sqlite3
    
    # Strict snake_case sanitization
    clean_username = username.lower()
    clean_username = re.sub(r'[\s\-]+', '_', clean_username)
    clean_username = re.sub(r'[^\w]', '', clean_username)
    clean_username = re.sub(r'_+', '_', clean_username)
    clean_username = clean_username.strip('_')
    
    _, ext = os.path.splitext(file.filename or '')
    ext = ext.lower()
    if ext not in {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.jfif'}:
        ext = '.png'
        
    filename = f"{clean_username}{ext}"
    
    contents = await file.read()
    
    target_dir = "/home/james/SovereignOS/avatars"
    os.makedirs(target_dir, exist_ok=True)
    p = os.path.join(target_dir, filename)
    with open(p, "wb") as f_out:
        f_out.write(contents)
            
    avatar_url = f"/avatars/{filename}"
    
    mime = file.content_type or 'image/png'
    b64 = base64.b64encode(contents).decode('utf-8')
    data_url = f"data:{mime};base64,{b64}"
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    usernames_to_update = {username, clean_username, f"pilot_{clean_username}", f"pilot_{username}"}
    if clean_username.startswith("pilot_"):
        usernames_to_update.add(clean_username[6:])
    if username.startswith("pilot_"):
        usernames_to_update.add(username[6:])
        
    for u in usernames_to_update:
        c.execute("UPDATE sys_user SET avatar_url=? WHERE user_name=?", (avatar_url, u))
        c.execute("UPDATE persona SET avatar_url=?, avatar_blob=? WHERE user_name=?", (avatar_url, data_url, u))
        
    conn.commit()
    conn.close()
    
    return {"status": "success", "avatar_url": avatar_url}


@router.post("/api/auth/update_my_profile")
async def update_my_profile(req: UpdateUserRequest, user: dict = Depends(get_current_user)):
    """Any authenticated user can update their own display name and password."""
    if user["sub"] != req.username:
        raise HTTPException(status_code=403, detail="Can only update your own profile")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    if req.display_name:
        c.execute("UPDATE sys_user SET display_name=? WHERE user_name=?", (req.display_name, req.username))
    if req.email is not None:
        c.execute("UPDATE sys_user SET email=? WHERE user_name=?", (req.email, req.username))
    if req.avatar_url is not None and req.avatar_url != "":
        c.execute("UPDATE sys_user SET avatar_url=? WHERE user_name=?", (req.avatar_url, req.username))
    if req.favorite_team is not None and req.favorite_team != "":
        c.execute("UPDATE sys_user SET favorite_team=? WHERE user_name=?", (req.favorite_team, req.username))
    if req.introduction is not None:
        c.execute("UPDATE sys_user SET introduction=? WHERE user_name=?", (req.introduction, req.username))
    if req.new_password:
        if len(req.new_password) < 8:
            conn.close()
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        pw_hash = bcrypt.hashpw(req.new_password.encode(), bcrypt.gensalt(rounds=12)).decode()
        c.execute("UPDATE sys_user SET password_hash=? WHERE user_name=?", (pw_hash, req.username))
    
    # Save custom Read the Room protocol preferences
    for pref_name, pref_val in [
        ("os_theme", req.os_theme),
        ("entropy_level", str(req.entropy_level)),
        ("procedural_avatars", "true" if req.procedural_avatars else "false"),
        ("kiosk_projection", "true" if req.kiosk_projection else "false"),
        ("desk_relic", req.desk_relic)
    ]:
        if pref_val is not None and pref_val != "":
            c.execute("SELECT sys_id FROM sys_user_preference WHERE user_name=? AND name=?", (req.username, pref_name))
            row = c.fetchone()
            if row:
                c.execute("UPDATE sys_user_preference SET value=?, sys_updated_on=datetime('now') WHERE sys_id=?", (pref_val, row[0]))
            else:
                import uuid
                c.execute("INSERT INTO sys_user_preference (sys_id, user_name, name, value, sys_updated_on) VALUES (?, ?, ?, ?, datetime('now'))", (uuid.uuid4().hex, req.username, pref_name, pref_val))
                
    conn.close()
    return {"status": "success"}

class OnboardingRequest(BaseModel):
    answers: dict

@router.post("/api/user/onboarding")
async def post_user_onboarding(req: OnboardingRequest, user: dict = Depends(get_current_user)):
    username = user["sub"]
    answers = req.answers
    
    # Base layout config
    theme = "sovereign-home"
    left_relics = []
    center_relics = []
    right_relics = []
    
    # Branch A: Aesthetic
    drink = answers.get("drink", "").lower()
    music = answers.get("music", "").lower()
    if "martini" in drink or "mills" in music:
        theme = "storybook-sapphire"
        left_relics.append("classy_martini")
        right_relics.append("mills_brothers")
        
    # Branch B: Mission / Responsibility
    mission = answers.get("mission", "").lower()
    if "admin" in mission or "system" in mission or "fleet" in mission:
        right_relics.extend(["garden_stack", "livestock_stack"])
        
    # Branch C: Mental Exercise
    exercise = answers.get("exercise", "").lower()
    if "crossword" in exercise or "puzzle" in exercise:
        right_relics.append("crossword_puzzle")
    elif "terminal" in exercise or "hacking" in exercise or "command" in exercise:
        right_relics.append("cli_operator_shell")
        
    # Default relics
    right_relics.append("messaging_app")
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT introduction FROM sys_user WHERE user_name=?", (username,))
    intro_row = c.fetchone()
    intro = (intro_row[0] or "") if intro_row else ""
    
    if "eileen" in username.lower() or "detective" in intro.lower() or "inkwell" in intro.lower() or "irony" in intro.lower():
        theme = "storybook-sapphire"
        left_relics = ["classy_martini", "auth_key"]
        center_relics = []
        right_relics = ["messaging_app", "garden_stack", "livestock_stack", "crossword_puzzle", "mills_brothers"]
        
    layout_config = {
        "theme": theme,
        "columns": {
            "left": left_relics,
            "center": center_relics,
            "right": right_relics
        }
    }
    
    import json
    config_json = json.dumps(layout_config)
    
    c.execute("UPDATE sys_user SET u_layout_configuration=? WHERE user_name=?", (config_json, username))
    
    # Also update user preference for os_theme
    c.execute("SELECT sys_id FROM sys_user_preference WHERE user_name=? AND name='os_theme'", (username,))
    pref_row = c.fetchone()
    if pref_row:
        c.execute("UPDATE sys_user_preference SET value=?, sys_updated_on=datetime('now') WHERE sys_id=?", (theme, pref_row[0]))
    else:
        c.execute("INSERT INTO sys_user_preference (sys_id, user_name, name, value, sys_updated_on) VALUES (?, ?, 'os_theme', ?, datetime('now'))", (uuid.uuid4().hex, username, theme))
        
    conn.commit()
    conn.close()
    
    return {"status": "success", "configuration": layout_config}

@router.get("/api/user/parse_bio")
async def parse_user_bio(user: dict = Depends(get_current_user)):
    username = user["sub"]
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT introduction FROM sys_user WHERE user_name=?", (username,))
    intro_row = c.fetchone()
    conn.close()
    
    intro = (intro_row[0] or "") if intro_row else ""
    intro_lower = intro.lower()
    
    # Suggest layouts based on keywords
    theme = "sovereign-home"
    left_relics = []
    center_relics = []
    right_relics = []
    
    if "martini" in intro_lower or "drink" in intro_lower:
        theme = "storybook-sapphire"
        left_relics.append("classy_martini")
        
    if "mills" in intro_lower or "jukebox" in intro_lower or "music" in intro_lower:
        right_relics.append("mills_brothers")
        
    # grandmaster widget removed
        
    if "admin" in intro_lower or "system" in intro_lower or "vet" in intro_lower or "garden" in intro_lower:
        right_relics.extend(["garden_stack", "livestock_stack"])
        
    if "crossword" in intro_lower or "puzzle" in intro_lower:
        right_relics.append("crossword_puzzle")
        
    if "terminal" in intro_lower or "command" in intro_lower or "hack" in intro_lower:
        right_relics.append("cli_operator_shell")
        
    if "detective" in intro_lower or "inkwell" in intro_lower or "irony" in intro_lower or "investigator" in intro_lower or "eileen" in username.lower():
        left_relics.append("auth_key")
        
    # Defaults if empty
    if not left_relics and not center_relics and not right_relics:
        left_relics = ["classy_martini"]
        center_relics = []
        right_relics = ["messaging_app", "crossword_puzzle"]
    else:
        right_relics.append("messaging_app")
        
    if "eileen" in username.lower() or "detective" in intro_lower or "inkwell" in intro_lower or "irony" in intro_lower:
        theme = "storybook-sapphire"
        left_relics = ["classy_martini", "auth_key"]
        center_relics = []
        right_relics = ["messaging_app", "garden_stack", "livestock_stack", "crossword_puzzle", "mills_brothers"]
        
    suggested_layout = {
        "theme": theme,
        "columns": {
            "left": left_relics,
            "center": center_relics,
            "right": right_relics
        }
    }
    
    return {"status": "success", "suggested_layout": suggested_layout, "introduction": intro}

class UsernameRequest(BaseModel):
    username: str

@router.post("/api/auth/deactivate_user")
async def deactivate_user(req: UsernameRequest, pilot: dict = Depends(require_pilot)):
    if req.username == pilot["sub"]:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE sys_user SET active=0 WHERE user_name=?", (req.username,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@router.post("/api/auth/reactivate_user")
async def reactivate_user(req: UsernameRequest, pilot: dict = Depends(require_pilot)):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE sys_user SET active=1 WHERE user_name=?", (req.username,))
    conn.commit()
    conn.close()
    return {"status": "success"}

# ── Module RBAC Endpoints ─────────────────────────────────────────────────────

@router.get("/api/auth/modules")
async def list_modules(pilot: dict = Depends(require_pilot)):
    """List all registered system modules."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, module_name, display_name, description, icon, color, active, category, port FROM sys_module ORDER BY module_name")
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return {"status": "success", "modules": rows}

@router.get("/api/auth/user_modules/{username}")
async def get_user_modules(username: str, pilot: dict = Depends(require_pilot)):
    """List module grants for a specific user."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""
        SELECT m.module_name, m.display_name, m.color, m.icon, m.category, m.port,
               um.granted_by, um.granted_at, um.active
        FROM sys_module m
        LEFT JOIN (
            SELECT um2.* FROM m2m_user_module um2
            JOIN sys_user u ON u.sys_id = um2.user_sys_id
            WHERE u.user_name = ?
        ) um ON um.module_name = m.module_name
        WHERE m.active = 1
        ORDER BY m.module_name
    """, (username,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return {"status": "success", "username": username, "modules": rows}

class ModuleGrantRequest(BaseModel):
    username: str
    module_name: str

@router.post("/api/auth/grant_module")
async def grant_module(req: ModuleGrantRequest, pilot: dict = Depends(require_pilot)):
    """Pilot-only: grant a module to a user."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT sys_id FROM sys_user WHERE user_name=? AND active=1", (req.username,))
    user_row = c.fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"User '{req.username}' not found")
    c.execute("SELECT module_name FROM sys_module WHERE module_name=? AND active=1", (req.module_name,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Module '{req.module_name}' not found")
    # Upsert: re-activate if previously revoked
    c.execute("""
        INSERT INTO m2m_user_module (sys_id, user_sys_id, module_name, granted_by, active)
        VALUES (?,?,?,?,1)
        ON CONFLICT(user_sys_id, module_name) DO UPDATE SET active=1, granted_by=excluded.granted_by, granted_at=CURRENT_TIMESTAMP
    """, (uuid.uuid4().hex, user_row[0], req.module_name, pilot["sub"]))
    conn.commit()
    conn.close()
    return {"status": "success", "action": "granted", "username": req.username, "module": req.module_name}

@router.post("/api/auth/revoke_module")
async def revoke_module(req: ModuleGrantRequest, pilot: dict = Depends(require_pilot)):
    """Pilot-only: revoke a module from a user."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        UPDATE m2m_user_module SET active=0
        WHERE user_sys_id = (SELECT sys_id FROM sys_user WHERE user_name=?)
          AND module_name = ?
    """, (req.username, req.module_name))
    conn.commit()
    affected = c.rowcount
    conn.close()
    return {"status": "success", "action": "revoked", "username": req.username, "module": req.module_name, "rows": affected}

class StackProvisionRequest(BaseModel):
    stack_module_name: str
    utility_module_name: str
    active: int

@router.get("/api/auth/stack_utilities/{stack_name}")
async def list_stack_utilities(stack_name: str, pilot: dict = Depends(require_pilot)):
    """List all registered system utilities and whether they are provisioned to the given stack."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""
        SELECT m.module_name, m.display_name, m.description, m.icon, m.color, m.category, m.port,
               COALESCE(su.active, 0) as active
        FROM sys_module m
        LEFT JOIN m2m_stack_utility su ON su.utility_module_name = m.module_name AND su.stack_module_name = ?
        WHERE m.category = 'utility'
        ORDER BY m.module_name
    """, (stack_name,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return {"status": "success", "stack_name": stack_name, "utilities": rows}

@router.post("/api/auth/provision_utility")
async def provision_utility(req: StackProvisionRequest, pilot: dict = Depends(require_pilot)):
    """Provision or unprovision a utility to a stack."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT module_name FROM sys_module WHERE module_name=? AND category='stack'", (req.stack_module_name,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Stack module '{req.stack_module_name}' not found")
    c.execute("SELECT module_name FROM sys_module WHERE module_name=? AND category='utility'", (req.utility_module_name,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail=f"Utility module '{req.utility_module_name}' not found")
    c.execute("""
        INSERT INTO m2m_stack_utility (stack_module_name, utility_module_name, active)
        VALUES (?, ?, ?)
        ON CONFLICT(stack_module_name, utility_module_name) DO UPDATE SET active = excluded.active
    """, (req.stack_module_name, req.utility_module_name, req.active))
    conn.commit()
    conn.close()
    return {"status": "success"}

@router.get("/api/public/stack_utilities/{stack_name}")
async def list_stack_utilities_public(stack_name: str):
    """List all registered system utilities and whether they are active and provisioned to the given stack (Public read-only)."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("""
        SELECT m.module_name, m.display_name, m.description, m.icon, m.color, m.category, m.port,
               COALESCE(su.active, 0) as active
        FROM sys_module m
        LEFT JOIN m2m_stack_utility su ON su.utility_module_name = m.module_name AND su.stack_module_name = ?
        WHERE m.category = 'utility'
        ORDER BY m.module_name
    """, (stack_name,))
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    return {"status": "success", "stack_name": stack_name, "utilities": rows}

# ── End Module RBAC Endpoints ─────────────────────────────────────────────────

# ── User Preferences Endpoints ────────────────────────────────────────────────
class UserPreference(BaseModel):
    name: str
    value: str

@router.get("/api/user_preferences")
async def get_my_preferences(user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT name, value FROM sys_user_preference WHERE user_name=?", (user["sub"],)).fetchall()
    conn.close()
    return {"status": "success", "preferences": [dict(r) for r in rows]}

@router.post("/api/user_preferences")
async def set_my_preference(req: UserPreference, user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        INSERT INTO sys_user_preference (sys_id, user_name, name, value) 
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_name, name) DO UPDATE SET value=excluded.value, sys_updated_on=CURRENT_TIMESTAMP
    """, (uuid.uuid4().hex, user["sub"], req.name, req.value))
    conn.commit()
    conn.close()
    return {"status": "success"}
# ── End User Preferences Endpoints ────────────────────────────────────────────

class GamedaySyncToggleRequest(BaseModel):
    enabled: bool

@router.get("/api/system/gameday_sync/status")
async def get_gameday_sync_status(user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT value FROM sys_properties WHERE name = 'system.gameday_sync.enabled'")
    row = cur.fetchone()
    conn.close()
    enabled = row[0].strip().lower() == 'true' if row else True
    return {"status": "success", "enabled": enabled}

@router.post("/api/system/gameday_sync/toggle")
async def toggle_gameday_sync(req: GamedaySyncToggleRequest, pilot: dict = Depends(require_pilot)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO sys_properties (name, value, description)
        VALUES ('system.gameday_sync.enabled', ?, 'Toggle continuous gameday livefeed compilation and Google Drive synchronization.')
        ON CONFLICT(name) DO UPDATE SET value=excluded.value
    """, ('true' if req.enabled else 'false',))
    conn.commit()
    conn.close()
    return {"status": "success", "enabled": req.enabled}
