
export type ClothingType = 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessories';
export type ClothingTag = 'casual' | 'formal' | 'sport' | 'street' | 'vintage' | 'minimal';

export interface ClothingItem {
  id: string;
  name: string;
  type: ClothingType;
  category?: string;
  color?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutfitRecord {
  id: string;
  date: string;
  clothingIds: string[];
  topId?: string;
  bottomId?: string;
  topImage?: string;
  bottomImage?: string;
  compositeImage?: string;
  photo?: string;
  thumbnail?: string;
  rating: number;
  note?: string;
  notes?: string;
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  bio: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
