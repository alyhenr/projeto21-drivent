import { Enrollment } from '@prisma/client';
import { findByUserId, findTypes, enrollmentRepository, createTicket } from '@/repositories';
import { notFoundError } from '@/errors';

export function getByUserId(userId: number): Promise<UserTickets[]> | null {
  return findByUserId(userId);
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

export function getByType(): Promise<TicketType[]> {
  return findTypes();
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

export async function reserveTicket(userId: number, ticketTypeId: number): Promise<UserTickets> {
  const enrollment: Enrollment = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollment) throw notFoundError();

  await createTicket(enrollment.id, ticketTypeId);

  return (await findByUserId(userId))[0];
}

export type TicketReservation = {
  ticketTypeId: number;
};
