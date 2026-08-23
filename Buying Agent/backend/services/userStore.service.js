const fs = require('fs');
const path = require('path');

const os = require('os');
const MEMORY_FILE = path.join(os.tmpdir(), 'razorpay_agent_user_memory.json');

// Default initial users database
const initialUsers = {
  'nawaz@gmail.com': {
    name: 'Nawaz Khan',
    email: 'nawaz@gmail.com',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    addresses: [
      {
        id: 'addr_home',
        label: 'Home',
        recipientName: 'Nawaz Khan',
        street: 'Flat 402, Sunshine Heights, 12th Main',
        area: 'Koramangala 4th Block',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560034',
        isDefault: true
      },
      {
        id: 'addr_office',
        label: 'Office / Work',
        recipientName: 'Nawaz Khan',
        street: 'WeWork Galaxy, 43 Residency Road',
        area: 'Shanthala Nagar, Ashok Nagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560025',
        isDefault: false
      }
    ],
    paymentMethods: [
      {
        id: 'pm_visa_1007',
        type: 'card',
        method: 'card',
        brand: 'Visa (Domestic)',
        last4: '1007',
        cardNumber: '4100 2800 0000 1007',
        expiry: '12/28',
        holder: 'Nawaz Khan',
        autoDebitLimit: 15000,
        isDefault: true,
        label: 'Visa Debit (•••• 1007)'
      },
      {
        id: 'pm_icici_4022',
        type: 'card',
        method: 'card',
        brand: 'Amazon Pay ICICI Card',
        last4: '4022',
        cardNumber: '4315 2800 0000 4022',
        expiry: '08/29',
        holder: 'Nawaz Khan',
        autoDebitLimit: 25000,
        isDefault: false,
        label: 'Amazon Pay ICICI (•••• 4022)'
      },
      {
        id: 'pm_hdfc_3003',
        type: 'card',
        method: 'card',
        brand: 'HDFC Millennia Card',
        last4: '3003',
        cardNumber: '4100 2800 0000 3003',
        expiry: '05/30',
        holder: 'Nawaz Khan',
        autoDebitLimit: 20000,
        isDefault: false,
        label: 'HDFC Millennia (•••• 3003)'
      },
      {
        id: 'pm_rupay_1005',
        type: 'card',
        method: 'card',
        brand: 'RuPay Domestic Debit',
        last4: '1005',
        cardNumber: '6527 6589 0000 1005',
        expiry: '11/27',
        holder: 'Nawaz Khan',
        autoDebitLimit: 15000,
        isDefault: false,
        label: 'RuPay Debit (•••• 1005)'
      },
      {
        id: 'pm_bob_nb',
        type: 'netbanking',
        method: 'netbanking',
        bank: 'BARB_R',
        bankName: 'Bank of Baroda',
        holder: 'Nawaz Khan',
        autoDebitLimit: 50000,
        isDefault: false,
        label: 'Bank of Baroda (BOB) NetBanking'
      },
      {
        id: 'pm_hdfc_nb',
        type: 'netbanking',
        method: 'netbanking',
        bank: 'HDFC',
        bankName: 'HDFC Bank',
        holder: 'Nawaz Khan',
        autoDebitLimit: 50000,
        isDefault: false,
        label: 'HDFC Bank NetBanking'
      },
      {
        id: 'pm_sbi_nb',
        type: 'netbanking',
        method: 'netbanking',
        bank: 'SBIN',
        bankName: 'State Bank of India',
        holder: 'Nawaz Khan',
        autoDebitLimit: 50000,
        isDefault: false,
        label: 'SBI NetBanking'
      },
      {
        id: 'pm_icici_nb',
        type: 'netbanking',
        method: 'netbanking',
        bank: 'ICIC',
        bankName: 'ICICI Bank',
        holder: 'Nawaz Khan',
        autoDebitLimit: 50000,
        isDefault: false,
        label: 'ICICI Bank NetBanking'
      },
      {
        id: 'pm_upi_gpay',
        type: 'upi',
        method: 'upi',
        vpa: 'nawaz@okhdfcbank',
        holder: 'Nawaz Khan',
        autoDebitLimit: 25000,
        isDefault: false,
        label: 'Google Pay UPI (nawaz@okhdfcbank)'
      },
      {
        id: 'pm_upi_phonepe',
        type: 'upi',
        method: 'upi',
        vpa: 'nawaz@ybl',
        holder: 'Nawaz Khan',
        autoDebitLimit: 25000,
        isDefault: false,
        label: 'PhonePe UPI (nawaz@ybl)'
      },
      {
        id: 'pm_upi_paytm',
        type: 'upi',
        method: 'upi',
        vpa: 'nawaz@paytm',
        holder: 'Nawaz Khan',
        autoDebitLimit: 25000,
        isDefault: false,
        label: 'Paytm UPI (nawaz@paytm)'
      }
    ],
    orders: []
  },
  'student@example.com': {
    name: 'Student Buyer',
    email: 'student@example.com',
    phone: '+91 91234 56789',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
    addresses: [
      {
        id: 'addr_hostel',
        label: 'Campus / Hostel',
        recipientName: 'Student Buyer',
        street: 'Room 304, Block B, Tech University Hostel',
        area: 'Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066',
        isDefault: true
      }
    ],
    paymentMethods: [
      {
        id: 'pm_visa_1007',
        type: 'card',
        brand: 'Visa (Domestic)',
        last4: '1007',
        cardNumber: '4100 2800 0000 1007',
        expiry: '12/28',
        holder: 'Student Buyer',
        autoDebitLimit: 15000,
        isDefault: true,
        label: 'Visa (Domestic) (•••• 1007)'
      }
    ],
    orders: []
  }
};

