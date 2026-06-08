# Walkthrough - INC4891039

## Problem Statement
The Sovereign OS Portal loaded successfully, but attempting to log in via `/api/auth/login` returned a `500 Internal Server Error`.

## Root Cause Analysis
1. The Vite front-end development server (listening on port `3000`) proxies all `/api/auth/*` requests to the local port `8090`.
2. The `sovereign_core_api.py` backend process (listening on port `8090`) was offline/down.
3. Because port `8090` was unreachable, the Vite proxy failed with a connection refused (`ECONNREFUSED`) error and bubble-up returned a `500 Internal Server Error` to the front-end login requests.
4. Additionally, the `mando_watchdog.py` background monitoring process was offline, preventing the system from automatically restarting the core API.

## Resolution Steps
1. **Started Core API:** Manually launched `sovereign_core_api.py` under the virtual environment. It successfully bound to port `8090`.
2. **Started Mando Watchdog:** Started `mando_watchdog.py` in the background to continuously monitor all critical system ports (including `8090`, `8095`, etc.) and prevent future downtime.
3. **End-to-End Verification:** Verified authentication successfully using curl against the public domain `https://clio.taila01894.ts.net/api/auth/login` with Pilot credentials. The API now returns a valid `200 OK` signed JWT session token.

## Empirical Proof of Success
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_name": "james",
  "role": "pilot",
  "display_name": "James (Pilot)",
  "modules": ["argus", "bistro", "fanstack", "gardenstack", "itsm"]
}
```
