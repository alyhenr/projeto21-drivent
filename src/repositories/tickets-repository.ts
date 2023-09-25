import { Ticket } from '@prisma/client';
import { TicketType, UserTickets } from '@/services';
import { prisma } from '@/config';

async function findById(id: number): Promise<Ticket> {
  return await prisma.ticket.findUnique({
    where: { id },
    rejectOnNotFound: false,
  });
}

async function findByUserId(userId: number): Promise<UserTickets[]> | null {
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      status: true,
      ticketTypeId: true,
      enrollmentId: true,
      createdAt: true,
      updatedAt: true,
      TicketType: {
        select: {
          id: true,
          name: true,
          price: true,
          isRemote: true,
          includesHotel: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    where: {
      Enrollment: {
        userId,
      },
    },
  });

  if (!tickets || tickets.length == 0) {
    return null;
  }

  return tickets.map((ticket) => ({
    id: ticket.id,
    status: ticket.status,
    ticketTypeId: ticket.ticketTypeId,
    enrollmentId: ticket.enrollmentId,
    TicketType: {
      id: ticket.TicketType.id,
      name: ticket.TicketType.name,
      price: ticket.TicketType.price,
      isRemote: ticket.TicketType.isRemote,
      includesHotel: ticket.TicketType.includesHotel,
      createdAt: ticket.TicketType.createdAt,
      updatedAt: ticket.TicketType.updatedAt,
    },
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  }));
}

async function findTypes(): Promise<TicketType[]> {
  return await prisma.ticketType.findMany();
}

async function createTicket(enrollmentId: number, ticketTypeId: number): Promise<void> {
  await prisma.ticket.create({
    data: {
      status: 'RESERVED',
      enrollmentId,
      ticketTypeId,
    },
  });
}

async function updateTicketStatus(ticketId: number, status: 'RESERVED' | 'PAID'): Promise<void> {
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: status },
  });
}

export const ticketsRepositories = {
  findById,
  findByUserId,
  findTypes,
  createTicket,
  updateTicketStatus,
};
