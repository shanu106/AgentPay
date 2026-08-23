import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const location = useLocation();
  const { paymentDetails, customerName, customerEmail } = location.state || {};

  // Redirect if no payment details
  if (!paymentDetails) {
    return <Navigate to="/" replace />;
  }

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">🎉</div>
        <h1 className="success-title">Payment Successful!</h1>
        <p className="success-subtitle">
          Thank you for your purchase, <strong>{customerName}</strong>!
        </p>

        <div className="success-details">
          <div className="success-detail-item">
            <span className="detail-label">Course</span>
            <span className="detail-value">{paymentDetails.courseTitle}</span>
          </div>
          <div className="success-detail-item">
            <span className="detail-label">Amount Paid</span>
            <span className="detail-value amount">{paymentDetails.amount}</span>
          </div>
          <div className="success-detail-item">
            <span className="detail-label">Transaction ID</span>
            <span className="detail-value transaction-id">{paymentDetails.paymentId}</span>
          </div>
          <div className="success-detail-item">
            <span className="detail-label">Date</span>
            <span className="detail-value">{formatDate()}</span>
          </div>
          <div className="success-detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-value">{customerEmail}</span>
          </div>
        </div>

        <div className="success-actions">
          <Link to="/" className="btn-browse">
            Browse More Courses
          </Link>
          <button
            className="btn-download"
            onClick={() => window.print()}
          >
            Download Receipt
          </button>
        </div>

        <p className="success-email-note">
          📧 A confirmation email has been sent to <strong>{customerEmail}</strong> with your course access details.
        </p>
      </div>
    </div>
  );
}

export default PaymentSuccess;