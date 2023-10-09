import supertest from 'supertest';
import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';
import { cleanDb, generateValidToken } from '../helpers';
import { createEnrollmentWithAddress, createTicket, createTicketType, createUser } from '../factories';
import { createHotels, createRooms } from '../factories/hotels-factory';
import { createBooking } from '../factories/booking-factory';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
  await cleanDb();
});

const server = supertest(app);

describe('/GET booking', () => {
  it('Should respond with 401 when no token is given', async () => {
    const response = await server.get('/booking');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 401 when token is invalid', async () => {
    const invalidToken = faker.lorem.word();
    const response = await server.get('/booking').set('Authorization', `Bearer ${invalidToken}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 401 if token is valid but there is no session', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with a 404 notFoundError when user has no booking yet', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('Should respond with a 404 notFoundError when user has no booking yet', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it("Should respond with a 200 and send the user's booking", async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const room = (await createRooms(1, hotel.id))[0];
    const booking = await createBooking(user.id, room.id);

    const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.body).toEqual({
      id: booking.id,
      Room: {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        hotelId: room.hotelId,
        createdAt: room.createdAt.toISOString(),
        updatedAt: room.updatedAt.toISOString(),
      },
    });
  });
});

describe('/POST booking', () => {
  it('Should respond with 401 when no token is given', async () => {
    const response = await server.post('/booking');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 401 when token is invalid', async () => {
    const invalidToken = faker.lorem.word();
    const response = await server.post('/booking').set('Authorization', `Bearer ${invalidToken}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 401 if token is valid but there is no session', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with a 400 bad request status code if roomId is not provided', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });

  it('Should respond with a 403 forbidden status code if user already have a active booking', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const room = (await createRooms(1, hotel.id))[0];
    await createBooking(user.id, room.id);

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it('Should respond with a 404 not found status code if room does not exist', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server
      .post('/booking')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: faker.random.numeric() });
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('Should respond with a 403 forbidden status code if room is already full', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const room = (await createRooms(1, hotel.id))[0];
    for (let i = 0; i < room.capacity; i++) {
      const userWithBooking = await createUser();
      await createBooking(userWithBooking.id, room.id);
    }

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });

    expect(response.status).toBe(httpStatus.FORBIDDEN);
    expect(response.text).toEqual('This room is already full.');
  });

  it('Should respond with a 404 not found status code if user does not have a ticket', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const room = (await createRooms(1, hotel.id))[0];

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });

    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('Should respond with a 403 forbidden status code when ticket is not paid', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const room = (await createRooms(1, hotel.id))[0];

    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, 'RESERVED');

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });

    expect(response.status).toBe(httpStatus.FORBIDDEN);
    expect(response.text).toEqual('User must have a ticket that is: presencial, includes hotel and is paid');
  });

  it('Should respond with a 403 forbidden status code when ticket is remote', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const room = (await createRooms(1, hotel.id))[0];

    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(true, true);
    await createTicket(enrollment.id, ticketType.id, 'PAID');

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });

    expect(response.status).toBe(httpStatus.FORBIDDEN);
    expect(response.text).toEqual('User must have a ticket that is: presencial, includes hotel and is paid');
  });

  it('Should respond with a 403 forbidden status code when ticket does not includes hotel', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const room = (await createRooms(1, hotel.id))[0];

    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, false);
    await createTicket(enrollment.id, ticketType.id, 'PAID');

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });

    expect(response.status).toBe(httpStatus.FORBIDDEN);
    expect(response.text).toEqual('User must have a ticket that is: presencial, includes hotel and is paid');
  });

  it('Should respond with a 200 OK status code and send a object with a bookingId: Number', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const room = (await createRooms(1, hotel.id))[0];

    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, 'PAID');

    const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual(
      expect.objectContaining({
        bookingId: expect.any(Number),
      }),
    );
  });
});

describe('/PUT booking', () => {
  it('Should respond with 401 when no token is given', async () => {
    const response = await server.put(`/booking/${faker.datatype.number()}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 401 when token is invalid', async () => {
    const invalidToken = faker.lorem.word();
    const response = await server
      .put(`/booking/${faker.datatype.number()}`)
      .set('Authorization', `Bearer ${invalidToken}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 401 if token is valid but there is no session', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.put(`/booking/${faker.datatype.number()}`).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with a 400 bad request status code if roomId is not provided', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.put(`/booking/${faker.datatype.number()}`).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.BAD_REQUEST);
  });

  it('Should respond with a 404 not found status code if room does not exist', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server
      .put(`/booking/${faker.datatype.number()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: faker.random.numeric() });
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('Should respond with a 403 forbidden status if user does not have a active booking', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const room = (await createRooms(1, hotel.id))[0];

    const response = await server
      .put(`/booking/${faker.datatype.number()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it('Should respond with a 403 forbidden status if given bookingId does not macth bookingId found by userId', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const room = (await createRooms(1, hotel.id))[0];
    const booking = await createBooking(user.id, room.id);

    const response = await server
      .put(`/booking/${booking.id + faker.datatype.number()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: room.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it('Should respond with a 403 forbidden status if room is already full', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const roomToUpdateFrom = (await createRooms(1, hotel.id))[0];
    const booking = await createBooking(user.id, roomToUpdateFrom.id);

    const roomToUpdateTo = (await createRooms(1, hotel.id))[0];
    for (let i = 0; i < roomToUpdateTo.capacity; i++) {
      const userWithBooking = await createUser();
      await createBooking(userWithBooking.id, roomToUpdateTo.id);
    }

    const response = await server
      .put(`/booking/${booking.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: roomToUpdateTo.id });
    expect(response.status).toBe(httpStatus.FORBIDDEN);
  });

  it('Should respond with a 200 OK status code and send a object with a bookingId: Number when the roomId update is successful', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const hotel = (await createHotels(1))[0];
    const roomToUpdateFrom = (await createRooms(1, hotel.id))[0];
    const booking = await createBooking(user.id, roomToUpdateFrom.id);

    const roomToUpdateTo = (await createRooms(1, hotel.id))[0];

    const response = await server
      .put(`/booking/${booking.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ roomId: roomToUpdateTo.id });
    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual(
      expect.objectContaining({
        bookingId: booking.id,
      }),
    );
  });
});
