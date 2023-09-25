import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import { TicketReservation, TicketType, UserTickets, ticketsService } from '@/services/tickets-service';
import { invalidDataError } from '@/errors';

export async function getUserTickets(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  const tickets: UserTickets[] | null = await ticketsService.getByUserId(userId);
  if (!tickets) {
    res.sendStatus(404);
  } else {
    res.send(tickets[0]);
  }
}

export async function getTicketsType(_req: AuthenticatedRequest, res: Response) {
  res.send((await ticketsService.getByType()) as TicketType[]);
}

export async function postTicket(req: AuthenticatedRequest, res: Response) {
  const { ticketTypeId } = req.body as TicketReservation;
  if (!ticketTypeId) throw invalidDataError('Ticket type id not sent');

  const ticket: UserTickets = await ticketsService.reserveTicket(req.userId, ticketTypeId);

  res.status(httpStatus.CREATED).send(ticket);
}
