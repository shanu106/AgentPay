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

const orders = {};
const enrollments = [];

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
    id: 'merchant_courses',
    name: 'LearnHub Courses'
  }
});

module.exports = {
  courses,
  orders,
  enrollments,
  formatMerchantProduct
};
