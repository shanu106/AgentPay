import { useState, useEffect } from 'react';
import { ecommerceApi } from '../services/ecommerceApi';

export function useProducts(selectedCategory = 'All', searchQuery = '') {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await ecommerceApi.getProducts(selectedCategory, searchQuery);
        if (isMounted) {
          if (data.success) {
            setProducts(data.products || []);
          } else {
            setError(data.message || 'Failed to fetch products');
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, [selectedCategory, searchQuery]);

  return { products, loading, error };
}
