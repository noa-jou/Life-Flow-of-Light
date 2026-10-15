import { mkdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

// Resolve paths relative to this file.
// This works from both src/database.ts and dist/database.js.
const dataDirectory = new URL('../data/', import.meta.url);
const databaseFile = new URL('life-flow-of-light.sqlite', dataDirectory);
const schemaFile = new URL('../schema.sql', import.meta.url);

// Create the data directory if it does not exist.
mkdirSync(dataDirectory, { recursive: true });

// Open the existing database, or create a new database file.
const database = new DatabaseSync(fileURLToPath(databaseFile));

try {
  // Enable foreign key checks for this connection.
  database.exec('PRAGMA foreign_keys = ON;');

  // Read and execute the SQL instructions.
  const schema = readFileSync(schemaFile, 'utf8');
  database.exec(schema);
} catch (error) {
  // Release the connection if initialization fails.
  database.close();
  throw error;
}

// Other backend files can import this connection.
export { database };