import { Router } from 'express';
import { authenticateToken, validateBody } from '@/middlewares';
import { getPayments, postPayment } from '@/controllers';
import { paymentsSchema } from '@/schemas';

const paymentsRouter = Router();

paymentsRouter
  .all('/*', authenticateToken)
  .get('/', getPayments)
  .post('/process', validateBody(paymentsSchema), postPayment);

export { paymentsRouter };
