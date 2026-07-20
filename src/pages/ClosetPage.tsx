import React, { useState, useRef, useEffect } from 'react';
import { useClothingStore } from '../store/dailyfit-store';
import { ClothingItem } from '../types';
import { Upload, X, Tag, Image as ImageIcon } from 'lucide-react';

// 定义衣橱分类
type Category = 'tops' | 'bottoms';

// 衣物卡片组件
const ClothingCard: React.FC<{
  item: ClothingItem;
  onLongPress: (item: ClothingItem) => void;
  onClick: (item: ClothingItem) => void;
}> = ({ item, onLongPress, onClick }) => {
  const [isPressed, setIsPressed] = useState(false);
  const pressTimer = useRef<number | null>(null);

  // 处理长按事件
  const handleTouchStart = () => {
    setIsPressed(true);
    pressTimer.current = window.setTimeout(() => {
      onLongPress(item);
    }, 500); // 长按500ms触发
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <div
      className={`relative rounded-lg overflow-hidden shadow-md transition-transform ${
        isPressed ? 'scale-95' : 'scale-100'
      }`}
      style={{ touchAction: 'manipulation' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onClick={() => onClick(item)}
    >
      <img
        src={item.thumbnailUrl || item.imageUrl}
        alt={item.name}
        className="w-full h-48 object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
        <span className="text-white opacity-0 hover:opacity-100 transition-opacity">
          点击预览
        </span>
      </div>
      {item.tags && item.tags.length > 0 && (
        <div className="absolute top-2 right-2 flex flex-wrap gap-1">
          {item.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="bg-white bg-opacity-75 text-gray-800 text-xs px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 2 && (
            <span className="bg-white bg-opacity-75 text-gray-800 text-xs px-2 py-1 rounded-full">
              +{item.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// 图片预览模态框
const ImagePreviewModal: React.FC<{
  imageUrl: string;
  onClose: () => void;
}> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="max-w-3xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt="衣物大图"
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <button
        className="absolute top-4 right-4 text-white text-2xl"
        onClick={onClose}
        aria-label="关闭"
      >
        ×
      </button>
    </div>
  );
};

// 标签编辑组件
const TagEditor: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
}> = ({ tags, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const [localTags, setLocalTags] = useState<string[]>(tags || []);

  useEffect(() => {
    setLocalTags(tags || []);
  }, [tags]);

  const addTag = () => {
    if (inputValue.trim() && !localTags.includes(inputValue.trim())) {
      const newTags = [...localTags, inputValue.trim()];
      setLocalTags(newTags);
      onChange(newTags);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = localTags.filter((tag) => tag !== tagToRemove);
    setLocalTags(newTags);
    onChange(newTags);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">标签</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {localTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {tag}
            <button
              type="button"
              className="ml-1.5 inline-flex text-gray-400 hover:text-gray-600"
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
          onKeyPress={(e) => e.key === 'Enter' && addTag()}
          placeholder="输入标签并回车"
          className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <button
          type="button"
          onClick={addTag}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          添加
        </button>
      </div>
    </div>
  );
};

// 上下文菜单组件
const ContextMenu: React.FC<{
  item: ClothingItem;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ClothingItem>) => void;
}> = ({ item, onClose, onDelete, onUpdate }) => {
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [currentTags, setCurrentTags] = useState(item.tags || []);

  const handleDelete = () => {
    if (window.confirm('确定要删除这件衣物吗？')) {
      onDelete(item.id);
      onClose();
    }
  };

  const handleUpdateTags = (tags: string[]) => {
    setCurrentTags(tags);
    onUpdate(item.id, { tags });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40" onClick={onClose}>
      <div
        className="bg-white rounded-lg p-4 w-80 max-w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-medium text-gray-900 mb-4">{item.name}</h3>
        
        {!showTagEditor ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowTagEditor(true)}
              className="w-full flex items-center px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <Tag className="h-5 w-5 mr-3 text-gray-500" />
              编辑标签
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center px-4 py-2 text-left text-red-700 hover:bg-red-50 rounded-md"
            >
              <X className="h-5 w-5 mr-3" />
              删除衣物
            </button>
          </div>
        ) : (
          <>
            <TagEditor tags={currentTags} onChange={handleUpdateTags} />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setShowTagEditor(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                返回
              </button>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          关闭
        </button>
      </div>
    </div>
  );
};

// 空状态组件
const EmptyState: React.FC<{ onUpload: () => void }> = ({ onUpload }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">你的衣橱还是空的</h3>
    <p className="text-gray-500 mb-6">上传第一件衣物，开始打造你的数字衣橱</p>
    <button
      onClick={onUpload}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <Upload className="h-4 w-4 mr-2" />
      上传衣物
    </button>
  </div>
);

// 主组件
const WardrobePage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('tops');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ClothingItem | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 使用 Zustand Store
  const {
    clothingItems,
    addClothingItem,
    updateClothingItem,
    deleteClothingItem,
    fetchClothingItems,
  } = useClothingStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载衣物数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchClothingItems();
      } catch (error) {
        console.error('加载衣物数据失败:', error);
        // 显示错误提示（可通过Toast组件实现）
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchClothingItems]);

  // 过滤当前分类的衣物
  const filteredItems = (Array.isArray(clothingItems) ? clothingItems : Object.values(clothingItems)).filter(
  (item: ClothingItem) => item.category === activeCategory
);

  // 文件选择处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    handleImageUpload(files[0]);
  };

  // 拍照上传处理
  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = 'environment';
      fileInputRef.current.click();
    }
  };

  // 相册选择处理
  const handleSelectFromAlbum = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = 'image/*';
      fileInputRef.current.capture = undefined;
      fileInputRef.current.click();
    }
  };

  // 图片上传核心逻辑
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择有效的图片文件');
      return;
    }

    setUploadProgress(0);

    try {
      // 调用 store 的图片处理和添加方法
      await addClothingItem(file, activeCategory, (progress) => {
        setUploadProgress(progress);
      });

      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('上传衣物失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploadProgress(null);
    }
  };

  // 打开图片预览
  const openImagePreview = (item: ClothingItem) => {
    setImagePreview(item.imageUrl);
  };

  // 关闭图片预览
  const closeImagePreview = () => {
    setImagePreview(null);
  };

  // 打开上下文菜单
  const openContextMenu = (item: ClothingItem) => {
    setContextMenu(item);
  };

  // 关闭上下文菜单
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 删除衣物
  const handleDeleteClothing = async (id: string) => {
    try {
      await deleteClothingItem(id);
    } catch (error) {
      console.error('删除衣物失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 更新衣物信息
  const handleUpdateClothing = async (
    id: string,
    updates: Partial<ClothingItem>
  ) => {
    try {
      await updateClothingItem(id, updates);
    } catch (error) {
      console.error('更新衣物失败:', error);
      alert('更新失败，请重试');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 分类切换 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex space-x-1 rounded-lg p-1 bg-gray-100">
          <button
            onClick={() => setActiveCategory('tops')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeCategory === 'tops'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            上衣
          </button>
          <button
            onClick={() => setActiveCategory('bottoms')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeCategory === 'bottoms'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            裤子/裙子
          </button>
        </div>

        {/* 上传按钮组 */}
        <div className="flex space-x-2 mt-3">
          <button
            onClick={handleSelectFromAlbum}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            从相册选择
          </button>
          <button
            onClick={handleTakePhoto}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            拍照上传
          </button>
        </div>

        {/* 上传进度条 */}
        {uploadProgress !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>上传中...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* 衣物网格布局 */}
      <div className="p-4">
        {isLoading ? (
          // Skeleton 加载状态
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden bg-gray-200 animate-pulse"
                style={{ paddingTop: '100%' }}
              ></div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          // 空状态
          <EmptyState onUpload={handleSelectFromAlbum} />
        ) : (
          // 衣物网格
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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

      {/* 图片预览模态框 */}
      {imagePreview && (
        <ImagePreviewModal imageUrl={imagePreview} onClose={closeImagePreview} />
      )}

      {/* 上下文菜单 */}
      {contextMenu && (
        <ContextMenu
          item={contextMenu}
          onClose={closeContextMenu}
          onDelete={handleDeleteClothing}
          onUpdate={handleUpdateClothing}
        />
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default WardrobePage;