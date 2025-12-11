"use client"

import { motion } from "framer-motion"
import { useMemo } from "react"

// Optimized particle component with memo
const Particle = motion.div

export default function Loading() {
  // Memoize particles to avoid regeneration
  const particles = useMemo(() => {
    const arr = []
    for (let i = 0; i < 30; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 2 + 2,
        delay: Math.random() * 1.5,
        xOffset: Math.random() * 15 - 7.5,
      })
    }
    return arr
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      {/* Animated particles background - reduced count for performance */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <Particle
            key={particle.id}
            className="absolute rounded-full bg-purple-500/20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -25, 0],
              x: [0, particle.xOffset, 0],
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Main loading spinner - optimized */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <motion.div
          className="relative h-16 w-16"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-r-pink-500" />
        </motion.div>

        <motion.p
          className="text-sm text-gray-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          Loading...
        </motion.p>
      </div>
    </div>
  )
}

