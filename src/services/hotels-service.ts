import { Hotel } from '@prisma/client';
import { UserTickets } from './tickets-service';
import { ticketsRepositories } from '@/repositories';
import { notFoundError } from '@/errors';
import { paymentRequired } from '@/errors/payment-required';
import { hotelsRepository } from '@/repositories/hotels-repository';

const checkIfTicketIsValid = async (userId: number): Promise<UserTickets> => {
  const tickets: UserTickets[] = await ticketsRepositories.findByUserId(userId);
  if (!tickets || tickets.length === 0) throw notFoundError();

  const ticket: UserTickets = tickets[0];

  if (ticket.status !== 'PAID' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel)
    throw paymentRequired();

  return ticket;
};

async function getHotels(userId: number): Promise<Omit<Hotel, 'Rooms'>[]> {
  await checkIfTicketIsValid(userId);
  const hotels = await hotelsRepository.findHotels();
  if (!hotels || hotels.length === 0) throw notFoundError();
  return hotels;
}

async function getHotelRooms(userId: number, hotelId: number): Promise<Hotel> {
  await checkIfTicketIsValid(userId);

  const hotelWithRooms = await hotelsRepository.findHotelRooms(hotelId);
  if (!hotelWithRooms) throw notFoundError();

  return hotelWithRooms;
}

export const hotelsService = {
  getHotels,
  getHotelRooms,
};
