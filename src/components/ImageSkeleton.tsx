/**
 * 图片加载骨架屏
 * - 图片 onLoad 前显示 shimmer 动画
 */
export default function ImageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton rounded-xl ${className}`} />
  )
}