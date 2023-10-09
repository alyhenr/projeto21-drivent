import faker from '@faker-js/faker';
import { TicketStatus } from '@prisma/client';
import { prisma } from '@/config';
import { UserTickets } from '@/services';

export async function createTicketType(isRemote = faker.datatype.boolean(), includesHotel = faker.datatype.boolean()) {
  return prisma.ticketType.create({
    data: {
      name: faker.name.findName(),
      price: faker.datatype.number(),
      isRemote,
      includesHotel,
    },
  });
}

export async function createTicket(enrollmentId: number, ticketTypeId: number, status: TicketStatus) {
  return prisma.ticket.create({
    data: {
      enrollmentId,
      ticketTypeId,
      status,
    },
  });
}

export const mockUserTicket = (status = 'RESERVED', isRemote = false, includesHotel = true): UserTickets => ({
  id: faker.datatype.number(),
  status,
  ticketTypeId: faker.datatype.number(),
  enrollmentId: faker.datatype.number(),
  createdAt: new Date(faker.date.past().toISOString()),
  updatedAt: new Date(faker.date.past().toISOString()),
  TicketType: {
    id: faker.datatype.number(),
    includesHotel,
    isRemote,
    name: faker.name.jobTitle(),
    price: faker.datatype.number(),
    createdAt: new Date(faker.date.past().toISOString()),
    updatedAt: new Date(faker.date.past().toISOString()),
  },
});
