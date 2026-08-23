import { useState, useEffect } from 'react';
import { paymentService } from '../services/payment.service';
import { DEFAULT_SAVED_PAYMENT } from '../config/agent.config';

export function useSavedPayment() {
  const [savedPayment, setSavedPayment] = useState(DEFAULT_SAVED_PAYMENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedPayment();
  }, []);

  const loadSavedPayment = async () => {
    try {
      setLoading(true);
      const data = await paymentService.fetchSavedPaymentMethod();
      if (data && data.paymentMethod) {
        setSavedPayment(data.paymentMethod);
      }
    } catch (err) {
      console.warn('Failed to load saved payment method:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async (updatedData) => {
    try {
      const res = await paymentService.updateSavedPaymentMethod(updatedData);
      if (res && res.paymentMethod) {
        setSavedPayment(res.paymentMethod);
      } else {
        setSavedPayment(updatedData);
      }
      return res;
    } catch (err) {
      console.error('Failed to update saved payment method:', err);
      throw err;
    }
  };

  return {
    savedPayment,
    setSavedPayment,
    loading,
    updatePaymentMethod,
    reloadPayment: loadSavedPayment
  };
}
