import http from "../http";

export const getBoard = (date) => http.get("/board", { params: { date } });

export const listMyBookings = () => http.get("/bookings/mine");

export const createBooking = (payload) => http.post("/bookings", payload);

export const updateBooking = (id, payload) =>
  http.put(`/bookings/${id}`, payload);

export const releaseBooking = (id) => http.put(`/bookings/${id}/release`);

export const listBookingAudit = (id) => http.get(`/bookings/${id}/audit`);

export const listAdminBookings = (params) =>
  http.get("/bookings/admin", { params });
