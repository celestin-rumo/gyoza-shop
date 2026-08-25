ALTER TABLE production_sessions
    ADD COLUMN duration_hours NUMERIC;

-- Backfill any pre-existing rows using the longest individual participant time as a
-- best-effort proxy for the session's total duration, now tracked once per session
-- instead of per participant.
UPDATE production_sessions
SET duration_hours = COALESCE(
    (SELECT MAX(hours_spent) FROM session_participants WHERE session_participants.production_session_id = production_sessions.id),
    1
)
WHERE duration_hours IS NULL;

ALTER TABLE production_sessions
    ALTER COLUMN duration_hours SET NOT NULL;

ALTER TABLE session_participants
    DROP COLUMN hours_spent;
