import { Response } from 'express';
import { Booking, Room } from '@prisma/client';
import { AuthenticatedRequest } from '@/middlewares';
import { CreateBooking, bookingService } from '@/services';
import { invalidDataError } from '@/errors';

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  const userBooking: {
    id: number;
    Room: Room;
  } = await bookingService.findBooking(userId);

  res.send(userBooking);
}

export async function createBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body as CreateBooking;
  if (!roomId) throw invalidDataError('Room id is required');

  const newBooking: Booking = await bookingService.createBooking(userId, roomId);

  res.status(200).send({
    bookingId: newBooking.id,
  });
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { bookingId } = req.params;
  const { roomId } = req.body as CreateBooking;
  if (!roomId) throw invalidDataError('Room id is required');

  const changedBooking: Booking = await bookingService.changeRoom(userId, Number(roomId), Number(bookingId));

  res.status(200).send({
    bookingId: changedBooking.id,
  });
}
