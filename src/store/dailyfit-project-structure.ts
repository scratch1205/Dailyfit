
// 类型重导出（兼容旧引用）
export type {
  ClothingType,
  ClothingTag,
  ClothingItem,
  OutfitRecord,
} from '../types';

export type DBService = any;
export type CacheStrategy = 'lru' | 'fifo' | 'ttl';
