import faker from '@faker-js/faker';
import { Room } from '@prisma/client';

export const mockRoom = (
  roomId: number = faker.datatype.number(),
  capacity: number = faker.datatype.number({ min: 1 }),
): Room => ({
  id: roomId,
  capacity,
  hotelId: faker.datatype.number(),
  name: faker.name.jobArea(),
  createdAt: new Date(faker.date.past().toISOString()),
  updatedAt: new Date(faker.date.past().toISOString()),
});
