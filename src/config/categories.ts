import type { ClothingType } from '../types'

export type Category = 'tops' | 'bottoms' | 'shoes' | 'bags'

export interface CategoryConfig {
  key: Category
  label: string
  type: ClothingType
  icon: string
  accent: string
}

export const CATEGORIES: CategoryConfig[] = [
  { key: 'tops', label: '上衣', type: 'top', icon: 'shirt', accent: 'clay' },
  { key: 'bottoms', label: '裤裙', type: 'bottom', icon: 'pants', accent: 'slate2' },
  { key: 'shoes', label: '鞋子', type: 'shoes', icon: 'shoe', accent: 'amber' },
  { key: 'bags', label: '包包', type: 'accessories', icon: 'bag', accent: 'emerald' },
]

export const categoryLabels: Record<Category, string> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.key]: c.label }),
  {} as Record<Category, string>
)

export const categoryToType: Record<Category, ClothingType> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.key]: c.type }),
  {} as Record<Category, ClothingType>
)

export function getCategoryConfig(key: Category): CategoryConfig {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[0]
}
