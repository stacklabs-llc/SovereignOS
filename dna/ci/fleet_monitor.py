import http.server
import socketserver
import json
import psutil
import os
import shutil
import subprocess

PORT = 8093

class FleetStatsHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/stats/73':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            # Node .73 (Local) Stats
            cpu = psutil.cpu_percent(interval=0.1)
            ram = psutil.virtual_memory()
            swap = psutil.swap_memory()
            disk = shutil.disk_usage("/")
            
            stats = {
                "node": "Node .73 (Sigma-9)",
                "cpu_percent": cpu,
                "ram_percent": ram.percent,
                "ram_used_gb": round(ram.used / (1024**3), 2),
                "ram_total_gb": round(ram.total / (1024**3), 2),
                "swap_percent": swap.percent,
                "disk_percent": round((disk.used / disk.total) * 100, 1),
                "status": "ONLINE"
            }
            self.wfile.write(json.dumps(stats).encode())
        else:
            # Serve files (like the HTML UI)
            super().do_GET()
            
    def do_POST(self):
        if self.path == '/api/action/clear-swap':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            try:
                # Trigger the swap purge strictly in the background so it doesn't block
                subprocess.Popen(["sudo", "sh", "-c", "swapoff -a && swapon -a"])
                self.wfile.write(json.dumps({"status": "success", "message": "Swap Purge Initiated"}).encode())
            except Exception as e:
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

if __name__ == "__main__":
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    print(f"Starting Sovereign Fleet Monitor on port {PORT}...")
    with ReusableTCPServer(("", PORT), FleetStatsHandler) as httpd:
        httpd.serve_forever()
