import { restaurantService } from './restaurant.service';
import { orderService } from './order.service';

export const zomatoApi = {
  getRestaurants: restaurantService.getRestaurants,
  getRestaurantById: restaurantService.getRestaurantById,
  createPaymentOrder: orderService.createPaymentOrder,
  verifyPayment: orderService.verifyPayment
};
