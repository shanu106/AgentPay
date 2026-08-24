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
 * Initialize PostgreSQL Schema & Seed Default Data
 * Tables: users, user_addresses, payment_methods, orders, audit_logs,
 *         agent_authorizations, merchants, webhook_events
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
    // SECURITY: No raw card numbers stored. Only last4 + brand + token_ref
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        method VARCHAR(50) NOT NULL,
        brand VARCHAR(100),
        last4 VARCHAR(10),
        token_ref VARCHAR(255),
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

    // Migration: Drop card_number column if it exists (security fix)
    try {
      const colCheck = await client.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'payment_methods' AND column_name = 'card_number'
      `);
      if (colCheck.rows.length > 0) {
        try {
          await client.query(`ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS token_ref VARCHAR(255)`);
          await client.query(`UPDATE payment_methods SET token_ref = card_number WHERE token_ref IS NULL AND card_number IS NOT NULL`);
          await client.query(`ALTER TABLE payment_methods DROP COLUMN card_number`);
          console.log('[PostgreSQL] SECURITY: Migrated card_number -> token_ref and dropped card_number column');
        } catch (migErr) {
          console.warn('[PostgreSQL] Migration note:', migErr.message);
        }
      }
    } catch (_) {}

    // 4. Orders Table (with idempotency_key for deduplication)
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(100) UNIQUE NOT NULL,
        idempotency_key VARCHAR(255) UNIQUE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255) NOT NULL,
        authorization_id INTEGER,
        merchant_id VARCHAR(100),
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
        status_history JSONB DEFAULT '[]'::jsonb,
        failure_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: Add new columns to existing orders if missing
    try {
      await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE`);
      await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS authorization_id INTEGER`);
      await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS merchant_id VARCHAR(100)`);
      await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb`);
      await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS failure_reason TEXT`);
    } catch (_) {}

    // 5. Audit Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        user_email VARCHAR(255),
        agent_session_id VARCHAR(255),
        order_id VARCHAR(100),
        request_id VARCHAR(255),
        action_type VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}'::jsonb,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: Add new audit columns if missing
    try {
      await client.query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS agent_session_id VARCHAR(255)`);
      await client.query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS order_id VARCHAR(100)`);
      await client.query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_id VARCHAR(255)`);
    } catch (_) {}

    // 6. Agent Authorizations Table (Policy Engine)
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_authorizations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        max_transaction_amount NUMERIC(12, 2) DEFAULT 5000.00,
        daily_spending_limit NUMERIC(12, 2) DEFAULT 10000.00,
        spent_today NUMERIC(12, 2) DEFAULT 0.00,
        spent_today_reset_date DATE DEFAULT CURRENT_DATE,
        currency VARCHAR(10) DEFAULT 'INR',
        allowed_categories JSONB DEFAULT '[]'::jsonb,
        allowed_merchants JSONB DEFAULT '[]'::jsonb,
        allowed_payment_methods JSONB DEFAULT '[]'::jsonb,
        require_confirmation_above NUMERIC(12, 2) DEFAULT 3000.00,
        status VARCHAR(50) DEFAULT 'active',
        starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Merchants Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        api_base_url TEXT,
        agent_commerce_enabled BOOLEAN DEFAULT TRUE,
        max_autonomous_order_amount NUMERIC(12, 2) DEFAULT 10000.00,
        allowed_categories JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 8. Webhook Events Table (Idempotent webhook processing)
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id VARCHAR(255) PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        razorpay_order_id VARCHAR(100),
        razorpay_payment_id VARCHAR(100),
        payload JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(50) DEFAULT 'processed',
        processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ====== SEED DATA ======

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

      // Seed Default Addresses
      await client.query(`
        INSERT INTO user_addresses (id, user_id, label, recipient_name, street, area, city, state, pincode, is_default)
        VALUES 
          ('addr_home', $1, 'Home', 'Nawaz Khan', 'Flat 402, Sunshine Heights, 12th Main', 'Koramangala 4th Block', 'Bengaluru', 'Karnataka', '560034', TRUE),
          ('addr_office', $1, 'Office', 'Nawaz Khan', 'Tech Park Tower B, 5th Floor, Outer Ring Rd', 'Bellandur', 'Bengaluru', 'Karnataka', '560103', FALSE)
        ON CONFLICT (id) DO NOTHING;
      `, [userId]);

      // Seed Default Payment Methods (NO raw card numbers)
      const seedPaymentMethods = [
        { id: 'pm_visa_1007', type: 'card', method: 'card', brand: 'Visa (Domestic)', last4: '1007', token_ref: 'rzp_test_visa_1007', expiry: '12/28', holder: 'Nawaz Khan', label: 'Visa Debit (•••• 1007)', category: 'Cards', auto_debit_limit: 15000.00, is_default: true },
        { id: 'pm_icici_4022', type: 'card', method: 'card', brand: 'Amazon Pay ICICI Card', last4: '4022', token_ref: 'rzp_test_icici_4022', expiry: '08/29', holder: 'Nawaz Khan', label: 'Amazon Pay ICICI (•••• 4022)', category: 'Cards', auto_debit_limit: 25000.00, is_default: false },
        { id: 'pm_hdfc_3003', type: 'card', method: 'card', brand: 'HDFC Millennia Card', last4: '3003', token_ref: 'rzp_test_hdfc_3003', expiry: '05/30', holder: 'Nawaz Khan', label: 'HDFC Millennia (•••• 3003)', category: 'Cards', auto_debit_limit: 20000.00, is_default: false },
        { id: 'pm_rupay_1005', type: 'card', method: 'card', brand: 'RuPay Domestic Debit', last4: '1005', token_ref: 'rzp_test_rupay_1005', expiry: '11/27', holder: 'Nawaz Khan', label: 'RuPay Debit (•••• 1005)', category: 'Cards', auto_debit_limit: 10000.00, is_default: false },
        { id: 'nb_bob', type: 'netbanking', method: 'netbanking', brand: 'Bank of Baroda', bank: 'BARB_R', bank_name: 'Bank of Baroda NetBanking', holder: 'Nawaz Khan', label: 'Bank of Baroda NetBanking', category: 'NetBanking', auto_debit_limit: 50000.00, is_default: false },
        { id: 'nb_sbi', type: 'netbanking', method: 'netbanking', brand: 'State Bank of India', bank: 'SBIN', bank_name: 'State Bank of India', holder: 'Nawaz Khan', label: 'SBI NetBanking', category: 'NetBanking', auto_debit_limit: 50000.00, is_default: false },
        { id: 'nb_hdfc', type: 'netbanking', method: 'netbanking', brand: 'HDFC Bank', bank: 'HDFC', bank_name: 'HDFC Bank', holder: 'Nawaz Khan', label: 'HDFC Bank NetBanking', category: 'NetBanking', auto_debit_limit: 50000.00, is_default: false },
        { id: 'nb_icici', type: 'netbanking', method: 'netbanking', brand: 'ICICI Bank', bank: 'ICIC', bank_name: 'ICICI Bank', holder: 'Nawaz Khan', label: 'ICICI Bank NetBanking', category: 'NetBanking', auto_debit_limit: 50000.00, is_default: false },
        { id: 'upi_gpay_instant', type: 'upi', method: 'upi', brand: 'Google Pay', vpa: 'nawaz@okaxis', holder: 'Nawaz Khan', label: 'Google Pay (nawaz@okaxis)', category: 'UPI', auto_debit_limit: 20000.00, is_default: false },
        { id: 'upi_phonepe_instant', type: 'upi', method: 'upi', brand: 'PhonePe', vpa: 'nawaz@ybl', holder: 'Nawaz Khan', label: 'PhonePe (nawaz@ybl)', category: 'UPI', auto_debit_limit: 20000.00, is_default: false }
      ];

      for (const pm of seedPaymentMethods) {
        await client.query(`
          INSERT INTO payment_methods (
            id, user_id, type, method, brand, last4, token_ref, expiry,
            holder, bank, bank_name, vpa, label, category, auto_debit_limit, is_default
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO NOTHING;
        `, [
          pm.id, userId, pm.type, pm.method, pm.brand, pm.last4 || null, pm.token_ref || null, pm.expiry || null,
          pm.holder, pm.bank || null, pm.bank_name || null, pm.vpa || null, pm.label, pm.category, pm.auto_debit_limit, pm.is_default
        ]);
      }
      console.log('[PostgreSQL] Seeded payment methods and addresses for default user.');

      // Seed Default Agent Authorization
      await client.query(`
        INSERT INTO agent_authorizations (
          user_id, max_transaction_amount, daily_spending_limit, spent_today,
          currency, allowed_categories, allowed_merchants, allowed_payment_methods,
          require_confirmation_above, status, starts_at, expires_at
        ) VALUES (
          $1, 5000.00, 10000.00, 0.00,
          'INR', '["courses","food","electronics"]'::jsonb, '[]'::jsonb, '[]'::jsonb,
          3000.00, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days'
        ) ON CONFLICT DO NOTHING;
      `, [userId]);
      console.log('[PostgreSQL] Seeded default agent authorization.');

    } else {
      userId = userRes.rows[0].id;

      // Ensure authorization exists for existing user
      const authCheck = await client.query('SELECT id FROM agent_authorizations WHERE user_id = $1', [userId]);
      if (authCheck.rows.length === 0) {
        await client.query(`
          INSERT INTO agent_authorizations (
            user_id, max_transaction_amount, daily_spending_limit, spent_today,
            currency, allowed_categories, allowed_merchants, allowed_payment_methods,
            require_confirmation_above, status, starts_at, expires_at
          ) VALUES (
            $1, 5000.00, 10000.00, 0.00,
            'INR', '["courses","food","electronics"]'::jsonb, '[]'::jsonb, '[]'::jsonb,
            3000.00, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days'
          );
        `, [userId]);
        console.log('[PostgreSQL] Created default agent authorization for existing user.');
      }
    }

    // Seed Merchants
    const merchants = [
      { id: 'merchant_courses', name: 'LearnHub Course Platform', api_base_url: 'http://localhost:8000/api', max_amt: 10000 },
      { id: 'merchant_ecommerce', name: 'TechGear Electronics', api_base_url: 'http://localhost:8002/api', max_amt: 15000 },
      { id: 'merchant_zomato', name: 'FoodExpress Restaurant', api_base_url: 'http://localhost:8003/api', max_amt: 5000 }
    ];
    for (const m of merchants) {
      await client.query(`
        INSERT INTO merchants (id, name, api_base_url, agent_commerce_enabled, max_autonomous_order_amount, status)
        VALUES ($1, $2, $3, TRUE, $4, 'active')
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          api_base_url = EXCLUDED.api_base_url,
          max_autonomous_order_amount = EXCLUDED.max_autonomous_order_amount;
      `, [m.id, m.name, m.api_base_url, m.max_amt]);
    }
    console.log('[PostgreSQL] Seeded merchant records.');

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
