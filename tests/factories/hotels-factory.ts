import faker from '@faker-js/faker';
import { Hotel } from '@prisma/client';
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
