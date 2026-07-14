import time
import sqlite3
import os
from sovereign_knot import SovereignKnotEngine, StateFractureError

DB_PATH = os.path.join(os.path.dirname(__file__), "knot_state.db")

def update_voltage(voltage):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE sys_variable SET status_value = ? WHERE variable_key = 'PW'", (voltage,))
        conn.commit()
    finally:
        conn.close()

def run_simulator():
    engine = SovereignKnotEngine(DB_PATH)
    print("Sovereign Knot Core Fault-Tolerance Simulator Started.")
    print("Press Ctrl+C to terminate.")

    try:
        while True:
            # ----------------------------------------------------
            # STATE 1: NOMINAL STATE (5 seconds)
            # ----------------------------------------------------
            print("\n>>> STATE 1: NOMINAL CONSENSUS ENGAGED")
            update_voltage(5.1)
            for i in range(5):
                try:
                    score, status = engine.evaluate_consensus()
                    print(f"[{time.strftime('%H:%M:%S')}] [NOMINAL] S-Score: {score:.4f} | Voltage: 5.1V | Status: {status}")
                except StateFractureError as e:
                    print(f"[{time.strftime('%H:%M:%S')}] [ERROR] Unexpected state fracture: {e}")
                time.sleep(1)

            # ----------------------------------------------------
            # STATE 2: FRACTURE TRIGGER (5 seconds)
            # ----------------------------------------------------
            print("\n>>> STATE 2: FRACTURE TRIGGERED (VOLTAGE SAG)")
            update_voltage(4.7)
            for i in range(5):
                try:
                    score, status = engine.evaluate_consensus()
                    print(f"[{time.strftime('%H:%M:%S')}] [NOMINAL] Unexpected nominal status: {status}")
                except StateFractureError as e:
                    # Note: engine.evaluate_consensus() prints the topological collapse message internally
                    pass
                time.sleep(1)

            # ----------------------------------------------------
            # STATE 3: RAIL RECOVERY (5 seconds)
            # ----------------------------------------------------
            print("\n>>> STATE 3: RAIL RECOVERY COMPLETED - RE-ENGAGING EXECUTIVE GATE")
            update_voltage(5.1)
            for i in range(5):
                try:
                    score, status = engine.evaluate_consensus()
                    print(f"[{time.strftime('%H:%M:%S')}] [RECOVERED] S-Score: {score:.4f} | Voltage: 5.1V | Status: {status}")
                except StateFractureError as e:
                    print(f"[{time.strftime('%H:%M:%S')}] [ERROR] Unexpected state fracture during recovery: {e}")
                time.sleep(1)

    except KeyboardInterrupt:
        print("\nSimulator terminated by user.")
        # Ensure we leave the database in a nominal state
        update_voltage(5.1)

if __name__ == "__main__":
    run_simulator()
