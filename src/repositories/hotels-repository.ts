import { Hotel } from '@prisma/client';
import { prisma } from '@/config';

async function findHotels(): Promise<Omit<Hotel, 'Rooms'>[]> {
  const hotels = await prisma.hotel.findMany({
    select: { id: true, name: true, image: true, createdAt: true, updatedAt: true },
  });
  return hotels.map((hotel) => ({
    ...hotel,
    updatedAt: new Date(hotel.updatedAt.toISOString()),
    createdAt: new Date(hotel.createdAt.toISOString()),
  }));
}

async function findHotelRooms(id: number): Promise<Hotel> {
  return await prisma.hotel.findUnique({
    where: { id },
    include: { Rooms: true },
  });
}

export const hotelsRepository = {
  findHotels,
  findHotelRooms,
};
