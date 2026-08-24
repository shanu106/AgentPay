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
export const fetchOrders = userService.fetchUserOrders; // Fetches user orders from PostgreSQL
export const fetchAuditLogs = agentService.fetchAuditLogs;
export const fetchConfig = agentService.fetchConfig;
export const updateApiKey = agentService.updateApiKey;

// PostgreSQL User Authentication, Addresses, Payment Methods & Orders
export const signupUser = userService.signup;
export const loginUser = userService.login;
export const fetchUserProfile = userService.fetchUserProfile;
export const fetchUserAddresses = userService.fetchUserAddresses;
export const addUserAddress = userService.addAddress;
export const setDefaultUserAddress = userService.setDefaultAddress;
export const fetchPaymentMethods = userService.fetchPaymentMethods;
export const addPaymentMethod = userService.addPaymentMethod;
export const setDefaultPaymentMethod = userService.setDefaultPaymentMethod;
export const updatePaymentMethod = userService.updatePaymentMethod;
export const deletePaymentMethod = userService.deletePaymentMethod;
export const fetchUserOrders = userService.fetchUserOrders;
export const fetchUserEmails = userService.fetchUserEmails;
