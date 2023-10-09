import Joi from 'joi';
import { CreateBooking } from '@/services/booking-service';

export const bookingSchema = Joi.object<CreateBooking>({
  roomId: Joi.number().required(),
});
