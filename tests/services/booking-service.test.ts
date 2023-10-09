import faker from '@faker-js/faker';
import { Booking, Room } from '@prisma/client';
import { cleanDb } from '../helpers';
import { mockRoom } from '../factories/room-factory';
import { mockUserTicket } from '../factories';
import { init } from '@/app';
import { bookingService } from '@/services';
import { bookingRepository, ticketsRepositories } from '@/repositories';
import { forbiddenError, notFoundError } from '@/errors';

beforeEach(() => {
  jest.clearAllMocks();
});

beforeAll(async () => {
  await init();
  await cleanDb();
});

describe('findBooking', () => {
  it('should throw notFoundError if user does not have any reservation', async () => {
    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce(null);

    try {
      await bookingService.findBooking(1);
      fail('should throw not found error!');
    } catch (error) {
      expect(error).toEqual(notFoundError());
    }
  });

  it("should return user's booking if userId and roomId are valid", async () => {
    const id = faker.datatype.number();
    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce({
      id,
      Room: {
        id,
        capacity: faker.datatype.number(),
        hotelId: faker.datatype.number(),
        name: faker.name.jobArea(),
        createdAt: new Date(faker.date.past().toISOString()),
        updatedAt: new Date(faker.date.past().toISOString()),
      },
    });

    try {
      const response = await bookingService.findBooking(id);
      expect(response).toEqual(
        expect.objectContaining({
          id,
          Room: expect.objectContaining({
            id,
            name: expect.any(String),
            capacity: expect.any(Number),
            hotelId: expect.any(Number),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        }),
      );
    } catch (error) {
      fail(`should return a booking, but got an error: ${error.message}`);
    }
  });
});

describe('createBooking', () => {
  const bookingId = faker.datatype.number();
  const userId = faker.datatype.number();
  const roomId = faker.datatype.number();

  it('should throw a forbiddenError if user already has a reservation (booking)', async () => {
    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce({
      id: bookingId,
      Room: mockRoom(roomId),
    });
    const response = bookingService.createBooking(userId, roomId);
    expect(response).rejects.toEqual(forbiddenError('User already have booked a room.'));
  });

  it('should throw a notFoundError if room does not exist', async () => {
    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(null);

    const response = bookingService.createBooking(userId, roomId);
    expect(response).rejects.toEqual(notFoundError());
  });

  it('should throw a forbiddenError if room is at its full capacity', async () => {
    const randomCapacity = Math.floor((Math.random() + 0.1) * 10);
    const room: Room = mockRoom(roomId, randomCapacity);
    const bookings = Array(randomCapacity).fill({
      id: faker.datatype.number(),
      Room: room,
    });

    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce(null);
    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(room);
    jest.spyOn(bookingRepository, 'findBookingsByRoomId').mockResolvedValueOnce(bookings);

    const response = bookingService.createBooking(userId, roomId);
    expect(response).rejects.toEqual(forbiddenError('This room is already full.'));
  });

  it("should throw a forbiddenError if user's ticket type is remote", async () => {
    const randomCapacity = Math.floor((Math.random() + 0.1) * 10);
    const room: Room = mockRoom(roomId, randomCapacity);

    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce(null);
    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(room);
    jest.spyOn(bookingRepository, 'findBookingsByRoomId').mockResolvedValueOnce(null);

    //Ticket validity:
    jest.spyOn(ticketsRepositories, 'findByUserId').mockResolvedValueOnce([mockUserTicket('PAID', true, true)]);

    expect(bookingService.createBooking(userId, roomId)).rejects.toEqual(
      forbiddenError('User must have a ticket that is: presencial, includes hotel and is paid'),
    );
  });

  it("should throw a forbiddenError if user's ticket type does not includes hotel", async () => {
    const randomCapacity = Math.floor((Math.random() + 0.1) * 10);
    const room: Room = mockRoom(roomId, randomCapacity);

    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce(null);
    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(room);
    jest.spyOn(bookingRepository, 'findBookingsByRoomId').mockResolvedValueOnce(null);

    //Ticket validity:
    jest.spyOn(ticketsRepositories, 'findByUserId').mockResolvedValueOnce([mockUserTicket('PAID', false, false)]);

    expect(bookingService.createBooking(userId, roomId)).rejects.toEqual(
      forbiddenError('User must have a ticket that is: presencial, includes hotel and is paid'),
    );
  });

  it("should throw a forbiddenError if user's ticket type is not paid", async () => {
    const randomCapacity = Math.floor((Math.random() + 0.1) * 10);
    const room: Room = mockRoom(roomId, randomCapacity);

    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce(null);
    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(room);
    jest.spyOn(bookingRepository, 'findBookingsByRoomId').mockResolvedValueOnce(null);

    //Ticket validity:
    jest.spyOn(ticketsRepositories, 'findByUserId').mockResolvedValueOnce([mockUserTicket('RESERVED', false, true)]);

    expect(bookingService.createBooking(userId, roomId)).rejects.toEqual(
      forbiddenError('User must have a ticket that is: presencial, includes hotel and is paid'),
    );
  });

  it('should create a new booking and return it with input data is ok', async () => {
    const randomCapacity = Math.floor((Math.random() + 0.1) * 10);
    const room: Room = mockRoom(roomId, randomCapacity);

    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce(null);
    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(room);
    jest.spyOn(bookingRepository, 'findBookingsByRoomId').mockResolvedValueOnce(null);

    //Ticket validity:
    jest.spyOn(ticketsRepositories, 'findByUserId').mockResolvedValueOnce([mockUserTicket('PAID', false, true)]);

    jest.spyOn(bookingRepository, 'create').mockResolvedValueOnce({
      id: faker.datatype.number(),
      roomId,
      userId,
      createdAt: new Date(faker.date.past().toISOString()),
      updatedAt: new Date(faker.date.past().toISOString()),
    });

    const response = await bookingService.createBooking(userId, roomId);
    expect(response).toEqual(
      expect.objectContaining<Booking>({
        id: expect.any(Number),
        roomId,
        userId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });
});

describe('changeRoom', () => {
  const bookingId = faker.datatype.number();
  const userId = faker.datatype.number();
  const roomId = faker.datatype.number();

  it('should throw a notFoundError when room does not exist', async () => {
    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(null);

    const response = bookingService.changeRoom(userId, roomId, bookingId);
    expect(response).rejects.toEqual(notFoundError());
  });

  it('should throw a forbiddenError when user does not have any reservation', async () => {
    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(mockRoom());
    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce(null);

    const response = bookingService.changeRoom(userId, roomId, bookingId);
    expect(response).rejects.toEqual(forbiddenError("User don't have any reservation!"));
  });

  it('should throw a forbiddenError when bookingId found from userId does not match bookingId provided', async () => {
    const randomCapacity = Math.floor((Math.random() + 0.1) * 10);
    const room: Room = mockRoom(roomId, randomCapacity);
    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(room);
    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce({
      id: bookingId,
      Room: mockRoom(roomId),
    });

    const response = bookingService.changeRoom(userId, roomId, bookingId + faker.datatype.number({ min: 1 }));
    expect(response).rejects.toEqual(forbiddenError("bookingId provided does match user's bookingId"));
  });

  it('should throw a forbiddenError when user is trying to change for a room that is already full', async () => {
    const randomCapacity = Math.floor((Math.random() + 0.1) * 10);
    const room: Room = mockRoom(roomId, randomCapacity);
    const bookings = Array(randomCapacity).fill({
      id: faker.datatype.number(),
      Room: room,
    });

    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(room);
    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce({
      id: bookingId,
      Room: mockRoom(roomId + Number(faker.random.numeric())),
    });
    jest.spyOn(bookingRepository, 'findBookingsByRoomId').mockResolvedValueOnce(bookings);

    const response = bookingService.changeRoom(userId, roomId, bookingId);
    expect(response).rejects.toEqual(forbiddenError('This room is already full.'));
  });

  it('should update the room of the booking and return the booking if input data is ok', async () => {
    jest.spyOn(bookingRepository, 'findRoom').mockResolvedValueOnce(mockRoom());
    jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce({
      id: bookingId,
      Room: mockRoom(roomId),
    });
    jest.spyOn(bookingRepository, 'findBookingsByRoomId').mockResolvedValueOnce(null);

    jest.spyOn(bookingRepository, 'update').mockResolvedValueOnce({
      id: faker.datatype.number(),
      roomId,
      userId,
      createdAt: new Date(faker.date.past().toISOString()),
      updatedAt: new Date(faker.date.past().toISOString()),
    });

    const response = await bookingService.changeRoom(userId, roomId, bookingId);
    expect(response).toEqual(
      expect.objectContaining<Booking>({
        id: expect.any(Number),
        roomId,
        userId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });
});
