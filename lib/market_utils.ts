import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  if (isNaN(num) || num === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5
  }).format(num)
}

export function getChangeColor(change: number): string {
  if (isNaN(change) || change === undefined) return 'text-gray-500'
  return change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-gray-500'
}

