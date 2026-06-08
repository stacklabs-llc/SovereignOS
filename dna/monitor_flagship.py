import os
import time
import subprocess
from datetime import datetime

BLUE, ORANGE, RED, GREEN, BOLD, END = '\033[94m', '\033[93m', '\033[91m', '\033[92m', '\033[1m', '\033[0m'

def get_cpu_temp():
    try:
        temp = subprocess.check_output(['vcgencmd', 'measure_temp']).decode('utf-8')
        return float(temp.replace('temp=', '').replace("'C\n", ""))
    except: return 0.0

def render_dashboard():
    while True:
        os.system('clear')
        temp = get_cpu_temp()
        temp_color = GREEN if temp < 65 else ORANGE if temp < 80 else RED
        hurricane = f"{RED}{BOLD}ACTIVE{END}" if temp > 75 else f"{GREEN}NOMINAL{END}"
        
        print(f"{BLUE}{BOLD}============================================================{END}")
        print(f"{BLUE}{BOLD}   SOVEREIGN FLAGSHIP MONITOR [NODE .73] - SPRINT 03{END}")
        print(f"{BLUE}{BOLD}============================================================{END}")
        print(f"{ORANGE}TIMESTAMP:{END} {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{ORANGE}THERMAL:{END}    {temp_color}{temp}°C{END} [HURRICANE: {hurricane}]")
        print(f"{ORANGE}NPU:{END}        {BLUE}HAILO-10H (26 TOPS){END}")
        print("-" * 60)
        print(f"{ORANGE}UAT WATCH:{END}  {GREEN}FERRIS (CI-12) INITIALIZING{END}")
        print(f"{BLUE}LAW 26:{END}     Isolation Verified.")
        print(f"{BLUE}{BOLD}============================================================{END}")
        time.sleep(2)

if __name__ == "__main__":
    render_dashboard()
