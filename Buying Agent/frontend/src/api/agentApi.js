// Backward-compatible façade forwarding to specialized modular services (Separation of Concerns)
import { agentService } from '../services/agent.service';
import { paymentService } from '../services/payment.service';
import { orderService } from '../services/order.service';
import { userService } from '../services/user.service';

export const loadRazorpayScript = paymentService.loadRazorpayScript;
export const submitPurchaseRequest = agentService.submitPurchaseRequest;
export const verifyPayment = paymentService.verifyPayment;
export const fetchSavedPaymentMethod = paymentService.fetchSavedPaymentMethod;
export const updateSavedPaymentMethod = paymentService.updateSavedPaymentMethod;
export const fetchOrderById = orderService.fetchOrderById;
export const fetchOrders = orderService.fetchOrders;
export const fetchAuditLogs = agentService.fetchAuditLogs;
export const fetchConfig = agentService.fetchConfig;
export const updateApiKey = agentService.updateApiKey;
export const fetchUserProfile = userService.fetchUserProfile;
export const fetchUserAddresses = userService.fetchUserAddresses;
export const fetchUserEmails = userService.fetchUserEmails;
