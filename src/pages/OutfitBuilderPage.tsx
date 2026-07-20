import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/dailyfit-store'; // Zustand store 引入
import { ClothingItem, OutfitRecord } from '../types';
import { format, parseISO } from 'date-fns';
import { Upload, Shuffle, Save, Star, StarOff, X, ZoomIn } from 'lucide-react';

// 搭配工作台页面组件
const OutfitStudioPage: React.FC = () => {
  // 从 Zustand Store 获取状态和方法
  const { 
    clothingItems, 
    addOutfitRecord, 
    getRandomOutfitPair, 
    isOnline 
  } = useStore();

  // 状态管理
  const [topItem, setTopItem] = useState<ClothingItem | null>(null);
  const [bottomItem, setBottomItem] = useState<ClothingItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'vertical' | 'horizontal'>('vertical'); // 布局模式
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [previewScale, setPreviewScale] = useState<number>(1); // 预览图缩放

  // 过滤出 Tops 和 Bottoms
const items = Array.isArray(clothingItems) ? clothingItems : Object.values(clothingItems);
const tops = items.filter((item: ClothingItem) => item.type === 'top');
const bottoms = items.filter((item: ClothingItem) => item.type === 'bottom');

  // 初始化：如果没有选中衣物，尝试随机搭配
  useEffect(() => {
    if (!topItem && !bottomItem && (tops.length > 0 || bottoms.length > 0)) {
      handleRandomOutfit();
    }
  }, []);

  // 显示 Toast 提示
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // 处理选择 Top 衣物
  const handleSelectTop = (item: ClothingItem) => {
    setTopItem(item);
    showToastMessage(`已选择上衣：${item.name}`);
  };

  // 处理选择 Bottom 衣物
  const handleSelectBottom = (item: ClothingItem) => {
    setBottomItem(item);
    showToastMessage(`已选择下装：${item.name}`);
  };

  // 随机搭配算法调用
  const handleRandomOutfit = () => {
    try {
      const pair = getRandomOutfitPair();
      if (pair.top) setTopItem(pair.top);
      if (pair.bottom) setBottomItem(pair.bottom);
      showToastMessage('已生成随机搭配');
    } catch (error) {
      showToastMessage('无法生成搭配：库存不足');
    }
  };

  // 切换收藏状态
  const toggleFavorite = () => {
    setIsFavorite(prev => !prev);
    showToastMessage(isFavorite ? '已取消收藏' : '已添加到收藏');
  };

  // 保存搭配记录
  const handleSaveOutfit = async () => {
    if (!topItem || !bottomItem) {
      showToastMessage('请先选择上衣和下装');
      return;
    }

    setIsLoading(true);

    try {
      const newOutfit: Omit<OutfitRecord, 'id'> = {
        topId: topItem.id,
        bottomId: bottomItem.id,
        date: selectedDate,
        note,
        isFavorite,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addOutfitRecord(newOutfit);
      showToastMessage('搭配已保存！');
    } catch (error) {
      console.error('保存搭配失败:', error);
      showToastMessage('保存失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 切换布局模式（移动端左右滑动可触发）
  const toggleLayout = () => {
    setLayoutMode(prev => (prev === 'vertical' ? 'horizontal' : 'vertical'));
  };

  // 缩放预览图
  const handleZoom = (delta: number) => {
    setPreviewScale(prev => {
      const newValue = prev + delta;
      return Math.min(Math.max(1, newValue), 3); // 限制在 1x - 3x 之间
    });
  };

  // 空状态提示
  if (clothingItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <img src="/empty-closet.png" alt="空衣橱" className="w-40 h-40 opacity-50 mb-4" />
        <h2 className="text-xl font-medium text-gray-700 mb-2">你的衣橱还是空的</h2>
        <p className="text-gray-500 mb-6">去「衣橱」页面上传你的第一件衣物吧！</p>
        <button
          onClick={() => window.location.href = '/closet'}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow hover:bg-indigo-700 transition"
        >
          <Upload size={20} />
          去上传
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 pb-20 relative">
      {/* 页面标题 */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800">搭配工作台</h1>
        <button
          onClick={toggleLayout}
          className="p-2 text-gray-600 hover:text-gray-800"
          aria-label="切换布局"
        >
          {layoutMode === 'vertical' ? '↔️' : '↕️'}
        </button>
      </header>

      {/* 组合预览区 */}
      <main
        className={`flex-1 overflow-hidden transition-all duration-300 ${
          layoutMode === 'vertical'
            ? 'flex flex-col'
            : 'flex flex-row items-center justify-center'
        }`}
        style={{ transform: `scale(${previewScale})`, transformOrigin: 'center center' }}
      >
        {/* 上栏 - Top 衣物 */}
        <div
          className={`relative w-full flex-1 flex items-center justify-center p-4 cursor-pointer min-h-[200px] ${
            topItem ? 'bg-white' : 'bg-gray-100'
          }`}
          onClick={() => document.getElementById('top-selector')?.scrollIntoView({ behavior: 'smooth' })}
        >
          {topItem ? (
            <div className="text-center">
              <img
                src={topItem.imageUrl}
                alt={topItem.name}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md"
                loading="lazy"
              />
              <p className="mt-2 text-sm text-gray-600">{topItem.name}</p>
            </div>
          ) : (
            <p className="text-gray-400">点击选择上衣</p>
          )}
        </div>

        {/* 下栏 - Bottom 衣物 */}
        <div
          className={`relative w-full flex-1 flex items-center justify-center p-4 cursor-pointer min-h-[200px] ${
            bottomItem ? 'bg-white' : 'bg-gray-100'
          }`}
          onClick={() => document.getElementById('bottom-selector')?.scrollIntoView({ behavior: 'smooth' })}
        >
          {bottomItem ? (
            <div className="text-center">
              <img
                src={bottomItem.imageUrl}
                alt={bottomItem.name}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md"
                loading="lazy"
              />
              <p className="mt-2 text-sm text-gray-600">{bottomItem.name}</p>
            </div>
          ) : (
            <p className="text-gray-400">点击选择下装</p>
          )}
        </div>
      </main>

      {/* 手势缩放控制 */}
      <div className="absolute top-20 right-4 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(0.2)}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50 active:bg-gray-100"
          aria-label="放大"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={() => handleZoom(-0.2)}
          className="p-2 bg-white rounded-full shadow hover:bg-gray-50 active:bg-gray-100"
          aria-label="缩小"
        >
          <X size={20} />
        </button>
      </div>

      {/* 衣物选择器区域 */}
      <section id="top-selector" className="bg-white border-t p-4 mt-2">
        <h2 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
          选择上衣 (Tops)
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {tops.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无上衣，请上传</p>
          ) : (
            tops.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectTop(item)}
                className={`flex-shrink-0 w-20 h-28 border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  topItem?.id === item.id ? 'border-indigo-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ minWidth: '5rem' }}
              >
                <img
                  src={item.thumbnailUrl || item.imageUrl}
                  alt={item.name}
                  className="w-full h-20 object-cover"
                />
                <p className="text-xs text-center p-1 text-gray-600 truncate">{item.name}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section id="bottom-selector" className="bg-white border-t p-4 mt-1">
        <h2 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <span className="inline-block w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
          选择下装 (Bottoms)
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {bottoms.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无下装，请上传</p>
          ) : (
            bottoms.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectBottom(item)}
                className={`flex-shrink-0 w-20 h-28 border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  bottomItem?.id === item.id ? 'border-pink-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ minWidth: '5rem' }}
              >
                <img
                  src={item.thumbnailUrl || item.imageUrl}
                  alt={item.name}
                  className="w-full h-20 object-cover"
                />
                <p className="text-xs text-center p-1 text-gray-600 truncate">{item.name}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 底部操作栏 */}
      <div className="bottom-16 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* 日期选择 */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* 笔记输入 */}
          <textarea
            placeholder="添加搭配笔记..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
            rows={1}
          />

          {/* 收藏按钮 */}
          <button
            onClick={toggleFavorite}
            className={`p-3 rounded-full transition ${
              isFavorite ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-500'
            } hover:shadow`}
            aria-label={isFavorite ? '取消收藏' : '添加收藏'}
          >
            {isFavorite ? <Star size={20} fill="currentColor" /> : <StarOff size={20} />}
          </button>

          {/* 随机搭配按钮 */}
          <button
            onClick={handleRandomOutfit}
            className="p-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition hover:shadow"
            aria-label="随机搭配"
          >
            <Shuffle size={20} />
          </button>

          {/* 保存按钮 */}
          <button
            onClick={handleSaveOutfit}
            disabled={isLoading || !topItem || !bottomItem}
            className={`flex-1 py-3 px-6 rounded-full text-white font-medium shadow transition ${
              isLoading || !topItem || !bottomItem
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
            }`}
          >
            {isLoading ? '保存中...' : '保存搭配'}
          </button>
        </div>
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm z-50 shadow-lg animate-fade-in-up">
          {toastMessage}
        </div>
      )}

      {/* 网络状态提示 */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-xs z-50 shadow">
          📵 离线模式（部分功能受限）
        </div>
      )}

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OutfitStudioPage;