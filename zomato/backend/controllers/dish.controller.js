const { getAllDishesAsProducts } = require('../data/restaurants.data');

const listDishesAsProducts = (req, res) => {
  const { query, maxPrice, category } = req.query;
  let list = getAllDishesAsProducts();

  if (category) {
    list = list.filter(p => p.category.toLowerCase().includes(category.toLowerCase()));
  }

  if (maxPrice) {
    list = list.filter(p => p.price <= Number(maxPrice));
  }

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    const STOP_WORDS = new Set(['for', 'the', 'and', 'with', 'using', 'via', 'from', 'this', 'that', 'have', 'each', 'all', 'buy', 'get', 'order', 'please', 'course', 'courses', 'store', 'shop', 'me', 'you', 'item', 'items']);
    const qWords = q.split(/[\s,_\-]+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));

    if (qWords.length === 0 && !list.some(p => p.title.toLowerCase().includes(q))) {
      list = [];
    } else {
      const scored = list.map(p => {
        let score = 0;
        const title = p.title.toLowerCase();
        const desc = p.description.toLowerCase();
        const cat = `${p.category || ''} ${p.subcategory || ''}`.toLowerCase();

        // Exact query match bonus
        if (title.includes(q)) score += 200;
        if (cat.includes(q)) score += 100;
        if (desc.includes(q) && q.length >= 4) score += 30;

        // Word boundary matching with significant words only
        for (const w of qWords) {
          const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const wordRegex = new RegExp(`\\b${escaped}\\b`, 'i');

          if (wordRegex.test(title)) score += 100;
          else if (title.includes(w) && w.length >= 3) score += 40;

          if (wordRegex.test(cat)) score += 60;
          else if (cat.includes(w) && w.length >= 3) score += 20;

          if (wordRegex.test(desc)) score += 15;
          else if (w.length >= 5 && desc.includes(w)) score += 5;
        }

        return { product: p, score };
      });

      list = scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.product);
    }
  }

  res.json({ success: true, count: list.length, products: list });
};

const getDishById = (req, res) => {
  const dishes = getAllDishesAsProducts();
  const dish = dishes.find(d => d.id === req.params.id);
  if (!dish) {
    return res.status(404).json({ success: false, message: 'Dish not found' });
  }
  res.json({ success: true, product: dish });
};

const checkAvailability = (req, res) => {
  const dishes = getAllDishesAsProducts();
  const dish = dishes.find(d => d.id === req.params.id);
  if (!dish) {
    return res.status(404).json({ success: false, available: false, message: 'Dish not found' });
  }
  res.json({ success: true, productId: dish.id, available: true, kitchenStock: 50 });
};

module.exports = {
  listDishesAsProducts,
  getDishById,
  checkAvailability
};