class UserStoreService {
  constructor() {
    this.users = { ...initialUsers };
    this.loadMemory();
  }

  loadMemory() {
    try {
      if (fs.existsSync(MEMORY_FILE)) {
        const data = fs.readFileSync(MEMORY_FILE, 'utf8');
        const parsed = JSON.parse(data);
        for (const [em, u] of Object.entries(parsed)) {
          if (this.users[em]) {
            const initialPms = initialUsers[em]?.paymentMethods || initialUsers['nawaz@gmail.com'].paymentMethods;
            const savedPms = u.paymentMethods || [];
            const mergedPms = [...initialPms];
            savedPms.forEach(spm => {
              const idx = mergedPms.findIndex(p => p.id === spm.id);
              if (idx >= 0) mergedPms[idx] = { ...mergedPms[idx], ...spm };
              else mergedPms.push(spm);
            });
            this.users[em] = { ...this.users[em], ...u, paymentMethods: mergedPms };
          } else {
            this.users[em] = u;
          }
        }
      } else {
        this.saveMemory();
      }
    } catch (err) {
      console.warn('Error reading user memory file, using defaults:', err.message);
    }
  }

  saveMemory() {
    try {
      const dir = path.dirname(MEMORY_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.users, null, 2), 'utf8');
    } catch (err) {
      console.warn('Error saving user memory file:', err.message);
    }
  }

  // Get or create user profile by email/Gmail
  getUser(email) {
    const cleanEmail = (email || 'nawaz@gmail.com').toLowerCase().trim();
    if (!this.users[cleanEmail]) {
      // Auto-register new user
      const namePart = cleanEmail.split('@')[0];
      const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      this.users[cleanEmail] = {
        name: formattedName,
        email: cleanEmail,
        phone: '+91 98000 12345',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        addresses: [
          {
            id: `addr_${Date.now()}`,
            label: 'Home',
            recipientName: formattedName,
            street: '123 Innovation Way, Tech Park',
            area: 'Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560038',
            isDefault: true
          }
        ],
        paymentMethods: [
          {
            id: 'pm_default_visa',
            type: 'card',
            brand: 'Visa (Domestic)',
            last4: '1007',
            cardNumber: '4100 2800 0000 1007',
            expiry: '12/28',
            holder: formattedName,
            autoDebitLimit: 15000,
            isDefault: true,
            label: 'Visa (Domestic) (•••• 1007)'
          }
        ],
        orders: []
      };
      this.saveMemory();
    }
    return this.users[cleanEmail];
  }

  // Set / update default delivery address
  setDefaultAddress(email, addressId) {
    const user = this.getUser(email);
    user.addresses.forEach(a => {
      a.isDefault = (a.id === addressId);
    });
    this.saveMemory();
    return user.addresses;
  }

  // Add new delivery address
  addAddress(email, addressData) {
    const user = this.getUser(email);
    const newAddr = {
      id: `addr_${Date.now()}`,
      label: addressData.label || 'Home',
      recipientName: addressData.recipientName || user.name,
      street: addressData.street || '',
      area: addressData.area || '',
      city: addressData.city || 'Bengaluru',
      state: addressData.state || 'Karnataka',
      pincode: addressData.pincode || '560034',
      isDefault: Boolean(addressData.isDefault || user.addresses.length === 0)
    };
    if (newAddr.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }
    user.addresses.push(newAddr);
    this.saveMemory();
    return newAddr;
  }

  // Get active delivery address (with prompt override, e.g. "deliver to office")
  getActiveAddress(email, message = '') {
    const user = this.getUser(email);
    const text = (message || '').toLowerCase();
    
    if (text.includes('office') || text.includes('work')) {
      const officeAddr = user.addresses.find(a => a.label.toLowerCase().includes('office') || a.label.toLowerCase().includes('work'));
      if (officeAddr) return officeAddr;
    }

    if (text.includes('home')) {
      const homeAddr = user.addresses.find(a => a.label.toLowerCase().includes('home'));
      if (homeAddr) return homeAddr;
    }

    const defaultAddr = user.addresses.find(a => a.isDefault) || user.addresses[0];
    return defaultAddr;
  }

  // Get default payment method
  getDefaultPaymentMethod(email) {
    const user = this.getUser(email);
    return user.paymentMethods.find(pm => pm.isDefault) || user.paymentMethods[0];
  }

  // Set default payment method
  setDefaultPaymentMethod(email, methodId) {
    const user = this.getUser(email);
    user.paymentMethods.forEach(pm => {
      pm.isDefault = (pm.id === methodId);
    });
    this.saveMemory();
    return this.getDefaultPaymentMethod(email);
  }

  // Update payment method spending limits or details
  updatePaymentMethod(email, methodId, updateData) {
    const user = this.getUser(email);
    const target = user.paymentMethods.find(pm => pm.id === methodId) || user.paymentMethods[0];
    if (target) {
      if (updateData.autoDebitLimit) target.autoDebitLimit = Number(updateData.autoDebitLimit);
      if (updateData.holder) target.holder = updateData.holder;
      if (updateData.isDefault) {
        user.paymentMethods.forEach(pm => { pm.isDefault = (pm.id === target.id); });
      }
      this.saveMemory();
    }
    return target;
  }

  // Save new order to user's order memory
  saveOrder(email, orderRecord) {
    const user = this.getUser(email);
    const orderEntry = {
      id: orderRecord.orderId || `ORD-${Date.now()}`,
      orderId: orderRecord.orderId,
      razorpayOrderId: orderRecord.razorpayOrderId,
      razorpayPaymentId: orderRecord.paymentId || orderRecord.razorpayPaymentId,
      amount: orderRecord.amount,
      quantity: orderRecord.quantity || 1,
      items: orderRecord.items || [{ title: orderRecord.productTitle || 'Product', quantity: 1, unitPrice: orderRecord.amount, lineTotal: orderRecord.amount }],
      productTitle: orderRecord.productTitle || 'Product',
      merchant: orderRecord.merchant || 'Store',
      deliveryAddress: orderRecord.deliveryAddress || this.getActiveAddress(email),
      paymentMethod: orderRecord.paymentMethod || this.getDefaultPaymentMethod(email),
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: new Date().toISOString()
    };

    user.orders.unshift(orderEntry);
    this.saveMemory();
    return orderEntry;
  }

  // Memory Recall: Get last placed order
  getLastOrder(email) {
    const user = this.getUser(email);
    return user.orders && user.orders.length > 0 ? user.orders[0] : null;
  }

  // Memory Recall: Get full order history
  getOrderHistory(email) {
    const user = this.getUser(email);
    return user.orders || [];
  }

  // Memory Recall: Calculate total spend
  getSpendingStats(email) {
    const orders = this.getOrderHistory(email);
    const totalSpent = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    return {
      orderCount: orders.length,
      totalSpent,
      lastOrderDate: orders[0]?.createdAt || null
    };
  }
}

module.exports = new UserStoreService();
