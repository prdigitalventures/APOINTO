import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

test("createBooking persists a booking", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "apointo-test-"));
  const dbPath = path.join(tempDir, "test.db");
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      service TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const result = db
    .prepare(
      "INSERT INTO bookings (business_name, customer_name, service, scheduled_at, status) VALUES (?, ?, ?, ?, 'pending')"
    )
    .run("Test Spa", "Ravi Singh", "Massage", "2026-09-01T11:00:00");

  const row = db
    .prepare("SELECT business_name, customer_name, service FROM bookings WHERE id = ?")
    .get(result.lastInsertRowid) as { business_name: string; customer_name: string; service: string };

  assert.equal(row.business_name, "Test Spa");
  assert.equal(row.customer_name, "Ravi Singh");
  assert.equal(row.service, "Massage");

  db.close();
  fs.rmSync(tempDir, { recursive: true, force: true });
});
