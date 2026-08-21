export type Booking = {
  id: number;
  businessName: string;
  customerName: string;
  service: string;
  scheduledAt: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
};

export async function fetchBookings(): Promise<Booking[]> {
  const response = await fetch("/api/bookings");
  if (!response.ok) {
    throw new Error("Failed to load bookings");
  }
  const data = (await response.json()) as { bookings: Booking[] };
  return data.bookings;
}

export async function createBooking(input: {
  businessName: string;
  customerName: string;
  service: string;
  scheduledAt: string;
}): Promise<Booking> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Failed to create booking");
  }

  const data = (await response.json()) as { booking: Booking };
  return data.booking;
}
