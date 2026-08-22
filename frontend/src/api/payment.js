const API_BASE = '/api';

const handleResponse = async (res) => {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned unexpected response (${res.status} ${res.statusText})`);
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
};

export const fetchCourses = async () => {
  const res = await fetch(`${API_BASE}/courses`);
  const data = await handleResponse(res);
  if (!data.success) throw new Error('Failed to fetch courses');
  return data.courses;
};

export const fetchCourseById = async (courseId) => {
  const res = await fetch(`${API_BASE}/courses/${courseId}`);
  const data = await handleResponse(res);
  if (!data.success) throw new Error('Course not found');
  return data.course;
};

export const createPaymentOrder = async ({ courseId, customerName, customerEmail }) => {
  const res = await fetch(`${API_BASE}/payment/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId, customerName, customerEmail })
  });
  const data = await handleResponse(res);
  if (!data.success) throw new Error(data.message || 'Failed to create order');
  return data;
};

export const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId }) => {
  const res = await fetch(`${API_BASE}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId })
  });
  const data = await handleResponse(res);
  if (!data.success) throw new Error(data.message || 'Payment verification failed');
  return data;
};

export const getRazorpayKey = async () => {
  const res = await fetch(`${API_BASE}/config`);
  const data = await handleResponse(res);
  return data.key;
};