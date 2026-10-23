-- Enable foreign key checks for this database connection.
-- The backend must also run this whenever it opens a new connection.
PRAGMA foreign_keys = ON;

-- Apply all schema changes together.
BEGIN TRANSACTION;


-- Store each registered bulb.
-- Removing a bulb from a position does not delete this row.
CREATE TABLE IF NOT EXISTS bulbs (

    -- Internal database ID.
    id INTEGER PRIMARY KEY,

    -- Permanent bulb identity.
    -- The backend generates a random serial number when registering a bulb.
    -- NOT NULL: a serial number is required.
    -- UNIQUE: two bulbs cannot have the same serial number.
    serial_number TEXT NOT NULL UNIQUE,

    -- Display name chosen by the user.
    -- The backend can change this name later.
    name TEXT NOT NULL,

    -- Current installation position.
    -- NULL means the bulb is registered but not installed.
    --
    -- UNIQUE allows only one bulb at each position.
    -- SQLite allows multiple rows with NULL here,
    -- so multiple bulbs can remain uninstalled.
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

    -- ID of the bulb that sent the heartbeat.
    bulb_id INTEGER NOT NULL,

    -- Copy the bulb's position when this session starts.
    -- This value stays unchanged if the bulb is moved later.
    -- An uninstalled bulb cannot start a session.
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

    -- Every session must refer to an existing bulb.
    -- Prevent deleting a bulb that has session records.
    -- Uninstalling a bulb should set bulbs.position to NULL instead.
    FOREIGN KEY (bulb_id) REFERENCES bulbs(id)
        ON DELETE RESTRICT,

    -- Reject negative start times.
    CHECK (started_at >= 0),

    -- The most recent heartbeat cannot be earlier than the first one.
    CHECK (last_seen_at >= started_at)
);


-- Speed up queries for sessions at one position, newest first.
CREATE INDEX IF NOT EXISTS idx_light_sessions_position_time
    ON light_sessions (position, started_at DESC);


-- Reject any attempt to change a registered bulb's serial number.
-- Changing its name or position is still allowed.
CREATE TRIGGER IF NOT EXISTS prevent_bulb_serial_number_change
BEFORE UPDATE OF serial_number ON bulbs
WHEN NEW.serial_number IS NOT OLD.serial_number
BEGIN
    SELECT RAISE(ABORT, 'Bulb serial number cannot be changed');
END;


-- Finish applying the schema changes.
COMMIT;