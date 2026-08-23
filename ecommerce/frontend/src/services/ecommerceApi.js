import { productService } from './product.service';
import { paymentService } from './payment.service';

export const ecommerceApi = {
  getProducts: productService.getProducts,
  getProductById: productService.getProductById,
  createOrder: paymentService.createOrder,
  verifyPayment: paymentService.verifyPayment
};
