import { API_BASE } from '../config/constants';

export const productService = {
  async getProducts(category = 'All', query = '') {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (query && query.trim() !== '') params.append('query', query.trim());

    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    return res.json();
  },

  async getProductById(id) {
    const res = await fetch(`${API_BASE}/products/${id}`);
    return res.json();
  }
};
