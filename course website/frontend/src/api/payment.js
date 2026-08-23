// Backward-compatible façade forwarding to specialized modular services (Separation of Concerns)
import { courseService } from '../services/course.service';
import { paymentService } from '../services/payment.service';

export const fetchCourses = courseService.fetchCourses;
export const fetchCourseById = courseService.fetchCourseById;
export const createPaymentOrder = paymentService.createPaymentOrder;
export const verifyPayment = paymentService.verifyPayment;
export const getRazorpayKey = paymentService.getRazorpayKey;