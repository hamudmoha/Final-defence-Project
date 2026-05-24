import api from "../../../services/api";

/* Create Ticket */
export const createTicket = async (ticketData) => {
  const res = await api.post("/tickets", ticketData);
  return res.data;
};

/* Get Tickets */
export const getTickets = async () => {
  const res = await api.get("/tickets");
  return res.data;
};
