import { Router } from 'express';
import { authenticateToken, validateBody } from '@/middlewares';
import { getUserTickets, getTicketsType, postTicket } from '@/controllers';
import { reserveTicketSchema } from '@/schemas';

const tickestRouter = Router();

tickestRouter
  .all('/*', authenticateToken)
  .get('/', getUserTickets)
  .get('/types', getTicketsType)
  .post('/', validateBody(reserveTicketSchema), postTicket);

export { tickestRouter };
