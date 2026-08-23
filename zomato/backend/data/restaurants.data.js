const restaurants = [
  {
    id: 'rest-biryani-by-kilo',
    name: 'Biryani By Kilo',
    cuisine: 'Biryani, Mughlai, Kebabs',
    rating: 4.4,
    ratingCount: '12K+',
    deliveryTime: '30-35 mins',
    distance: '2.5 km',
    costForTwo: '₹600 for two',
    avgPrice: 350,
    isVeg: false,
    promoted: true,
    discount: '50% OFF up to ₹100',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    address: 'Indiranagar, Bangalore',
    categories: [
      {
        name: 'Royal Dum Biryani',
        dishes: [
          {
            id: 'dish-hyd-chicken-biryani',
            name: 'Hyderabadi Chicken Dum Biryani',
            price: 349,
            priceDisplay: '₹349',
            description: 'Authentic kacchi dum biryani cooked with tender chicken pieces marinated in secret spices and fragrant basmati rice.',
            isVeg: false,
            rating: 4.6,
            ratingCount: 4200,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-mutton-dum-biryani',
            name: 'Kolkata Mutton Dum Biryani',
            price: 449,
            priceDisplay: '₹449',
            description: 'Succulent mutton slow-cooked in handi with aromatic rice, spiced potatoes and boiled egg.',
            isVeg: false,
            rating: 4.7,
            ratingCount: 2800,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-paneer-dum-biryani',
            name: 'Royal Paneer Dum Biryani',
            price: 299,
            priceDisplay: '₹299',
            description: 'Fresh malai paneer cubes tossed in rich saffron spices layered with aged basmati rice.',
            isVeg: true,
            rating: 4.3,
            ratingCount: 1900,
            bestseller: false,
            image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400&auto=format&fit=crop&q=80'
          }
        ]
      },
      {
        name: 'Kebabs & Starters',
        dishes: [
          {
            id: 'dish-chicken-tikka',
            name: 'Tandoori Chicken Tikka (6 Pcs)',
            price: 269,
            priceDisplay: '₹269',
            description: 'Boneless chicken marinated in spiced yogurt and roasted in a traditional clay tandoor.',
            isVeg: false,
            rating: 4.5,
            ratingCount: 1540,
            bestseller: false,
            image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-galouti-kebab',
            name: 'Melt-in-Mouth Galouti Kebabs',
            price: 299,
            priceDisplay: '₹299',
            description: 'Finely minced spiced meat kebabs that melt in your mouth, served with ulta tawa paratha.',
            isVeg: false,
            rating: 4.8,
            ratingCount: 980,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80'
          }
        ]
      },
      {
        name: 'Desserts & Beverages',
        dishes: [
          {
            id: 'dish-matka-phirni',
            name: 'Kesari Matka Phirni',
            price: 99,
            priceDisplay: '₹99',
            description: 'Traditional slow-cooked ground rice pudding flavored with green cardamom, saffron, and pistachios.',
            isVeg: true,
            rating: 4.7,
            ratingCount: 3100,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&auto=format&fit=crop&q=80'
          }
        ]
      }
    ]
  },
  {
    id: 'rest-la-pinoz-pizza',
    name: "La Pino'z Pizza",
    cuisine: 'Pizza, Italian, Fast Food',
    rating: 4.2,
    ratingCount: '25K+',
    deliveryTime: '25-30 mins',
    distance: '1.8 km',
    costForTwo: '₹500 for two',
    avgPrice: 280,
    isVeg: false,
    promoted: false,
    discount: '40% OFF up to ₹80',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    address: 'Koramangala 5th Block, Bangalore',
    categories: [
      {
        name: 'Giant Slice Pizzas',
        dishes: [
          {
            id: 'dish-burn-to-hell',
            name: 'Burn to Hell Pizza (Medium)',
            price: 399,
            priceDisplay: '₹399',
            description: 'Fiery red paprika, jalapenos, capsicum, spicy peri peri chicken and ghost chili drizzle.',
            isVeg: false,
            rating: 4.5,
            ratingCount: 3800,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-cheesy-7',
            name: 'Cheesy-7 Pizza (Medium)',
            price: 449,
            priceDisplay: '₹449',
            description: 'Loaded with 7 varieties of gourmet cheese: Mozzarella, Cheddar, Gouda, Colby, Monterey Jack, Cream Cheese & Liquid Cheese.',
            isVeg: true,
            rating: 4.6,
            ratingCount: 5200,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-farm-villa',
            name: 'Farm Villa Veg Special Pizza',
            price: 349,
            priceDisplay: '₹349',
            description: 'Crisp capsicum, sweet corn, black olives, sliced mushrooms, paneer cubes, and fresh mozzarella.',
            isVeg: true,
            rating: 4.3,
            ratingCount: 2900,
            bestseller: false,
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80'
          }
        ]
      },
      {
        name: 'Garlic Breads & Sides',
        dishes: [
          {
            id: 'dish-cheese-garlic-bread',
            name: 'Supreme Cheesy Garlic Bread',
            price: 149,
            priceDisplay: '₹149',
            description: 'Freshly baked artisan bread with garlic herb butter, overloaded with melted mozzarella cheese.',
            isVeg: true,
            rating: 4.5,
            ratingCount: 1800,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1619895092538-128341789043?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-choco-lava',
            name: 'Molten Choco Lava Cake',
            price: 119,
            priceDisplay: '₹119',
            description: 'Warm chocolate cake with a rich liquid chocolate center.',
            isVeg: true,
            rating: 4.8,
            ratingCount: 4500,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80'
          }
        ]
      }
    ]
  },
  {
    id: 'rest-burger-king',
    name: 'Burger King',
    cuisine: 'Burgers, American, Fast Food, Shakes',
    rating: 4.3,
    ratingCount: '40K+',
    deliveryTime: '20-25 mins',
    distance: '1.2 km',
    costForTwo: '₹350 for two',
    avgPrice: 190,
    isVeg: false,
    promoted: true,
    discount: 'FLAT ₹125 OFF',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    address: 'Church Street, Bangalore',
    categories: [
      {
        name: 'Signature Whoppers',
        dishes: [
          {
            id: 'dish-chicken-whopper',
            name: 'Crispy Chicken Whopper Meal',
            price: 249,
            priceDisplay: '₹249',
            description: 'Flame-grilled crunchy chicken patty with fresh lettuce, sliced tomatoes, creamy mayo + Medium Fries & Coke.',
            isVeg: false,
            rating: 4.6,
            ratingCount: 8900,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-veg-whopper',
            name: 'Crispy Veg Whopper',
            price: 189,
            priceDisplay: '₹189',
            description: 'Crunchy savory vegetable patty with tangy pickles, fresh onions and secret house sauce.',
            isVeg: true,
            rating: 4.3,
            ratingCount: 4200,
            bestseller: false,
            image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80'
          }
        ]
      },
      {
        name: 'Sides & Shakes',
        dishes: [
          {
            id: 'dish-peri-fries',
            name: 'King Peri Peri Fries',
            price: 109,
            priceDisplay: '₹109',
            description: 'Golden crispy french fries sprinkled with zesty peri peri spice mix.',
            isVeg: true,
            rating: 4.4,
            ratingCount: 6500,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-oreo-shake',
            name: 'Thick Oreo Chocolate Shake',
            price: 139,
            priceDisplay: '₹139',
            description: 'Rich thick vanilla ice cream blended with crushed Oreo cookies and chocolate fudge.',
            isVeg: true,
            rating: 4.7,
            ratingCount: 3100,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80'
          }
        ]
      }
    ]
  },
  {
    id: 'rest-belgian-waffle',
    name: 'The Belgian Waffle Co.',
    cuisine: 'Waffles, Desserts, Shakes, Ice Cream',
    rating: 4.6,
    ratingCount: '18K+',
    deliveryTime: '20-25 mins',
    distance: '2.1 km',
    costForTwo: '₹300 for two',
    avgPrice: 170,
    isVeg: true,
    promoted: false,
    discount: '20% OFF',
    image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&auto=format&fit=crop&q=80',
    address: 'HSR Layout, Bangalore',
    categories: [
      {
        name: 'Waffle-Wiches',
        dishes: [
          {
            id: 'dish-nutella-waffle',
            name: 'Naked Nutella Waffle',
            price: 169,
            priceDisplay: '₹169',
            description: 'Warm classic crispy Belgian waffle smothered with premium melted Nutella hazelnut spread.',
            isVeg: true,
            rating: 4.8,
            ratingCount: 7800,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-triple-chocolate',
            name: 'Triple Chocolate Waffle-Wich',
            price: 189,
            priceDisplay: '₹189',
            description: 'Dark chocolate waffle filled with melted milk chocolate and white chocolate chips.',
            isVeg: true,
            rating: 4.9,
            ratingCount: 6500,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1598214886806-c87b84b7078b?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-red-velvet-waffle',
            name: 'Red Velvet White Chocolate Waffle',
            price: 179,
            priceDisplay: '₹179',
            description: 'Crimson red velvet waffle base layered with melted Belgian white chocolate.',
            isVeg: true,
            rating: 4.6,
            ratingCount: 3100,
            bestseller: false,
            image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80'
          }
        ]
      }
    ]
  },
  {
    id: 'rest-haldirams',
    name: "Haldiram's Sweets & Snacks",
    cuisine: 'North Indian, Street Food, Sweets, Chaat',
    rating: 4.5,
    ratingCount: '32K+',
    deliveryTime: '25-30 mins',
    distance: '3.0 km',
    costForTwo: '₹400 for two',
    avgPrice: 180,
    isVeg: true,
    promoted: false,
    discount: '30% OFF up to ₹75',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    address: 'MG Road, Bangalore',
    categories: [
      {
        name: 'Street Food & Chaat',
        dishes: [
          {
            id: 'dish-chole-bhature',
            name: 'Special Amritsari Chole Bhature (2 Pcs)',
            price: 199,
            priceDisplay: '₹199',
            description: 'Fluffy giant bhaturas served with spicy authentic Amritsari pindi chole, pickled onions and green chutney.',
            isVeg: true,
            rating: 4.7,
            ratingCount: 9400,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-raj-kachori',
            name: 'Shahi Raj Kachori',
            price: 149,
            priceDisplay: '₹149',
            description: 'Crisp kachori filled with spiced potatoes, sprouts, sweetened yogurt, tamarind and mint chutneys.',
            isVeg: true,
            rating: 4.8,
            ratingCount: 5100,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-pav-bhaji',
            name: 'Butter Masala Pav Bhaji',
            price: 179,
            priceDisplay: '₹179',
            description: 'Thick spiced mashed vegetable curry topped with a dollop of butter, served with 2 toasted butter pavs.',
            isVeg: true,
            rating: 4.5,
            ratingCount: 4300,
            bestseller: false,
            image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&auto=format&fit=crop&q=80'
          }
        ]
      },
      {
        name: 'Authentic Indian Sweets',
        dishes: [
          {
            id: 'dish-gulab-jamun',
            name: 'Desi Ghee Gulab Jamun (2 Pcs)',
            price: 79,
            priceDisplay: '₹79',
            description: 'Soft melt-in-the-mouth fried dumplings soaked in aromatic rose and cardamom sugar syrup.',
            isVeg: true,
            rating: 4.9,
            ratingCount: 11000,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&auto=format&fit=crop&q=80'
          }
        ]
      }
    ]
  },
  {
    id: 'rest-mainland-china',
    name: 'Mainland China',
    cuisine: 'Chinese, Asian, Dimsums, Noodles',
    rating: 4.5,
    ratingCount: '15K+',
    deliveryTime: '35-40 mins',
    distance: '3.8 km',
    costForTwo: '₹800 for two',
    avgPrice: 320,
    isVeg: false,
    promoted: true,
    discount: '40% OFF',
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
    address: 'Whitefield, Bangalore',
    categories: [
      {
        name: 'Dimsums & Appetizers',
        dishes: [
          {
            id: 'dish-chicken-dimsums',
            name: 'Chicken Sui Mai Steamed Dimsums (6 Pcs)',
            price: 269,
            priceDisplay: '₹269',
            description: 'Delicate translucent steamed dumplings packed with seasoned minced chicken, served with spicy dip.',
            isVeg: false,
            rating: 4.7,
            ratingCount: 2200,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=400&auto=format&fit=crop&q=80'
          },
          {
            id: 'dish-chilli-paneer',
            name: 'Chilli Paneer Dry',
            price: 289,
            priceDisplay: '₹289',
            description: 'Wok-tossed crispy paneer cubes with bell peppers, green chilies, and tangy soya garlic glaze.',
            isVeg: true,
            rating: 4.4,
            ratingCount: 1700,
            bestseller: false,
            image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&auto=format&fit=crop&q=80'
          }
        ]
      },
      {
        name: 'Rice & Noodles',
        dishes: [
          {
            id: 'dish-schezwan-rice',
            name: 'Schezwan Fried Rice (Chicken)',
            price: 249,
            priceDisplay: '₹249',
            description: 'Fragrant wok-fried long grain rice tossed with chicken, egg ribbons, scallions and fiery Schezwan sauce.',
            isVeg: false,
            rating: 4.6,
            ratingCount: 3500,
            bestseller: true,
            image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&auto=format&fit=crop&q=80'
          }
        ]
      }
    ]
  }
];

const foodOrders = {};
const placedOrders = [];

// Flattened dishes as standardized products for Agent discovery
const getAllDishesAsProducts = () => {
  const list = [];
  restaurants.forEach(rest => {
    rest.categories.forEach(cat => {
      cat.dishes.forEach(dish => {
        list.push({
          id: dish.id,
          title: dish.name,
          description: `${dish.description} (From: ${rest.name})`,
          price: dish.price,
          currency: 'INR',
          rating: dish.rating,
          ratingCount: dish.ratingCount,
          isVeg: dish.isVeg,
          bestseller: dish.bestseller,
          category: cat.name,
          subcategory: rest.name,
          image: dish.image,
          available: true,
          inStock: true,
          restaurant: {
            id: rest.id,
            name: rest.name,
            cuisine: rest.cuisine,
            deliveryTime: rest.deliveryTime
          },
          merchant: {
            id: 'merchant_zomato',
            name: 'Zomato Food Delivery'
          }
        });
      });
    });
  });
  return list;
};

module.exports = {
  restaurants,
  foodOrders,
  placedOrders,
  getAllDishesAsProducts
};
