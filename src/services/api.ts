import { Product, Order, StoreSettings, User, CategoryType, Member } from '../types';

export interface DatabaseStatus {
  connected: boolean;
  provider?: string;
  dbName?: string;
  region?: string;
  latencyMs?: number;
  status?: string;
  error?: string;
}

export interface BootstrapResponse {
  users: User[];
  products: Product[];
  orders: Order[];
  categories: CategoryType[];
  settings: StoreSettings;
  members?: Member[];
}

export const api = {
  // Check health and Turso connectivity
  async getStatus(): Promise<DatabaseStatus> {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) throw new Error('Status endpoint returned non-200');
      return await res.json();
    } catch (err: any) {
      return {
        connected: false,
        error: err?.message || 'Gagal terhubung ke server',
      };
    }
  },

  // Bootstrap all data from Turso
  async getBootstrap(): Promise<BootstrapResponse | null> {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error('Failed to load bootstrap data');
      const data = await res.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.warn('API getBootstrap failed, using offline cache:', err);
      return null;
    }
  },

  // Authentication against Turso DB (Staff)
  async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghubungi server login' };
    }
  },

  // Member Sign Up (Registrasi Member Baru ke Turso)
  async registerMember(data: {
    fullName: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
  }): Promise<{ success: boolean; member?: Member; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghubungi server pendaftaran member' };
    }
  },

  // Member Sign In (Masuk Member ke Turso)
  async loginMember(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; member?: Member; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/members/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const result = await res.json();
      return result;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal menghubungi server login member' };
    }
  },

  // Get all members
  async getMembers(): Promise<Member[]> {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      return data.success && Array.isArray(data.members) ? data.members : [];
    } catch (err) {
      console.error('Failed to load members from Turso:', err);
      return [];
    }
  },

  // Update member (points, profile, etc.)
  async updateMember(
    id: string,
    updates: Partial<Member>
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Failed to update member in Turso:', err);
      return false;
    }
  },

  // Save product (Insert or Update)
  async saveProduct(product: Product): Promise<boolean> {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Failed to sync product with Turso:', err);
      return false;
    }
  },

  // Delete product
  async deleteProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Failed to delete product from Turso:', err);
      return false;
    }
  },

  // Adjust product stock
  async adjustStock(productId: string, newStock: number): Promise<boolean> {
    try {
      const res = await fetch('/api/products/adjust-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, newStock }),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Failed to adjust stock in Turso:', err);
      return false;
    }
  },

  // Create order with atomic stock decrement
  async createOrder(order: Order): Promise<boolean> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Failed to save order to Turso:', err);
      return false;
    }
  },

  // Save user (RBAC)
  async saveUser(user: User): Promise<boolean> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Failed to save user to Turso:', err);
      return false;
    }
  },

  // Delete user
  async deleteUser(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Failed to delete user from Turso:', err);
      return false;
    }
  },

  // Save store settings
  async saveSettings(settings: StoreSettings): Promise<boolean> {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Failed to save settings to Turso:', err);
      return false;
    }
  },

  // Save categories
  async saveCategories(categories: CategoryType[]): Promise<boolean> {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
      });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Failed to save categories to Turso:', err);
      return false;
    }
  },

  // Reset database
  async resetDatabase(): Promise<boolean> {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      return Boolean(data.success);
    } catch (err) {
      console.error('Failed to reset Turso database:', err);
      return false;
    }
  },
};
