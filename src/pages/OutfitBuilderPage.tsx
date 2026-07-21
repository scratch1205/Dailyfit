import React, { useState, useEffect, useMemo } from 'react'
import { useDailyFitStore } from '../store/dailyfit-store'
import type { ClothingItem, OutfitRecord } from '../types'
import { type Category, CATEGORIES, categoryLabels } from '../config/categories'
import { format } from 'date-fns'
import { Shuffle, Save, Star, X, Upload, Shirt, Plus, Check } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'

interface SlotConfig {
  category: Category
  label: string
  accent: string
  accentSoft: string
  accentBorder: string
}

const SLOTS: SlotConfig[] = [
  { category: 'tops',    label: '上衣', accent: 'bg-clay-500',    accentSoft: 'bg-clay-50',    accentBorder: 'border-clay-500' },
  { category: 'bottoms', label: '裤裙', accent: 'bg-slate2-500',  accentSoft: 'bg-slate2-50',  accentBorder: 'border-slate2-500' },
  { category: 'shoes',   label: '鞋子', accent: 'bg-amber-500',   accentSoft: 'bg-amber-50',   accentBorder: 'border-amber-500' },
  { category: 'bags',    label: '包包', accent: 'bg-emerald-500', accentSoft: 'bg-emerald-50', accentBorder: 'border-emerald-500' },
]

const EMPTY_SELECTION: Record<Category, ClothingItem | null> = {
  tops: null,
  bottoms: null,
  shoes: null,
  bags: null,
}

