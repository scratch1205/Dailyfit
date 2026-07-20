/**
 * DailyFit 移动端 Web 应用项目结构与 TypeScript 数据模型定义
 * 技术栈：React + Vite + TypeScript + Tailwind CSS
 * 生成时间：2026-07-19
 *
 * 本文件包含：
 * 1. 完整的项目目录结构树（以注释形式呈现）
 * 2. 核心 TypeScript 数据模型定义
 * 3. 移动端存储优化与 PWA 相关类型
 * 4. 工具函数接口定义
 */

// =============================
// 1. 项目目录结构树（推荐）
// =============================

/*
dailyfit-mobile/
├── public/                     # 静态资源目录
│   ├── favicon.ico
│   ├── manifest.json           # PWA 配置文件
│   └── assets/
│       ├── icons/              # 应用图标（PWA）
│       └── images/             # 公共图片资源
│
├── src/
│   ├── components/             # 可复用 UI 组件
│   │   ├── ui/                 # 基础组件（按钮、卡片等）
│   │   ├── layout/             # 布局组件
│   │   └── shared/             # 跨模块共享组件
│   │
│   ├── pages/                  # 页面级组件
│   │   ├── Home/
│   │   ├── Wardrobe/
│   │   ├── Outfits/
│   │   ├── Profile/
│   │   └── Settings/
│   │
│   ├── models/                 # TypeScript 数据模型（本文件所在位置）
│   │   └── index.ts            # 模型导出入口
│   │
│   ├── services/               # 数据服务层
│   │   ├── database/           # 本地数据库操作（IndexedDB / LocalForage）
│   │   ├── api/                # 远程 API 接口封装
│   │   └── sync/               # 数据同步逻辑
│   │
│   ├── store/                  # 状态管理（如 Zustand 或 Redux Toolkit）
│   │   ├── slices/
│   │   └── index.ts
│   │
│   ├── utils/                  # 工具函数
│   │   ├── storage.ts          # 本地存储封装
│   │   ├── imageOptimizer.ts   # 图片压缩工具
│   │   └── validators.ts       # 表单验证等
│   │
│   ├── hooks/                  # 自定义 Hook
│   │   ├── useCachedData.ts
│   │   └── useNetworkStatus.ts
│   │
│   ├── assets/                 # 模块内静态资源
│   │   ├── styles/
│   │   │   └── globals.css     # Tailwind 入口样式
│   │   └── images/
│   │
│   ├── App.tsx                 # 根组件
│   ├── main.tsx                # 应用入口
│   └── vite-env.d.ts           # Vite 环境声明
│
├── .env                        # 环境变量配置
├── .gitignore
├── index.html                  # HTML 主入口
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TypeScript 配置
├── tailwind.config.js          # Tailwind CSS 配置
├── postcss.config.js
├── package.json
└── README.md
*/

// =============================
// 2. 核心数据模型定义
// =============================

/**
 * 服装单品数据模型
 */
export interface ClothingItem {
  /**
   * 唯一标识符
   */
  id: string;

  /**
   * 服装名称
   */
  name: string;

  /**
   * 服装类别（如上衣、裤子、鞋子等）
   */
  category: string;

  /**
   * 子类别（如T恤、衬衫、牛仔裤等）
   */
  subCategory?: string;

  /**
   * 品牌名称
   */
  brand?: string;

  /**
   * 颜色数组（支持多色）
   */
  colors: string[];

  /**
   * 季节标签（春、夏、秋、冬）
   */
  seasons: Season[];

  /**
   * 图片 URL（原始图）
   */
  imageUrl: string;

  /**
   * 缩略图 URL（用于列表展示，移动端优化）
   */
  thumbnailUrl?: string;

  /**
   * 是否收藏
   */
  isFavorite: boolean;

  /**
   * 购买日期
   */
  purchaseDate?: string; // ISO 8601 格式

  /**
   * 价格（单位：分）
   */
  price?: number;

  /**
   * 穿着次数统计
   */
  wearCount: number;

  /**
   * 最后一次穿着日期
   */
  lastWornDate?: string; // ISO 8601 格式

  /**
   * 创建时间戳
   */
  createdAt: string; // ISO 8601

  /**
   * 更新时间戳
   */
  updatedAt: string; // ISO 8601
}

/**
 * 搭配记录数据模型
 */
export interface OutfitRecord {
  /**
   * 唯一标识符
   */
  id: string;

  /**
   * 搭配名称
   */
  name: string;

  /**
   * 包含的服装 ID 列表
   */
  clothingIds: string[];

  /**
   * 搭配描述
   */
  description?: string;

  /**
   * 搭配场合（如通勤、休闲、正式等）
   */
  occasion?: string;

  /**
   * 适用季节
   */
  seasons: Season[];

  /**
   * 封面图片 URL（可为合成图或用户上传）
   */
  coverImageUrl: string;

  /**
   * 缩略图 URL（移动端优化）
   */
  thumbnailUrl?: string;

  /**
   * 是否设为推荐搭配
   */
  isRecommended: boolean;

  /**
   * 使用次数
   */
  usageCount: number;

  /**
   * 最后使用日期
   */
  lastUsedDate?: string; // ISO 8601

  /**
   * 创建时间戳
   */
  createdAt: string; // ISO 8601

  /**
   * 更新时间戳
   */
  updatedAt: string; // ISO 8601
}

/**
 * 季节枚举类型
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// =============================
// 3. 移动端存储优化相关类型
// =============================

/**
 * 图片压缩配置
 */
export interface ImageCompressionConfig {
  /**
   * 目标质量（0-1）
   */
  quality: number;

  /**
   * 最大宽度（像素）
   */
  maxWidth: number;

  /**
   * 最大高度（像素）
   */
  maxHeight: number;

  /**
   * 是否启用 WebP 格式（移动端优先）
   */
  useWebP: boolean;

  /**
   * 是否在低端设备上进一步降低质量
   */
  adaptiveQuality: boolean;
}

/**
 * 本地缓存策略
 */
export interface CacheStrategy {
  /**
   * 缓存键前缀
   */
  keyPrefix: string;

  /**
   * 过期时间（毫秒）
   */
  ttl: number;

  /**
   * 最大缓存条目数
   */
  maxItems: number;

  /**
   * 是否启用内存缓存（L1）
   */
  inMemory: boolean;

  /**
   * 是否持久化到 IndexedDB（L2）
   */
  persistent: boolean;
}

/**
 * 数据库连接配置
 */
export interface DatabaseConfig {
  /**
   * 数据库名称
   */
  name: string;

  /**
   * 版本号
   */
  version: number;

  /**
   * 对象仓库配置
   */
  stores: Array<{
    name: string;
    keyPath: string;
    autoIncrement: boolean;
    indices?: Array<{
      name: string;
      keyPath: string;
      unique: boolean;
    }>;
  }>;
}

// =============================
// 4. PWA 相关类型定义
// =============================

/**
 * PWA 安装横幅控制状态
 */
export interface PwaInstallState {
  /**
   * 是否显示安装提示
   */
  showInstallPrompt: boolean;

  /**
   * 安装事件引用（用于延迟安装）
   */
  deferredPrompt: Event | null;

  /**
   * 安装状态
   */
  installStatus: 'idle' | 'installing' | 'installed' | 'failed';
}

/**
 * 离线同步任务
 */
export interface SyncTask {
  /**
   * 任务 ID
   */
  id: string;

  /**
   * 操作类型（create, update, delete）
   */
  operation: 'create' | 'update' | 'delete';

  /**
   * 实体类型
   */
  entityType: 'clothing' | 'outfit';

  /**
   * 序列化后的数据快照
   */
  payload: string;

  /**
   * 重试次数
   */
  retryCount: number;

  /**
   * 创建时间
   */
  createdAt: string; // ISO 8601
}

// =============================
// 5. 工具函数类型定义
// =============================

/**
 * 异步结果封装
 */
export type AsyncResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * 分页查询参数
 */
export interface PaginationParams {
  /**
   * 当前页码（从1开始）
   */
  page: number;

  /**
   * 每页数量
   */
  limit: number;

  /**
   * 排序字段
   */
  sortBy?: string;

  /**
   * 排序方向
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 分页响应结果
 */
export interface PaginatedResult<T> {
  /**
   * 当前页数据
   */
  items: T[];

  /**
   * 总数
   */
  total: number;

  /**
   * 当前页码
   */
  page: number;

  /**
   * 每页数量
   */
  limit: number;

  /**
   * 总页数
   */
  totalPages: number;
}

/**
 * 数据校验器函数类型
 */
export type Validator<T> = (value: T) => { valid: boolean; message?: string };

// =============================
// 6. 导出所有类型
// =============================

export type {
  ClothingItem,
  OutfitRecord,
  Season,
  ImageCompressionConfig,
  CacheStrategy,
  DatabaseConfig,
  PwaInstallState,
  SyncTask,
  AsyncResult,
  PaginationParams,
  PaginatedResult,
  Validator,
};

export default {
  ClothingItem,
  OutfitRecord,
  Season,
  ImageCompressionConfig,
  CacheStrategy,
  DatabaseConfig,
  PwaInstallState,
  SyncTask,
  AsyncResult,
  PaginationParams,
  PaginatedResult,
  Validator,
};