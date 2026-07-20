import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-clay-500 text-white hover:bg-clay-600 active:bg-clay-700 shadow-sm',
  outline: 'bg-white text-warm-700 border border-warm-300 hover:bg-warm-50 active:bg-warm-100',
  ghost: 'bg-transparent text-warm-600 hover:bg-warm-100 active:bg-warm-200',
  danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:bg-red-200',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg min-h-tap',
  md: 'px-4 py-2.5 text-sm rounded-xl min-h-tap',
  lg: 'px-6 py-3 text-base rounded-xl min-h-tap',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-medium pressable disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
