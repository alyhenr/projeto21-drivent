import faker from '@faker-js/faker';
import { Hotel, Room } from '@prisma/client';
import { createHotels } from './hotels-factory';
import { prisma } from '@/config';

export async function createRoom(): Promise<Room> {
  const hotel: Hotel = (await createHotels(1))[0];
  return await prisma.room.create({
    data: {
      hotelId: hotel.id,
      capacity: faker.datatype.number({ min: 1, max: 10 }),
      name: faker.name.jobTitle(),
    },
  });
}

export const mockRoom = (
  roomId: number = faker.datatype.number(),
  capacity: number = faker.datatype.number({ min: 1, max: 20 }),
): Room => ({
  id: roomId,
  capacity,
  hotelId: faker.datatype.number(),
  name: faker.name.jobArea(),
  createdAt: new Date(faker.date.past().toISOString()),
  updatedAt: new Date(faker.date.past().toISOString()),
});
