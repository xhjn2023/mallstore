export function yuan(cents: number): string {
  const v = cents / 100
  return '¥' + (Number.isInteger(v) ? v.toString() : v.toFixed(2))
}
