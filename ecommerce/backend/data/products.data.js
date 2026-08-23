const products = [
  {
    id: 'prod-keychron-k2',
    title: 'Keychron K2 Wireless Mechanical Keyboard',
    subtitle: '75% Compact Wireless Mechanical Keyboard with RGB',
    description: 'Compact 84-key wireless mechanical keyboard with hot-swappable Gateron G Pro switches, aluminum frame, Bluetooth 5.1 & Type-C wired connectivity. Compatible with macOS, Windows, iOS and Android.',
    category: 'Keyboards',
    subcategory: 'Mechanical Keyboards',
    price: 349900, // paise (₹3,499)
    priceDisplay: '₹3,499',
    originalPrice: '₹6,999',
    rating: 4.9,
    ratingCount: 1840,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
    tags: ['keyboard', 'keychron', 'mechanical', 'rgb', 'wireless', 'mac']
  },
  {
    id: 'prod-sony-anc',
    title: 'Sony WH-1000XM5 ANC Wireless Headphones',
    subtitle: 'Industry Leading Noise Cancelling with Auto NC Optimizer',
    description: 'Premium over-ear wireless headphones with two processors and 8 microphones for unparalleled noise cancellation. 30-hour battery life, ultra-comfortable lightweight design, and crystal-clear hands-free calling.',
    category: 'Audio',
    subcategory: 'Headphones',
    price: 299900, // paise (₹2,999)
    priceDisplay: '₹2,999',
    originalPrice: '₹5,999',
    rating: 4.8,
    ratingCount: 3200,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
    tags: ['headphones', 'sony', 'anc', 'noise cancelling', 'audio', 'wireless']
  },
  {
    id: 'prod-gan-charger',
    title: 'Anker 100W GaN Fast Charger',
    subtitle: '3-Port High-Speed Wall Charger for Laptops & Phones',
    description: 'Ultra-compact 100W GaN II fast charger equipped with 2 USB-C ports and 1 USB-A port. Power your MacBook Pro, iPhone, and iPad simultaneously at maximum speed with ActiveShield 2.0 safety protection.',
    category: 'Accessories',
    subcategory: 'Chargers',
    price: 89900, // paise (₹899)
    priceDisplay: '₹899',
    originalPrice: '₹1,999',
    rating: 4.7,
    ratingCount: 940,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=80',
    tags: ['charger', 'gan', 'fast charger', 'anker', '100w', 'usb-c', 'power']
  },
  {
    id: 'prod-logitech-mx',
    title: 'Logitech MX Master 3S Ergonomic Mouse',
    subtitle: 'Quiet Clicks, 8K DPI Any-Surface Tracking',
    description: 'Master precision with electromagnetic MagSpeed scrolling, 8000 DPI track-on-glass sensor, and whisper-quiet acoustic clicks. Ergonomic silhouette crafted for palm comfort and productivity.',
    category: 'Accessories',
    subcategory: 'Mice',
    price: 189900, // paise (₹1,899)
    priceDisplay: '₹1,899',
    originalPrice: '₹3,499',
    rating: 4.9,
    ratingCount: 2450,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80',
    tags: ['mouse', 'logitech', 'mx master', 'ergonomic', 'bluetooth', 'trackball']
  },
  {
    id: 'prod-smart-band',
    title: 'Fitbit Charge 6 Smart Fitness Tracker',
    subtitle: 'Heart Rate, Built-in GPS & 40+ Exercise Modes',
    description: 'Advanced fitness and health tracker with built-in GPS, EDA sensor for stress management, 24/7 heart rate monitoring, sleep tracking, 7-day battery life, and Google Wallet integration.',
    category: 'Wearables',
    subcategory: 'Fitness Trackers',
    price: 149900, // paise (₹1,499)
    priceDisplay: '₹1,499',
    originalPrice: '₹2,999',
    rating: 4.6,
    ratingCount: 1120,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=500&auto=format&fit=crop&q=80',
    tags: ['fitness', 'tracker', 'smartband', 'fitbit', 'watch', 'health', 'gps']
  },
  {
    id: 'prod-leather-sleeve',
    title: 'Bellroy Premium Leather Laptop Sleeve',
    subtitle: 'Slim Magnetic Closure for 14-16 inch Laptops',
    description: 'Crafted from environmentally certified premium leather with recycled woven fabric lining. Features seamless magnetic bumper entry, scratch-resistant microfiber interior, and ultra-slim profile.',
    category: 'Bags & Sleeves',
    subcategory: 'Laptop Sleeves',
    price: 219900, // paise (₹2,199)
    priceDisplay: '₹2,199',
    originalPrice: '₹3,999',
    rating: 4.8,
    ratingCount: 680,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80',
    tags: ['sleeve', 'laptop', 'leather', 'bellroy', 'case', 'bag']
  }
];

const orders = {};
const completedPurchases = [];

const formatProduct = (p) => ({
  id: p.id,
  title: p.title,
  subtitle: p.subtitle,
  description: p.description,
  category: p.category,
  subcategory: p.subcategory,
  price: p.price / 100, // in ₹
  pricePaise: p.price,
  priceDisplay: p.priceDisplay,
  originalPrice: p.originalPrice,
  currency: 'INR',
  rating: p.rating,
  ratingCount: p.ratingCount,
  available: p.inStock,
  image: p.image,
  merchant: {
    id: 'merchant_novastore',
    name: 'NovaStore Tech & Gear'
  }
});

module.exports = {
  products,
  orders,
  completedPurchases,
  formatProduct
};
