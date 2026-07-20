import React, { useState, useRef, useEffect } from 'react'
import { useDailyFitStore } from '../store/dailyfit-store'
import type { ClothingItem } from '../types'
import { Upload, X, Tag, Image as ImageIcon, Camera, Trash2, Check } from 'lucide-react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import Button from '../components/Button'

type Category = 'tops' | 'bottoms'

const categoryLabels: Record<Category, string> = {
  tops: '上衣',
  bottoms: '裤子/裙子',
}

const ClothingCard: React.FC<{
  item: ClothingItem
  onLongPress: (item: ClothingItem) => void
  onClick: (item: ClothingItem) => void
}> = ({ item, onLongPress, onClick }) => {
  const [isPressed, setIsPressed] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const pressTimer = useRef<number | null>(null)

  const handleTouchStart = () => {
    setIsPressed(true)
    pressTimer.current = window.setTimeout(() => {
      onLongPress(item)
    }, 500)
  }

  const handleTouchEnd = () => {
    setIsPressed(false)
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-warm-100 card-shadow card-shadow-hover transition-all duration-200 ${
        isPressed ? 'scale-95' : 'scale-100'
      }`}
      style={{ touchAction: 'manipulation' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={() => onClick(item)}
    >
      <div className="aspect-square w-full relative">
        {!imageLoaded && <div className="absolute inset-0 skeleton" />}
        <img
          src={item.thumbnailUrl || item.imageUrl}
          alt={item.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-warm-900/40 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-xs font-medium text-white truncate drop-shadow-md">{item.name}</p>
      </div>
      {item.tags && item.tags.length > 0 && (
        <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end">
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="bg-white/90 backdrop-blur text-warm-700 text-[10px] px-2 py-0.5 rounded-full font-medium"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 2 && (
            <span className="bg-white/90 backdrop-blur text-warm-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
              +{item.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

const ImagePreviewModal: React.FC<{
  imageUrl: string | null
  onClose: () => void
}> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!imageUrl) return null

  return (
    <div
      className="fixed inset-0 bg-warm-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt="衣物大图"
        className="max-w-full max-h-full object-contain rounded-xl animate-scale-in"
      />
      <button
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 pressable"
        onClick={onClose}
        aria-label="关闭"
      >
        <X size={20} />
      </button>
    </div>
  )
}

const TagEditor: React.FC<{
  tags: string[]
  onChange: (tags: string[]) => void
}> = ({ tags, onChange }) => {
  const [inputValue, setInputValue] = useState('')
  const [localTags, setLocalTags] = useState<string[]>(tags || [])

  useEffect(() => {
    setLocalTags(tags || [])
  }, [tags])

  const addTag = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !localTags.includes(trimmed)) {
      const newTags = [...localTags, trimmed]
      setLocalTags(newTags)
      onChange(newTags)
      setInputValue('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = localTags.filter((tag) => tag !== tagToRemove)
    setLocalTags(newTags)
    onChange(newTags)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-warm-700">标签</label>
      <div className="flex flex-wrap gap-2 mb-2 min-h-[28px]">
        {localTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-clay-50 text-clay-700 border border-clay-200"
          >
            {tag}
            <button
              type="button"
              className="ml-1.5 inline-flex text-clay-400 hover:text-clay-600"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="输入标签并回车"
          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-lg border border-warm-300 focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-clay-400 sm:text-sm bg-white"
        />
        <button
          type="button"
          onClick={addTag}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-r-lg text-white bg-clay-500 hover:bg-clay-600 pressable"
        >
          添加
        </button>
      </div>
    </div>
  )
}

const ContextMenu: React.FC<{
  item: ClothingItem
  onClose: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<ClothingItem>) => void
}> = ({ item, onClose, onDelete, onUpdate }) => {
  const [showTagEditor, setShowTagEditor] = useState(false)
  const [currentTags, setCurrentTags] = useState(item.tags || [])

  const handleDelete = () => {
    if (window.confirm('确定要删除这件衣物吗？')) {
      onDelete(item.id)
      onClose()
    }
  }

  const handleUpdateTags = (tags: string[]) => {
    setCurrentTags(tags)
    onUpdate(item.id, { tags })
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={item.name} maxWidth="sm">
      {!showTagEditor ? (
        <div className="space-y-2">
          <button
            onClick={() => setShowTagEditor(true)}
            className="w-full flex items-center px-4 py-3 text-left text-warm-700 hover:bg-warm-50 rounded-xl pressable"
          >
            <Tag className="h-5 w-5 mr-3 text-clay-500" />
            <span className="text-sm font-medium">编辑标签</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-xl pressable"
          >
            <Trash2 className="h-5 w-5 mr-3" />
            <span className="text-sm font-medium">删除衣物</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <TagEditor tags={currentTags} onChange={handleUpdateTags} />
          <Button variant="outline" onClick={() => setShowTagEditor(false)} className="w-full">
            <Check size={16} /> 完成
          </Button>
        </div>
      )}
    </Modal>
  )
}

const ClosetPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('tops')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ClothingItem | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const {
    clothingItems,
    addClothingItem,
    updateClothingItem,
    deleteClothingItem,
    fetchClothingItems,
  } = useDailyFitStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        await fetchClothingItems()
      } catch (error) {
        console.error('加载衣物数据失败:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [fetchClothingItems])

  const items = Array.isArray(clothingItems) ? clothingItems : Object.values(clothingItems)
  const filteredItems = items.filter((item: ClothingItem) => item.category === activeCategory)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    handleImageUpload(files[0])
  }

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment')
      fileInputRef.current.click()
    }
  }

  const handleSelectFromAlbum = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture')
      fileInputRef.current.click()
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      useDailyFitStore.getState().showToast('error', '请选择有效的图片文件')
      return
    }

    setUploadProgress(0)
    try {
      await addClothingItem(file, activeCategory, (progress) => {
        setUploadProgress(progress)
      })
      useDailyFitStore.getState().showToast('success', '衣物已添加')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      console.error('上传衣物失败:', error)
      useDailyFitStore.getState().showToast('error', '上传失败，请重试')
    } finally {
      setUploadProgress(null)
    }
  }

  const openImagePreview = (item: ClothingItem) => {
    setImagePreview(item.imageUrl || null)
  }

  const closeImagePreview = () => setImagePreview(null)

  const openContextMenu = (item: ClothingItem) => setContextMenu(item)
  const closeContextMenu = () => setContextMenu(null)

  const handleDeleteClothing = async (id: string) => {
    try {
      await deleteClothingItem(id)
      useDailyFitStore.getState().showToast('success', '已删除')
    } catch (error) {
      console.error('删除衣物失败:', error)
      useDailyFitStore.getState().showToast('error', '删除失败')
    }
  }

  const handleUpdateClothing = async (id: string, updates: Partial<ClothingItem>) => {
    try {
      await updateClothingItem(id, updates)
      useDailyFitStore.getState().showToast('success', '已更新')
    } catch (error) {
      console.error('更新衣物失败:', error)
      useDailyFitStore.getState().showToast('error', '更新失败')
    }
  }

  return (
    <div className="min-h-dvh bg-cream pb-24">
      {/* 顶部标题 */}
      <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-warm-200 px-4 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-warm-900 mb-3">我的衣橱</h1>

        {/* 分类切换 */}
        <div className="flex gap-1 p-1 bg-warm-100 rounded-xl">
          {(Object.keys(categoryLabels) as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all pressable ${
                activeCategory === cat
                  ? 'bg-white text-clay-600 shadow-sm'
                  : 'text-warm-500 hover:text-warm-700'
              }`}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>

        {/* 上传按钮组 */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSelectFromAlbum}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-clay-500 hover:bg-clay-600 pressable shadow-sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            从相册选择
          </button>
          <button
            onClick={handleTakePhoto}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-xl text-warm-700 bg-warm-100 hover:bg-warm-200 pressable"
          >
            <Camera className="h-4 w-4 mr-2" />
            拍照上传
          </button>
        </div>

        {/* 上传进度条 */}
        {uploadProgress !== null && (
          <div className="mt-3 animate-fade-in">
            <div className="flex justify-between text-xs text-warm-500 mb-1">
              <span>上传中...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-warm-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-clay-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* 衣物网格 */}
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-warm-100">
                <div className="aspect-square w-full skeleton" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={<ImageIcon size={32} />}
            title="衣橱还是空的"
            description="上传第一件衣物，开始打造你的数字衣橱"
            action={
              <Button onClick={handleSelectFromAlbum}>
                <Upload size={16} /> 上传衣物
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredItems.map((item) => (
              <ClothingCard
                key={item.id}
                item={item}
                onLongPress={openContextMenu}
                onClick={openImagePreview}
              />
            ))}
          </div>
        )}
      </div>

      <ImagePreviewModal imageUrl={imagePreview} onClose={closeImagePreview} />

      {contextMenu && (
        <ContextMenu
          item={contextMenu}
          onClose={closeContextMenu}
          onDelete={handleDeleteClothing}
          onUpdate={handleUpdateClothing}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}

export default ClosetPage
