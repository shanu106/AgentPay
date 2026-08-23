const { restaurants } = require('../data/restaurants.data');

const listRestaurants = (req, res) => {
  const { query, vegOnly, maxPrice, sort } = req.query;
  let list = [...restaurants];

  if (vegOnly === 'true') {
    list = list.filter(r => r.isVeg);
  }

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    list = list.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.cuisine.toLowerCase().includes(q) ||
      r.categories.some(cat => cat.dishes.some(d => d.name.toLowerCase().includes(q)))
    );
  }

  if (maxPrice) {
    list = list.filter(r => r.avgPrice <= Number(maxPrice));
  }

  if (sort === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'deliveryTime') {
    list.sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime));
  } else if (sort === 'costLow') {
    list.sort((a, b) => a.avgPrice - b.avgPrice);
  }

  res.json({ success: true, count: list.length, restaurants: list });
};

const getRestaurantById = (req, res) => {
  const rest = restaurants.find(r => r.id === req.params.id);
  if (!rest) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }
  res.json({ success: true, restaurant: rest });
};

module.exports = {
  listRestaurants,
  getRestaurantById
};
