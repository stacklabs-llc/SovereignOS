import schema_gate
import sqlite3
import hashlib
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "knot_state.db")

class StateFractureError(Exception):
    """Exception raised when the Sovereign Knot consensus collapses."""
    pass

class SovereignKnotEngine:
    def __init__(self, db_path=DB_PATH):
        self.db_path = db_path

    def get_variables(self):
        """Reads variable values from SQLite database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT variable_key, status_value FROM sys_variable")
            rows = cursor.fetchall()
            return {row[0]: row[1] for row in rows}
        finally:
            conn.close()

    def evaluate_consensus(self):
        """
        Computes the S-Score consensus and enforces the Zero-Collapse Containment Rule.
        """
        variables = self.get_variables()
        
        # Extrapolate keys, default to 0.0 if missing
        a_val = variables.get("A", 0.0)
        pw_val = variables.get("PW", 0.0)
        t_val = variables.get("T", 0.0)
        c_val = variables.get("C", 0.0)
        pi_val = variables.get("PI", 0.0)

        # Strict Evaluation Thresholds
        a_status = 1.0 if a_val >= 1.0 else 0.0
        pw_status = 1.0 if (5.05 <= pw_val <= 5.15) else 0.0
        t_status = 1.0 if t_val >= 1.0 else 0.0
        c_status = 1.0 if c_val >= 1.0 else 0.0
        pi_status = 1.0 if pi_val >= 1.0 else 0.0

        # Consensus Formula
        s_score = (a_status * pw_status * t_status * c_status) * pi_status

        # Evaluate Zero-Collapse Containment Rule
        if s_score == 1.0:
            self._commit_nominal_breadcrumb(variables, s_score)
            return s_score, "NOMINAL"
        else:
            self._execute_quarantine_suspension(variables, s_score)
            raise StateFractureError(f"State Fracture Detected. Consensus S-Score: {s_score:.4f}")

    def _commit_nominal_breadcrumb(self, variables, s_score):
        """Commits nominal SHA-256 hash of variables to the audit log."""
        # Construct deterministic state string for hash
        state_str = f"A:{variables.get('A')}|PW:{variables.get('PW')}|T:{variables.get('T')}|C:{variables.get('C')}|PI:{variables.get('PI')}|S:{s_score}"
        state_hash = hashlib.sha256(state_str.encode('utf-8')).hexdigest()

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO audit_breadcrumb (state_hash, s_score, details, timestamp) VALUES (?, ?, ?, datetime('now'))",
                (state_hash, s_score, "NOMINAL CONSENSUS REGISTERED",)
            )
            conn.commit()
        finally:
            conn.close()

    def _execute_quarantine_suspension(self, variables, s_score):
        """Logs a quarantine event and blocks downstream transactions."""
        state_str = f"A:{variables.get('A')}|PW:{variables.get('PW')}|T:{variables.get('T')}|C:{variables.get('C')}|PI:{variables.get('PI')}|S:{s_score}"
        state_hash = hashlib.sha256(state_str.encode('utf-8')).hexdigest()

        details = "STATE FRACTURE - [TOPOLOGICAL COLLAPSE - POWER DEGRADATION]"
        if not (5.05 <= variables.get("PW", 0.0) <= 5.15):
            details = f"STATE FRACTURE - [TOPOLOGICAL COLLAPSE - POWER DEGRADATION (Voltage: {variables.get('PW')}V)]"
        else:
            reasons = []
            if variables.get("A", 0.0) < 1.0: reasons.append("A")
            if variables.get("T", 0.0) < 1.0: reasons.append("T")
            if variables.get("C", 0.0) < 1.0: reasons.append("C")
            if variables.get("PI", 0.0) < 1.0: reasons.append("PI")
            details = f"STATE FRACTURE - [TOPOLOGICAL COLLAPSE - DRIFT DETECTED ({', '.join(reasons)})]"

        # Log to the breadcrumb without throwing so it is saved in history
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO audit_breadcrumb (state_hash, s_score, details, timestamp) VALUES (?, ?, ?, datetime('now'))",
                (state_hash, s_score, details)
            )
            conn.commit()
        finally:
            conn.close()

        # Print warning to console as per requirements
        print(f"[TOPOLOGICAL COLLAPSE - STATE FRACTURE] - S-Score: {s_score:.4f} | Details: {details}")

if __name__ == "__main__":
    engine = SovereignKnotEngine()
    try:
        score, status = engine.evaluate_consensus()
        print(f"Consensus Status: {status} | S-Score: {score:.4f}")
    except StateFractureError as e:
        print(f"Error: {e}")
