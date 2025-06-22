'use client'

import React, { useState, useEffect } from 'react';
import { useCandlestickChart } from '../hooks/use-candlestick-chart';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  LineChart, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Trash2,
  MousePointer
} from 'lucide-react';

interface AdvancedChartWithDrawingsProps {
  candles: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
  liveTickers?: Array<{
    symbol: string;
    price: number;
    time: number;
    type: string;
    bid?: number;
  }>;
  selectedSymbol: string;
  timeframeInSeconds?: number;
  isLoaded?: boolean;
  currentTimeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
  isMobile?: boolean;
}

export const AdvancedChartWithDrawings: React.FC<AdvancedChartWithDrawingsProps> = ({
  candles,
  liveTickers,
  selectedSymbol,
  timeframeInSeconds = 60,
  isLoaded = true,
  currentTimeframe = "M15",
  onTimeframeChange,
  isMobile = false,
}) => {
  const [selectedTool, setSelectedTool] = useState<'none' | 'line'>('none');

  const {
    containerRef,
    drawingMode,
    drawings,
    startDrawing,
    clearDrawings,
    setDrawingMode,
    isLibraryLoaded,
    isLibraryLoading,
    libraryError,
    autofocusChart,
    zoomIn,
    zoomOut,
    isChartLoading,
  } = useCandlestickChart({
    candles,
    liveTickers,
    selectedSymbol,
    timeframeInSeconds,
    isLoaded,
  });

//   console.log('AdvancedChartWithDrawings render:', {
//     candlesLength: candles?.length,
//     selectedSymbol,
//     timeframeInSeconds,
//     isLoaded,
//     selectedTool,
//     drawingMode
//   });

  const handleToolSelect = (tool: 'none' | 'line') => {
    console.log('=== handleToolSelect called ===');
    console.log('Tool selected:', tool);
    console.log('Current selectedTool:', selectedTool);
    console.log('Current drawingMode:', drawingMode);
    
    setSelectedTool(tool);
    console.log('setSelectedTool called with:', tool);
    
    if (tool === 'none') {
      console.log('Setting drawingMode to none');
      setDrawingMode('none');
      // Reset chart interactions when selecting none tool
      if (containerRef.current) {
        containerRef.current.style.cursor = "default";
      }
    } else {
      console.log('Setting drawingMode to:', tool);
      setDrawingMode(tool);
      // Remove the startDrawing call - let the chart click handle the drawing logic
      console.log('Drawing mode set, waiting for chart click');
    }
    
    console.log('=== handleToolSelect finished ===');
  };

  // Sync selectedTool with drawingMode from hook
  useEffect(() => {
    console.log('Sync effect triggered:', { drawingMode, selectedTool });
    
    // When drawingMode becomes 'none' (drawing completed), auto-select the Select Tool
    if (drawingMode === 'none' && selectedTool !== 'none') {
      console.log('Drawing completed, auto-selecting Select Tool');
      setSelectedTool('none');
    }
    // When starting a new drawing mode, sync the selectedTool
    else if (drawingMode === 'line' && drawingMode !== selectedTool) {
      console.log('Syncing selectedTool with drawingMode:', { drawingMode, selectedTool });
      setSelectedTool(drawingMode);
    }
  }, [drawingMode, selectedTool]);

  const handleResetView = () => {
    autofocusChart();
  };

  const handleClearDrawings = () => {
    clearDrawings();
  };

  if (isLibraryLoading) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading chart library...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (libraryError) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-destructive">Failed to load chart library</p>
            <p className="text-xs text-muted-foreground mt-1">{String(libraryError)}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLibraryLoaded) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Chart library not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      {/* Top Bar */}
      <div className={`p-3 border-b bg-background ${isMobile ? 'flex flex-col' : 'flex items-center justify-between'}`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium">Chart</h3>
            <span className="text-xs text-muted-foreground">({selectedSymbol})</span>
          </div>
          
          {/* On desktop, show timeframe next to title */}
          {!isMobile && (
            <Select value={currentTimeframe} onValueChange={onTimeframeChange}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M1">M1</SelectItem>
                <SelectItem value="M5">M5</SelectItem>
                <SelectItem value="M15">M15</SelectItem>
                <SelectItem value="M30">M30</SelectItem>
                <SelectItem value="H1">H1</SelectItem>
                <SelectItem value="H4">H4</SelectItem>
                <SelectItem value="D1">D1</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        {/* Chart Controls */}
        <div className={`flex items-center space-x-1 ${isMobile ? 'mt-2 justify-between w-full' : ''}`}>
          <Button variant="outline" size="sm" onClick={zoomOut} title="Zoom Out"><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={zoomIn} title="Zoom In"><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={handleResetView} title="Reset View"><RotateCcw className="h-4 w-4" /></Button>

          {/* On mobile, show timeframe in the second row */}
          {isMobile && (
            <Select value={currentTimeframe} onValueChange={onTimeframeChange}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M1">M1</SelectItem>
                <SelectItem value="M5">M5</SelectItem>
                <SelectItem value="M15">M15</SelectItem>
                <SelectItem value="M30">M30</SelectItem>
                <SelectItem value="H1">H1</SelectItem>
                <SelectItem value="H4">H4</SelectItem>
                <SelectItem value="D1">D1</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {!isMobile && <Separator orientation="vertical" className="h-6" />}
          
          {!isMobile && (
            <Button variant="outline" size="sm" onClick={handleClearDrawings} title="Clear Drawings">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="flex flex-1 max-h-[calc(100vh - 400px)]">
        {/* Drawing Tools Sidebar */}
        {!isMobile && (
          <div className="w-12 bg-gray-900 border-r flex flex-col items-center py-2 space-y-1">
            <Button
              variant={selectedTool === 'none' ? 'default' : 'ghost'}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => {
                console.log('Select tool button clicked');
                handleToolSelect('none');
              }}
              title="Select Tool"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            
            <Button
              variant={selectedTool === 'line' ? 'default' : 'ghost'}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => {
                console.log('Line tool button clicked');
                handleToolSelect('line');
              }}
              title="Line Tool"
            >
              <LineChart className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Chart Container */}
        <div className="flex-1 relative">
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
          />
          
          {/* Loading Overlay */}
          {isChartLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm font-medium text-foreground mb-2">Initializing Chart</p>
                <p className="text-xs text-muted-foreground">Loading {selectedSymbol} data...</p>
              </div>
            </div>
          )}
          
          {/* Drawing Mode Indicator */}
          {drawingMode !== 'none' && (
            <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs border">
              Drawing: Line
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}; 