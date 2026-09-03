/**
 * Utility for merging class names conditionally.
 * A lightweight alternative to clsx + tailwind-merge.
 */
export function cn(...classes) {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim()
}
