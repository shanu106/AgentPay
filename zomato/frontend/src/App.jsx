import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  ShoppingBag, 
  Star, 
  Clock, 
  ChevronDown, 
  SlidersHorizontal, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  Bike, 
  Utensils, 
  Sparkles,
  Percent,
  ShieldCheck,
  CreditCard,
  X
} from 'lucide-react';

const API_BASE = 'http://localhost:8003/api';

const CUISINES = [
  { name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80' },
  { name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=80' },
  { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80' },
  { name: 'Waffles', image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=200&auto=format&fit=crop&q=80' },
  { name: 'North Indian', image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=200&auto=format&fit=crop&q=80' },
  { name: 'Chinese', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&auto=format&fit=crop&q=80' },
  { name: 'Rolls', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=200&auto=format&fit=crop&q=80' },
  { name: 'Desserts', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&auto=format&fit=crop&q=80' }
];

export default function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('delivery');
  const [searchQuery, setSearchQuery] = useState('');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState(false);
  const [selectedFastDelivery, setSelectedFastDelivery] = useState(false);
  const [selectedOfferFilter, setSelectedOfferFilter] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState('100 Feet Rd, Indiranagar, Bangalore');

  useEffect(() => {
    fetchRestaurants();
  }, [searchQuery, isVegOnly, selectedRatingFilter, selectedFastDelivery]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (isVegOnly) params.append('vegOnly', 'true');

      const res = await fetch(`${API_BASE}/restaurants?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        let list = data.restaurants || [];
        if (selectedRatingFilter) {
          list = list.filter(r => r.rating >= 4.4);
        }
        if (selectedFastDelivery) {
          list = list.filter(r => parseInt(r.deliveryTime) <= 25);
        }
        if (selectedOfferFilter) {
          list = list.filter(r => r.discount);
        }
        setRestaurants(list);
      }
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (dish, restaurant) => {
    setCart(prev => {
      // If switching restaurant, confirm or clear
      if (prev.length > 0 && prev[0].restaurantId !== restaurant.id) {
        if (!window.confirm(`Your cart has items from ${prev[0].restaurantName}. Reset cart and add items from ${restaurant.name}?`)) {
          return prev;
        }
        return [{ ...dish, qty: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
      }

      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item => item.id === dish.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...dish, qty: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
    });
    showToast(`Added ${dish.name} to cart`);
  };

  const updateCartQty = (dishId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === dishId) {
          const newQty = item.qty + delta;
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const getDishQtyInCart = (dishId) => {
    const item = cart.find(i => i.id === dishId);
    return item ? item.qty : 0;
  };

  const cartItemTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const deliveryFee = cart.length > 0 ? 35 : 0;
  const platformFee = cart.length > 0 ? 5 : 0;
  const taxes = cart.length > 0 ? Math.round(cartItemTotal * 0.05) : 0;
  const grandTotal = cartItemTotal + deliveryFee + platformFee + taxes;

  // Handle Checkout via Razorpay
  const handleProceedToPayment = async () => {
    if (cart.length === 0) return;

    try {
      showToast('Creating Razorpay food order...');

      // 1. Create order on Zomato backend
      const res = await fetch(`${API_BASE}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          restaurantId: cart[0].restaurantId,
          deliveryAddress,
          customerName: 'Student Foodie',
          customerPhone: '9876512345'
        })
      });

      const orderData = await res.json();
      if (!orderData.success) {
        alert(orderData.message || 'Failed to create order');
        return;
      }

      const { order } = orderData;

      // 2. Open official Razorpay Checkout modal
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Zomato Food Delivery',
        description: `Order from ${order.restaurantName}`,
        image: 'https://img.icons8.com/fluency/96/zomato.png',
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify Payment
          try {
            const verifyRes = await fetch(`${API_BASE}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setActiveOrder({
                ...verifyData.order,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id
              });
              setCart([]);
              setIsCartOpen(false);
              setSelectedRestaurant(null);
            } else {
              alert('Payment verification failed');
            }
          } catch (err) {
            console.error('Verification error:', err);
          }
        },
        prefill: {
          name: 'Student Foodie',
          email: 'student@example.com',
          contact: '9876512345'
        },
        theme: {
          color: '#e23744'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Payment checkout error:', err);
      alert('Error launching payment: ' + err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: '#1c1c1c',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '8px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={16} color="#24963f" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Zomato Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px'
        }}>
          {/* Logo & Location */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div 
              onClick={() => { setSelectedRestaurant(null); setActiveOrder(null); }}
              style={{
                fontSize: '32px',
                fontWeight: '900',
                fontStyle: 'italic',
                color: '#e23744',
                cursor: 'pointer',
                letterSpacing: '-1.5px',
                userSelect: 'none'
              }}
            >
              zomato
            </div>

            {/* Location Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#4f4f4f',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #e8e8e8',
              backgroundColor: '#f8f8f8'
            }}>
              <MapPin size={16} color="#e23744" />
              <span style={{ fontWeight: '600', color: '#1c1c1c' }}>Bangalore</span>
              <span style={{ color: '#828282', fontSize: '13px' }}>· Indiranagar</span>
              <ChevronDown size={14} color="#828282" />
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            flex: '1',
            maxWidth: '520px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={18} color="#828282" style={{ position: 'absolute', left: '14px' }} />
            <input 
              type="text"
              placeholder="Search for restaurant, cuisine or a dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px 11px 42px',
                backgroundColor: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '10px',
                color: '#1c1c1c',
                fontSize: '14px',
                outline: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}
            />
          </div>

          {/* Cart Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={() => setIsCartOpen(true)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: cart.length > 0 ? '#e23744' : '#f8f8f8',
                color: cart.length > 0 ? '#ffffff' : '#1c1c1c',
                border: '1px solid',
                borderColor: cart.length > 0 ? '#e23744' : '#e8e8e8',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              <ShoppingBag size={18} />
              <span>Cart</span>
              {cart.length > 0 && (
                <span style={{
                  backgroundColor: '#ffffff',
                  color: '#e23744',
                  fontSize: '12px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  marginLeft: '4px'
                }}>
                  {cart.reduce((s, i) => s + i.qty, 0)} · ₹{cartItemTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: '1', maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>

        {/* Live Order Tracking View */}
        {activeOrder ? (
          <div style={{
            maxWidth: '680px',
            margin: '20px auto',
            backgroundColor: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={36} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1c1c1c', marginBottom: '6px' }}>
                Order Placed Successfully!
              </h2>
              <p style={{ color: '#696969', fontSize: '14px' }}>
                Your food is being freshly prepared at <strong>{activeOrder.restaurant?.name || 'the restaurant'}</strong>
              </p>
            </div>

            {/* Animated Status Steps */}
            <div style={{
              backgroundColor: '#f8f8f8',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', backgroundColor: '#24963f', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>✓</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1c1c1c' }}>Order Confirmed & Paid</div>
                  <div style={{ fontSize: '12px', color: '#828282' }}>Razorpay Payment ID: {activeOrder.paymentId}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', backgroundColor: '#e23744', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>👨‍🍳</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#1c1c1c' }}>Chef is preparing your order</div>
                  <div style={{ fontSize: '12px', color: '#e23744', fontWeight: '600' }}>Estimated Prep Time: ~15 mins</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '36px', height: '36px', backgroundColor: '#e8e8e8', color: '#828282', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>🛵</div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#828282' }}>Delivery Partner on the way</div>
                  <div style={{ fontSize: '12px', color: '#828282' }}>Delivering to: {activeOrder.deliveryAddress || 'Indiranagar, Bangalore'}</div>
                </div>
              </div>
            </div>

            {/* Order Items Receipt */}
            <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '16px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#1c1c1c', marginBottom: '12px' }}>Order Details</h4>
              {activeOrder.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#4f4f4f', marginBottom: '8px' }}>
                  <span>{item.qty} × {item.name}</span>
                  <span style={{ fontWeight: '600' }}>₹{item.price * item.qty}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e8e8e8', paddingTop: '10px', marginTop: '10px', fontWeight: '800', fontSize: '15px', color: '#1c1c1c' }}>
                <span>Total Amount Paid</span>
                <span>₹{activeOrder.amount}</span>
              </div>
            </div>

            <button 
              onClick={() => setActiveOrder(null)}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#e23744',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Order More Food
            </button>
          </div>

        ) : selectedRestaurant ? (
          
          /* Restaurant Menu View */
          <div>
            {/* Back Button */}
            <button 
              onClick={() => setSelectedRestaurant(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: '#e23744',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              <ArrowLeft size={18} />
              <span>Back to all restaurants</span>
            </button>

            {/* Restaurant Hero Banner */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '28px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1c1c1c', marginBottom: '6px' }}>
                    {selectedRestaurant.name}
                  </h1>
                  <div style={{ color: '#696969', fontSize: '14px', marginBottom: '6px' }}>
                    {selectedRestaurant.cuisine}
                  </div>
                  <div style={{ color: '#828282', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} color="#828282" />
                    <span>{selectedRestaurant.address}</span>
                    <span>·</span>
                    <Clock size={14} color="#828282" />
                    <span>{selectedRestaurant.deliveryTime}</span>
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#24963f',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: '800',
                  fontSize: '16px'
                }}>
                  <span>{selectedRestaurant.rating}</span>
                  <Star size={16} fill="#ffffff" color="#ffffff" />
                </div>
              </div>

              {/* Offer Banner */}
              {selectedRestaurant.discount && (
                <div style={{
                  marginTop: '16px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: '#fff1f2',
                  border: '1px solid #ffe4e6',
                  borderRadius: '8px',
                  color: '#e23744',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  <Percent size={14} />
                  <span>{selectedRestaurant.discount}</span>
                </div>
              )}
            </div>

            {/* Menu Categories */}
            {selectedRestaurant.categories?.map((cat, idx) => (
              <div key={idx} style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1c1c1c', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #f0f0f0' }}>
                  {cat.name} ({cat.dishes?.length || 0})
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {cat.dishes?.map(dish => {
                    const qty = getDishQtyInCart(dish.id);
                    return (
                      <div 
                        key={dish.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '20px',
                          padding: '18px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e8e8e8',
                          borderRadius: '16px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                        }}
                      >
                        {/* Dish Details */}
                        <div style={{ flex: '1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <div className={dish.isVeg ? 'veg-icon' : 'nonveg-icon'}>
                              <div className={dish.isVeg ? 'veg-dot' : 'nonveg-dot'}></div>
                            </div>
                            {dish.bestseller && (
                              <span style={{ backgroundColor: '#fff7ed', color: '#ea580c', fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                                ★ BESTSELLER
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1c1c1c', marginBottom: '4px' }}>
                            {dish.name}
                          </div>

                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#1c1c1c', marginBottom: '8px' }}>
                            {dish.priceDisplay || `₹${dish.price}`}
                          </div>

                          <div style={{ fontSize: '12px', color: '#696969', lineHeight: 1.5, maxWidth: '540px' }}>
                            {dish.description}
                          </div>
                        </div>

                        {/* Dish Image & Add Button */}
                        <div style={{ position: 'relative', width: '130px', height: '110px', flexShrink: 0 }}>
                          <img 
                            src={dish.image} 
                            alt={dish.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '12px'
                            }}
                          />

                          <div style={{
                            position: 'absolute',
                            bottom: '-10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '100px'
                          }}>
                            {qty === 0 ? (
                              <button
                                onClick={() => addToCart(dish, selectedRestaurant)}
                                style={{
                                  width: '100%',
                                  padding: '7px 0',
                                  backgroundColor: '#ffffff',
                                  color: '#e23744',
                                  border: '1.5px solid #e23744',
                                  borderRadius: '8px',
                                  fontWeight: '800',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                                }}
                              >
                                ADD
                              </button>
                            ) : (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#e23744',
                                color: '#ffffff',
                                borderRadius: '8px',
                                padding: '4px 8px',
                                fontWeight: '800',
                                fontSize: '13px',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                              }}>
                                <button 
                                  onClick={() => updateCartQty(dish.id, -1)}
                                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                  <Minus size={14} />
                                </button>
                                <span>{qty}</span>
                                <button 
                                  onClick={() => updateCartQty(dish.id, 1)}
                                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        ) : (

          /* All Restaurants Catalog View */
          <div>
            {/* Delivery / Dining Nav Tabs */}
            <div style={{ display: 'flex', gap: '36px', borderBottom: '1px solid #e8e8e8', marginBottom: '28px' }}>
              <div 
                onClick={() => setActiveTab('delivery')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  paddingBottom: '14px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '18px',
                  color: activeTab === 'delivery' ? '#e23744' : '#696969',
                  borderBottom: activeTab === 'delivery' ? '3px solid #e23744' : 'none'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: activeTab === 'delivery' ? '#fff1f2' : '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bike size={20} color={activeTab === 'delivery' ? '#e23744' : '#696969'} />
                </div>
                <span>Delivery</span>
              </div>

              <div 
                onClick={() => setActiveTab('dining')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  paddingBottom: '14px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '18px',
                  color: activeTab === 'dining' ? '#e23744' : '#696969',
                  borderBottom: activeTab === 'dining' ? '3px solid #e23744' : 'none'
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: activeTab === 'dining' ? '#fff1f2' : '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Utensils size={20} color={activeTab === 'dining' ? '#e23744' : '#696969'} />
                </div>
                <span>Dining Out</span>
              </div>
            </div>

            {/* Inspiration for your first order (Cuisine Carousel) */}
            <div style={{ marginBottom: '36px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1c1c1c', marginBottom: '18px' }}>
                Inspiration for your first order
              </h2>
              <div style={{
                display: 'flex',
                gap: '24px',
                overflowX: 'auto',
                paddingBottom: '10px'
              }}>
                {CUISINES.map((c, i) => (
                  <div 
                    key={i} 
                    className="category-circle"
                    onClick={() => setSearchQuery(c.name)}
                    style={{ textAlign: 'center', minWidth: '95px' }}
                  >
                    <div style={{
                      width: '95px',
                      height: '95px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      marginBottom: '8px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                    }}>
                      <img src={c.image} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#363636' }}>{c.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter Chips Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
              <button 
                onClick={() => setIsVegOnly(!isVegOnly)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: isVegOnly ? '#24963f' : '#e8e8e8',
                  backgroundColor: isVegOnly ? '#f0fdf4' : '#ffffff',
                  color: isVegOnly ? '#16a34a' : '#4f4f4f',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <span className="veg-dot" style={{ display: 'inline-block' }}></span>
                <span>Pure Veg</span>
              </button>

              <button 
                onClick={() => setSelectedRatingFilter(!selectedRatingFilter)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: selectedRatingFilter ? '#e23744' : '#e8e8e8',
                  backgroundColor: selectedRatingFilter ? '#fff1f2' : '#ffffff',
                  color: selectedRatingFilter ? '#e23744' : '#4f4f4f',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <span>Rating: 4.4+</span>
              </button>

              <button 
                onClick={() => setSelectedFastDelivery(!selectedFastDelivery)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: selectedFastDelivery ? '#e23744' : '#e8e8e8',
                  backgroundColor: selectedFastDelivery ? '#fff1f2' : '#ffffff',
                  color: selectedFastDelivery ? '#e23744' : '#4f4f4f',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <Clock size={14} />
                <span>Fast Delivery (&lt; 25m)</span>
              </button>

              <button 
                onClick={() => setSelectedOfferFilter(!selectedOfferFilter)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: selectedOfferFilter ? '#e23744' : '#e8e8e8',
                  backgroundColor: selectedOfferFilter ? '#fff1f2' : '#ffffff',
                  color: selectedOfferFilter ? '#e23744' : '#4f4f4f',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <Percent size={14} />
                <span>Great Offers</span>
              </button>

              {(isVegOnly || selectedRatingFilter || selectedFastDelivery || selectedOfferFilter || searchQuery) && (
                <button 
                  onClick={() => {
                    setIsVegOnly(false);
                    setSelectedRatingFilter(false);
                    setSelectedFastDelivery(false);
                    setSelectedOfferFilter(false);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#f1f5f9',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Restaurant Grid */}
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1c1c1c', marginBottom: '20px' }}>
              Delivery Restaurants in Bangalore
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#828282' }}>
                <div>Loading delicious food spots...</div>
              </div>
            ) : restaurants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#828282' }}>
                <h3>No restaurants found</h3>
                <p>Try searching for a different dish or cuisine</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '28px'
              }}>
                {restaurants.map(rest => (
                  <div 
                    key={rest.id}
                    className="restaurant-card"
                    onClick={() => setSelectedRestaurant(rest)}
                  >
                    {/* Image with Discount Overlay */}
                    <div style={{ position: 'relative', height: '220px', borderRadius: '14px', overflow: 'hidden', marginBottom: '12px' }}>
                      <img 
                        src={rest.image} 
                        alt={rest.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {rest.promoted && (
                        <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px' }}>
                          PROMOTED
                        </div>
                      )}

                      {rest.discount && (
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: '#1d4ed8', color: '#ffffff', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Percent size={12} />
                          <span>{rest.discount}</span>
                        </div>
                      )}

                      <div style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', color: '#1c1c1c', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '6px' }}>
                        {rest.deliveryTime}
                      </div>
                    </div>

                    {/* Restaurant Info */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1c1c1c' }}>
                          {rest.name}
                        </h3>
                        <div style={{
                          backgroundColor: '#24963f',
                          color: '#ffffff',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: '12px',
                          fontWeight: '800'
                        }}>
                          <span>{rest.rating}</span>
                          <Star size={11} fill="#ffffff" color="#ffffff" />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#696969', fontSize: '13px', marginBottom: '8px' }}>
                        <span>{rest.cuisine}</span>
                        <span>{rest.costForTwo}</span>
                      </div>

                      <div style={{ borderTop: '1px solid #f2f2f2', paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#828282' }}>
                        <ShieldCheck size={14} color="#24963f" />
                        <span>Follows standard safety & hygiene protocols</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cart Checkout Drawer */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '400px',
          maxWidth: '100vw',
          backgroundColor: '#ffffff',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Cart Header */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #e8e8e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1c1c1c' }}>My Food Cart</h3>
              {cart.length > 0 && (
                <div style={{ fontSize: '12px', color: '#e23744', fontWeight: '600' }}>
                  Ordering from {cart[0].restaurantName}
                </div>
              )}
            </div>
            <button 
              onClick={() => setIsCartOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#696969' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          <div style={{ flex: '1', padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#828282', marginTop: '60px' }}>
                <ShoppingBag size={48} style={{ margin: '0 auto 14px', color: '#d1d5db' }} />
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1c1c1c', marginBottom: '4px' }}>Your cart is empty</div>
                <div style={{ fontSize: '13px' }}>Add some delicious food from the menu!</div>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      backgroundColor: '#f8f8f8',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ flex: '1' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#1c1c1c' }}>{item.name}</div>
                      <div style={{ fontSize: '13px', color: '#e23744', fontWeight: '700', marginTop: '2px' }}>₹{item.price * item.qty}</div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e23744',
                      borderRadius: '6px',
                      padding: '3px 8px'
                    }}>
                      <button 
                        onClick={() => updateCartQty(item.id, -1)}
                        style={{ background: 'none', border: 'none', color: '#e23744', cursor: 'pointer', display: 'flex' }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#e23744' }}>{item.qty}</span>
                      <button 
                        onClick={() => updateCartQty(item.id, 1)}
                        style={{ background: 'none', border: 'none', color: '#e23744', cursor: 'pointer', display: 'flex' }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Delivery Address */}
                <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#f8f8f8', borderRadius: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#696969', marginBottom: '6px' }}>DELIVERY ADDRESS</div>
                  <input 
                    type="text" 
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #e8e8e8',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                      backgroundColor: '#fff'
                    }}
                  />
                </div>

                {/* Bill Breakdown */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #e8e8e8', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#4f4f4f' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Item Total</span>
                    <span>₹{cartItemTotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivery Fee</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Platform Fee</span>
                    <span>₹{platformFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>GST and Restaurant Charges</span>
                    <span>₹{taxes}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #e8e8e8', paddingTop: '10px', marginTop: '6px', fontWeight: '800', fontSize: '16px', color: '#1c1c1c' }}>
                    <span>To Pay</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Checkout Button */}
          {cart.length > 0 && (
            <div style={{ padding: '20px', borderTop: '1px solid #e8e8e8' }}>
              <button 
                onClick={handleProceedToPayment}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#e23744',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 16px rgba(226, 55, 68, 0.35)'
                }}
              >
                <CreditCard size={18} />
                <span>Pay ₹{grandTotal} with Razorpay</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        backgroundColor: '#f8f8f8',
        borderTop: '1px solid #e8e8e8',
        padding: '32px 20px',
        textAlign: 'center',
        color: '#828282',
        fontSize: '13px'
      }}>
        <div style={{ fontSize: '24px', fontWeight: '900', fontStyle: 'italic', color: '#1c1c1c', marginBottom: '8px' }}>
          zomato
        </div>
        <div>By continuing past this page, you agree to our Terms of Service, Cookie Policy, Privacy Policy and Content Policies.</div>
        <div style={{ marginTop: '8px', color: '#a0a0a0' }}>© 2026 Zomato Clone — Razorpay Food Delivery Integration</div>
      </footer>
    </div>
  );
}
