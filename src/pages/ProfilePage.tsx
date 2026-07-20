import React, { useState, useRef, useEffect } from 'react'
import { useDailyFitStore } from '../store/dailyfit-store'
import { Camera, CreditCard as Edit3, Check, Shirt, Calendar, Sparkles, TrendingUp } from 'lucide-react'
import Button from '../components/Button'
import Modal from '../components/Modal'
import { format, parseISO, differenceInDays } from 'date-fns'

const ProfilePage: React.FC = () => {
  const profile = useDailyFitStore((s) => s.profile)
  const clothingItems = useDailyFitStore((s) => s.clothingItems)
  const outfits = useDailyFitStore((s) => s.outfits)
  const fetchProfile = useDailyFitStore((s) => s.fetchProfile)
  const fetchClothingItems = useDailyFitStore((s) => s.fetchClothingItems)
  const updateProfile = useDailyFitStore((s) => s.updateProfile)
  const uploadAvatar = useDailyFitStore((s) => s.uploadAvatar)

  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState(profile.nickname)
  const [bio, setBio] = useState(profile.bio)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
    fetchClothingItems()
  }, [fetchProfile, fetchClothingItems])

  useEffect(() => {
    setNickname(profile.nickname)
    setBio(profile.bio)
  }, [profile.nickname, profile.bio])

  const handleSave = async () => {
    await updateProfile({ nickname: nickname.trim() || '我的衣橱', bio })
    setEditing(false)
    useDailyFitStore.getState().showToast('success', '资料已保存')
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadAvatar(file)
    if (avatarInputRef.current) avatarInputRef.current.value = ''
  }

  // 统计数据
  const totalItems = clothingItems.length
  const totalOutfits = outfits.length
  const recentItems = [...clothingItems]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4)
  const lastAddedDays = clothingItems.length
    ? differenceInDays(new Date(), parseISO(clothingItems.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0].createdAt))
    : 0

  const stats = [
    { label: '衣物总数', value: totalItems, icon: Shirt, color: 'text-clay-500', bg: 'bg-clay-50' },
    { label: '搭配记录', value: totalOutfits, icon: Sparkles, color: 'text-slate2-500', bg: 'bg-slate2-50' },
    { label: '最近添加', value: lastAddedDays === 0 ? '今天' : `${lastAddedDays}天前`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50' },
  ]

  return (
    <div className="min-h-dvh bg-cream pb-24">
      <header className="sticky top-0 z-20 bg-cream/95 backdrop-blur border-b border-warm-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-warm-900">个人主页</h1>
        <button
          onClick={() => setEditing(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full text-warm-600 hover:bg-warm-100 pressable"
          aria-label="编辑资料"
        >
          <Edit3 size={18} />
        </button>
      </header>

      {/* 头像 + 昵称 */}
      <section className="flex flex-col items-center px-4 pt-8 pb-6 animate-fade-in-up">
        <div className="relative">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="w-24 h-24 rounded-full overflow-hidden bg-warm-100 card-shadow pressable relative group"
            aria-label="更换头像"
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.nickname} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-warm-300">
                <Camera size={28} />
              </div>
            )}
            <div className="absolute inset-0 bg-warm-900/0 group-hover:bg-warm-900/30 flex items-center justify-center transition-all">
              <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>
        <h2 className="mt-4 text-xl font-bold text-warm-900">{profile.nickname}</h2>
        <p className="mt-1 text-sm text-warm-500 text-center max-w-xs">{profile.bio}</p>
      </section>

      {/* 统计卡片 */}
      <section className="px-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 card-shadow flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon size={18} className={s.color} />
              </div>
              <span className="text-lg font-bold text-warm-900">{s.value}</span>
              <span className="text-[11px] text-warm-500 mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 最近添加 */}
      <section className="px-4 mt-6">
        <h3 className="text-sm font-semibold text-warm-700 mb-3 flex items-center">
          <Calendar size={16} className="mr-1.5 text-clay-500" />
          最近添加
        </h3>
        {recentItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-sm text-warm-400 card-shadow">
            还没有添加任何衣物
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {recentItems.map((item) => (
              <div key={item.id} className="aspect-square rounded-xl overflow-hidden bg-warm-100 card-shadow">
                <img
                  src={item.thumbnailUrl || item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarSelect}
        className="hidden"
      />

      {/* 编辑资料弹窗 */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="编辑资料" maxWidth="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              className="w-full px-3 py-2.5 border border-warm-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-clay-400"
              placeholder="输入你的昵称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-1.5">简介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={100}
              rows={3}
              className="w-full px-3 py-2.5 border border-warm-300 rounded-lg text-sm resize-none bg-white focus:outline-none focus:ring-2 focus:ring-clay-400"
              placeholder="介绍一下自己吧"
            />
            <p className="text-xs text-warm-400 mt-1 text-right">{bio.length}/100</p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">取消</Button>
            <Button onClick={handleSave} className="flex-1">
              <Check size={16} /> 保存
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProfilePage
