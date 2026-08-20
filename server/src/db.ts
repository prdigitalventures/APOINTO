import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "apointo.db");

export type Booking = {
  id: number;
  businessName: string;
  customerName: string;
  service: string;
  scheduledAt: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
};

export function getDb(): Database.Database {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

export function initDb(db = getDb()): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      service TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const count = db.prepare("SELECT COUNT(*) as count FROM bookings").get() as { count: number };
  if (count.count === 0) {
    const insert = db.prepare(
      "INSERT INTO bookings (business_name, customer_name, service, scheduled_at, status) VALUES (?, ?, ?, ?, ?)"
    );
    insert.run("Sharma Salon", "Priya Patel", "Haircut", "2026-08-21T10:00:00", "confirmed");
    insert.run("Gupta Dental Clinic", "Amit Kumar", "Dental Checkup", "2026-08-22T14:30:00", "pending");
  }
}

export function listBookings(db = getDb()): Booking[] {
  const rows = db
    .prepare(
      "SELECT id, business_name, customer_name, service, scheduled_at, status, created_at FROM bookings ORDER BY scheduled_at"
    )
    .all() as Array<{
    id: number;
    business_name: string;
    customer_name: string;
    service: string;
    scheduled_at: string;
    status: Booking["status"];
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    businessName: row.business_name,
    customerName: row.customer_name,
    service: row.service,
    scheduledAt: row.scheduled_at,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export function createBooking(
  input: Pick<Booking, "businessName" | "customerName" | "service" | "scheduledAt">,
  db = getDb()
): Booking {
  const result = db
    .prepare(
      "INSERT INTO bookings (business_name, customer_name, service, scheduled_at, status) VALUES (?, ?, ?, ?, 'pending')"
    )
    .run(input.businessName, input.customerName, input.service, input.scheduledAt);

  const row = db
    .prepare(
      "SELECT id, business_name, customer_name, service, scheduled_at, status, created_at FROM bookings WHERE id = ?"
    )
    .get(result.lastInsertRowid) as {
    id: number;
    business_name: string;
    customer_name: string;
    service: string;
    scheduled_at: string;
    status: Booking["status"];
    created_at: string;
  };

  return {
    id: row.id,
    businessName: row.business_name,
    customerName: row.customer_name,
    service: row.service,
    scheduledAt: row.scheduled_at,
    status: row.status,
    createdAt: row.created_at,
  };
}

if (process.argv.includes("--init")) {
  initDb();
  console.log("Database initialized at", dbPath);
}
