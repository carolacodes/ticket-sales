import Ticket from "../models/ticket.model.js";
import Event from "../models/event.model.js";
import User from "../models/user.model.js";
import TicketType from "../models/ticketType.model.js";

export async function createManyTickets(tickets, session) {
  return await Ticket.insertMany(tickets, session ? { session } : undefined);
}

export async function findTicketsByUserId(userId) {
  return await Ticket.find({ userId }).sort({ createdAt: -1 });
}

export async function findTicketByCode(code) {
  return await Ticket.findOne({ code });
}

export async function updateTicketById(id, update, session) {
  return await Ticket.findByIdAndUpdate(id, update, { new: true, session });
}

export async function listEventTicketsForOrganizer(eventId, organizerId) {
  const event = await Event.findById(eventId).lean();

  if (!event) {
    const err = new Error("Event not found");
    err.status = 404;
    throw err;
  }

  if (String(event.organizerId) !== String(organizerId)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }

  const tickets = await Ticket.find({ eventId }).sort({ createdAt: -1 }).lean();

  const buyerIds = [...new Set(tickets.map((t) => String(t.userId)).filter(Boolean))];
  const ticketTypeIds = [...new Set(tickets.map((t) => String(t.ticketTypeId)).filter(Boolean))];

  const buyers = await User.find(
    { _id: { $in: buyerIds } },
    { username: 1, email: 1 }
  ).lean();

  const ticketTypes = await TicketType.find(
    { _id: { $in: ticketTypeIds } },
    { name: 1, price: 1, currency: 1 }
  ).lean();

  const buyersMap = Object.fromEntries(
    buyers.map((b) => [String(b._id), b])
  );

  const ticketTypesMap = Object.fromEntries(
    ticketTypes.map((tt) => [String(tt._id), tt])
  );

  const enrichedTickets = tickets.map((t) => ({
    ...t,
    buyer: buyersMap[String(t.userId)] || null,
    ticketType: ticketTypesMap[String(t.ticketTypeId)] || null,
  }));

  const stats = {
    total: enrichedTickets.length,
    valid: enrichedTickets.filter((t) => t.status === "VALID").length,
    used: enrichedTickets.filter((t) => t.status === "USED").length,
    void: enrichedTickets.filter((t) => t.status === "VOID").length,
  };

  return {
    event: {
      id: String(event._id),
      title: event.title,
      venue: event.venue || "",
      city: event.city || "",
      startAt: event.startAt,
      endAt: event.endAt || null,
      status: event.status,
    },
    stats,
    tickets: enrichedTickets,
  };
}