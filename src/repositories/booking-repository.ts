import { Booking, Room } from '@prisma/client';
import { prisma } from '@/config';

async function findByUserId(userId: number): Promise<{
  id: number;
  Room: Room;
}> {
  return await prisma.booking.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
      Room: true,
    },
  });
}

async function findBookingsByRoomId(roomId: number): Promise<(Booking & { Room: Room })[]> {
  return await prisma.booking.findMany({
    where: { roomId },
    include: {
      Room: true,
    },
  });
}

async function create(userId: number, roomId: number): Promise<Booking> {
  return await prisma.booking.create({
    data: {
      userId,
      roomId,
    },
  });
}

async function findRoom(id: number): Promise<Room> | null {
  return await prisma.room.findUnique({ where: { id } });
}

async function update(userId: number, roomId: number): Promise<Booking> {
  return await prisma.booking.update({
    where: { userId },
    data: {
      roomId,
    },
  });
}

export const bookingRepository = {
  findByUserId,
  findBookingsByRoomId,
  findRoom,
  create,
  update,
};
