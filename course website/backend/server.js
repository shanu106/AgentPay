const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Initialize Razorpay SDK with keys from .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// In-memory courses database
const courses = [
  {
    id: 'course-js-mastery',
    title: 'JavaScript Mastery',
    subtitle: 'From Zero to Hero in JavaScript',
    description: 'Master JavaScript from the ground up. Cover variables, functions, closures, prototypes, async/await, DOM manipulation, ES6+ features, and modern JavaScript patterns. Perfect for beginners and intermediate developers looking to deepen their JS knowledge.',
    price: 49900, // in paise (₹499)
    priceDisplay: '₹499',
    originalPrice: '₹1,999',
    instructor: 'Alex Johnson',
    instructorRole: 'Senior Frontend Engineer at Google',
    rating: 4.8,
    studentsCount: '24,500+',
    duration: '42 hours',
    lessons: 186,
    level: 'Beginner to Advanced',
    category: 'Web Development',
    image: 'https://img.icons8.com/fluency/96/javascript.png',
    learningObjectives: [
      'Understand JavaScript fundamentals and advanced concepts',
      'Master asynchronous programming with Promises and async/await',
      'Build interactive web applications from scratch',
      'Write clean, maintainable, and efficient code',
      'Prepare for technical interviews with confidence'
    ],
    curriculum: [
      { title: 'Introduction to JavaScript', lessons: '8 lessons', duration: '2.5 hours' },
      { title: 'Variables, Data Types & Operators', lessons: '12 lessons', duration: '3 hours' },
      { title: 'Functions & Scope', lessons: '15 lessons', duration: '4 hours' },
      { title: 'Objects, Arrays & Destructuring', lessons: '14 lessons', duration: '3.5 hours' },
      { title: 'DOM Manipulation & Events', lessons: '18 lessons', duration: '5 hours' },
      { title: 'Asynchronous JavaScript', lessons: '20 lessons', duration: '6 hours' },
      { title: 'Modern ES6+ Features', lessons: '16 lessons', duration: '4.5 hours' },
      { title: 'Error Handling & Debugging', lessons: '10 lessons', duration: '3 hours' }
    ]
  },
  {
    id: 'course-python-data-science',
    title: 'Python for Data Science',
    subtitle: 'Learn Python & Data Analysis from Scratch',
    description: 'Dive into Python programming with a focus on data science applications. Learn NumPy, Pandas, Matplotlib, and Jupyter notebooks. Work with real-world datasets and build data visualization dashboards.',
    price: 69900,
    priceDisplay: '₹699',
    originalPrice: '₹2,499',
    instructor: 'Dr. Priya Sharma',
    instructorRole: 'Data Science Lead at Microsoft',
    rating: 4.7,
    studentsCount: '18,200+',
    duration: '38 hours',
    lessons: 164,
    level: 'Beginner to Intermediate',
    category: 'Data Science',
    image: 'https://img.icons8.com/fluency/96/python.png',
    learningObjectives: [
      'Write Python code confidently for data analysis',
      'Manipulate data using Pandas DataFrames',
      'Create stunning visualizations with Matplotlib & Seaborn',
      'Work with real-world datasets and draw insights',
      'Build end-to-end data analysis projects'
    ],
    curriculum: [
      { title: 'Python Basics & Setup', lessons: '10 lessons', duration: '3 hours' },
      { title: 'Data Structures in Python', lessons: '14 lessons', duration: '3.5 hours' },
      { title: 'NumPy for Numerical Computing', lessons: '16 lessons', duration: '4 hours' },
      { title: 'Pandas for Data Manipulation', lessons: '22 lessons', duration: '6 hours' },
      { title: 'Data Visualization', lessons: '18 lessons', duration: '5 hours' },
      { title: 'Statistical Analysis', lessons: '15 lessons', duration: '4 hours' },
      { title: 'Capstone Projects', lessons: '8 lessons', duration: '6 hours' }
    ]
  },
  {
    id: 'course-react-dev',
    title: 'React & Modern Web Development',
    subtitle: 'Build Modern UIs with React, Hooks & Redux',
    description: 'Learn React from the ground up — components, hooks, state management, routing, and testing. Build production-ready single-page applications with modern tooling and best practices.',
    price: 59900,
    priceDisplay: '₹599',
    originalPrice: '₹2,199',
    instructor: 'Sarah Chen',
    instructorRole: 'UI Architect at Meta',
    rating: 4.9,
    studentsCount: '31,800+',
    duration: '45 hours',
    lessons: 210,
    level: 'Intermediate',
    category: 'Web Development',
    image: 'https://img.icons8.com/fluency/96/react-native.png',
    learningObjectives: [
      'Build reusable React components with confidence',
      'Master React Hooks and custom hooks',
      'Manage complex state with Redux Toolkit',
      'Implement routing and navigation',
      'Deploy production-ready React applications'
    ],
    curriculum: [
      { title: 'React Fundamentals', lessons: '14 lessons', duration: '4 hours' },
      { title: 'JSX & Components', lessons: '16 lessons', duration: '4.5 hours' },
      { title: 'State & Lifecycle', lessons: '18 lessons', duration: '5 hours' },
      { title: 'React Hooks Deep Dive', lessons: '24 lessons', duration: '7 hours' },
      { title: 'Redux & State Management', lessons: '20 lessons', duration: '6 hours' },
      { title: 'React Router & Navigation', lessons: '12 lessons', duration: '3.5 hours' },
      { title: 'Testing React Apps', lessons: '14 lessons', duration: '4 hours' },
      { title: 'Performance Optimization', lessons: '10 lessons', duration: '3 hours' }
    ]
  },
  {
    id: 'course-nodejs-backend',
    title: 'Node.js Backend Development',
    subtitle: 'Build Scalable APIs with Node.js & Express',
    description: 'Master server-side JavaScript with Node.js. Build RESTful APIs, work with databases (MongoDB & PostgreSQL), implement authentication, and deploy to cloud platforms.',
    price: 54900,
    priceDisplay: '₹549',
    originalPrice: '₹1,899',
    instructor: 'Michael Torres',
    instructorRole: 'Backend Lead at Amazon Web Services',
    rating: 4.6,
    studentsCount: '15,400+',
    duration: '36 hours',
    lessons: 148,
    level: 'Intermediate',
    category: 'Backend Development',
    image: 'https://img.icons8.com/fluency/96/node-js.png',
    learningObjectives: [
      'Build RESTful APIs with Express.js',
      'Work with MongoDB and PostgreSQL databases',
      'Implement JWT authentication & authorization',
      'Handle file uploads and real-time features',
      'Deploy applications to AWS and Heroku'
    ],
    curriculum: [
      { title: 'Node.js Basics', lessons: '10 lessons', duration: '3 hours' },
      { title: 'Express.js & Routing', lessons: '16 lessons', duration: '4.5 hours' },
      { title: 'Database Integration', lessons: '20 lessons', duration: '5.5 hours' },
      { title: 'Authentication & Security', lessons: '18 lessons', duration: '5 hours' },
      { title: 'File Uploads & Storage', lessons: '10 lessons', duration: '3 hours' },
      { title: 'Testing & Debugging', lessons: '12 lessons', duration: '3 hours' },
      { title: 'Deployment & DevOps', lessons: '14 lessons', duration: '4 hours' }
    ]
  },
  {
    id: 'course-fullstack',
    title: 'Full Stack Web Development',
    subtitle: 'Complete Web Development Bootcamp',
    description: 'The ultimate full-stack development course covering HTML, CSS, JavaScript, React, Node.js, MongoDB, PostgreSQL, and deployment. Build 5 complete projects and a portfolio that gets you hired.',
    price: 129900,
    priceDisplay: '₹1,299',
    originalPrice: '₹4,999',
    instructor: 'David Kim & Team',
    instructorRole: 'Full Stack Lead at Stripe',
    rating: 4.9,
    studentsCount: '52,100+',
    duration: '120 hours',
    lessons: 480,
    level: 'Beginner to Professional',
    category: 'Full Stack',
    image: 'https://img.icons8.com/fluency/96/domain.png',
    learningObjectives: [
      'Build complete web applications from scratch',
      'Master both frontend and backend technologies',
      'Create and deploy RESTful APIs with authentication',
      'Work with multiple databases and cloud services',
      'Build a professional portfolio with 5 projects'
    ],
    curriculum: [
      { title: 'Web Fundamentals (HTML, CSS, JS)', lessons: '30 lessons', duration: '10 hours' },
      { title: 'Frontend with React', lessons: '50 lessons', duration: '15 hours' },
      { title: 'Backend with Node.js & Express', lessons: '45 lessons', duration: '12 hours' },
      { title: 'Databases (MongoDB & PostgreSQL)', lessons: '35 lessons', duration: '10 hours' },
      { title: 'Authentication & Security', lessons: '25 lessons', duration: '8 hours' },
      { title: 'Testing & CI/CD', lessons: '20 lessons', duration: '6 hours' },
      { title: 'Cloud Deployment (AWS, Vercel)', lessons: '25 lessons', duration: '8 hours' },
      { title: '5 Capstone Projects', lessons: '30 lessons', duration: '20 hours' }
    ]
  },
  {
    id: 'course-ai-ml',
    title: 'AI & Machine Learning Fundamentals',
    subtitle: 'Build AI Models with Python & TensorFlow',
    description: 'Enter the world of artificial intelligence. Understand machine learning algorithms, neural networks, deep learning, and NLP. Build and deploy AI models with TensorFlow and scikit-learn.',
    price: 84900,
    priceDisplay: '₹849',
    originalPrice: '₹3,299',
    instructor: 'Dr. Rajesh Verma',
    instructorRole: 'AI Research Scientist at DeepMind',
    rating: 4.8,
    studentsCount: '12,700+',
    duration: '55 hours',
    lessons: 210,
    level: 'Intermediate',
    category: 'AI & ML',
    image: 'https://img.icons8.com/fluency/96/artificial-intelligence.png',
    learningObjectives: [
      'Understand core machine learning algorithms',
      'Build neural networks with TensorFlow & Keras',
      'Work with real datasets and perform feature engineering',
      'Deploy ML models as web APIs',
      'Create NLP models for text classification'
    ],
    curriculum: [
      { title: 'Python for ML', lessons: '12 lessons', duration: '4 hours' },
      { title: 'Mathematics for ML', lessons: '18 lessons', duration: '6 hours' },
      { title: 'Supervised Learning Algorithms', lessons: '25 lessons', duration: '8 hours' },
      { title: 'Unsupervised Learning', lessons: '20 lessons', duration: '6 hours' },
      { title: 'Neural Networks & Deep Learning', lessons: '30 lessons', duration: '10 hours' },
      { title: 'Natural Language Processing', lessons: '22 lessons', duration: '7 hours' },
      { title: 'Model Deployment', lessons: '15 lessons', duration: '5 hours' }
    ]
  },
  {
    id: 'course-dsa-mastery',
    title: 'Complete DSA Mastery',
    subtitle: 'Data Structures & Algorithms in Java, C++ & Python',
    description: 'Master Data Structures & Algorithms from foundational to competitive programming level. Covers Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, Greedy, Backtracking, and 300+ LeetCode problems.',
    price: 499900, // in paise (₹4,999)
    priceDisplay: '₹4,999',
    originalPrice: '₹9,999',
    instructor: 'Striver & SDE Team',
    instructorRole: 'Staff Software Engineer at Google',
    rating: 4.7,
    studentsCount: '48,000+',
    duration: '95 hours',
    lessons: 320,
    level: 'Beginner to Advanced',
    category: 'Computer Science',
    subcategory: 'DSA',
    image: 'https://img.icons8.com/fluency/96/code-fork.png',
    available: true,
    learningObjectives: [
      'Master all core Data Structures & Algorithms',
      'Solve 300+ FAANG interview problems',
      'Master time & space complexity analysis (Big-O)',
      'Ace technical coding rounds with confidence'
    ],
    curriculum: [
      { title: 'Time & Space Complexity Basics', lessons: '8 lessons', duration: '3 hours' },
      { title: 'Arrays, Strings & 2-Pointer', lessons: '25 lessons', duration: '8 hours' },
      { title: 'Linked Lists & Stacks/Queues', lessons: '30 lessons', duration: '10 hours' },
      { title: 'Binary Trees & BSTs', lessons: '35 lessons', duration: '12 hours' },
      { title: 'Heaps & Priority Queues', lessons: '18 lessons', duration: '6 hours' },
      { title: 'Graph Algorithms (BFS, DFS, Dijkstra, MST)', lessons: '40 lessons', duration: '15 hours' },
      { title: 'Dynamic Programming Mastery', lessons: '50 lessons', duration: '18 hours' },
      { title: 'Tries, Disjoint Sets & Segment Trees', lessons: '20 lessons', duration: '7 hours' }
    ]
  }
];

