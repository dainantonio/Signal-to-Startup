'use client'
import { useEffect } from 'react'

export default function ConsoleEasterEgg() {
  useEffect(() => {
    console.log(
      '%c⚡ Signal to Startup',
      'color: #000; background: #fff; font-size: 24px; font-weight: 900; padding: 8px 16px; border-radius: 8px;'
    )
    console.log(
      '%cYou found us. Curious people make the best entrepreneurs.',
      'color: #555; font-size: 14px; padding: 4px 0;'
    )
    console.log(
      '%c→ We turn news signals into startup opportunities.',
      'color: #22c55e; font-size: 13px; padding: 2px 0;'
    )
    console.log(
      '%cEmail hello@entrepaIneur.com — subject: "console"',
      'color: #888; font-size: 11px; padding: 2px 0;'
    )
    console.log(
      '%csignal-to-startup.vercel.app',
      'color: #3b82f6; font-size: 11px; text-decoration: underline;'
    )
  }, [])

  return null
}
