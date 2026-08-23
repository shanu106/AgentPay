import { useState } from 'react';

export function useCart() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (dish, restaurant) => {
    let shouldAdd = true;
    setCart(prev => {
      if (prev.length > 0 && prev[0].restaurantId !== restaurant.id) {
        if (!window.confirm(`Your cart has items from ${prev[0].restaurantName}. Reset cart and add items from ${restaurant.name}?`)) {
          shouldAdd = false;
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
    return shouldAdd;
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

  const removeFromCart = (dishId) => {
    setCart(prev => prev.filter(item => item.id !== dishId));
  };

  const clearCart = () => {
    setCart([]);
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
  const totalItemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return {
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
  };
}
