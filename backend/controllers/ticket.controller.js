import {
  findTicketsByUserId,
  updateTicketById,
  listEventTicketsForOrganizer,
} from "../services/ticket.service.js";

export async function listMine(req, res, next) {
  try {
    const userId = req.user.id;
    const tickets = await findTicketsByUserId(userId);
    return res.status(200).json({ tickets });
  } catch (err) {
    next(err);
  }
}

export async function listByEventForOrganizer(req, res, next) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    const result = await listEventTicketsForOrganizer(eventId, organizerId);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function checkIn(req, res, next) {
  try {
    const ticket = req.ticket;

    if (ticket.status !== "VALID") {
      return res.status(400).json({ message: `Ticket is ${ticket.status}` });
    }

    const updated = await updateTicketById(ticket._id, {
      status: "USED",
      checkedInAt: new Date(),
    });

    return res.status(200).json({ ticket: updated });
  } catch (err) {
    next(err);
  }
}