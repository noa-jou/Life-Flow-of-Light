-- Enable foreign key checks for this database connection.
-- The backend must also run this whenever it opens a new connection.
PRAGMA foreign_keys = ON;

-- Apply all schema changes together.
BEGIN TRANSACTION;


-- Store each registered lamp.
-- Removing a lamp from a position does not delete this row.
CREATE TABLE IF NOT EXISTS lamps (

    -- Internal database ID.
    id INTEGER PRIMARY KEY,

    -- Permanent lamp identity.
    -- The backend generates a random serial number when registering a lamp.
    -- NOT NULL: a serial number is required.
    -- UNIQUE: two lamps cannot have the same serial number.
    serial_number TEXT NOT NULL UNIQUE,

    -- Display name chosen by the user.
    -- The backend can change this name later.
    name TEXT NOT NULL,

    -- Current installation position.
    -- NULL means the lamp is registered but not installed.
    --
    -- UNIQUE allows only one lamp at each position.
    -- SQLite allows multiple rows with NULL here,
    -- so multiple lamps can remain uninstalled.
    position TEXT UNIQUE
        CHECK (
            position IS NULL
            OR position IN ('bedroom', 'bathroom', 'living_room')
        )
);


-- Store one row for each continuous period of lighting activity.
CREATE TABLE IF NOT EXISTS light_sessions (

    -- Internal ID of this lighting session.
    id INTEGER PRIMARY KEY,

    -- ID of the lamp that sent the heartbeat.
    lamp_id INTEGER NOT NULL,

    -- Copy the lamp's position when this session starts.
    -- This value stays unchanged if the lamp is moved later.
    -- An uninstalled lamp cannot start a session.
    position TEXT NOT NULL
        CHECK (
            position IN ('bedroom', 'bathroom', 'living_room')
        ),

    -- Time of the first heartbeat in this session.
    -- Store Unix time in milliseconds.
    started_at INTEGER NOT NULL,

    -- Time of the most recent heartbeat in this session.
    -- The backend updates this value as heartbeats arrive.
    -- Store Unix time in milliseconds.
    last_seen_at INTEGER NOT NULL,

    -- Every session must refer to an existing lamp.
    -- Prevent deleting a lamp that has session records.
    -- Uninstalling a lamp should set lamps.position to NULL instead.
    FOREIGN KEY (lamp_id) REFERENCES lamps(id)
        ON DELETE RESTRICT,

    -- Reject negative start times.
    CHECK (started_at >= 0),

    -- The most recent heartbeat cannot be earlier than the first one.
    CHECK (last_seen_at >= started_at)
);


-- Speed up queries for sessions at one position, newest first.
CREATE INDEX IF NOT EXISTS idx_light_sessions_position_time
    ON light_sessions (position, started_at DESC);


-- Reject any attempt to change a registered lamp's serial number.
-- Changing its name or position is still allowed.
CREATE TRIGGER IF NOT EXISTS prevent_lamp_serial_number_change
BEFORE UPDATE OF serial_number ON lamps
WHEN NEW.serial_number IS NOT OLD.serial_number
BEGIN
    SELECT RAISE(ABORT, 'Lamp serial number cannot be changed');
END;


-- Finish applying the schema changes.
COMMIT;