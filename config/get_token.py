import sys
import os
import datetime
from datetime import datetime, timezone, timedelta
import jwt

sys.path.append("/home/james/SovereignOS/scripts")
import sovereign_core_api

secret = sovereign_core_api._get_jwt_secret()
payload = {
    "sub": "james",
    "role": "pilot",
    "display_name": "James",
    "modules": [],
    "exp": datetime.now(timezone.utc) + timedelta(hours=24),
}
token = jwt.encode(payload, secret, algorithm="HS256")
print(token)
