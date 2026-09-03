import { cn } from '@/lib/utils'

export default function Card({
  children,
  className,
  onClick,
  padding = 'md',
}) {
  const paddings = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm',
        'transition-shadow duration-150',
        onClick && 'cursor-pointer hover:shadow-md',
        paddings[padding],
        className
      )}
    >
      {children}
    </div>
  )
}
