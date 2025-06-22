# Chart Hook Documentation

## Overview
The `useCandlestickChart` hook provides a complete solution for creating interactive candlestick charts with live updates and drawing tools.

## Basic Usage

```typescript
import { useCandlestickChart } from '@/hooks/use-candlestick-chart';

const {
  containerRef,
  drawingMode,
  drawings,
  startDrawing,
  clearDrawings,
  setDrawingMode,
} = useCandlestickChart({
  candles,
  liveTickers,
  selectedSymbol,
  timeframeInSeconds,
  isLoaded: true,
});
```

## Advanced Usage with Drawing Tools

```typescript
import { useCandlestickChart } from '@/hooks/use-candlestick-chart';

const {
  containerRef,
  drawingMode,
  drawings,
  startDrawing,
  clearDrawings,
  setDrawingMode,
} = useCandlestickChart({
  candles,
  liveTickers,
  selectedSymbol,
  timeframeInSeconds,
  isLoaded: true,
});
```

## Features

- **Custom TV.js Library**: Uses your local `lib/tv.js` instead of the lightweight-charts package
- **Real-time Candlestick Charts**: Displays historical and live candlestick data
- **Drawing Tools**: Multiple drawing tools with customizable options
- **Interactive Drawing**: Click-to-draw functionality on the chart
- **Drawing Management**: Add, remove, and clear drawings

## Drawing Tools Available

1. **Line**: Draw straight lines between two points
2. **Horizontal Line**: Draw horizontal lines across the chart
3. **Vertical Line**: Draw vertical lines through the chart
4. **Rectangle**: Draw rectangles by defining two corner points
5. **Ellipse**: Draw ellipses by defining two points for width and height

## Usage

### Basic Usage

```tsx
import { useCreateChart } from '@/hooks/use-candlestick-chart';
import { AdvancedChartWithDrawings } from '@/components/advanced-chart-with-drawings';

const MyChartComponent = () => {
  const candles = [
    { time: 1640995200, open: 100, high: 105, low: 98, close: 103 },
    // ... more candles
  ];
  
  const liveCandles = [
    { time: 1640995260, symbol: 'BTCUSDT', bid: 103.5 },
    // ... more live data
  ];

  return (
    <AdvancedChartWithDrawings
      candles={candles}
      liveCandles={liveCandles}
      symbol="BTCUSDT"
      timeframeSeconds={60}
    />
  );
};
```

### Using the Hook Directly

```tsx
import { useCreateChart } from '@/hooks/use-candlestick-chart';

const MyCustomChart = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    chartInstance,
    drawingTools,
    isDrawing,
    currentDrawing,
    selectedTool,
    startDrawing,
    stopDrawing,
    clearDrawings,
    removeDrawing,
    setSelectedTool,
  } = useCreateChart(
    containerRef,
    candles,
    liveCandles,
    symbol,
    timeframeSeconds
  );

  return (
    <div>
      <div ref={containerRef} className="w-full h-96" />
      
      {/* Custom drawing controls */}
      <button onClick={() => startDrawing('line')}>Draw Line</button>
      <button onClick={stopDrawing}>Stop Drawing</button>
      <button onClick={clearDrawings}>Clear All</button>
    </div>
  );
};
```

## API Reference

### Hook Parameters

- `containerRef`: React ref to the chart container element
- `candles`: Array of historical candlestick data
- `liveCandles`: Array of real-time tick data
- `symbol`: Current trading symbol
- `timeframeSeconds`: Chart timeframe in seconds

### Hook Return Values

- `chartInstance`: The chart instance and related data
- `drawingTools`: Array of all drawing tools
- `isDrawing`: Boolean indicating if currently drawing
- `currentDrawing`: Current drawing being created
- `selectedTool`: Currently selected drawing tool
- `startDrawing(toolType)`: Start drawing with specified tool
- `stopDrawing()`: Stop current drawing
- `clearDrawings()`: Remove all drawings
- `removeDrawing(id)`: Remove specific drawing by ID
- `setSelectedTool(tool)`: Set the selected drawing tool

### Drawing Tool Types

```typescript
type DrawingToolType = 'line' | 'horizontal-line' | 'vertical-line' | 'rectangle' | 'ellipse';
```

### Drawing Tool Options

```typescript
interface DrawingToolOptions {
  color?: string;        // Line color (default: '#2196f3')
  lineWidth?: number;    // Line width (default: 2)
  lineStyle?: number;    // Line style: 0=Solid, 1=Dotted, 2=Dashed, 3=LargeDashed, 4=SparseDotted
}
```

## Setup Requirements

1. **Load TV.js Library**: Make sure `lib/tv.js` is accessible and loaded before using the chart
2. **Container Element**: Provide a container element with defined dimensions
3. **Data Format**: Ensure candlestick data follows the required format

## Data Format

### Candlestick Data
```typescript
interface BarData {
  time: number;    // Unix timestamp in seconds
  open: number;    // Opening price
  high: number;    // Highest price
  low: number;     // Lowest price
  close: number;   // Closing price
}
```

### Live Tick Data
```typescript
interface Candle {
  time: number;    // Unix timestamp in seconds
  symbol: string;  // Trading symbol
  bid: number;     // Current bid price
}
```

## Drawing Workflow

1. **Select Tool**: Click on a drawing tool button
2. **Start Drawing**: The chart enters drawing mode
3. **Place Points**: Click on the chart to place drawing points
4. **Complete Drawing**: Tool automatically completes when enough points are placed
5. **Manage Drawings**: Use the drawing tools panel to manage existing drawings

## Customization

### Chart Options
The chart uses the same options as TradingView Lightweight Charts. You can customize:
- Colors and themes
- Grid and borders
- Time scale options
- Price scale options
- Crosshair behavior

### Drawing Customization
Each drawing tool can be customized with:
- Different colors
- Line widths
- Line styles (solid, dotted, dashed, etc.)
- Custom drawing logic

## Troubleshooting

### Chart Not Loading
- Ensure `lib/tv.js` is properly loaded
- Check browser console for errors
- Verify container element has dimensions

### Drawing Not Working
- Check if drawing mode is active
- Ensure chart is properly initialized
- Verify click events are being captured

### Performance Issues
- Limit the number of drawings for better performance
- Consider clearing old drawings periodically
- Optimize data updates for live feeds

## Examples

See `components/advanced-chart-with-drawings.tsx` for a complete implementation example with the drawing tools UI. 