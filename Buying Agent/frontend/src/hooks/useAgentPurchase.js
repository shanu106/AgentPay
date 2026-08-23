import { useState } from 'react';
import { agentService } from '../services/agent.service';
import { paymentService } from '../services/payment.service';

export function useAgentPurchase() {
  const [loading, setLoading] = useState(false);
  const [agentResult, setAgentResult] = useState(null);
  const [steps, setSteps] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  const executePurchase = async ({
    queryText,
    customerName,
    customerEmail,
    savedPaymentMethod,
    customApiKey,
    onNeedsManualCheckout
  }) => {
    const text = (queryText || '').trim();
    if (!text || loading) return;

    setLoading(true);
    setConfirmedOrder(null);
    setSelectedProduct(null);
    setActiveOrder(null);
    setPaymentData(null);
    setSteps([
      { text: `Analyzing purchase request: "${text}"`, status: 'completed' }
    ]);

    try {
      const res = await agentService.submitPurchaseRequest({
        message: text,
        customApiKey,
        customerName: savedPaymentMethod?.holder || customerName,
        customerEmail,
        autoExecutePayment: savedPaymentMethod?.enabled !== false,
        savedPaymentMethod
      });

      setAgentResult(res);
      setSteps(res.steps || []);
      setSelectedProduct(res.selectedProduct);
      setActiveOrder(res.order);
      setPaymentData(res.paymentData);

      if (res.autoPaid && res.order) {
        setConfirmedOrder({
          ...res.order,
          verifiedPayment: res.verification,
          status: 'confirmed'
        });
      } else if (!res.autoPaid && res.requiresCheckout && res.paymentData) {
        if (typeof onNeedsManualCheckout === 'function') {
          onNeedsManualCheckout();
        }
      }
      return res;
    } catch (err) {
      setSteps(prev => [
        ...prev,
        { text: `Error processing purchase: ${err.message}`, status: 'failed' }
      ]);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (verificationResult) => {
    const verifiedData = verificationResult.verification || verificationResult;
    setConfirmedOrder({
      ...(activeOrder || agentResult?.order || {}),
      verifiedPayment: verifiedData,
      status: 'confirmed'
    });

    setSteps(prev => [
      ...prev,
      {
        text: `Payment verified on Razorpay (ID: ${verifiedData.paymentId || verifiedData.razorpay_payment_id}). Order confirmed!`,
        status: 'completed'
      }
    ]);
  };

  const resetPurchaseState = () => {
    setConfirmedOrder(null);
    setSelectedProduct(null);
    setActiveOrder(null);
    setPaymentData(null);
    setAgentResult(null);
  };

  return {
    loading,
    agentResult,
    steps,
    setSteps,
    selectedProduct,
    activeOrder,
    paymentData,
    confirmedOrder,
    executePurchase,
    handlePaymentSuccess,
    resetPurchaseState
  };
}
