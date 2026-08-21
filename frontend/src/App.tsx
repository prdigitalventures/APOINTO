import { FormEvent, useEffect, useState } from "react";
import { Booking, createBooking, fetchBookings } from "./api";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("Mumbai Fitness Studio");
  const [customerName, setCustomerName] = useState("Neha Sharma");
  const [service, setService] = useState("Yoga Class");
  const [scheduledAt, setScheduledAt] = useState("2026-08-25T09:00:00");

  async function loadBookings() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBookings();
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const booking = await createBooking({ businessName, customerName, service, scheduledAt });
      setBookings((current) => [...current, booking].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <main className="page">
      <header>
        <h1>APOINTO</h1>
        <p>Universal AI-Powered Booking Platform for Indian SMBs</p>
      </header>

      <section className="card">
        <h2>Create booking</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Business
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </label>
          <label>
            Customer
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </label>
          <label>
            Service
            <input value={service} onChange={(e) => setService(e.target.value)} required />
          </label>
          <label>
            Scheduled at
            <input type="datetime-local" value={scheduledAt.slice(0, 16)} onChange={(e) => setScheduledAt(`${e.target.value}:00`)} required />
          </label>
          <button type="submit">Book appointment</button>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <h2>Upcoming bookings</h2>
          <button type="button" className="secondary" onClick={loadBookings}>Refresh</button>
        </div>
        {loading && <p>Loading bookings...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && bookings.length === 0 && <p>No bookings yet.</p>}
        <ul className="booking-list">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <strong>{booking.businessName}</strong>
              <span>{booking.service}</span>
              <span>{booking.customerName}</span>
              <span>{formatDate(booking.scheduledAt)}</span>
              <span className={`status status-${booking.status}`}>{booking.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
