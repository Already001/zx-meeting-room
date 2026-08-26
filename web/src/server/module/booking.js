import http from "../http";

export const getBoard = (date) => http.get("/board", { params: { date } });

export const listMyBookings = () => http.get("/bookings/mine");

export const createBooking = (payload) => http.post("/bookings", payload);

export const releaseBooking = (id) => http.put(`/bookings/${id}/release`);
