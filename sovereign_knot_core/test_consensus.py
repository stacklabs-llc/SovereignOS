import unittest
import sqlite3
import os
import time
from sovereign_knot import SovereignKnotEngine, StateFractureError

class TestSovereignKnotEngine(unittest.TestCase):
    def setUp(self):
        self.db_path = os.path.join(os.path.dirname(__file__), "knot_state_test.db")
        # Initialize test database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE IF NOT EXISTS sys_variable (variable_key TEXT PRIMARY KEY, status_value REAL NOT NULL, last_verified_timestamp TEXT NOT NULL)")
        cursor.execute("CREATE TABLE IF NOT EXISTS audit_breadcrumb (id INTEGER PRIMARY KEY AUTOINCREMENT, state_hash TEXT NOT NULL, s_score REAL NOT NULL, details TEXT NOT NULL, timestamp TEXT NOT NULL)")
        cursor.execute("INSERT OR REPLACE INTO sys_variable VALUES ('A', 1.0, datetime('now'))")
        cursor.execute("INSERT OR REPLACE INTO sys_variable VALUES ('PW', 5.1, datetime('now'))")
        cursor.execute("INSERT OR REPLACE INTO sys_variable VALUES ('T', 1.0, datetime('now'))")
        cursor.execute("INSERT OR REPLACE INTO sys_variable VALUES ('C', 1.0, datetime('now'))")
        cursor.execute("INSERT OR REPLACE INTO sys_variable VALUES ('PI', 1.0, datetime('now'))")
        conn.commit()
        conn.close()
        self.engine = SovereignKnotEngine(self.db_path)

    def tearDown(self):
        if os.path.exists(self.db_path):
            os.remove(self.db_path)

    def test_nominal_consensus(self):
        score, status = self.engine.evaluate_consensus()
        self.assertEqual(score, 1.0)
        self.assertEqual(status, "NOMINAL")

        # Verify audit log has breadcrumb
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT s_score, details FROM audit_breadcrumb ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertEqual(row[0], 1.0)
        self.assertEqual(row[1], "NOMINAL CONSENSUS REGISTERED")

    def test_fracture_under_voltage(self):
        # Update PW to 4.7
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("UPDATE sys_variable SET status_value = 4.7 WHERE variable_key = 'PW'")
        conn.commit()
        conn.close()

        # Should raise StateFractureError
        with self.assertRaises(StateFractureError):
            self.engine.evaluate_consensus()

        # Check breadcrumbs for fracture event
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT s_score, details FROM audit_breadcrumb ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertEqual(row[0], 0.0)
        self.assertIn("STATE FRACTURE - [TOPOLOGICAL COLLAPSE - POWER DEGRADATION", row[1])

if __name__ == "__main__":
    unittest.main()
