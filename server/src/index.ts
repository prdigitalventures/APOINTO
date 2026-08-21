import cors from "cors";
import express from "express";
import { createBooking, initDb, listBookings } from "./db.js";

const PORT = Number(process.env.PORT ?? 3001);

initDb();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "apointo-api" });
});

app.get("/api/bookings", (_req, res) => {
  res.json({ bookings: listBookings() });
});

app.post("/api/bookings", (req, res) => {
  const { businessName, customerName, service, scheduledAt } = req.body ?? {};

  if (!businessName || !customerName || !service || !scheduledAt) {
    res.status(400).json({ error: "businessName, customerName, service, and scheduledAt are required" });
    return;
  }

  const booking = createBooking({ businessName, customerName, service, scheduledAt });
  res.status(201).json({ booking });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`APOINTO API listening on http://0.0.0.0:${PORT}`);
});
