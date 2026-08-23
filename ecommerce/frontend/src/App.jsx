import React, { useState } from 'react';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { CodeModal } from './components/CodeModal';
import { TrustBadges, Footer } from './components/TrustBadges';
import { CheckCircle2 } from 'lucide-react';

const CATEGORIES = ['All', 'Keyboards', 'Audio', 'Accessories', 'Wearables', 'Bags & Sleeves'];

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const { products, loading } = useProducts(selectedCategory, searchQuery);
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    totalItemCount
  } = useCart();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    showToast(`Added ${product.title} to cart`);
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

  const handleCheckout = () => {
    if (window.RazorpayAgent && typeof window.RazorpayAgent.open === 'function') {
      setIsCartOpen(false);
      window.RazorpayAgent.open();
    } else {
      showToast('Redirecting to Razorpay checkout...');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0f1d' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          background: '#0284c7',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar Header */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCodeModal={() => setShowCodeModal(true)}
        onOpenCart={() => setIsCartOpen(true)}
        totalCartCount={totalItemCount}
      />

      {/* Main Content Area */}
      <main style={{ flex: '1', maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', width: '100%' }}>
        <HeroBanner onOpenAgent={triggerAgentPurchase} />

        <CategoryFilter
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <ProductGrid
          products={products}
          loading={loading}
          onAddToCart={handleAddToCart}
          onAgentBuy={triggerAgentPurchase}
        />

        <TrustBadges />
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        cartTotal={cartTotal}
        onCheckout={handleCheckout}
      />

      {/* Drop-In Code Snippet Modal */}
      <CodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
      />

      <Footer />
    </div>
  );
}
