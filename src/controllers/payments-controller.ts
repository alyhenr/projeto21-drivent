import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import { invalidDataError } from '@/errors';
import { PaymentCreation, paymentsService } from '@/services/payments-service';

export async function getPayments(req: AuthenticatedRequest, res: Response) {
  const { ticketId } = req.query;
  if (!ticketId) throw invalidDataError('Ticket id not provided');

  const payment = await paymentsService.getPayments(Number(ticketId), Number(req.userId));

  res.send(payment);
}

export async function postPayment(req: AuthenticatedRequest, res: Response) {
  const paymentDetails: PaymentCreation = req.body;

  const newPayment = await paymentsService.postPayment(paymentDetails, req.userId);

  res.status(httpStatus.OK).send(newPayment);
}
