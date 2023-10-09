import { Booking, Room } from '@prisma/client';
import { checkIfTicketIsValid } from './hotels-service';
import { bookingRepository } from '@/repositories';
import { forbiddenError, notFoundError } from '@/errors';

async function findBooking(userId: number): Promise<{
  id: number;
  Room: Room;
}> {
  const userBooking = await bookingRepository.findByUserId(userId);
  if (!userBooking) throw notFoundError();

  return userBooking;
}

async function createBooking(userId: number, roomId: number): Promise<Booking> {
  const existingBooking = await bookingRepository.findByUserId(userId);
  if (existingBooking) throw forbiddenError('User already have booked a room.');

  const room: Room = await bookingRepository.findRoom(Number(roomId));
  if (!room) throw notFoundError();

  const roomBookings: (Booking & { Room: Room })[] = await bookingRepository.findBookingsByRoomId(Number(roomId));

  if (!!roomBookings && roomBookings.length >= room.capacity) throw forbiddenError('This room is already full.');

  await checkIfTicketIsValid(
    userId,
    forbiddenError('User must have a ticket that is: presencial, includes hotel and is paid'),
  );

  const newBooking = await bookingRepository.create(userId, roomId);

  return newBooking;
}

async function changeRoom(userId: number, roomId: number, bookingId: number): Promise<Booking> {
  const room = await bookingRepository.findRoom(Number(roomId));
  if (!room) throw notFoundError();

  const booking = await bookingRepository.findByUserId(userId);
  if (!booking) throw forbiddenError("User don't have any reservation!");

  if (booking.id !== bookingId) throw forbiddenError("bookingId provided does match user's bookingId");

  const roomBookings: (Booking & { Room: Room })[] = await bookingRepository.findBookingsByRoomId(Number(roomId));

  if (!!roomBookings && roomBookings.length >= room.capacity) throw forbiddenError('This room is already full.');

  const updatedBooking = await bookingRepository.update(userId, roomId);

  return updatedBooking;
}

export type CreateBooking = {
  roomId: number;
};

export const bookingService = {
  findBooking,
  createBooking,
  changeRoom,
};
