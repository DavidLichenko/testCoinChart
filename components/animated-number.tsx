"use client"

import { useEffect, useState, useRef } from "react"
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
  const safeValue = Number.isFinite(value) ? value : 0
  
  // Храним предыдущее значение для анимации
  const prevValueRef = useRef<number>(safeValue)
  const isFirstRenderRef = useRef<boolean>(true)
  
  // Инициализируем motionValue с текущим значением
  const motionValue = useMotionValue(safeValue)
  
  const [display, setDisplay] = useState<string>(() => {
    return safeValue.toLocaleString(undefined, {
      minimumFractionDigits,
      maximumFractionDigits,
    })
  })

  useEffect(() => {
    const safe = Number.isFinite(value) ? value : 0
    
    // При первом рендере просто устанавливаем значение без анимации
    if (isFirstRenderRef.current) {
      motionValue.set(safe)
      prevValueRef.current = safe
      isFirstRenderRef.current = false
      setDisplay(
        safe.toLocaleString(undefined, {
          minimumFractionDigits,
          maximumFractionDigits,
        }),
      )
      return
    }

    // Если значение не изменилось, не анимируем
    if (safe === prevValueRef.current) {
      return
    }

    // Анимируем от предыдущего значения к новому
    const startValue = prevValueRef.current
    motionValue.set(startValue) // Устанавливаем начальное значение
    
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
      onComplete: () => {
        prevValueRef.current = safe
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