// Store created orders & enrollments temporarily
const orders = {};
const enrollments = [];

// Helper: Standardized Merchant Product format (Spec Section 18)
const formatMerchantProduct = (c) => ({
  id: c.id,
  title: c.title,
  description: c.description,
  subtitle: c.subtitle,
  category: c.category || 'education',
  subcategory: c.subcategory || c.category || 'General',
  price: c.price / 100, // in INR ₹
  pricePaise: c.price,
  priceDisplay: c.priceDisplay,
  currency: 'INR',
  rating: c.rating,
  ratingCount: parseInt(c.studentsCount) || 1240,
  available: c.available !== false,
  image: c.image,
  merchant: {
    id: 'merchant_demo',
    name: 'LearnHub Academy'
  }
});

// ==================== MERCHANT API ROUTES ====================

// GET /api/products - Standard Merchant API (Spec Section 17 & 18)
app.get('/api/products', (req, res) => {
  const { query, maxPrice, category } = req.query;
  let list = courses.map(formatMerchantProduct);

  if (category) {
    list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (maxPrice) {
    list = list.filter(p => p.price <= Number(maxPrice));
  }

  if (query && query.trim() !== '') {
    const q = query.toLowerCase().trim();
    const qWords = q.split(/\s+/).filter(w => w.length > 0);

    const scored = list.map(p => {
      let score = 0;
      const title = p.title.toLowerCase();
      const desc = p.description.toLowerCase();
      const cat = `${p.category || ''} ${p.subcategory || ''}`.toLowerCase();

      // Exact full query match bonus
      if (title.includes(q)) score += 200;
      if (cat.includes(q)) score += 100;
      if (desc.includes(q) && q.length >= 4) score += 30;

      // Word-boundary scoring for query terms
      for (const w of qWords) {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp(`\\b${escaped}\\b`, 'i');

        if (wordRegex.test(title)) {
          score += 100;
        } else if (title.includes(w) && w.length >= 3) {
          score += 40;
        }

        if (wordRegex.test(cat)) {
          score += 60;
        } else if (cat.includes(w) && w.length >= 3) {
          score += 20;
        }

        if (wordRegex.test(desc)) {
          score += 15;
        } else if (w.length >= 5 && desc.includes(w)) {
          score += 5;
        }
      }

      return { product: p, score };
    });

    list = scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);
  }

  res.json({ success: true, count: list.length, products: list });
});

