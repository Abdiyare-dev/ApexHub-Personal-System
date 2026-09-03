import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
  secondary: 'bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500',
  outline: 'border border-slate-300 hover:bg-slate-50 text-slate-700 focus:ring-slate-400',
  ghost: 'hover:bg-slate-100 text-slate-600 focus:ring-slate-400',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
}

const sizes = {
  sm: 'py-1.5 px-3 text-sm',
  md: 'py-2 px-4 text-sm',
  lg: 'py-2.5 px-5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  children,
  className,
  ...rest
}) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
        'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
