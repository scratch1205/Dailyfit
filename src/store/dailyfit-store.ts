import { create } from 'zustand';
import type { ClothingItem, OutfitRecord, UserProfile } from '../types';
import { type Category, categoryToType } from '../config/categories';
import { mattingImage, compressImage } from '../utils/image-matting';

// Re-export for convenience
export type { Category } from '../config/categories';
export type { ClothingItem, OutfitRecord, UserProfile } from '../types';

// ============ IndexedDB 服务 ============
const DB_NAME = 'dailyfit-db';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('clothing')) {
        db.createObjectStore('clothing', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('outfits')) {
        db.createObjectStore('outfits', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ============ 头像压缩 ============
async function compressAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const scale = Math.max(size / img.width, size / img.height);
      const sw = img.width * scale;
      const sh = img.height * scale;
      ctx.drawImage(img, (size - sw) / 2, (size - sh) / 2, sw, sh);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
  });
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'me',
  nickname: '我的衣橱',
  bio: '在这里记录你的每日穿搭。',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ============ Store 定义 ============
interface DailyFitStore {
  clothingItems: ClothingItem[];
  outfitRecords: OutfitRecord[];
  outfits: OutfitRecord[];
  profile: UserProfile;
  isOnline: boolean;
  isLoading: boolean;
  toast: { type: 'success' | 'error' | 'info'; message: string } | null;

  // 个人资料
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;

  // 衣物 CRUD
  fetchClothingItems: () => Promise<void>;
  addClothingItem: (
    file: File,
    category: Category,
    useMatting: boolean,
    onProgress?: (p: number) => void
  ) => Promise<void>;
  updateClothingItem: (id: string, updates: Partial<ClothingItem>) => Promise<void>;
  deleteClothingItem: (id: string) => Promise<void>;

  // 搭配 CRUD
  fetchOutfitsByDateRange: (start: string, end: string) => Promise<void>;
  addOutfitRecord: (record: Omit<OutfitRecord, 'id'>) => Promise<void>;
  updateOutfitRecord: (id: string, updates: Partial<OutfitRecord>) => Promise<void>;
  deleteOutfitRecord: (id: string) => Promise<void>;

  // 工具
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
  clearToast: () => void;
}

export const useDailyFitStore = create<DailyFitStore>()((set, get) => ({
  clothingItems: [],
  outfitRecords: [],
  outfits: [],
  profile: DEFAULT_PROFILE,
  isOnline: navigator.onLine,
  isLoading: false,
  toast: null,

  // ---- 个人资料 ----
  fetchProfile: async () => {
    try {
      const p = await dbGet<UserProfile>('profile', 'me');
      if (p) set({ profile: p });
      else await dbPut('profile', DEFAULT_PROFILE);
    } catch (e) {
      console.error('fetchProfile failed:', e);
    }
  },

  updateProfile: async (updates) => {
    const current = get().profile;
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    await dbPut('profile', updated);
    set({ profile: updated });
  },

  uploadAvatar: async (file) => {
    if (!file.type.startsWith('image/')) {
      get().showToast('error', '请选择有效的图片文件');
      return;
    }
    const avatar = await compressAvatar(file);
    await get().updateProfile({ avatar });
    get().showToast('success', '头像已更新');
  },

  // ---- 衣物 ----
  fetchClothingItems: async () => {
    try {
      const items = await dbGetAll<ClothingItem>('clothing');
      set({ clothingItems: items });
    } catch (e) {
      console.error('fetchClothingItems failed:', e);
    }
  },

  addClothingItem: async (file, category, useMatting, onProgress) => {
    onProgress?.(10);

    let url: string;
    let thumbnailUrl: string;

    if (useMatting) {
      const result = await mattingImage(file, { maxWidth: 800, tolerance: 32 });
      url = result.url;
      thumbnailUrl = result.thumbnailUrl;
    } else {
      const result = await compressImage(file, 800);
      url = result.url;
      thumbnailUrl = result.thumbnailUrl;
    }

    onProgress?.(70);

    const type = categoryToType[category];
    const newItem: ClothingItem = {
      id: crypto.randomUUID(),
      name: file.name.replace(/\.[^.]+$/, '') || '未命名',
      type,
      category,
      imageUrl: url,
      thumbnailUrl,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbPut('clothing', newItem);
    onProgress?.(100);
    set((state) => ({ clothingItems: [...state.clothingItems, newItem] }));
  },

  updateClothingItem: async (id, updates) => {
    const items = get().clothingItems;
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    await dbPut('clothing', updated);
    set((state) => ({
      clothingItems: state.clothingItems.map((i) => (i.id === id ? updated : i)),
    }));
  },

  deleteClothingItem: async (id) => {
    await dbDelete('clothing', id);
    set((state) => ({
      clothingItems: state.clothingItems.filter((i) => i.id !== id),
    }));
  },

  // ---- 搭配 ----
  fetchOutfitsByDateRange: async (start, end) => {
    try {
      const all = await dbGetAll<OutfitRecord>('outfits');
      const filtered = all.filter((r) => r.date >= start && r.date <= end);
      set({ outfitRecords: filtered, outfits: filtered });
    } catch (e) {
      console.error('fetchOutfitsByDateRange failed:', e);
    }
  },

  addOutfitRecord: async (recordWithoutId) => {
    const items = get().clothingItems;
    const topItem = recordWithoutId.topId ? items.find((i) => i.id === recordWithoutId.topId) : undefined;
    const bottomItem = recordWithoutId.bottomId ? items.find((i) => i.id === recordWithoutId.bottomId) : undefined;
    const shoesItem = recordWithoutId.shoesId ? items.find((i) => i.id === recordWithoutId.shoesId) : undefined;
    const bagsItem = recordWithoutId.bagsId ? items.find((i) => i.id === recordWithoutId.bagsId) : undefined;

    const newRecord: OutfitRecord = {
      id: crypto.randomUUID(),
      date: recordWithoutId.date || new Date().toISOString().split('T')[0],
      clothingIds: [recordWithoutId.topId, recordWithoutId.bottomId, recordWithoutId.shoesId, recordWithoutId.bagsId].filter(Boolean) as string[],
      topId: recordWithoutId.topId,
      bottomId: recordWithoutId.bottomId,
      shoesId: recordWithoutId.shoesId,
      bagsId: recordWithoutId.bagsId,
      topImage: topItem?.thumbnailUrl || topItem?.imageUrl,
      bottomImage: bottomItem?.thumbnailUrl || bottomItem?.imageUrl,
      shoesImage: shoesItem?.thumbnailUrl || shoesItem?.imageUrl,
      bagsImage: bagsItem?.thumbnailUrl || bagsItem?.imageUrl,
      rating: recordWithoutId.rating ?? 0,
      note: recordWithoutId.note || recordWithoutId.notes || '',
      notes: recordWithoutId.notes || recordWithoutId.note || '',
      isFavorite: recordWithoutId.isFavorite ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbPut('outfits', newRecord);
    set((state) => ({
      outfitRecords: [...state.outfitRecords, newRecord],
      outfits: [...state.outfitRecords, newRecord],
    }));
  },

  updateOutfitRecord: async (id, updates) => {
    const records = get().outfitRecords;
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return;
    const updated = { ...records[idx], ...updates, updatedAt: new Date().toISOString() };
    await dbPut('outfits', updated);
    set((state) => ({
      outfitRecords: state.outfitRecords.map((r) => (r.id === id ? updated : r)),
      outfits: state.outfitRecords.map((r) => (r.id === id ? updated : r)),
    }));
  },

  deleteOutfitRecord: async (id) => {
    await dbDelete('outfits', id);
    set((state) => ({
      outfitRecords: state.outfitRecords.filter((r) => r.id !== id),
      outfits: state.outfitRecords.filter((r) => r.id !== id),
    }));
  },

  // ---- 工具 ----
  showToast: (type, message) => {
    set({ toast: { type, message } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  clearToast: () => set({ toast: null }),
}));

// 网络状态监听
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useDailyFitStore.setState({ isOnline: true }));
  window.addEventListener('offline', () => useDailyFitStore.setState({ isOnline: false }));
}

// 兼容别名
export const useClothingStore = useDailyFitStore;
export const useStore = useDailyFitStore;
