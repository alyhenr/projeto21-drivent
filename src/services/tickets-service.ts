import { Enrollment } from '@prisma/client';
import { ticketsRepositories, enrollmentRepository } from '@/repositories';
import { notFoundError } from '@/errors';

function getByUserId(userId: number): Promise<UserTickets[]> | null {
  return ticketsRepositories.findByUserId(userId);
}

export type UserTickets = {
  id: number;
  status: string; //RESERVED | PAID
  ticketTypeId: number;
  enrollmentId: number;
  TicketType: TicketType;
  createdAt: Date;
  updatedAt: Date;
};

function getByType(): Promise<TicketType[]> {
  return ticketsRepositories.findTypes();
}

export type TicketType = {
  id: number;
  name: string;
  price: number;
  isRemote: boolean;
  includesHotel: boolean;
  createdAt: Date;
  updatedAt: Date;
};

async function reserveTicket(userId: number, ticketTypeId: number): Promise<UserTickets> {
  const enrollment: Enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollment) throw notFoundError();

  await ticketsRepositories.createTicket(enrollment.id, ticketTypeId);

  return (await ticketsRepositories.findByUserId(userId))[0];
}

export type TicketReservation = {
  ticketTypeId: number;
};

export const ticketsService = {
  getByUserId,
  getByType,
  reserveTicket,
};
