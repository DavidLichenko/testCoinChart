"use client"

import { useEffect, useState } from "react"
import { useMotionValue, animate } from "framer-motion"

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
  className?: string
  maximumFractionDigits?: number
  minimumFractionDigits?: number
  duration?: number
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  className,
  maximumFractionDigits = 2,
  minimumFractionDigits = 0,
  duration = 0.35,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<string>(() => {
    const safe = Number.isFinite(value) ? value : 0
    return safe.toLocaleString(undefined, {
      minimumFractionDigits,
      maximumFractionDigits,
    })
  })

  // 🔥 стартуем всегда с 0, чтобы при загрузке была анимация
  const motionValue = useMotionValue(0)

  useEffect(() => {
    const safe = Number.isFinite(value) ? value : 0

    const controls = animate(motionValue, safe, {
      duration,
      onUpdate: (latest) => {
        const v = Number.isFinite(latest) ? latest : 0
        setDisplay(
          v.toLocaleString(undefined, {
            minimumFractionDigits,
            maximumFractionDigits,
          }),
        )
      },
    })

    return () => controls.stop()
  }, [value, duration, motionValue, maximumFractionDigits, minimumFractionDigits])

  return (
    <span className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}