// GET /api/products/:id - Standard Merchant Product details
app.get('/api/products/:id', (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, product: formatMerchantProduct(course) });
});

// GET /api/products/:id/availability - Standard Merchant Availability check
app.get('/api/products/:id/availability', (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, available: false, message: 'Product not found' });
  }
  res.json({ success: true, productId: course.id, available: true, quantity: 1 });
});

// GET /api/courses - List all courses (Legacy course platform frontend)
app.get('/api/courses', (req, res) => {
  const courseList = courses.map(({ curriculum, ...rest }) => ({
    ...rest,
    curriculumLength: curriculum.length
  }));
  res.json({ success: true, courses: courseList });
});

// GET /api/courses/:id - Get course details
app.get('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }
  res.json({ success: true, course });
});

// POST /api/payment/create-order - Create a Razorpay order
app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { courseId, customerName, customerEmail } = req.body;

    // Validate input
    if (!courseId || !customerName || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: courseId, customerName, customerEmail'
      });
    }

    // Find the course
    const course = courses.find(c => c.id === courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const receiptId = `rcpt_${uuidv4().split('-')[0]}`;

    // Create order in Razorpay using test keys from .env
    const options = {
      amount: course.price, // amount in paise (e.g. 49900 for ₹499)
      currency: 'INR',
      receipt: receiptId,
      notes: {
        courseId: course.id,
        courseName: course.title,
        customerName,
        customerEmail
      }
    };

    const order = await razorpay.orders.create(options);

    // Store order details temporarily
    orders[order.id] = {
      ...options,
      id: order.id,
      status: 'created',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        key: process.env.RAZORPAY_KEY_ID
      },
      course: {
        id: course.id,
        title: course.title,
        priceDisplay: course.priceDisplay
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    let errorMessage = error?.error?.description || error?.message || 'Failed to create payment order';
    
    if (errorMessage.toLowerCase().includes('auth') || error?.statusCode === 401 || (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.includes('XXXX'))) {
      errorMessage = 'Razorpay Authentication Failed: The API Key ID or Key Secret in backend/.env is invalid or placeholder. Please update backend/.env with your actual Razorpay Test Key ID (e.g., rzp_test_...) and Key Secret from https://dashboard.razorpay.com/app/keys.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorMessage
    });
  }
});

