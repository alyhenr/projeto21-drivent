import faker from '@faker-js/faker';
import { Hotel, Room } from '@prisma/client';
import { prisma } from '@/config';

export async function createHotels(qtde: number): Promise<Hotel[]> {
  const hotels: Hotel[] = [];

  for (let i = 0; i < qtde; i++) {
    const hotel = await prisma.hotel.create({
      data: {
        name: faker.company.companyName(),
        image: faker.internet.url(),
      },
    });
    hotels.push(hotel);
  }

  return hotels;
}

export async function createRooms(qtde: number, hotelId: number): Promise<Room[]> {
  const rooms: Room[] = [];

  for (let i = 0; i < qtde; i++) {
    const room = await prisma.room.create({
      data: {
        name: faker.name.jobArea(),
        capacity: Number(faker.random.numeric()),
        hotelId,
      },
    });
    rooms.push(room);
  }
  return rooms;
}
