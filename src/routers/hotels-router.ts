import { Router } from 'express';
import { getHotels, getHotelById } from '@/controllers';
import { authenticateToken } from '@/middlewares';

const hotelsRouter = Router();

hotelsRouter.all('/*', authenticateToken).get('/', getHotels).get('/:hotelId', getHotelById);

export { hotelsRouter };
