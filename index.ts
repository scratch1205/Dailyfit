export interface ClothingItem {
  id: string;
  name: string;
  category: string;
  type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'outerwear';
  color: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OutfitRecord {
  id: string;
  date: string;
  name: string;
  topId?: string;
  bottomId?: string;
  shoesId?: string;
  accessoryIds?: string[];
  imageUrl?: string;
  note?: string;
  rating?: number;
  createdAt: string;
}