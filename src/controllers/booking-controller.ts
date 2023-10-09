import { Response } from 'express';
import { Booking, Room } from '@prisma/client';
import { AuthenticatedRequest } from '@/middlewares';
import { CreateBooking, bookingService } from '@/services';

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

  const newBooking: Booking = await bookingService.createBooking(userId, roomId);

  res.send({
    bookingId: newBooking.id,
  });
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body as CreateBooking;

  const changedBooking: Booking = await bookingService.changeRoom(userId, roomId);

  res.send({
    bookingId: changedBooking.id,
  });
}
