const products = [
  // ================= COURSES =================
  {
    id: 'prod-js-mastery',
    title: 'JavaScript & TypeScript Mastery 2026',
    subtitle: 'From Fundamentals to Modern Fullstack Architecture',
    description: 'Master JavaScript (ES6-ES2025) and TypeScript from the ground up. Cover closures, prototypes, async event loops, DOM engines, design patterns, and building production-ready apps.',
    category: 'Courses',
    subcategory: 'Web Development',
    price: 499,
    originalPrice: 1999,
    discountPercent: 75,
    rating: 4.9,
    reviewsCount: 3420,
    image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&auto=format&fit=crop&q=80',
    icon: '⚡',
    badge: 'Bestseller',
    inStock: true,
    features: [
      '45+ hours on-demand video & real-world projects',
      'TypeScript strict typing & advanced generics',
      'Asynchronous JS, WebSockets & WebWorkers',
      'Lifetime access & certificate of completion'
    ],
    specs: {
      Format: 'Online Video Course',
      Duration: '45 Hours',
      Level: 'Beginner to Advanced',
      Language: 'English',
      Instructor: 'Alex Johnson (Senior Eng @ Google)'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'STUDENT50', 'NOVABUY']
  },
  {
    id: 'prod-python-ai-ds',
    title: 'Python for AI & Data Science Masterclass',
    subtitle: 'NumPy, Pandas, PyTorch & LLM Fine-tuning',
    description: 'The definitive data science & AI curriculum in Python. Work with real-world datasets, build predictive machine learning models, visualize insights, and deploy neural networks.',
    category: 'Courses',
    subcategory: 'AI & Data Science',
    price: 699,
    originalPrice: 2499,
    discountPercent: 72,
    rating: 4.8,
    reviewsCount: 2890,
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&auto=format&fit=crop&q=80',
    icon: '🐍',
    badge: 'Top Rated',
    inStock: true,
    features: [
      'Data manipulation with Pandas & Polars',
      'Machine learning algorithms with Scikit-Learn',
      'Deep Learning with PyTorch & HuggingFace',
      '5 Real-world Capstone Industry Projects'
    ],
    specs: {
      Format: 'Online Video Course',
      Duration: '42 Hours',
      Level: 'All Levels',
      Language: 'English',
      Instructor: 'Dr. Priya Sharma (AI Scientist)'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'STUDENT50', 'NOVABUY']
  },
  {
    id: 'prod-react-nextjs',
    title: 'React 19 & Next.js 15 Fullstack Bootcamp',
    subtitle: 'Server Components, Server Actions & Modern UI',
    description: 'Learn modern React 19 architecture with Next.js 15 App Router, React Server Components, TailwindCSS, Zustand state management, and full-stack PostgreSQL integrations.',
    category: 'Courses',
    subcategory: 'Web Development',
    price: 599,
    originalPrice: 2199,
    discountPercent: 73,
    rating: 4.9,
    reviewsCount: 4120,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&auto=format&fit=crop&q=80',
    icon: '⚛️',
    badge: 'Hot Deal',
    inStock: true,
    features: [
      'Next.js 15 App Router & Server Actions',
      'Authentication with NextAuth & Clerk',
      'PostgreSQL, Prisma ORM & Supabase',
      'Deploying high-speed production applications'
    ],
    specs: {
      Format: 'Online Video Course',
      Duration: '48 Hours',
      Level: 'Intermediate',
      Language: 'English',
      Instructor: 'Sarah Chen (Meta UI Architect)'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'STUDENT50', 'NOVABUY']
  },
  {
    id: 'prod-fullstack-bundle',
    title: 'Complete Full-Stack Cloud & DevOps Bundle',
    subtitle: 'Node.js, Docker, Kubernetes, AWS & CI/CD',
    description: 'Become a high-earning Full Stack & Cloud Engineer. Master containerization with Docker, orchestration with Kubernetes, infrastructure on AWS, and automated CI/CD pipelines.',
    category: 'Courses',
    subcategory: 'DevOps & Cloud',
    price: 1299,
    originalPrice: 4999,
    discountPercent: 74,
    rating: 4.9,
    reviewsCount: 5600,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    icon: '☁️',
    badge: 'All-in-One Pack',
    inStock: true,
    features: [
      'AWS Solutions Architect practical labs',
      'Docker containerization & K8s deployment',
      'Terraform Infrastructure as Code (IaC)',
      'GitHub Actions automated deployment pipelines'
    ],
    specs: {
      Format: 'Bundle Course Pack',
      Duration: '80 Hours',
      Level: 'Beginner to Advanced',
      Language: 'English',
      Instructor: 'David Kim & Cloud DevOps Team'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'STUDENT50', 'NOVABUY']
  },
  {
    id: 'prod-ai-agents-llm',
    title: 'Building Autonomous AI Agents with Gemini & LangChain',
    subtitle: 'Function Calling, Multi-Agent Systems & Tool Use',
    description: 'Learn to design and deploy production-ready AI agents using Google Gemini API, LangChain, LangGraph, tool calling, memory stores, and autonomous decision loops.',
    category: 'Courses',
    subcategory: 'AI & Data Science',
    price: 849,
    originalPrice: 3299,
    discountPercent: 74,
    rating: 4.95,
    reviewsCount: 1980,
    image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=400&auto=format&fit=crop&q=80',
    icon: '🤖',
    badge: 'Trending',
    inStock: true,
    features: [
      'Gemini 2.0 & 1.5 Flash/Pro Function Calling',
      'Building multi-agent autonomous teams',
      'Vector databases (Pinecone, ChromaDB, pgvector)',
      'Deploying AI agent backends to production'
    ],
    specs: {
      Format: 'Online Workshop & Course',
      Duration: '36 Hours',
      Level: 'Intermediate',
      Language: 'English',
      Instructor: 'Dr. Rajesh Verma (DeepMind Alum)'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'STUDENT50', 'NOVABUY']
  },

  // ================= HARDWARE & DEVELOPER GEAR =================
  {
    id: 'prod-mech-keyboard',
    title: 'NovaKey Pro Wireless Mechanical Keyboard',
    subtitle: '75% Layout, Hot-Swappable Gateron Yellow Switches',
    description: 'Premium custom mechanical keyboard engineered for programmers and writers. Features factory-lubed switches, sound-dampening silicone pads, RGB backlighting, and Bluetooth 5.2/2.4G.',
    category: 'Hardware',
    subcategory: 'Peripherals',
    price: 4499,
    originalPrice: 7999,
    discountPercent: 44,
    rating: 4.8,
    reviewsCount: 1250,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80',
    icon: '⌨️',
    badge: 'Popular Gear',
    inStock: true,
    features: [
      'Hot-swappable PCB supporting 3-pin and 5-pin switches',
      'Tri-mode connectivity (Type-C, 2.4GHz, Bluetooth)',
      '4000mAh long-lasting rechargeable battery',
      'Mac and Windows dual layout compatibility'
    ],
    specs: {
      Layout: '75% (84 Keys)',
      Switches: 'Gateron G Pro Yellow (Linear)',
      Keycaps: 'Double-shot PBT Cherry Profile',
      Connectivity: 'Bluetooth 5.2 / 2.4G Wireless / USB-C',
      Weight: '880g'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'NOVABUY']
  },
  {
    id: 'prod-anc-headphones',
    title: 'AeroSound Pro Hybrid ANC Headphones',
    subtitle: '45dB Active Noise Cancellation & 60h Battery Life',
    description: 'Immerse in deep focus with industry-leading hybrid active noise cancellation. Features 40mm titanium drivers, ultra-soft memory foam earcups, multi-point pairing, and Hi-Res wireless audio.',
    category: 'Hardware',
    subcategory: 'Audio',
    price: 4999,
    originalPrice: 9999,
    discountPercent: 50,
    rating: 4.7,
    reviewsCount: 3100,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
    icon: '🎧',
    badge: '50% OFF',
    inStock: true,
    features: [
      'Hybrid ANC with Transparency Ambient Mode',
      '60-hour playtime on single charge (45h with ANC)',
      'Quad-microphone array for studio-clear calls',
      'Foldable design with protective hardshell case'
    ],
    specs: {
      Drivers: '40mm Titanium Dynamic',
      ANC: 'Up to -45dB Hybrid',
      Battery: '60 Hours (Fast Charge: 10m = 5h)',
      Bluetooth: '5.3 with LDAC, AAC, SBC',
      Weight: '245g'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'NOVABUY']
  },
  {
    id: 'prod-4k-webcam',
    title: 'StreamVision 4K Ultra-HD Webcam',
    subtitle: 'AI Auto-Framing, HDR & Dual Stereo Microphones',
    description: 'Crystal-clear 4K video conferencing and streaming camera with Sony STARVIS sensor, intelligent autofocus, magnetic privacy shutter, and plug-and-play USB-C connectivity.',
    category: 'Hardware',
    subcategory: 'Streaming & Video',
    price: 3299,
    originalPrice: 5999,
    discountPercent: 45,
    rating: 4.6,
    reviewsCount: 890,
    image: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=400&auto=format&fit=crop&q=80',
    icon: '📹',
    badge: 'Pro Stream',
    inStock: true,
    features: [
      '4K 30FPS / 1080P 60FPS high dynamic range',
      'AI-powered face tracking & auto-exposure',
      'Dual noise-cancelling omnidirectional mics',
      'Adjustable 90° wide field of view'
    ],
    specs: {
      Sensor: 'Sony STARVIS 8MP',
      Resolution: '3840x2160 @ 30fps',
      FieldOfView: '65° / 78° / 90°',
      Interface: 'USB-C 3.0 (Detachable Cable)',
      Mount: 'Tripod mount & Monitor clip'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'NOVABUY']
  },
  {
    id: 'prod-ergo-mouse',
    title: 'ErgoGlide Vertical Ergonomic Wireless Mouse',
    subtitle: 'Natural 57° Handshake Grip & Silent Click Switches',
    description: 'Reduce forearm strain and wrist fatigue during long coding hours with our 57-degree natural vertical handshake grip mouse. Features adjustable 4000 DPI sensor and thumb scroll wheel.',
    category: 'Hardware',
    subcategory: 'Peripherals',
    price: 1899,
    originalPrice: 3499,
    discountPercent: 46,
    rating: 4.8,
    reviewsCount: 1450,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80',
    icon: '🖱️',
    badge: 'Ergonomic',
    inStock: true,
    features: [
      '57° ergonomic handshake posture reduces wrist pressure',
      'Silent Kailh switches with 10M click durability',
      'Customizable thumb buttons & DPI switcher (800-4000)',
      'Rechargeable Type-C battery lasts up to 90 days'
    ],
    specs: {
      Sensor: 'Optical 4000 DPI',
      Angle: '57° Natural Handshake',
      Connectivity: '2.4G USB Receiver + Bluetooth 5.0',
      Battery: '500mAh Li-Po (90 days per charge)',
      Weight: '115g'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'STUDENT50', 'NOVABUY']
  },

  // ================= BOOKS & CHEATSHEETS =================
  {
    id: 'prod-system-design-book',
    title: 'System Design Interview & Architecture Playbook',
    subtitle: 'Hardcover & Interactive Digital Edition (2026)',
    description: 'Master large-scale distributed system architectures. Includes 35 real-world case studies (Netflix streaming, WhatsApp chat, Uber dispatch, Stripe payments) and visual flowcharts.',
    category: 'Books',
    subcategory: 'Software Engineering',
    price: 899,
    originalPrice: 1999,
    discountPercent: 55,
    rating: 4.95,
    reviewsCount: 5200,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
    icon: '📚',
    badge: 'Must Read',
    inStock: true,
    features: [
      '350+ full-color architectural diagrams',
      'Step-by-step 4-step framework for system design interviews',
      'Database sharding, caching, message queues, rate limiters',
      'Includes DRM-free PDF, ePub, and interactive web companion'
    ],
    specs: {
      Pages: '460 Pages',
      Format: 'Hardcover + Digital Companion',
      Edition: '3rd Edition (2026)',
      Author: 'Alex Xu & Engineering Team'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'STUDENT50', 'NOVABUY']
  },
  {
    id: 'prod-clean-code-refactor',
    title: 'Modern Clean Code & Refactoring Guide',
    subtitle: 'Design Patterns & Clean Architecture for TypeScript/Python',
    description: 'Write robust, self-documenting, and bug-free code. Packed with before-and-after refactoring examples, SOLID principles in practice, unit testing paradigms, and legacy code rescue.',
    category: 'Books',
    subcategory: 'Software Engineering',
    price: 649,
    originalPrice: 1499,
    discountPercent: 57,
    rating: 4.85,
    reviewsCount: 2310,
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e37264?w=400&auto=format&fit=crop&q=80',
    icon: '📖',
    badge: 'Essential',
    inStock: true,
    features: [
      'Comprehensive refactoring recipes with real codebases',
      'Design patterns simplified (Factory, Strategy, Observer, Decorator)',
      'Test-Driven Development (TDD) best practices',
      'Code review checklist for engineering teams'
    ],
    specs: {
      Pages: '380 Pages',
      Format: 'Paperback + eBook',
      Language: 'English',
      Author: 'Martin Fowler & Robert Martin'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'STUDENT50', 'NOVABUY']
  },

  // ================= SUBSCRIPTIONS & CLOUD SERVICES =================
  {
    id: 'prod-ai-cloud-sub',
    title: 'NovaCloud Developer Pro - 1 Year Pass',
    subtitle: 'Unlimited GPU Compute, Cloud Database & Staging Servers',
    description: 'All-in-one developer cloud sandbox with 200 compute hours, managed PostgreSQL & Redis, automated preview environments, custom domains, and SSL certificates.',
    category: 'Subscriptions',
    subcategory: 'Cloud Services',
    price: 1999,
    originalPrice: 4999,
    discountPercent: 60,
    rating: 4.9,
    reviewsCount: 1670,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80',
    icon: '🚀',
    badge: 'Pro Tier',
    inStock: true,
    features: [
      '200 Monthly GPU/CPU Compute Hours (NVIDIA T4/A10G)',
      '10x Managed PostgreSQL & Redis instances',
      'Unlimited preview deployment URLs for team pull requests',
      'Priority 24/7 technical support & Discord VIP role'
    ],
    specs: {
      Duration: '12 Months Access',
      Storage: '100 GB NVMe Cloud Storage',
      Bandwidth: '2 TB High-Speed Egress',
      TeamSeats: 'Up to 3 Developers'
    },
    applicableCoupons: ['SAVE10', 'SAVE20', 'NOVABUY']
  }
];

const coupons = [
  { code: 'SAVE10', discountPercent: 10, minSpend: 0, description: '10% off any order' },
  { code: 'SAVE20', discountPercent: 20, minSpend: 1000, description: '20% off orders above ₹1,000' },
  { code: 'NOVABUY', discountPercent: 25, minSpend: 1500, description: '25% AI Agent Special on orders above ₹1,500' },
  { code: 'STUDENT50', discountPercent: 50, minSpend: 500, description: '50% off on all educational courses & books' }
];

module.exports = {
  products,
  coupons
};
