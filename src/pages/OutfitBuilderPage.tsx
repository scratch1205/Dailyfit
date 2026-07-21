import React, { useState, useEffect } from 'react'
import { useDailyFitStore } from '../store/dailyfit-store'
import type { ClothingItem, OutfitRecord } from '../types'
import { type Category, CATEGORIES } from '../config/categories'
import { format } from 'date-fns'
import { Shuffle, Save, Star, StarOff, ZoomIn, ZoomOut, Upload, Shirt, Sparkles } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import Button from '../components/Button'

interface SlotConfig {
  category: Category
  label: string
  accent: string
}

const SLOTS: SlotConfig[] = [
  { category: 'tops', label: '上衣', accent: 'bg-clay-500' },
  { category: 'bottoms', label: '裤裙', accent: 'bg-slate2-500' },
  { category: 'shoes', label: '鞋子', accent: 'bg-amber-500' },
  { category: 'bags', label: '包包', accent: 'bg-emerald-500' },
]

const OutfitBuilderPage: React.FC = () => {
  const clothingItems = useDailyFitStore((s) => s.clothingItems)
  const addOutfitRecord = useDailyFitStore((s) => s.addOutfitRecord)
  const isOnline = useDailyFitStore((s) => s.isOnline)

  const [selectedItems, setSelectedItems] = useState<Record<Category, ClothingItem | null>>({
    tops: null,
    bottoms: null,
    shoes: null,
    bags: null,
  })
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [note, setNote] = useState<string>('')
  const [isFavorite, setIsFavorite] = useState<boolean>(false)
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'horizontal'>('vertical')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [previewScale, setPreviewScale] = useState<number>(1)

  const items = Array.isArray(clothingItems) ? clothingItems : Object.values(clothingItems)

  const itemsByCategory = (cat: Category) =>
    items.filter((item: ClothingItem) => item.category === cat)

  // 初始化随机搭配（仅一次）
  useEffect(() => {
    const hasAny = SLOTS.some((s) => itemsByCategory(s.category).length > 0)
    if (hasAny && !Object.values(selectedItems).some((v) => v !== null)) {
      handleRandomOutfit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectItem = (category: Category, item: ClothingItem) => {
    setSelectedItems((prev) => ({ ...prev, [category]: item }))
    useDailyFitStore.getState().showToast('info', `已选择${CATEGORIES.find((c) => c.key === category)?.label}：${item.name}`)
  }

  const handleRandomOutfit = () => {
    const next = { ...selectedItems }
    for (const slot of SLOTS) {
      const pool = itemsByCategory(slot.category)
      if (pool.length > 0) {
        next[slot.category] = pool[Math.floor(Math.random() * pool.length)]
      }
    }
    setSelectedItems(next)
    useDailyFitStore.getState().showToast('info', '已生成随机搭配')
  }

  const toggleFavorite = () => {
    setIsFavorite((prev) => !prev)
    useDailyFitStore.getState().showToast('info', isFavorite ? '已取消收藏' : '已添加到收藏')
  }

  const handleSaveOutfit = async () => {
    const hasSelection = Object.values(selectedItems).some((v) => v !== null)
    if (!hasSelection) {
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
    } catch (error) {
      console.error('保存搭配失败:', error)
      useDailyFitStore.getState().showToast('error', '保存失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleLayout = () => {
    setLayoutMode((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'))
  }

  const handleZoom = (delta: number) => {
    setPreviewScale((prev) => Math.min(Math.max(1, prev + delta), 3))
  }

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
    <div className="flex flex-col min-h-dvh bg-cream pb-24">
      {/* 标题 */}
      <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-warm-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-warm-900">搭配工作台</h1>
        <button
          onClick={toggleLayout}
          className="w-10 h-10 flex items-center justify-center rounded-full text-warm-600 hover:bg-warm-100 pressable"
          aria-label="切换布局"
        >
          {layoutMode === 'vertical' ? '↔️' : '↕️'}
        </button>
      </header>

      {/* 组合预览区 - 2x2 网格 */}
      <main
        className="flex-1 overflow-hidden transition-all duration-300 p-3"
        style={{ transform: `scale(${previewScale})`, transformOrigin: 'center center' }}
      >
        <div className="grid grid-cols-2 gap-3 h-full">
          {SLOTS.map((slot) => {
            const item = selectedItems[slot.category]
            return (
              <div
                key={slot.category}
                className={`relative flex items-center justify-center p-3 min-h-[140px] rounded-2xl ${
                  item ? 'bg-white card-shadow' : 'bg-warm-50'
                }`}
              >
                {item ? (
                  <div className="text-center animate-fade-in">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="max-h-[24vh] max-w-full object-contain rounded-xl"
                      loading="lazy"
                    />
                    <p className="mt-1.5 text-xs text-warm-600 truncate">{item.name}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-warm-400">
                    <Shirt size={28} />
                    <p className="text-xs mt-1.5">{slot.label}</p>
                  </div>
                )}
                <span className={`absolute top-2 left-2 w-2 h-2 rounded-full ${slot.accent}`} />
              </div>
            )
          })}
        </div>
      </main>

      {/* 缩放控制 */}
      <div className="fixed right-4 top-24 flex flex-col gap-2 z-30">
        <button
          onClick={() => handleZoom(0.2)}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full card-shadow hover:bg-warm-50 pressable"
          aria-label="放大"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => handleZoom(-0.2)}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full card-shadow hover:bg-warm-50 pressable"
          aria-label="缩小"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      {/* 衣物选择器 - 每个类别一行 */}
      {SLOTS.map((slot) => {
        const pool = itemsByCategory(slot.category)
        if (pool.length === 0) return null
        return (
          <section key={slot.category} className="bg-white border-t border-warm-200 p-4 mt-1">
            <h2 className="text-sm font-semibold text-warm-700 mb-2 flex items-center">
              <span className={`inline-block w-2 h-2 ${slot.accent} rounded-full mr-2`} />
              选择{slot.label}
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
              {pool.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(slot.category, item)}
                  className={`flex-shrink-0 w-20 border-2 rounded-xl overflow-hidden pressable transition-all ${
                    selectedItems[slot.category]?.id === item.id
                      ? 'border-clay-500 card-shadow'
                      : 'border-warm-200 hover:border-warm-300'
                  }`}
                  style={{ minWidth: '5rem' }}
                >
                  <img
                    src={item.thumbnailUrl || item.imageUrl}
                    alt={item.name}
                    className="w-full h-20 object-cover"
                    loading="lazy"
                  />
                  <p className="text-xs text-center p-1 text-warm-600 truncate">{item.name}</p>
                </button>
              ))}
            </div>
          </section>
        )
      })}

      {/* 底部操作栏 */}
      <div className="sticky bottom-16 left-0 right-0 bg-white border-t border-warm-200 shadow-lg p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-warm-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-clay-400"
          />
          <textarea
            placeholder="添加搭配笔记..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-2 border border-warm-300 rounded-lg text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-clay-400 min-h-[40px]"
            rows={1}
          />
          <button
            onClick={toggleFavorite}
            className={`w-10 h-10 flex items-center justify-center rounded-full pressable ${
              isFavorite ? 'bg-amber-50 text-amber-500' : 'bg-warm-100 text-warm-500'
            }`}
            aria-label={isFavorite ? '取消收藏' : '添加收藏'}
          >
            {isFavorite ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
          </button>
          <button
            onClick={handleRandomOutfit}
            className="w-10 h-10 flex items-center justify-center bg-warm-100 text-warm-600 rounded-full hover:bg-warm-200 pressable"
            aria-label="随机搭配"
          >
            <Shuffle size={18} />
          </button>
          <Button
            onClick={handleSaveOutfit}
            disabled={isLoading || !Object.values(selectedItems).some((v) => v !== null)}
            className="flex-1 min-w-[120px]"
          >
            {isLoading ? (
              <>保存中...</>
            ) : (
              <>
                <Save size={16} /> 保存搭配
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
