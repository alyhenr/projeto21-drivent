import supertest from 'supertest';
import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';
import { TicketStatus } from '@prisma/client';
import { cleanDb, generateValidToken } from '../helpers';
import { createEnrollmentWithAddress, createTicket, createTicketType, createUser } from '../factories';
import { createHotels } from '../factories/hotels-factory';
import app, { init } from '@/app';

beforeAll(async () => {
  await init();
  await cleanDb();
});

const server = supertest(app);

describe('GET /hotels', () => {
  it('Should respond with 401 when no token is given', async () => {
    const response = await server.get('/hotels');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 401 when token is invalid', async () => {
    const invalidToken = faker.lorem.word();
    const response = await server.get('/hotels').set('Authorization', `Bearer ${invalidToken}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 401 if token is valid but there is no session', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 404 if user has no enrollments', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('Should respond with 404 if ticket does not exist', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('Should respond with 404 if there is no hotels registered', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('Should respond with 402 if ticket is not paid', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it('Should respond with 402 if ticket is remote', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(true, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it('Should respond with 402 if ticket does note includes hotel', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, false);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it('Should respond with 200 if request is valid', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createHotels(1);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.OK);
  });

  it('Should send available hotels in an array', async () => {
    await cleanDb();
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createHotels(5);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.body).toHaveLength(5);
  });

  it('Should send array of hotels with the defined object format', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createHotels(1);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        image: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
  });

  it('Should have the the properties createdAt and updatedAt in a valid date format converted to ISO string', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    await createHotels(1);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);

    expect(response.body[0].createdAt).toEqual(new Date(response.body[0].createdAt).toISOString());
    expect(response.body[0].updatedAt).toEqual(new Date(response.body[0].updatedAt).toISOString());
  });
});

describe('GET /hotels/:hotelId', () => {
  it('Should respond with 401 when no token is given', async () => {
    const response = await server.get('/hotels/1');
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 401 when token is invalid', async () => {
    const invalidToken = faker.lorem.word();
    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${invalidToken}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 401 if token is valid but there is no session', async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('Should respond with 404 if user has no enrollments', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);

    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('Should respond with 404 if ticket does not exist', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    await createEnrollmentWithAddress(user);

    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('Should respond with 404 if hotel id is not found', async () => {
    await cleanDb();
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

    const response = await server.get('/hotels/1').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.NOT_FOUND);
  });

  it('Should respond with 402 if ticket is not paid', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it('Should respond with 402 if ticket is remote', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(true, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it('Should respond with 402 if ticket does note includes hotel', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, false);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

    const response = await server.get('/hotels').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.PAYMENT_REQUIRED);
  });

  it('Should respond with 200 if request is valid', async () => {
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketType(false, true);
    await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
    const hotel = await createHotels(1);

    const response = await server.get(`/hotels/${hotel[0].id}`).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(httpStatus.OK);
  });
});
