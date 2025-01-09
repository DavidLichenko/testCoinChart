export function formatNumber(num: number, decimals: number = 5): string {
  return num.toFixed(decimals)
}

export function calculateChange(current: number, previous: number): number {
  return ((current - previous) / previous) * 100
}

