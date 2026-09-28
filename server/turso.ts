import { createClient } from '@libsql/client';
import type { Client } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

let clientInstance: Client | null = null;

export function getTursoClient(): Client {
  if (!clientInstance) {
    const rawUrl = process.env.TURSO_DATABASE_URL || 'libsql://mykasirdb-hauradigiss.aws-ap-northeast-1.turso.io';
    const rawToken = process.env.TURSO_AUTH_TOKEN || '';

    // Handle token format: strip accidental leading 'i' if user typed ieyJ...
    const cleanToken = rawToken.startsWith('ieyJ') ? rawToken.slice(1) : rawToken;

    clientInstance = createClient({
      url: rawUrl,
      authToken: cleanToken,
    });
  }
  return clientInstance;
}

export async function initTursoDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    const db = getTursoClient();

    // 1. Users table (Enterprise RBAC)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('super_admin', 'manager', 'cashier')),
        avatar TEXT,
        last_login TEXT
      );
    `);

    // 2. Products table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        cost_price REAL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock_alert INTEGER NOT NULL DEFAULT 10,
        icon TEXT DEFAULT 'inventory_2',
        description TEXT,
        created_at TEXT
      );
    `);

    // 3. Orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        receipt_number TEXT UNIQUE NOT NULL,
        items_json TEXT NOT NULL,
        subtotal REAL NOT NULL,
        discount REAL NOT NULL DEFAULT 0,
        tax REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        payment_method TEXT NOT NULL,
        amount_paid REAL NOT NULL,
        change_amount REAL NOT NULL DEFAULT 0,
        cashier_name TEXT NOT NULL,
        customer_name TEXT,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'completed'
      );
    `);

    // 4. Categories table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        name TEXT PRIMARY KEY
      );
    `);

    // 5. Store Settings table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id TEXT PRIMARY KEY,
        store_name TEXT NOT NULL,
        tagline TEXT,
        address TEXT,
        phone TEXT,
        tax_rate REAL NOT NULL,
        currency_symbol TEXT NOT NULL,
        low_stock_threshold INTEGER NOT NULL,
        receipt_footer TEXT,
        enable_sound INTEGER NOT NULL DEFAULT 1
      );
    `);

    // 6. Members table (Customer Loyalty & Membership Portal)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        member_code TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        points INTEGER NOT NULL DEFAULT 50,
        tier TEXT NOT NULL DEFAULT 'Bronze' CHECK(tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
        discount_rate REAL NOT NULL DEFAULT 0.05,
        avatar TEXT DEFAULT 'person',
        created_at TEXT NOT NULL,
        last_login TEXT
      );
    `);

    // Check if initial users exist, if not seed
    const userCount = await db.execute('SELECT COUNT(*) as count FROM users');
    const uCount = Number(userCount.rows[0]?.count ?? 0);
    if (uCount === 0) {
      await db.execute({
        sql: `INSERT INTO users (id, username, password, full_name, role, avatar, last_login)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'usr-super-admin',
          'haura',
          '231',
          'Haura',
          'super_admin',
          'shield_person',
          new Date().toISOString(),
        ],
      });
      await db.execute({
        sql: `INSERT INTO users (id, username, password, full_name, role, avatar, last_login)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'usr-cashier-1',
          'sarah',
          '123',
          'Sarah Jenkins',
          'cashier',
          'badge',
          new Date().toISOString(),
        ],
      });
      await db.execute({
        sql: `INSERT INTO users (id, username, password, full_name, role, avatar, last_login)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'usr-manager-1',
          'manager',
          '123',
          'Budi Santoso',
          'manager',
          'manage_accounts',
          new Date().toISOString(),
        ],
      });
    }

    // Check if products exist, if not seed initial products
    const prodCount = await db.execute('SELECT COUNT(*) as count FROM products');
    const pCount = Number(prodCount.rows[0]?.count ?? 0);
    if (pCount === 0) {
      const initialProducts = [
        {
          id: 'prod-1',
          name: 'Moleskine Classic Ruled',
          sku: 'N-MOL-001',
          category: 'Notebooks',
          price: 24.00,
          cost_price: 13.50,
          stock: 142,
          min_stock_alert: 20,
          icon: 'bookmark',
          description: 'Hardcover large notebook with 240 ivory acid-free pages, expandable pocket, and ribbon bookmark.',
          created_at: '2026-08-01T10:00:00Z',
        },
        {
          id: 'prod-2',
          name: 'Pilot G2 Premium Gel Pen, Black',
          sku: 'P-PG2-BLK',
          category: 'Writing',
          price: 2.50,
          cost_price: 1.10,
          stock: 12,
          min_stock_alert: 25,
          icon: 'edit',
          description: 'Smooth writing 0.7mm fine point retractable gel ink pen with ergonomic contoured rubber grip.',
          created_at: '2026-08-02T11:30:00Z',
        },
        {
          id: 'prod-3',
          name: 'A4 Document Folders (10 Pk)',
          sku: 'F-A4D-010',
          category: 'Accessories',
          price: 8.99,
          cost_price: 3.80,
          stock: 0,
          min_stock_alert: 15,
          icon: 'folder',
          description: 'Heavy duty polypropylene transparent presentation document wallets with snap button closure.',
          created_at: '2026-08-03T14:15:00Z',
        },
        {
          id: 'prod-4',
          name: 'Faber-Castell Watercolors',
          sku: 'A-FCW-024',
          category: 'Art Supplies',
          price: 32.50,
          cost_price: 18.00,
          stock: 45,
          min_stock_alert: 10,
          icon: 'palette',
          description: 'Connector paint box 24 vibrant watercolours with click-together paint pans and brush.',
          created_at: '2026-08-04T09:00:00Z',
        },
        {
          id: 'prod-5',
          name: 'Rhodia DotPad A5 Notepad',
          sku: 'N-RHO-DOT',
          category: 'Notebooks',
          price: 9.90,
          cost_price: 4.80,
          stock: 80,
          min_stock_alert: 20,
          icon: 'note_alt',
          description: '80 gsm extra white paper with pale violet dot grid, micro-perforated sheets for clean removal.',
          created_at: '2026-08-05T13:20:00Z',
        },
        {
          id: 'prod-6',
          name: 'Lamy Safari Fountain Pen Charcoal M',
          sku: 'P-LAM-SAF',
          category: 'Writing',
          price: 36.00,
          cost_price: 21.00,
          stock: 8,
          min_stock_alert: 12,
          icon: 'history_edu',
          description: 'Timeless design, perfect ergonomics with sturdy ABS plastic body and flexible chrome clip.',
          created_at: '2026-08-06T16:45:00Z',
        },
        {
          id: 'prod-7',
          name: 'Midori Brass Ruler 15cm',
          sku: 'A-MID-RUL',
          category: 'Accessories',
          price: 18.50,
          cost_price: 9.00,
          stock: 35,
          min_stock_alert: 10,
          icon: 'straighten',
          description: 'Solid brass 15cm ruler that deepens in patina and character with daily stationer use.',
          created_at: '2026-08-07T11:00:00Z',
        },
        {
          id: 'prod-8',
          name: 'Japanese Washi Tape Set (5 Rolls)',
          sku: 'A-WSH-005',
          category: 'Accessories',
          price: 11.25,
          cost_price: 4.50,
          stock: 94,
          min_stock_alert: 25,
          icon: 'tape',
          description: 'Premium rice paper decorative washi adhesive tapes in botanical minimalist patterns.',
          created_at: '2026-08-08T15:10:00Z',
        }
      ];

      for (const p of initialProducts) {
        await db.execute({
          sql: `INSERT OR REPLACE INTO products (id, name, sku, category, price, cost_price, stock, min_stock_alert, icon, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [p.id, p.name, p.sku, p.category, p.price, p.cost_price, p.stock, p.min_stock_alert, p.icon, p.description, p.created_at],
        });
      }
    }

    // Check categories
    const catCount = await db.execute('SELECT COUNT(*) as count FROM categories');
    if (Number(catCount.rows[0]?.count ?? 0) === 0) {
      const defaultCats = ['Notebooks', 'Writing', 'Accessories', 'Art Supplies', 'Paper & Envelopes', 'Other'];
      for (const cat of defaultCats) {
        await db.execute({
          sql: `INSERT OR IGNORE INTO categories (name) VALUES (?)`,
          args: [cat],
        });
      }
    }

    // Check settings
    const settingsCount = await db.execute('SELECT COUNT(*) as count FROM store_settings');
    if (Number(settingsCount.rows[0]?.count ?? 0) === 0) {
      await db.execute({
        sql: `INSERT INTO store_settings (id, store_name, tagline, address, phone, tax_rate, currency_symbol, low_stock_threshold, receipt_footer, enable_sound)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'main_settings',
          'StationeryPOS Hub',
          'Fine Pens, Paper & Creative Supplies',
          '142 Market Street, Suite 4B, San Francisco, CA',
          '(415) 890-2341',
          0.0825,
          '$',
          15,
          'Thank you for supporting your local stationery craft shop!',
          1,
        ],
      });
    }

    // Check members table and seed initial members
    const membersCount = await db.execute('SELECT COUNT(*) as count FROM members');
    if (Number(membersCount.rows[0]?.count ?? 0) === 0) {
      await db.execute({
        sql: `INSERT INTO members (id, member_code, full_name, email, phone, username, password, points, tier, discount_rate, avatar, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'mbr-1',
          'MBR-8801',
          'Anita Rahmawati',
          'anita@example.com',
          '081234567890',
          'anita',
          '123',
          250,
          'Silver',
          0.10,
          'face_3',
          '2026-08-15T10:00:00Z',
        ],
      });
      await db.execute({
        sql: `INSERT INTO members (id, member_code, full_name, email, phone, username, password, points, tier, discount_rate, avatar, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'mbr-2',
          'MBR-8802',
          'Bambang Wijaya',
          'bambang@example.com',
          '081987654321',
          'bambang',
          '123',
          80,
          'Bronze',
          0.05,
          'face',
          '2026-08-20T14:30:00Z',
        ],
      });
    }

    return { success: true, message: 'Turso database initialized successfully' };
  } catch (error: any) {
    console.error('Turso init error:', error);
    return { success: false, message: error?.message || 'Failed to initialize Turso' };
  }
}
