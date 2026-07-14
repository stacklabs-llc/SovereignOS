CREATE TABLE IF NOT EXISTS u_sys_approval_queue (
    sys_id TEXT PRIMARY KEY,
    u_task_id TEXT NOT NULL,
    u_assigned_to TEXT DEFAULT 'james',
    u_title TEXT NOT NULL,
    u_plan_markdown TEXT NOT NULL,
    u_state TEXT DEFAULT 'Requested',
    u_auth_level TEXT DEFAULT 'omega=0',
    u_sys_created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    u_sys_updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    u_comments TEXT
);

CREATE INDEX IF NOT EXISTS idx_approval_pending 
ON u_sys_approval_queue (u_assigned_to, u_state);