const OutfitBuilderPage: React.FC = () => {
  const clothingItems = useDailyFitStore((s) => s.clothingItems)
  const addOutfitRecord = useDailyFitStore((s) => s.addOutfitRecord)
  const isOnline = useDailyFitStore((s) => s.isOnline)

  const [selectedItems, setSelectedItems] = useState<Record<Category, ClothingItem | null>>(EMPTY_SELECTION)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [note, setNote] = useState<string>('')
  const [isFavorite, setIsFavorite] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [activeSlot, setActiveSlot] = useState<Category | null>(null)

  const items = useMemo(
    () => (Array.isArray(clothingItems) ? clothingItems : Object.values(clothingItems)),
    [clothingItems]
  )

  const itemsByCategory = useMemo(() => {
    const map: Record<Category, ClothingItem[]> = { tops: [], bottoms: [], shoes: [], bags: [] }
    for (const item of items) {
      const cat = (item as ClothingItem).category as Category
      if (cat && map[cat]) map[cat].push(item as ClothingItem)
    }
    return map
  }, [items])

  const availableSlots = SLOTS.filter((s) => itemsByCategory[s.category].length > 0)
  const selectedCount = Object.values(selectedItems).filter(Boolean).length

  // 首次进入若有衣物，自动随机一套
  useEffect(() => {
    if (items.length > 0 && selectedCount === 0) {
      handleRandomOutfit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectItem = (category: Category, item: ClothingItem) => {
    setSelectedItems((prev) => {
      // 再次点击同一件 → 取消选择
      if (prev[category]?.id === item.id) {
        return { ...prev, [category]: null }
      }
      return { ...prev, [category]: item }
    })
  }

  const handleClearSlot = (category: Category) => {
    setSelectedItems((prev) => ({ ...prev, [category]: null }))
  }

  const handleRandomOutfit = () => {
    const next = { ...EMPTY_SELECTION }
    for (const slot of SLOTS) {
      const pool = itemsByCategory[slot.category]
      if (pool.length > 0) {
        next[slot.category] = pool[Math.floor(Math.random() * pool.length)]
      }
    }
    setSelectedItems(next)
    useDailyFitStore.getState().showToast('info', '已生成随机搭配')
  }

  const handleClearAll = () => {
    setSelectedItems(EMPTY_SELECTION)
    setNote('')
    setIsFavorite(false)
  }

  const toggleFavorite = () => setIsFavorite((p) => !p)

  const handleSaveOutfit = async () => {
    if (selectedCount === 0) {
      useDailyFitStore.getState().showToast('error', '请至少选择一件衣物')
      return
    }

    setIsLoading(true)
    try {
      const top = selectedItems.tops
      const bottom = selectedItems.bottoms
      const newOutfit: Omit<OutfitRecord, 'id'> = {
        topId: top?.id,
        bottomId: bottom?.id,
        date: selectedDate,
        note,
        isFavorite,
        rating: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await addOutfitRecord(newOutfit)
      useDailyFitStore.getState().showToast('success', '搭配已保存！')
      handleClearAll()
    } catch (error) {
      console.error('保存搭配失败:', error)
      useDailyFitStore.getState().showToast('error', '保存失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // ── 空衣橱 ──
  if (items.length === 0) {
    return (
      <div className="min-h-dvh bg-cream flex items-center justify-center">
        <EmptyState
          icon={<Shirt size={32} />}
          title="衣橱还是空的"
          description="去「衣橱」页面上传你的第一件衣物吧"
          action={
            <a href="/closet">
              <Button>
                <Upload size={16} /> 去上传
              </Button>
            </a>
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-cream pb-28">
      {/* 标题栏 */}
      <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-warm-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-warm-900">搭配工作台</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomOutfit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-warm-100 text-warm-600 hover:bg-warm-200 pressable"
          >
            <Shuffle size={14} /> 随机
          </button>
          <button
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-warm-100 text-warm-500 hover:bg-warm-200 pressable"
          >
            <X size={14} /> 清空
          </button>
        </div>
      </header>

      {/* 预览区 - 2x2 网格 */}
      <section className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {SLOTS.map((slot) => {
            const item = selectedItems[slot.category]
            const hasPool = itemsByCategory[slot.category].length > 0
            return (
              <button
                key={slot.category}
                onClick={() => hasPool && setActiveSlot(slot.category)}
                disabled={!hasPool}
                className={`relative flex flex-col items-center justify-center p-3 min-h-[120px] rounded-2xl transition-all pressable ${
                  !hasPool
                    ? 'bg-warm-50 opacity-50'
                    : item
                    ? `bg-white card-shadow ${slot.accentBorder} border-2`
                    : `${slot.accentSoft} border-2 border-dashed border-warm-200 hover:border-warm-300`
                }`}
              >
                {item ? (
                  <div className="text-center animate-fade-in w-full">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="max-h-[16vh] mx-auto object-contain rounded-lg"
                      loading="lazy"
                    />
                    <p className="mt-1 text-xs text-warm-600 truncate px-1">{item.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-warm-400">
                    {hasPool ? <Plus size={24} /> : <Shirt size={24} />}
                    <p className="text-xs mt-1">{slot.label}</p>
                    {hasPool && (
                      <p className="text-[10px] text-warm-300 mt-0.5">
                        {itemsByCategory[slot.category].length} 件可选
                      </p>
                    )}
                  </div>
                )}
                {/* 取消选择按钮 */}
                {item && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearSlot(slot.category)
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-warm-900/60 text-white hover:bg-warm-900/80 pressable"
                  >
                    <X size={12} />
                  </span>
                )}
                <span className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${slot.accent}`} />
              </button>
            )
          })}
        </div>
      </section>

      {/* 衣物选择器 - 每个 slot 一行，始终可见 */}
      <section className="px-4 mt-4 space-y-3">
        {availableSlots.map((slot) => {
          const pool = itemsByCategory[slot.category]
          return (
            <div key={slot.category} className="bg-white rounded-2xl p-3 card-shadow">
              <h2 className="text-sm font-semibold text-warm-700 mb-2 flex items-center justify-between">
                <span className="flex items-center">
                  <span className={`inline-block w-2 h-2 ${slot.accent} rounded-full mr-2`} />
                  {slot.label}
                  <span className="ml-1.5 text-xs font-normal text-warm-400">{pool.length} 件</span>
                </span>
                {selectedItems[slot.category] && (
                  <button
                    onClick={() => handleClearSlot(slot.category)}
                    className="text-xs text-warm-400 hover:text-warm-600 pressable"
                  >
                    取消
                  </button>
                )}
              </h2>
              <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
                {pool.map((item) => {
                  const isSelected = selectedItems[slot.category]?.id === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(slot.category, item)}
                      className={`flex-shrink-0 w-[72px] rounded-xl overflow-hidden pressable transition-all ${
                        isSelected
                          ? `${slot.accentBorder} border-2 ring-2 ring-offset-1 ring-clay-300`
                          : 'border border-warm-200 hover:border-warm-300'
                      }`}
                    >
                      <div className="w-full h-[72px] bg-warm-50 relative">
                        <img
                          src={item.thumbnailUrl || item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-clay-500 text-white">
                            <Check size={10} />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-center px-1 py-0.5 text-warm-600 truncate">{item.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      {/* 底部操作栏 */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-warm-200 shadow-lg z-30">
        <div className="px-4 py-3 space-y-2.5">
          {/* 日期 + 收藏 */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-warm-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-clay-400"
            />
            <button
              onClick={toggleFavorite}
              className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full pressable transition-colors ${
                isFavorite ? 'bg-amber-50 text-amber-500 border border-amber-200' : 'bg-warm-100 text-warm-400'
              }`}
              aria-label={isFavorite ? '取消收藏' : '添加收藏'}
            >
              <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
          {/* 笔记 */}
          <textarea
            placeholder="添加搭配笔记..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-warm-300 rounded-lg text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-clay-400 min-h-[36px]"
            rows={1}
          />
          {/* 保存 */}
          <Button
            onClick={handleSaveOutfit}
            disabled={isLoading || selectedCount === 0}
            className="w-full"
          >
            {isLoading ? '保存中...' : (
              <>
                <Save size={16} /> 保存搭配{selectedCount > 0 && `（${selectedCount} 件）`}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 网络状态提示 */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-xs z-50 shadow animate-fade-in">
          离线模式（部分功能受限）
        </div>
      )}
    </div>
  )
}

export default OutfitBuilderPage
