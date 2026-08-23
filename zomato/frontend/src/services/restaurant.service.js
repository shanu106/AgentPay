import { API_BASE } from '../config/constants';

export const restaurantService = {
  async getRestaurants(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.vegOnly) searchParams.append('vegOnly', 'true');
    if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice);

    const res = await fetch(`${API_BASE}/restaurants?${searchParams.toString()}`);
    return res.json();
  },

  async getRestaurantById(id) {
    const res = await fetch(`${API_BASE}/restaurants/${id}`);
    return res.json();
  }
};