// POST /api/payment/verify - Verify Razorpay payment signature
app.post('/api/payment/verify', (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId
    } = req.body;

    // Verify signature using RAZORPAY_KEY_SECRET from .env
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - invalid signature'
      });
    }

    // Find the course
    const course = courses.find(c => c.id === courseId);

    // Update order status
    if (orders[razorpay_order_id]) {
      orders[razorpay_order_id].status = 'paid';
      orders[razorpay_order_id].paymentId = razorpay_payment_id;
    }

    const enrollment = {
      enrollmentId: `enr_${Date.now()}`,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      courseId: course?.id || courseId,
      courseTitle: course?.title || 'Course',
      coursePrice: course?.priceDisplay || '₹4,999',
      courseImage: course?.image || 'https://img.icons8.com/fluency/96/code-fork.png',
      customerName: orders[razorpay_order_id]?.notes?.customerName || 'Student Buyer',
      customerEmail: orders[razorpay_order_id]?.notes?.customerEmail || 'student@example.com',
      enrolledAt: new Date().toISOString()
    };
    enrollments.push(enrollment);

    res.json({
      success: true,
      message: 'Payment verified successfully',
      paymentDetails: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        courseTitle: course?.title || 'Course',
        amount: course?.priceDisplay || 'N/A'
      },
      enrollment
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
});

// GET /api/enrollments - List verified enrollments
app.get('/api/enrollments', (req, res) => {
  res.json({ success: true, count: enrollments.length, enrollments });
});

// GET /api/payment/orders - (Optional) List recent orders
app.get('/api/payment/orders', (req, res) => {
  const orderList = Object.entries(orders).map(([id, order]) => ({
    id,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    customerName: order.notes?.customerName || 'N/A',
    courseName: order.notes?.courseName || 'N/A',
    createdAt: order.createdAt
  }));
  res.json({ success: true, orders: orderList });
});

// GET /api/config - Get Razorpay public key for frontend
app.get('/api/config', (req, res) => {
  res.json({
    key: process.env.RAZORPAY_KEY_ID
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         Course Platform Backend Server           ║
╠══════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}        ║
║  API base:      http://localhost:${PORT}/api       ║
║  Courses:       http://localhost:${PORT}/api/courses ║
║  Health:        http://localhost:${PORT}/api/health  ║
║                                                  ║
║  Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}         ║
╚══════════════════════════════════════════════════╝
  `);
});