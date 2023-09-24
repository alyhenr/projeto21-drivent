import Joi from 'joi';
import { TicketReservation } from '@/services/tickets-service';

export const reserveTicketSchema = Joi.object<TicketReservation>({
  ticketTypeId: Joi.number().required(),
});
