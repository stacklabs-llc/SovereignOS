BEGIN TRANSACTION;

-- Add approved_to_run and preapproved columns to sovereign_tickets
ALTER TABLE sovereign_tickets ADD COLUMN approved_to_run INTEGER DEFAULT 0;
ALTER TABLE sovereign_tickets ADD COLUMN preapproved INTEGER DEFAULT 0;

COMMIT;
