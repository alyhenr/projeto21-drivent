import Joi from 'joi';
import { PaymentCreation } from '@/services/payments-service';

export const paymentsSchema = Joi.object<PaymentCreation>({
  ticketId: Joi.number().required(),
  cardData: Joi.object({
    issuer: Joi.string().required(),
    number: Joi.number().required(),
    name: Joi.string().required(),
    expirationDate: Joi.string().required(),
    cvv: Joi.number().required(),
  }).required(),
});
