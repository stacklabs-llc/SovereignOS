import pytchat
import json
import time
import asyncio
import websockets
import sys

# Usage: python3 tail_wardy_chat.py NKJIEkPzj3w /home/james/SovereignOS/dna/dropzone/daily_28042026/wardy_chat_tail.md

async def tail_chat(video_id, output_file):
    chat = pytchat.create(video_id=video_id)
    ws_url = "ws://127.0.0.1:8008"

    # P3 FIX: Detect VOD / no-chat-feed immediately before entering relay loop
    # pytchat.is_alive() returns False instantly for highlight clips and non-live VODs
    # Root cause: highlights uploads have no YouTube live chat feed — yt-dlp/pytchat returns nothing
    import asyncio as _aio
    await _aio.sleep(2)  # Brief settle to let pytchat initialize
    if not chat.is_alive():
        print(f"[WardyChatTail] No live chat feed detected for video {video_id}. VOD or highlights clip?")
        try:
            async with websockets.connect(ws_url) as ws:
                await ws.send(json.dumps({
                    "type": "YOUTUBE_CHAT",
                    "user": "SYSTEM",
                    "text": f"⚠️ No live chat feed found for video ID: {video_id}. This may be a highlights clip or a VOD without chat replay enabled. Paste a live stream or a live-replay URL.",
                    "target_game_pk": "live_chat_sniper",
                    "is_system": True
                }))
                print("[WardyChatTail] VOD diagnostic sent to relay.")
        except Exception as e:
            print(f"[WardyChatTail] Could not send diagnostic: {e}")
        return

    while chat.is_alive():
        try:
            async with websockets.connect(ws_url) as ws:
                print(f"[WardyChatTail] Connected to {ws_url}. Tailing video {video_id}...")
                
                while chat.is_alive():
                    try:
                        for c in chat.get().sync_items():
                            author = c.author.name
                            message = c.message
                            
                            # 1. Append to Markdown file
                            with open(output_file, "a") as f:
                                f.write(f"\n\n@{author}\n{message}")
                                
                            # 2. Send to Sovereign OS WebSocket
                            payload = {
                                "type": "YOUTUBE_CHAT",
                                "user": author,
                                "text": message,
                                "target_game_pk": "live_chat_sniper"
                            }
                            await ws.send(json.dumps(payload))
                            print(f"[{time.strftime('%H:%M:%S')}] Relayed: {author}: {message}")
                            
                    except websockets.exceptions.ConnectionClosed:
                        print("WebSocket connection closed. Retrying in 2s...")
                        break
                    except Exception as e:
                        print(f"Error processing chat: {e}")
                        
                    await asyncio.sleep(2)
        except Exception as e:
             print(f"Connection error, reconnecting in 5s: {e}")
             await asyncio.sleep(5)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 tail_wardy_chat.py <video_id> <output_file>")
        sys.exit(1)
        
    vid = sys.argv[1]
    out_file = sys.argv[2]
    
    try:
        asyncio.run(tail_chat(vid, out_file))
    except KeyboardInterrupt:
        print("Stopping...")
    except Exception as e:
        print(f"Exiting due to error: {e}")
