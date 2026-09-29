import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getTursoClient, initTursoDatabase } from './server/turso.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Turso tables and seed defaults on boot
  initTursoDatabase()
    .then((res) => console.log('⚡ Turso Database Status:', res.message))
    .catch((err) => console.error('Failed to initialize Turso on boot:', err));

  // ==========================================
  // API ROUTES (Must precede Vite middleware)
  // ==========================================

  // 1. Database Connection Status & Health
  app.get('/api/status', async (_req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const db = getTursoClient();
      const result = await db.execute('SELECT 1 as ping');
      const latencyMs = Date.now() - startTime;
      res.json({
        connected: true,
        provider: 'Turso (libSQL)',
        dbName: 'mykasirdb-hauradigiss',
        region: 'aws-ap-northeast-1',
        latencyMs,
        status: 'healthy',
      });
    } catch (error: any) {
      res.status(500).json({
        connected: false,
        error: error?.message || 'Turso connection failed',
      });
    }
  });

  // 2. Full State Bootstrap (Loads all records from Turso)
  app.get('/api/bootstrap', async (_req: Request, res: Response) => {
    try {
      const db = getTursoClient();

      const [usersRes, prodRes, ordersRes, catRes, settingsRes, membersRes] = await Promise.all([
        db.execute('SELECT * FROM users ORDER BY full_name ASC'),
        db.execute('SELECT * FROM products ORDER BY name ASC'),
        db.execute('SELECT * FROM orders ORDER BY timestamp DESC LIMIT 200'),
        db.execute('SELECT * FROM categories ORDER BY name ASC'),
        db.execute('SELECT * FROM store_settings LIMIT 1'),
        db.execute('SELECT * FROM members ORDER BY full_name ASC'),
      ]);

      const users = usersRes.rows.map((r: any) => ({
        id: String(r.id),
        username: String(r.username),
        password: String(r.password),
        fullName: String(r.full_name),
        role: String(r.role),
        avatar: r.avatar ? String(r.avatar) : undefined,
        lastLogin: r.last_login ? String(r.last_login) : undefined,
      }));

      const products = prodRes.rows.map((r: any) => ({
        id: String(r.id),
        name: String(r.name),
        sku: String(r.sku),
        category: String(r.category),
        price: Number(r.price),
        costPrice: Number(r.cost_price ?? 0),
        stock: Number(r.stock),
        minStockAlert: Number(r.min_stock_alert),
        icon: String(r.icon || 'inventory_2'),
        description: r.description ? String(r.description) : '',
        createdAt: String(r.created_at || new Date().toISOString()),
      }));

      const orders = ordersRes.rows.map((r: any) => {
        let items = [];
        try {
          items = JSON.parse(r.items_json);
        } catch {
          items = [];
        }
        return {
          id: String(r.id),
          receiptNumber: String(r.receipt_number),
          items,
          subtotal: Number(r.subtotal),
          discount: Number(r.discount),
          tax: Number(r.tax),
          total: Number(r.total),
          paymentMethod: String(r.payment_method),
          amountPaid: Number(r.amount_paid),
          change: Number(r.change_amount),
          cashierName: String(r.cashier_name),
          customerName: r.customer_name ? String(r.customer_name) : 'Walk-in',
          timestamp: String(r.timestamp),
          status: String(r.status),
        };
      });

      const categories = catRes.rows.map((r: any) => String(r.name));

      const members = membersRes.rows.map((r: any) => ({
        id: String(r.id),
        memberCode: String(r.member_code),
        fullName: String(r.full_name),
        email: r.email ? String(r.email) : undefined,
        phone: r.phone ? String(r.phone) : undefined,
        username: String(r.username),
        points: Number(r.points || 0),
        tier: String(r.tier || 'Bronze'),
        discountRate: Number(r.discount_rate || 0.05),
        avatar: r.avatar ? String(r.avatar) : 'person',
        createdAt: String(r.created_at || ''),
        lastLogin: r.last_login ? String(r.last_login) : undefined,
      }));

      let settings: any = {
        storeName: 'StationeryPOS Hub',
        tagline: 'Fine Pens, Paper & Creative Supplies',
        address: '142 Market Street, Suite 4B, San Francisco, CA',
        phone: '(415) 890-2341',
        taxRate: 0.0825,
        currencySymbol: '$',
        lowStockThreshold: 15,
        receiptFooter: 'Thank you for supporting your local stationery craft shop!',
        enableSound: true,
      };

      if (settingsRes.rows.length > 0) {
        const s: any = settingsRes.rows[0];
        settings = {
          storeName: String(s.store_name),
          tagline: String(s.tagline || ''),
          address: String(s.address || ''),
          phone: String(s.phone || ''),
          taxRate: Number(s.tax_rate),
          currencySymbol: String(s.currency_symbol || '$'),
          lowStockThreshold: Number(s.low_stock_threshold),
          receiptFooter: String(s.receipt_footer || ''),
          enableSound: Boolean(s.enable_sound),
        };
      }

      res.json({
        success: true,
        data: {
          users,
          products,
          orders,
          categories,
          settings,
          members,
        },
      });
    } catch (error: any) {
      console.error('Bootstrap error:', error);
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // 3. Login Authentication
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
      }

      const db = getTursoClient();
      const userRes = await db.execute({
        sql: 'SELECT * FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1',
        args: [username.trim()],
      });

      if (userRes.rows.length === 0) {
        return res.status(401).json({ success: false, error: 'Username atau password tidak ditemukan' });
      }

      const userRow: any = userRes.rows[0];
      if (String(userRow.password) !== String(password).trim()) {
        return res.status(401).json({ success: false, error: 'Password yang Anda masukkan salah' });
      }

      // Update last_login
      const now = new Date().toISOString();
      await db.execute({
        sql: 'UPDATE users SET last_login = ? WHERE id = ?',
        args: [now, userRow.id],
      });

      res.json({
        success: true,
        user: {
          id: String(userRow.id),
          username: String(userRow.username),
          fullName: String(userRow.full_name),
          role: String(userRow.role),
          avatar: userRow.avatar ? String(userRow.avatar) : undefined,
          lastLogin: now,
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // ==========================================
  // MEMBER AUTHENTICATION & MANAGEMENT API
  // ==========================================

  // List all members
  app.get('/api/members', async (_req: Request, res: Response) => {
    try {
      const db = getTursoClient();
      const result = await db.execute('SELECT * FROM members ORDER BY full_name ASC');
      const members = result.rows.map((r: any) => ({
        id: String(r.id),
        memberCode: String(r.member_code),
        fullName: String(r.full_name),
        email: r.email ? String(r.email) : undefined,
        phone: r.phone ? String(r.phone) : undefined,
        username: String(r.username),
        points: Number(r.points || 0),
        tier: String(r.tier || 'Bronze'),
        discountRate: Number(r.discount_rate || 0.05),
        avatar: r.avatar ? String(r.avatar) : 'person',
        createdAt: String(r.created_at || ''),
        lastLogin: r.last_login ? String(r.last_login) : undefined,
      }));
      res.json({ success: true, members });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // Member Sign Up (Registrasi Member Baru ke Database Turso)
  app.post('/api/members/register', async (req: Request, res: Response) => {
    try {
      const { fullName, username, password, email, phone } = req.body;
      if (!fullName || !username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Nama lengkap, username, dan password wajib diisi',
        });
      }

      const cleanUsername = String(username).trim().toLowerCase();
      const cleanFullName = String(fullName).trim();
      const cleanEmail = email ? String(email).trim().toLowerCase() : null;
      const cleanPhone = phone ? String(phone).trim() : null;
      const cleanPassword = String(password).trim();

      if (cleanPassword.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Password minimal 3 karakter',
        });
      }

      const db = getTursoClient();

      // Check if username already exists in members
      const checkUsername = await db.execute({
        sql: 'SELECT id FROM members WHERE LOWER(username) = ? LIMIT 1',
        args: [cleanUsername],
      });
      if (checkUsername.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Username sudah digunakan oleh member lain. Silakan pilih username unik.',
        });
      }

      // Check if phone already registered
      if (cleanPhone) {
        const checkPhone = await db.execute({
          sql: 'SELECT id FROM members WHERE phone = ? LIMIT 1',
          args: [cleanPhone],
        });
        if (checkPhone.rows.length > 0) {
          return res.status(409).json({
            success: false,
            error: 'Nomor telepon sudah terdaftar pada akun member lain.',
          });
        }
      }

      // Generate Member Code: e.g. MBR-8805
      const countRes = await db.execute('SELECT COUNT(*) as count FROM members');
      const count = Number(countRes.rows[0]?.count ?? 0) + 1;
      const memberCode = `MBR-${String(8800 + count).padStart(4, '0')}`;
      const id = `mbr-${Date.now()}`;
      const now = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO members (id, member_code, full_name, email, phone, username, password, points, tier, discount_rate, avatar, created_at, last_login)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          memberCode,
          cleanFullName,
          cleanEmail,
          cleanPhone,
          cleanUsername,
          cleanPassword,
          50, // Bonus Poin Selamat Datang!
          'Bronze',
          0.05, // Diskon 5% untuk Bronze
          'face',
          now,
          now,
        ],
      });

      const newMember = {
        id,
        memberCode,
        fullName: cleanFullName,
        email: cleanEmail || undefined,
        phone: cleanPhone || undefined,
        username: cleanUsername,
        points: 50,
        tier: 'Bronze',
        discountRate: 0.05,
        avatar: 'face',
        createdAt: now,
        lastLogin: now,
      };

      res.status(201).json({
        success: true,
        message: 'Registrasi Member berhasil! Anda mendapatkan 50 Poin Selamat Datang.',
        member: newMember,
      });
    } catch (error: any) {
      console.error('Member register error:', error);
      res.status(500).json({ success: false, error: error?.message || 'Gagal mendaftar member' });
    }
  });

  // Member Sign In (Masuk Member ke Database Turso)
  app.post('/api/members/login', async (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username, Email, No. HP, atau Kode Member serta password wajib diisi',
        });
      }

      const cleanIdent = String(identifier).trim().toLowerCase();
      const rawIdent = String(identifier).trim();
      const cleanPass = String(password).trim();

      const db = getTursoClient();
      const result = await db.execute({
        sql: `SELECT * FROM members 
              WHERE LOWER(username) = ? 
                 OR LOWER(email) = ? 
                 OR phone = ? 
                 OR UPPER(member_code) = UPPER(?) 
              LIMIT 1`,
        args: [cleanIdent, cleanIdent, rawIdent, rawIdent],
      });

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Akun member tidak ditemukan. Periksa kembali username/nomor HP/kode member Anda.',
        });
      }

      const row: any = result.rows[0];
      if (String(row.password) !== cleanPass) {
        return res.status(401).json({
          success: false,
          error: 'Kata sandi akun member yang Anda masukkan salah.',
        });
      }

      const now = new Date().toISOString();
      await db.execute({
        sql: 'UPDATE members SET last_login = ? WHERE id = ?',
        args: [now, row.id],
      });

      const member = {
        id: String(row.id),
        memberCode: String(row.member_code),
        fullName: String(row.full_name),
        email: row.email ? String(row.email) : undefined,
        phone: row.phone ? String(row.phone) : undefined,
        username: String(row.username),
        points: Number(row.points || 0),
        tier: String(row.tier || 'Bronze'),
        discountRate: Number(row.discount_rate || 0.05),
        avatar: row.avatar ? String(row.avatar) : 'face',
        createdAt: String(row.created_at || ''),
        lastLogin: now,
      };

      res.json({
        success: true,
        message: 'Login member berhasil.',
        member,
      });
    } catch (error: any) {
      console.error('Member login error:', error);
      res.status(500).json({ success: false, error: error?.message || 'Gagal memproses login member' });
    }
  });

  // Update Member (Poin, Profil, Tier)
  app.put('/api/members/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { points, tier, discountRate, fullName, email, phone } = req.body;
      const db = getTursoClient();

      await db.execute({
        sql: `UPDATE members 
              SET points = COALESCE(?, points),
                  tier = COALESCE(?, tier),
                  discount_rate = COALESCE(?, discount_rate),
                  full_name = COALESCE(?, full_name),
                  email = COALESCE(?, email),
                  phone = COALESCE(?, phone)
              WHERE id = ?`,
        args: [
          points !== undefined ? points : null,
          tier !== undefined ? tier : null,
          discountRate !== undefined ? discountRate : null,
          fullName !== undefined ? fullName : null,
          email !== undefined ? email : null,
          phone !== undefined ? phone : null,
          id,
        ],
      });

      res.json({ success: true, message: 'Data member berhasil diperbarui' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // 4. Products API
  app.get('/api/products', async (_req: Request, res: Response) => {
    try {
      const db = getTursoClient();
      const result = await db.execute('SELECT * FROM products ORDER BY name ASC');
      const products = result.rows.map((r: any) => ({
        id: String(r.id),
        name: String(r.name),
        sku: String(r.sku),
        category: String(r.category),
        price: Number(r.price),
        costPrice: Number(r.cost_price ?? 0),
        stock: Number(r.stock),
        minStockAlert: Number(r.min_stock_alert),
        icon: String(r.icon || 'inventory_2'),
        description: r.description ? String(r.description) : '',
        createdAt: String(r.created_at),
      }));
      res.json({ success: true, products });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post('/api/products', async (req: Request, res: Response) => {
    try {
      const p = req.body;
      const db = getTursoClient();
      await db.execute({
        sql: `INSERT OR REPLACE INTO products (id, name, sku, category, price, cost_price, stock, min_stock_alert, icon, description, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.id || `prod-${Date.now()}`,
          p.name,
          p.sku,
          p.category,
          p.price,
          p.costPrice ?? 0,
          p.stock ?? 0,
          p.minStockAlert ?? 10,
          p.icon || 'inventory_2',
          p.description || '',
          p.createdAt || new Date().toISOString(),
        ],
      });
      res.json({ success: true, message: 'Produk berhasil disimpan ke Turso' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.delete('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const db = getTursoClient();
      await db.execute({
        sql: 'DELETE FROM products WHERE id = ?',
        args: [id],
      });
      res.json({ success: true, message: 'Produk berhasil dihapus dari Turso' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post('/api/products/adjust-stock', async (req: Request, res: Response) => {
    try {
      const { productId, newStock } = req.body;
      const db = getTursoClient();
      await db.execute({
        sql: 'UPDATE products SET stock = ? WHERE id = ?',
        args: [newStock, productId],
      });
      res.json({ success: true, message: 'Stok diperbarui di Turso' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // 5. Checkout & Orders API (ATOMIC TRANSACTION IN TURSO)
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const order = req.body;
      const db = getTursoClient();

      // Begin atomic transaction
      const transaction = await db.transaction('write');

      try {
        // Insert order
        await transaction.execute({
          sql: `INSERT INTO orders (id, receipt_number, items_json, subtotal, discount, tax, total, payment_method, amount_paid, change_amount, cashier_name, customer_name, timestamp, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            order.id || `ord-${Date.now()}`,
            order.receiptNumber,
            JSON.stringify(order.items || []),
            order.subtotal,
            order.discount,
            order.tax,
            order.total,
            order.paymentMethod,
            order.amountPaid,
            order.change,
            order.cashierName,
            order.customerName || 'Walk-in',
            order.timestamp || new Date().toISOString(),
            order.status || 'completed',
          ],
        });

        // Atomically decrement stock for each item in the cart
        for (const item of order.items || []) {
          if (item.product?.id && item.quantity > 0) {
            await transaction.execute({
              sql: 'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?',
              args: [item.quantity, item.product.id],
            });
          }
        }

        // Commit transaction to Turso Cloud
        await transaction.commit();

        res.json({ success: true, message: 'Transaksi berhasil disimpan dan stok terpotong di Turso' });
      } catch (err: any) {
        await transaction.rollback();
        throw err;
      }
    } catch (error: any) {
      console.error('Order creation error:', error);
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // 6. Users API
  app.get('/api/users', async (_req: Request, res: Response) => {
    try {
      const db = getTursoClient();
      const result = await db.execute('SELECT * FROM users ORDER BY full_name ASC');
      const users = result.rows.map((r: any) => ({
        id: String(r.id),
        username: String(r.username),
        password: String(r.password),
        fullName: String(r.full_name),
        role: String(r.role),
        avatar: r.avatar ? String(r.avatar) : undefined,
        lastLogin: r.last_login ? String(r.last_login) : undefined,
      }));
      res.json({ success: true, users });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const u = req.body;
      const db = getTursoClient();
      await db.execute({
        sql: `INSERT OR REPLACE INTO users (id, username, password, full_name, role, avatar, last_login)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          u.id || `usr-${Date.now()}`,
          u.username.toLowerCase().trim(),
          u.password,
          u.fullName,
          u.role,
          u.avatar || 'badge',
          u.lastLogin || new Date().toISOString(),
        ],
      });
      res.json({ success: true, message: 'User berhasil disimpan ke Turso' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const db = getTursoClient();
      await db.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [id],
      });
      res.json({ success: true, message: 'Pengguna dihapus dari Turso' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // Dedicated Password CRUD & Update for Super Admin
  app.put('/api/users/:id/password', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newPassword, oldPassword, forceReset } = req.body;

      if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Password baru tidak boleh kosong' });
      }

      const cleanNewPassword = newPassword.trim();
      const db = getTursoClient();

      const userRes = await db.execute({
        sql: 'SELECT * FROM users WHERE id = ? LIMIT 1',
        args: [id],
      });

      if (userRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Akun pengguna tidak ditemukan' });
      }

      const existingUser: any = userRes.rows[0];

      // If oldPassword is provided and not a forceReset, verify current password
      if (oldPassword !== undefined && !forceReset) {
        if (String(existingUser.password) !== String(oldPassword).trim()) {
          return res.status(400).json({ success: false, error: 'Password saat ini (lama) tidak cocok' });
        }
      }

      await db.execute({
        sql: 'UPDATE users SET password = ? WHERE id = ?',
        args: [cleanNewPassword, id],
      });

      res.json({
        success: true,
        message: `Password akun @${existingUser.username} berhasil diperbarui di Turso Cloud`,
        userId: id,
        username: String(existingUser.username),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // 7. Settings API
  app.post('/api/settings', async (req: Request, res: Response) => {
    try {
      const s = req.body;
      const db = getTursoClient();
      await db.execute({
        sql: `INSERT OR REPLACE INTO store_settings (id, store_name, tagline, address, phone, tax_rate, currency_symbol, low_stock_threshold, receipt_footer, enable_sound)
              VALUES ('main_settings', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          s.storeName,
          s.tagline,
          s.address,
          s.phone,
          s.taxRate,
          s.currencySymbol,
          s.lowStockThreshold,
          s.receiptFooter,
          s.enableSound ? 1 : 0,
        ],
      });
      res.json({ success: true, message: 'Pengaturan berhasil disimpan ke Turso' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // 8. Categories API
  app.post('/api/categories', async (req: Request, res: Response) => {
    try {
      const { categories } = req.body;
      const db = getTursoClient();
      if (Array.isArray(categories)) {
        await db.execute('DELETE FROM categories');
        for (const cat of categories) {
          await db.execute({
            sql: 'INSERT OR IGNORE INTO categories (name) VALUES (?)',
            args: [cat],
          });
        }
      }
      res.json({ success: true, message: 'Kategori disimpan ke Turso' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // 9. Reset database to initial seed
  app.post('/api/reset', async (_req: Request, res: Response) => {
    try {
      const db = getTursoClient();
      await db.execute('DROP TABLE IF EXISTS orders');
      await db.execute('DROP TABLE IF EXISTS products');
      await db.execute('DROP TABLE IF EXISTS users');
      await db.execute('DROP TABLE IF EXISTS store_settings');
      await db.execute('DROP TABLE IF EXISTS categories');
      await db.execute('DROP TABLE IF EXISTS members');

      await initTursoDatabase();
      res.json({ success: true, message: 'Database Turso berhasil direset ke data awal' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // ==========================================
  // Vite Middleware / Static Asset Serving
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 StationeryPOS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
