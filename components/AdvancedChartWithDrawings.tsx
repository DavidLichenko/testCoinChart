"use client"

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react"

import { useCandlestickChart } from "../hooks/use-candlestick-chart"
import { Button } from "./ui/button"

export interface AdvancedChartWithDrawingsProps {
  candles: Array<{
    time: number
    open: number
    high: number
    low: number
    close: number
    volume?: number
  }>
  liveTickers?: Array<{
    symbol: string
    price: number
    time: number
    type: string
    bid?: number
  }>
  selectedSymbol: string
  timeframeInSeconds?: number
  isLoaded?: boolean
  currentTimeframe?: string
  onTimeframeChange?: (timeframe: string) => void
  isMobile?: boolean
  onDrawingsChange?: (drawings: Array<{ type: 'line', points: { time: number, price: number }[] }>) => void
  initialDrawings?: Array<{ type: 'line', points: { time: number, price: number }[] }> // Add this prop
}

export type AdvancedChartHandle = {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
  clearDrawings: () => void
  setTool: (tool: "none" | "line") => void
}

export const AdvancedChartWithDrawings = forwardRef<
    AdvancedChartHandle,
    AdvancedChartWithDrawingsProps
>(function AdvancedChartWithDrawings(
    {
      candles,
      liveTickers,
      selectedSymbol,
      timeframeInSeconds = 60,
      isLoaded = true,
      isMobile = false,
      onDrawingsChange,
      initialDrawings = [], // Add this prop
    },
    ref,
) {
  const {
    containerRef,
    drawingMode,
    drawings,
    clearDrawings,
    setDrawingMode,
    isLibraryLoaded,
    isLibraryLoading,
    libraryError,
    autofocusChart,
    zoomIn,
    zoomOut,
    isChartLoading,
    setInitialDrawings, // Add this
  } = useCandlestickChart({
    candles,
    liveTickers,
    selectedSymbol,
    timeframeInSeconds,
    isLoaded,
    initialDrawings, // Add this prop
  })

  // Notify parent component when drawings change
  useEffect(() => {
    if (onDrawingsChange) {
      onDrawingsChange(drawings)
    }
  }, [drawings, onDrawingsChange])

  const handleResetView = () => {
    autofocusChart()
  }

  useImperativeHandle(ref, () => ({
    zoomIn,
    zoomOut,
    resetView: autofocusChart,
    clearDrawings,
    setTool: setDrawingMode,
  }))

  if (isLibraryLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center bg-slate-950">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-12 w-12">
              <div className="absolute inset-0  border border-slate-700/60 animate-ping" />
              <div className="absolute inset-2  border-t-2 border-b-2 border-purple-500 animate-spin" />
            </div>
            <p className="text-xs font-medium text-slate-200">
              Loading chart engine…
            </p>
            <p className="text-[11px] text-slate-500">
              Preparing {selectedSymbol} workspace
            </p>
          </div>
        </div>
    )
  }

  if (libraryError) {
    return (
        <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
          <div className="text-center">
            <p className="text-sm text-red-400">Failed to load chart library</p>
            <p className="mt-1 text-xs text-slate-500">
              {String(libraryError)}
            </p>
          </div>
        </div>
    )
  }

  if (!isLibraryLoaded) {
    return (
        <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
          <p className="text-xs text-slate-400">Chart library not available</p>
        </div>
    )
  }

  return (
      <div className="relative flex h-full w-full max-h-[calc(100vh-260px)]">
        <div className="relative flex-1">
          <div
              ref={containerRef}
              className="h-full w-full"
              style={{ minHeight: isMobile ? 260 : 400 }}
          />

          {isChartLoading && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-950/95">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-14 w-14">
                    <div className="absolute inset-0 rounded-full bg-purple-500/10" />
                    <div className="absolute inset-1 rounded-full border border-purple-500/40" />
                    <div className="absolute inset-2 rounded-full border-t-2 border-b-2 border-purple-400 animate-spin" />
                  </div>
                  <p className="text-xs font-semibold text-slate-100">
                    Initializing {selectedSymbol} chart…
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Applying candles and live data stream
                  </p>
                </div>
              </div>
          )}
        </div>
      </div>
  )
})