import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCourseById, createPaymentOrder, verifyPayment } from '../api/payment';
import './Checkout.css';

// Helper to ensure Razorpay checkout script is loaded
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function Checkout() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const data = await fetchCourseById(courseId);
      setCourse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) {
      errors.customerName = 'Name is required';
    }
    if (!formData.customerEmail.trim()) {
      errors.customerEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setProcessing(true);
      setError(null);

      // Step 1: Ensure Razorpay SDK script is loaded
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Step 2: Create Razorpay Order on backend
      const orderData = await createPaymentOrder({
        courseId: course.id,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail
      });

      // Step 3: Configure Razorpay Checkout options
      const options = {
        key: orderData.order.key,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'LearnHub',
        description: `Enrollment for ${course.title}`,
        image: 'https://img.icons8.com/fluency/96/book.png',
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            // Step 4: Verify payment signature on backend
            const verification = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: course.id
            });

            // Step 5: Navigate to success page
            navigate('/payment-success', {
              state: {
                paymentDetails: verification.paymentDetails,
                customerName: formData.customerName,
                customerEmail: formData.customerEmail
              }
            });
          } catch (verifyError) {
            setError(verifyError.message || 'Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        prefill: {
          name: formData.customerName,
          email: formData.customerEmail
        },
        theme: {
          color: '#6c63ff'
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setError('Payment was cancelled. You can try again whenever you are ready.');
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response.error);
        setError(`Payment failed: ${response.error?.description || response.error?.reason || 'Transaction declined'}`);
        setProcessing(false);
      });

      rzp.open();

    } catch (err) {
      console.error('Payment checkout error:', err);
      setError(err.message || 'Something went wrong while initiating payment. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="error-container">
        <h2>Course not found</h2>
        <button className="btn-retry" onClick={() => navigate('/')}>Back to Courses</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">Checkout</h1>

      <div className="checkout-grid">
        <div className="checkout-form-section">
          <h2 className="section-title">Student Details</h2>
          <form onSubmit={handlePayment} className="checkout-form">
            <div className="form-group">
              <label htmlFor="customerName">Full Name</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={formErrors.customerName ? 'input-error' : ''}
              />
              {formErrors.customerName && <span className="field-error">{formErrors.customerName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="customerEmail">Email Address</label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="Enter your email"
                className={formErrors.customerEmail ? 'input-error' : ''}
              />
              {formErrors.customerEmail && <span className="field-error">{formErrors.customerEmail}</span>}
            </div>

            {error && (
              <div className="payment-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-pay"
              disabled={processing}
            >
              {processing ? (
                <span className="btn-loading">
                  <span className="btn-spinner"></span>
                  Opening Razorpay Checkout...
                </span>
              ) : (
                `Pay ${course?.priceDisplay}`
              )}
            </button>

            <p className="secure-notice">
              🔒 100% Secure payment powered by Razorpay. 256-bit encryption.
            </p>
          </form>
        </div>

        <div className="checkout-summary">
          <h2 className="section-title">Order Summary</h2>
          <div className="summary-card">
            <div className="summary-course">
              <img src={course.image} alt={course.title} className="summary-course-image" />
              <div>
                <h3 className="summary-course-title">{course.title}</h3>
                <p className="summary-course-desc">{course.subtitle}</p>
              </div>
            </div>
            <div className="summary-row">
              <span>Course Price</span>
              <span>{course.priceDisplay}</span>
            </div>
            <div className="summary-row">
              <span>Discount</span>
              <span className="discount-text">-{course.originalPrice}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Total</span>
              <span className="total-price">{course.priceDisplay}</span>
            </div>
          </div>

          <div className="summary-benefits">
            <p>✓ Full lifetime access</p>
            <p>✓ Certificate of completion</p>
            <p>✓ 30-day money-back guarantee</p>
            <p>✓ Access on mobile & TV</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;