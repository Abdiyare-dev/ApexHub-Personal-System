import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, helperText, type = 'text', className, id, ...rest },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg border text-sm',
          'transition-colors duration-150 outline-none',
          'placeholder:text-slate-400',
          error
            ? 'border-red-500 focus:ring-2 focus:ring-red-500'
            : 'border-slate-300 focus:ring-2 focus:ring-emerald-500',
          className
        )}
        {...rest}
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  )
})

export default Input
