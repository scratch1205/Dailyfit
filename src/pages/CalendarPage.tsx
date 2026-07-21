import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  format,
  isToday,
  isBefore,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useDailyFitStore } from '../store/dailyfit-store'
import type { OutfitRecord } from '../types'
import { type Category, CATEGORIES } from '../config/categories'
import Modal from '../components/Modal'
import Button from '../components/Button'
import { Calendar as CalendarIcon, Sun as SunIcon, ChevronLeft, ChevronRight, Trash2, Shirt } from 'lucide-react'

type CalendarCellState = {
  date: Date
  hasOutfit: boolean
  outfit?: OutfitRecord
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const CalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [activeDate, setActiveDate] = useState<Date | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [showCreatePanel, setShowCreatePanel] = useState(false)

  const outfits = useDailyFitStore((s) => s.outfits)
  const fetchOutfitsByDateRange = useDailyFitStore((s) => s.fetchOutfitsByDateRange)
  const deleteOutfitRecord = useDailyFitStore((s) => s.deleteOutfitRecord)
  const addOutfitRecord = useDailyFitStore((s) => s.addOutfitRecord)
  const clothingItems = useDailyFitStore((s) => s.clothingItems)

  // 生成日历网格（含跨月填充）
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [currentMonth])

  // 预加载相邻月数据
  const preloadNearbyData = useCallback(
    async (targetMonth: Date) => {
      const startDate = startOfMonth(subMonths(targetMonth, 1))
      const endDate = endOfMonth(addMonths(targetMonth, 1))
      try {
        await fetchOutfitsByDateRange(format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'))
      } catch (error) {
        console.error('预加载数据失败:', error)
      }
    },
    [fetchOutfitsByDateRange]
  )

  useEffect(() => {
    preloadNearbyData(currentMonth)
  }, [currentMonth, preloadNearbyData])

  // 构建单元格状态
  const cellStates = useMemo(() => {
    const map = new Map<string, CalendarCellState>()
    calendarDays.forEach((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const outfit = outfits.find((o) => o.date === dateStr)
      map.set(dateStr, { date, hasOutfit: !!outfit, outfit })
    })
    return map
  }, [calendarDays, outfits])

  const goToPreviousMonth = () => setCurrentMonth((prev) => subMonths(prev, 1))
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1))
  const jumpToToday = () => setCurrentMonth(new Date())

  const handleDateClick = (cell: CalendarCellState) => {
    setActiveDate(cell.date)
    if (cell.hasOutfit && cell.outfit) {
      setShowDetailPanel(true)
    } else {
      setShowCreatePanel(true)
    }
  }

  const closeAllPanels = () => {
    setShowDetailPanel(false)
    setShowCreatePanel(false)
    setActiveDate(null)
  }

  const handleDeleteOutfit = async (id: string) => {
    try {
      await deleteOutfitRecord(id)
      closeAllPanels()
      useDailyFitStore.getState().showToast('success', '搭配已删除')
    } catch (error) {
      console.error('删除失败:', error)
      useDailyFitStore.getState().showToast('error', '删除失败')
    }
  }

  const handleCreateOutfit = async (data: Omit<OutfitRecord, 'id'>) => {
    try {
      await addOutfitRecord(data)
      closeAllPanels()
      useDailyFitStore.getState().showToast('success', '搭配已保存')
    } catch (error) {
      console.error('保存失败:', error)
      useDailyFitStore.getState().showToast('error', '保存失败')
    }
  }

  const renderCalendarCell = (cellState: CalendarCellState) => {
    const { date, hasOutfit, outfit } = cellState
    const dayStr = format(date, 'd')
    const isCurrentToday = isToday(date)
    const inMonth = isSameMonth(date, currentMonth)
    const isPast = isBefore(date, new Date()) && !isCurrentToday

    return (
      <button
        key={format(date, 'yyyy-MM-dd')}
        className={`relative flex flex-col items-center justify-start w-full aspect-square p-1.5 rounded-lg border transition-all pressable ${
          isCurrentToday
            ? 'border-clay-400 bg-clay-50'
            : 'border-transparent hover:border-warm-200 hover:bg-warm-50'
        } ${!inMonth ? 'opacity-30' : ''}`}
        onClick={() => handleDateClick(cellState)}
        aria-label={`${format(date, 'yyyy年MM月dd日')}`}
      >
        <span
          className={`text-sm font-medium mb-1 ${
            isCurrentToday
              ? 'text-clay-600'
              : isPast
              ? 'text-warm-400'
              : 'text-warm-700'
          }`}
        >
          {dayStr}
        </span>

        <div className="flex-1 w-full relative overflow-hidden rounded-md bg-warm-100 min-h-[24px]">
          {hasOutfit && outfit && (outfit.topImage || outfit.bottomImage || outfit.shoesImage || outfit.bagsImage) ? (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-px">
              {outfit.topImage ? (
                <img src={outfit.topImage} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : <div className="w-full h-full" />}
              {outfit.bottomImage ? (
                <img src={outfit.bottomImage} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : <div className="w-full h-full" />}
              {outfit.shoesImage ? (
                <img src={outfit.shoesImage} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : <div className="w-full h-full" />}
              {outfit.bagsImage ? (
                <img src={outfit.bagsImage} alt="" className="w-full h-full object-cover" loading="lazy" />
              ) : <div className="w-full h-full" />}
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-warm-300">
              {isPast ? <SunIcon size={14} /> : <CalendarIcon size={14} />}
            </div>
          )}
        </div>

        {isCurrentToday && (
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-clay-500 rounded-full" />
        )}
      </button>
    )
  }

  const activeOutfit = activeDate
    ? cellStates.get(format(activeDate, 'yyyy-MM-dd'))?.outfit
    : undefined

  return (
    <div className="flex flex-col min-h-dvh bg-cream pb-24">
      {/* 标题 */}
      <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-warm-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-warm-900 mb-3 text-center">
          {format(currentMonth, 'yyyy年MM月')}
        </h1>
        <div className="flex justify-between items-center">
          <button
            onClick={goToPreviousMonth}
            className="w-10 h-10 flex items-center justify-center rounded-full text-warm-600 hover:bg-warm-100 pressable"
            aria-label="上一月"
          >
            <ChevronLeft size={20} />
          </button>
          <Button variant="outline" size="sm" onClick={jumpToToday}>
            今天
          </Button>
          <button
            onClick={goToNextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-full text-warm-600 hover:bg-warm-100 pressable"
            aria-label="下一月"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      {/* 星期栏 */}
      <div className="grid grid-cols-7 px-2 py-2 bg-cream border-b border-warm-200 text-center text-xs font-medium text-warm-500">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* 日历主体 */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd')
            const cellState = cellStates.get(dateStr) || { date, hasOutfit: false }
            return renderCalendarCell(cellState)
          })}
        </div>
      </div>

      {/* 详情面板 */}
      {showDetailPanel && activeOutfit && (
        <Modal isOpen={true} onClose={closeAllPanels} title="搭配详情" maxWidth="sm">
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-warm-100 rounded-xl overflow-hidden">
              {(activeOutfit.topImage || activeOutfit.bottomImage || activeOutfit.shoesImage || activeOutfit.bagsImage) ? (
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-px">
                  {activeOutfit.topImage ? (
                    <img src={activeOutfit.topImage} alt="" className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full" />}
                  {activeOutfit.bottomImage ? (
                    <img src={activeOutfit.bottomImage} alt="" className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full" />}
                  {activeOutfit.shoesImage ? (
                    <img src={activeOutfit.shoesImage} alt="" className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full" />}
                  {activeOutfit.bagsImage ? (
                    <img src={activeOutfit.bagsImage} alt="" className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full" />}
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-full text-warm-400">
                  <Shirt size={40} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-medium text-warm-500 mb-1.5">上衣</h4>
                {activeOutfit.topImage ? (
                  <img src={activeOutfit.topImage} alt="" className="w-full h-20 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-20 bg-warm-100 rounded-lg" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-medium text-warm-500 mb-1.5">下装</h4>
                {activeOutfit.bottomImage ? (
                  <img src={activeOutfit.bottomImage} alt="" className="w-full h-20 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-20 bg-warm-100 rounded-lg" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-medium text-warm-500 mb-1.5">鞋子</h4>
                {activeOutfit.shoesImage ? (
                  <img src={activeOutfit.shoesImage} alt="" className="w-full h-20 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-20 bg-warm-100 rounded-lg" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-medium text-warm-500 mb-1.5">包包</h4>
                {activeOutfit.bagsImage ? (
                  <img src={activeOutfit.bagsImage} alt="" className="w-full h-20 object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-20 bg-warm-100 rounded-lg" />
                )}
              </div>
            </div>
            {activeOutfit.note && (
              <div>
                <h4 className="text-xs font-medium text-warm-500 mb-1.5">笔记</h4>
                <p className="text-sm text-warm-700 bg-warm-50 rounded-lg p-3">{activeOutfit.note}</p>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-warm-200">
              <Button variant="outline" onClick={closeAllPanels}>关闭</Button>
              <Button variant="danger" onClick={() => handleDeleteOutfit(activeOutfit.id)}>
                <Trash2 size={16} /> 删除
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 创建搭配面板 */}
      {showCreatePanel && activeDate && (
        <CreateOutfitPanel
          targetDate={activeDate}
          onClose={closeAllPanels}
          onCreate={handleCreateOutfit}
          clothingItems={clothingItems}
        />
      )}
    </div>
  )
}

// 创建搭配面板（独立组件，避免内联定义导致状态重置）
const CreateOutfitPanel: React.FC<{
  targetDate: Date
  onClose: () => void
  onCreate: (record: Omit<OutfitRecord, 'id'>) => void
  clothingItems: any[]
}> = ({ targetDate, onClose, onCreate, clothingItems }) => {
  const [note, setNote] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [topId, setTopId] = useState<string>('')
  const [bottomId, setBottomId] = useState<string>('')

  const items = Array.isArray(clothingItems) ? clothingItems : Object.values(clothingItems)
  const tops = items.filter((i: any) => i.category === 'tops')
  const bottoms = items.filter((i: any) => i.category === 'bottoms')

  const handleSubmit = () => {
    if (!topId || !bottomId) {
      useDailyFitStore.getState().showToast('error', '请选择上衣和下装')
      return
    }
    onCreate({
      topId,
      bottomId,
      date: format(targetDate, 'yyyy-MM-dd'),
      note,
      isFavorite,
      rating: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`为 ${format(targetDate, 'M月d日')} 搭配`} maxWidth="sm">
      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-warm-500 text-center py-4">衣橱还是空的，请先上传衣物</p>
        ) : (
          <>
            <p className="text-sm text-warm-500">选择衣物组合，打造你的专属穿搭。</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">上衣</label>
                <select
                  value={topId}
                  onChange={(e) => setTopId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-warm-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-clay-400"
                >
                  <option value="">选择上衣...</option>
                  {tops.map((item: any) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">下装</label>
                <select
                  value={bottomId}
                  onChange={(e) => setBottomId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-warm-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-clay-400"
                >
                  <option value="">选择下装...</option>
                  {bottoms.map((item: any) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-500 mb-1.5">笔记（可选）</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2.5 border border-warm-300 rounded-lg resize-none text-sm bg-white focus:outline-none focus:ring-2 focus:ring-clay-400"
                rows={2}
                placeholder="添加一些搭配心得..."
              />
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="mr-2 w-4 h-4 accent-clay-500"
              />
              <span className="text-sm text-warm-700">收藏此搭配</span>
            </label>
          </>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">取消</Button>
          {items.length > 0 && (
            <Button onClick={handleSubmit} className="flex-1">保存搭配</Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default CalendarPage
