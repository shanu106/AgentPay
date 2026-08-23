import { useState, useEffect } from 'react';
import { zomatoApi } from '../services/zomatoApi';

export function useRestaurants({ searchQuery, isVegOnly, selectedRatingFilter, selectedFastDelivery, selectedOfferFilter }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchList = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await zomatoApi.getRestaurants({ query: searchQuery, vegOnly: isVegOnly });
        if (isMounted) {
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
          } else {
            setError(data.message || 'Failed to fetch restaurants');
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchList();
    return () => { isMounted = false; };
  }, [searchQuery, isVegOnly, selectedRatingFilter, selectedFastDelivery, selectedOfferFilter]);

  return { restaurants, loading, error };
}
