import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capScore(score: number | undefined | null): number {
  if (!score && score !== 0) return 0
  return Math.min(Math.max(Math.round(score), 0), 99)
}
