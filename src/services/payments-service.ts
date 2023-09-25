import { Payment } from '@prisma/client';
import { UserTickets } from './tickets-service';
import { paymentsRepository } from '@/repositories/payments-repository';
import { ticketsRepositories } from '@/repositories';
import { invalidDataError, notFoundError, unauthorizedError } from '@/errors';

async function getPayments(ticketId: number, userId: number): Promise<Payment> {
  const ticket = await ticketsRepositories.findById(ticketId);
  if (!ticket) throw notFoundError();

  const userTicket = await ticketsRepositories.findByUserId(userId);
  if (!userTicket || userTicket[0].id !== ticketId) throw unauthorizedError();

  return paymentsRepository.findPayment(ticketId);
}

async function postPayment(paymentDetails: PaymentCreation, userId: number): Promise<Payment> {
  const ticket = await ticketsRepositories.findById(paymentDetails.ticketId);
  if (!ticket) throw notFoundError();

  const userTicket = await ticketsRepositories.findByUserId(userId);
  if (!userTicket || userTicket[0].id !== ticket.id) throw unauthorizedError();

  const payment = await paymentsRepository.createPayment(
    paymentDetails.cardData.issuer,
    paymentDetails.cardData.number.toString().slice(-4),
    ticket.id,
    userTicket[0].TicketType.price,
  );
  await ticketsRepositories.updateTicketStatus(paymentDetails.ticketId, 'PAID');

  return payment;
}

export type PaymentCreation = {
  ticketId: number;
  cardData: {
    issuer: string;
    number: number;
    name: string;
    expirationDate: Date;
    cvv: number;
  };
};

export const paymentsService = { getPayments, postPayment };
