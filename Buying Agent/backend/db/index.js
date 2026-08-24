const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]:', err.message);
});

/**
 * Initialize PostgreSQL Schema & Seed Default User Data
 */
async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('[PostgreSQL] Connecting and initializing schema...');

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        phone VARCHAR(50),
        spending_limit_total NUMERIC(12, 2) DEFAULT 50000.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. User Addresses Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_addresses (
        id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        label VARCHAR(100) DEFAULT 'Home',
        recipient_name VARCHAR(255),
        street TEXT,
        area VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Payment Methods Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- 'card' | 'netbanking' | 'upi'
        method VARCHAR(50) NOT NULL,
        brand VARCHAR(100),
        last4 VARCHAR(10),
        card_number VARCHAR(100),
        expiry VARCHAR(20),
        holder VARCHAR(255),
        bank VARCHAR(50),
        bank_name VARCHAR(100),
        vpa VARCHAR(255),
        label VARCHAR(255),
        category VARCHAR(100),
        auto_debit_limit NUMERIC(12, 2) DEFAULT 15000.00,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Orders Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(100) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255) NOT NULL,
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        product_title TEXT NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        quantity INTEGER DEFAULT 1,
        items JSONB DEFAULT '[]'::jsonb,
        payment_method JSONB DEFAULT '{}'::jsonb,
        delivery_address JSONB DEFAULT '{}'::jsonb,
        merchant_url TEXT,
        status VARCHAR(50) DEFAULT 'created',
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Audit Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        action_type VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default user if not present
    const defaultEmail = 'nawaz@gmail.com';
    const userRes = await client.query('SELECT * FROM users WHERE email = $1', [defaultEmail]);

    let userId;
    if (userRes.rows.length === 0) {
      const defaultPasswordHash = await bcrypt.hash('password123', 10);
      const insertedUser = await client.query(
        `INSERT INTO users (name, email, password_hash, phone, spending_limit_total)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['Nawaz Khan', defaultEmail, defaultPasswordHash, '+91 9876543210', 50000.00]
      );
      userId = insertedUser.rows[0].id;
      console.log(`[PostgreSQL] Seeded default user ${defaultEmail} (ID: ${userId})`);

      // Seed Default Address
      await client.query(`
        INSERT INTO user_addresses (id, user_id, label, recipient_name, street, area, city, state, pincode, is_default)
        VALUES 
          ('addr_home', $1, 'Home', 'Nawaz Khan', 'Flat 402, Sunshine Heights, 12th Main', 'Koramangala 4th Block', 'Bengaluru', 'Karnataka', '560034', TRUE),
          ('addr_office', $1, 'Office', 'Nawaz Khan', 'Tech Park Tower B, 5th Floor, Outer Ring Rd', 'Bellandur', 'Bengaluru', 'Karnataka', '560103', FALSE)
        ON CONFLICT (id) DO NOTHING;
      `, [userId]);

      // Seed Default Payment Methods
      const seedPaymentMethods = [
        {
          id: 'pm_visa_1007',
          type: 'card',
          method: 'card',
          brand: 'Visa (Domestic)',
          last4: '1007',
          card_number: '4100 2800 0000 1007',
          expiry: '12/28',
          holder: 'Nawaz Khan',
          bank: null,
          bank_name: null,
          vpa: null,
          label: 'Visa Debit (•••• 1007)',
          category: 'Cards',
          auto_debit_limit: 15000.00,
          is_default: true
        },
        {
          id: 'pm_icici_4022',
          type: 'card',
          method: 'card',
          brand: 'Amazon Pay ICICI Card',
          last4: '4022',
          card_number: '4315 2800 0000 4022',
          expiry: '08/29',
          holder: 'Nawaz Khan',
          bank: null,
          bank_name: null,
          vpa: null,
          label: 'Amazon Pay ICICI (•••• 4022)',
          category: 'Cards',
          auto_debit_limit: 25000.00,
          is_default: false
        },
        {
          id: 'pm_hdfc_3003',
          type: 'card',
          method: 'card',
          brand: 'HDFC Millennia Card',
          last4: '3003',
          card_number: '4100 2800 0000 3003',
          expiry: '05/30',
          holder: 'Nawaz Khan',
          bank: null,
          bank_name: null,
          vpa: null,
          label: 'HDFC Millennia (•••• 3003)',
          category: 'Cards',
          auto_debit_limit: 20000.00,
          is_default: false
        },
        {
          id: 'pm_rupay_1005',
          type: 'card',
          method: 'card',
          brand: 'RuPay Domestic Debit',
          last4: '1005',
          card_number: '6527 6589 0000 1005',
          expiry: '11/27',
          holder: 'Nawaz Khan',
          bank: null,
          bank_name: null,
          vpa: null,
          label: 'RuPay Debit (•••• 1005)',
          category: 'Cards',
          auto_debit_limit: 10000.00,
          is_default: false
        },
        {
          id: 'nb_bob',
          type: 'netbanking',
          method: 'netbanking',
          brand: 'Bank of Baroda',
          last4: null,
          card_number: null,
          expiry: null,
          holder: 'Nawaz Khan',
          bank: 'BARB_R',
          bank_name: 'Bank of Baroda NetBanking',
          vpa: null,
          label: 'Bank of Baroda NetBanking',
          category: 'NetBanking',
          auto_debit_limit: 50000.00,
          is_default: false
        },
        {
          id: 'nb_sbi',
          type: 'netbanking',
          method: 'netbanking',
          brand: 'State Bank of India',
          last4: null,
          card_number: null,
          expiry: null,
          holder: 'Nawaz Khan',
          bank: 'SBIN',
          bank_name: 'State Bank of India',
          vpa: null,
          label: 'SBI NetBanking',
          category: 'NetBanking',
          auto_debit_limit: 50000.00,
          is_default: false
        },
        {
          id: 'nb_hdfc',
          type: 'netbanking',
          method: 'netbanking',
          brand: 'HDFC Bank',
          last4: null,
          card_number: null,
          expiry: null,
          holder: 'Nawaz Khan',
          bank: 'HDFC',
          bank_name: 'HDFC Bank',
          vpa: null,
          label: 'HDFC Bank NetBanking',
          category: 'NetBanking',
          auto_debit_limit: 50000.00,
          is_default: false
        },
        {
          id: 'nb_icici',
          type: 'netbanking',
          method: 'netbanking',
          brand: 'ICICI Bank',
          last4: null,
          card_number: null,
          expiry: null,
          holder: 'Nawaz Khan',
          bank: 'ICIC',
          bank_name: 'ICICI Bank',
          vpa: null,
          label: 'ICICI Bank NetBanking',
          category: 'NetBanking',
          auto_debit_limit: 50000.00,
          is_default: false
        },
        {
          id: 'upi_gpay_instant',
          type: 'upi',
          method: 'upi',
          brand: 'Google Pay',
          last4: null,
          card_number: null,
          expiry: null,
          holder: 'Nawaz Khan',
          bank: null,
          bank_name: null,
          vpa: 'nawaz@okaxis',
          label: 'Google Pay (nawaz@okaxis)',
          category: 'UPI',
          auto_debit_limit: 20000.00,
          is_default: false
        },
        {
          id: 'upi_phonepe_instant',
          type: 'upi',
          method: 'upi',
          brand: 'PhonePe',
          last4: null,
          card_number: null,
          expiry: null,
          holder: 'Nawaz Khan',
          bank: null,
          bank_name: null,
          vpa: 'nawaz@ybl',
          label: 'PhonePe (nawaz@ybl)',
          category: 'UPI',
          auto_debit_limit: 20000.00,
          is_default: false
        }
      ];

      for (const pm of seedPaymentMethods) {
        await client.query(`
          INSERT INTO payment_methods (
            id, user_id, type, method, brand, last4, card_number, expiry,
            holder, bank, bank_name, vpa, label, category, auto_debit_limit, is_default
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO NOTHING;
        `, [
          pm.id, userId, pm.type, pm.method, pm.brand, pm.last4, pm.card_number, pm.expiry,
          pm.holder, pm.bank, pm.bank_name, pm.vpa, pm.label, pm.category, pm.auto_debit_limit, pm.is_default
        ]);
      }
      console.log('[PostgreSQL] Seeded payment methods and addresses for default user.');
    } else {
      userId = userRes.rows[0].id;
    }

    console.log('[PostgreSQL] Database initialized successfully.');
  } catch (err) {
    console.error('[PostgreSQL Initialization Error]:', err.message);
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  initDatabase
};
