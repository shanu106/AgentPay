import React, { useState } from 'react';
import { useRestaurants } from './hooks/useRestaurants';
import { useCart } from './hooks/useCart';
import { Header } from './components/Header';
import { CategoryCarousel, FilterBar } from './components/CategoryCarousel';
import { RestaurantList } from './components/RestaurantCard';
import { RestaurantDetailView } from './components/RestaurantDetailView';
import { CartDrawer, OrderTrackerModal, Footer } from './components/CartDrawer';
import { CheckCircle2 } from 'lucide-react';
import { zomatoApi } from './services/zomatoApi';

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
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState(false);
  const [selectedFastDelivery, setSelectedFastDelivery] = useState(false);
  const [selectedOfferFilter, setSelectedOfferFilter] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const deliveryAddress = '100 Feet Rd, Indiranagar, Bangalore';

  const { restaurants, loading } = useRestaurants({
    searchQuery,
    isVegOnly,
    selectedRatingFilter,
    selectedFastDelivery,
    selectedOfferFilter
  });

  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    getDishQtyInCart,
    cartItemTotal,
    deliveryFee,
    platformFee,
    taxes,
    grandTotal,
    totalItemCount
  } = useCart();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (dish, restaurant) => {
    const added = addToCart(dish, restaurant);
    if (added) showToast(`Added ${dish.name} to cart`);
  };

  const triggerAgentPurchase = (productPrompt) => {
    if (window.RazorpayAgent && typeof window.RazorpayAgent.purchase === 'function') {
      window.RazorpayAgent.purchase(productPrompt);
    } else if (window.RazorpayAgent && typeof window.RazorpayAgent.open === 'function') {
      window.RazorpayAgent.open();
    } else {
      showToast('Razorpay Agent widget is initializing...');
    }
  };

  const handleProceedToPayment = async () => {
    if (cart.length === 0) return;
    try {
      showToast('Creating Razorpay food order...');
      const rest = selectedRestaurant || { id: cart[0]?.restaurantId, name: cart[0]?.restaurantName };

      const createRes = await zomatoApi.createPaymentOrder({
        restaurantId: rest.id,
        cartItems: cart,
        customerName: 'Foodie Learner',
        deliveryAddress
      });

      if (!createRes.success || !createRes.order) {
        showToast('Failed to create Razorpay payment order');
        return;
      }

      const options = {
        key: createRes.order.key,
        amount: createRes.order.amount,
        currency: 'INR',
        name: rest.name,
        description: `Food Order (${cart.length} items)`,
        order_id: createRes.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await zomatoApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              restaurantId: rest.id,
              items: cart,
              totalAmount: grandTotal
            });

            if (verifyRes.success) {
              setActiveOrder(verifyRes.order);
              clearCart();
              setIsCartOpen(false);
              showToast('🎉 Order placed and payment captured on Razorpay!');
            }
          } catch (vErr) {
            showToast('Payment verification issue: ' + vErr.message);
          }
        },
        prefill: {
          name: 'Nawaz Khan',
          email: 'nawaz@gmail.com',
          contact: '9999999999'
        },
        theme: {
          color: '#e23744'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      showToast('Checkout error: ' + err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fafafa', color: '#1c1c1c' }}>
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
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={16} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCart={() => setIsCartOpen(true)}
        totalCartCount={totalItemCount}
        deliveryAddress={deliveryAddress}
      />

      {/* Main Content View */}
      <main style={{ flex: '1', maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>
        {selectedRestaurant ? (
          <RestaurantDetailView
            restaurant={selectedRestaurant}
            onBack={() => setSelectedRestaurant(null)}
            cart={cart}
            onAddToCart={handleAddToCart}
            updateCartQty={updateCartQty}
            getDishQtyInCart={getDishQtyInCart}
            onAgentBuy={triggerAgentPurchase}
          />
        ) : (
          <div>
            <CategoryCarousel
              cuisines={CUISINES}
              onSelectCuisine={(cName) => setSearchQuery(cName)}
            />

            <FilterBar
              isVegOnly={isVegOnly}
              setIsVegOnly={setIsVegOnly}
              selectedRatingFilter={selectedRatingFilter}
              setSelectedRatingFilter={setSelectedRatingFilter}
              selectedFastDelivery={selectedFastDelivery}
              setSelectedFastDelivery={setSelectedFastDelivery}
              selectedOfferFilter={selectedOfferFilter}
              setSelectedOfferFilter={setSelectedOfferFilter}
            />

            <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1c1c1c', marginBottom: '20px' }}>
              Delivery Restaurants in Indiranagar
            </h2>

            <RestaurantList
              restaurants={restaurants}
              loading={loading}
              onSelectRestaurant={(rest) => setSelectedRestaurant(rest)}
            />
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateCartQty={updateCartQty}
        removeFromCart={removeFromCart}
        cartItemTotal={cartItemTotal}
        deliveryFee={deliveryFee}
        platformFee={platformFee}
        taxes={taxes}
        grandTotal={grandTotal}
        deliveryAddress={deliveryAddress}
        onProceedToPayment={handleProceedToPayment}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        order={activeOrder}
        onClose={() => setActiveOrder(null)}
      />

      <Footer />
    </div>
  );
}
