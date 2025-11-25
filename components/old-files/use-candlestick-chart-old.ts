import { useEffect, useRef, useState } from 'react';
import { useTVLibrary } from './use-tv-library';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface Ticker {
  symbol: string;
  price: number;
  time: number;
  type: string;
  bid?: number;
}

interface UseCandlestickChartProps {
  candles: Candle[];
  liveTickers?: Ticker[];
  selectedSymbol: string;
  timeframeInSeconds?: number;
  isLoaded?: boolean;
}

export const useCandlestickChart = ({
  candles,
  liveTickers,
  selectedSymbol,
  timeframeInSeconds = 60,
  isLoaded = true,
}: UseCandlestickChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const lineSeriesRef = useRef<any>(null);
  const previewSeriesRef = useRef<any>(null);
  const lastCandleRef = useRef<any>(null);
  const xspanRef = useRef<number>(60);
  const drawingModeRef = useRef<'none' | 'line'>('none');
  const startPointRef = useRef<{ time: number; price: number } | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const historicalDataLoadedRef = useRef<boolean>(false);
  const fetchedCandlesRef = useRef<any[]>([]);
  const chartReadyRef = useRef<boolean>(false);

  // Drawing state
  const [drawingMode, setDrawingMode] = useState<'none' | 'line'>('none');
  const [drawings, setDrawings] = useState<Array<{ type: 'line', points: { time: number, price: number }[] }>>([]);
  const [preview, setPreview] = useState<{ type: 'line', points: { time: number, price: number }[] } | null>(null);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);

  // Log drawings state changes
  useEffect(() => {

  }, [drawings]);

  // Line interaction state
  const [startPoint, setStartPoint] = useState<{ time: number; price: number } | null>(null);
  const [isUpdatingLine, setIsUpdatingLine] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [dragStartLineData, setDragStartLineData] = useState<any[]>([]);
  const [lastCrosshairPosition, setLastCrosshairPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [hoverThreshold] = useState(0.01);
  const [currentLineIndex, setCurrentLineIndex] = useState<number | null>(null);

  const { isLoaded: isLibraryLoaded, isLoading: isLibraryLoading, error: libraryError, LightweightCharts } = useTVLibrary();

  // Update ref when drawingMode changes
  useEffect(() => {
    drawingModeRef.current = drawingMode;

  }, [drawingMode]);

  // Update ref when startPoint changes
  useEffect(() => {
    startPointRef.current = startPoint;
  }, [startPoint]);

  // Chart event handlers
  const handleChartClick = (param: any) => {

    
    // Debounce to prevent multiple rapid calls
    const now = Date.now();
    if (now - lastClickTimeRef.current < 100) {
  
      return;
    }
    lastClickTimeRef.current = now;
    
    const currentDrawingMode = drawingModeRef.current;
    if (isUpdatingLine || isDragging) {
  
      return;
    }
    
    const xTs = param.time || (candles && candles[0] ? candles[0].time + param.logical * xspanRef.current : 0);
    const yPrice = candleSeriesRef.current?.coordinateToPrice(param.point?.y);
    

    
    if (!xTs || !yPrice || !param.point) {

      return;
    }
    
    if (currentDrawingMode === 'line') {
 
      
      if (!startPointRef.current) {
   
        setStartPoint({ time: xTs, price: yPrice });
        startPointRef.current = { time: xTs, price: yPrice };
    
      } else {

        
        // Complete drawing
        if (startPointRef.current) {
    
          const newDrawing: { type: 'line'; points: { time: number; price: number; }[] } = {
            type: 'line',
            points: [
              { time: startPointRef.current.time, price: startPointRef.current.price },
              { time: xTs, price: yPrice }
            ]
          };
          
          // Validate the drawing data before adding
          const validPoints = newDrawing.points.filter(point => 
            point && point.time != null && point.price != null && 
            !isNaN(point.time) && !isNaN(point.price)
          );
          
          if (validPoints.length === newDrawing.points.length) {
            setDrawings(prev => [...prev, newDrawing]);
    
          } else {
      
          }
        }
        
      
        setPreview(null);
        setStartPoint(null);
        startPointRef.current = null;
        // Clear preview when drawing is completed
        if (previewSeriesRef.current) {
          previewSeriesRef.current.setData([]);
        }
        // Auto-select Select Tool after drawing
        setDrawingMode('none');
        drawingModeRef.current = 'none';
        if (chartRef.current) {
          chartRef.current.applyOptions({ handleScroll: true, handleScale: true });
        }
        if (containerRef.current) {
          containerRef.current.style.cursor = "default";
        }

      }
    } else {

    }
    

  };

  const handleCrosshairMove = (param: any) => {
    // Enable crosshair move during select mode for line interaction
    if (drawingModeRef.current !== 'none') {
      return; // Disable during drawing mode
    }
    
    if (isUpdatingLine) return;
    
    // Check if param.point exists and has valid coordinates
    if (!param.point || typeof param.point.y === 'undefined') {
      return;
    }
    
    const xTs = param.time || (candles && candles[0] ? candles[0].time + param.logical * xspanRef.current : 0);
    const yPrice = candleSeriesRef.current?.coordinateToPrice(param.point.y);
    
    if (!xTs || !yPrice) return;

    setLastCrosshairPosition({ x: xTs, y: yPrice });

    // Check for line hovering when in select mode
    if (drawingModeRef.current === 'none' && drawings.length > 0) {
      const allLines = drawings
        .filter(d => d.type === 'line')
        .map(d => d.points)
        .filter(p => p.length === 2 && p.every(pt => pt && pt.time != null && pt.price != null && !isNaN(pt.time) && !isNaN(pt.price)));
      
      let foundHover = false;
      allLines.forEach((line, lineIndex) => {
        if (line.length === 2) {
          const point1 = line[0];
          const point2 = line[1];
          
          // Check if hovering over line points or line itself
          const isHovering = isLineHovered(xTs, yPrice, point1, point2);
          if (isHovering && !foundHover) {
            foundHover = true;
            setCurrentLineIndex(lineIndex);
            if (!isHovered) {
              startHover();
            }
          }
        }
      });
      
      if (!foundHover && isHovered) {
        endHover();
        setCurrentLineIndex(null);
      }
    }

    if (isDragging && dragStartPoint && dragStartLineData.length) {
      const deltaX = xTs - dragStartPoint.x;
      const deltaY = yPrice - dragStartPoint.y;

      const newLineData = dragStartLineData.map((point, i) =>
        selectedPoint !== null
          ? i === selectedPoint
            ? { time: point.time + deltaX, value: point.value + deltaY }
            : point
          : { time: point.time + deltaX, value: point.value + deltaY }
      );

      dragLine(newLineData);
    }
  };

  // Mouse event handlers for dragging and preview
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastMoveTime = 0;
    const throttleDelay = 16; // ~60fps

    const handleMouseDown = (e: MouseEvent) => {
   
      
      if (drawingModeRef.current === 'none' && isHovered && lastCrosshairPosition) {
     
        startDrag(lastCrosshairPosition.x, lastCrosshairPosition.y);
      } else if (drawingModeRef.current === 'none' && chartRef.current && candleSeriesRef.current) {
        // Check if clicking on a line even if not hovering
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const logical = chartRef.current.timeScale().coordinateToLogical(x);
        const yPrice = candleSeriesRef.current.coordinateToPrice(y);
        
        if (logical !== null && yPrice !== null && candles && candles[0]) {
          const xTs = candles[0].time + logical * xspanRef.current;
          
          // Check if clicking on any line
          const allLines = drawings
            .filter(d => d.type === 'line')
            .map(d => d.points)
            .filter(p => p.length === 2 && p.every(pt => pt && pt.time != null && pt.price != null && !isNaN(pt.time) && !isNaN(pt.price)));
          
          for (let i = 0; i < allLines.length; i++) {
            const line = allLines[i];
            if (isLineHovered(xTs, yPrice, line[0], line[1])) {
        
              setCurrentLineIndex(i);
              startHover();
              startDrag(xTs, yPrice);
              break;
            }
          }
        }
      } else {

      }

    };

    const handleMouseUp = () => {

      
      if (isDragging) {

        endDrag();
      } else {

      }

    };

    const handleMouseMove = (e: MouseEvent) => {
      // Throttle mouse move events for better performance
      const now = Date.now();
      if (now - lastMoveTime < throttleDelay) {
        return;
      }
      lastMoveTime = now;

      // Drawing preview
      if (drawingModeRef.current !== 'none' && startPointRef.current && chartRef.current && candleSeriesRef.current) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert mouse coordinates to chart coordinates
        const logical = chartRef.current.timeScale().coordinateToLogical(x);
        const yPrice = candleSeriesRef.current.coordinateToPrice(y);
        
        if (logical !== null && yPrice !== null && candles && candles[0]) {
          const xTs = candles[0].time + logical * xspanRef.current;
          
          if (drawingModeRef.current === 'line') {
            // Show preview line from start point to current mouse position
            const previewData = [
              { time: startPointRef.current.time, value: startPointRef.current.price },
              { time: xTs, value: yPrice }
            ].filter(point => point.time != null && point.value != null && !isNaN(point.time) && !isNaN(point.value));
            
            if (previewData.length === 2) {
              previewSeriesRef.current.setData(previewData);
            }
          }
        }
      } 
      // Dragging logic
      else if (drawingModeRef.current === 'none' && isDragging && dragStartPoint && chartRef.current && candleSeriesRef.current) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert mouse coordinates to chart coordinates
        const logical = chartRef.current.timeScale().coordinateToLogical(x);
        const yPrice = candleSeriesRef.current.coordinateToPrice(y);
        
        if (logical !== null && yPrice !== null && candles && candles[0]) {
          const xTs = candles[0].time + logical * xspanRef.current;
          
          if (dragStartLineData.length === 2) {
            let newLineData;
            
            // Check if we're resizing (dragging an endpoint)
            if (selectedPoint !== null) {
              // Resizing: only move the selected endpoint
              newLineData = dragStartLineData.map((point, index) => {
                if (index === selectedPoint) {
                  return { time: xTs, value: yPrice };
                }
                return point;
              });
  
            } else {
              // Dragging entire line: apply offset to both points
              const timeOffset = xTs - dragStartPoint.x;
              const priceOffset = yPrice - dragStartPoint.y;
              
              newLineData = dragStartLineData.map(point => ({
                time: point.time + timeOffset,
                value: point.value + priceOffset
              }));
        
            }
            
            dragLine(newLineData);
          }
        }
      }
      // Hover detection for lines (only when not dragging)
      else if (drawingModeRef.current === 'none' && !isDragging && chartRef.current && candleSeriesRef.current) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const logical = chartRef.current.timeScale().coordinateToLogical(x);
        const yPrice = candleSeriesRef.current.coordinateToPrice(y);
        
        if (logical !== null && yPrice !== null && candles && candles[0]) {
          const xTs = candles[0].time + logical * xspanRef.current;
          
          // Check if hovering over any line
          const allLines = drawings
            .filter(d => d.type === 'line')
            .map(d => d.points)
            .filter(p => p.length === 2 && p.every(pt => pt && pt.time != null && pt.price != null && !isNaN(pt.time) && !isNaN(pt.price)));
          
          let foundHover = false;
          for (let i = 0; i < allLines.length; i++) {
            const line = allLines[i];
            if (isLineHovered(xTs, yPrice, line[0], line[1])) {
              if (!isHovered || currentLineIndex !== i) {
          
                setCurrentLineIndex(i);
                startHover();
              }
              foundHover = true;
              break;
            }
          }
          
          if (!foundHover && isHovered) {

            endHover();
            // Clear the state when not hovering
            setSelectedPoint(null);
            setCurrentLineIndex(null);
          }
        }
      }
      // Clear preview when not drawing or dragging
      else {
        if (previewSeriesRef.current) {
          previewSeriesRef.current.setData([]);
        }
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [lastCrosshairPosition, isHovered, candles, drawings, isDragging, dragStartPoint, dragStartLineData]);

  // Drawing functions
  const handleLineDrawing = (xTs: number, yPrice: number) => {
    const currentStartPoint = startPointRef.current;
    
    if (!currentStartPoint) {
      const newStartPoint = { time: xTs, price: yPrice };

      setStartPoint(newStartPoint);
      startPointRef.current = newStartPoint; // Update ref immediately

    } else {

      const lineData = [
        { time: currentStartPoint.time, value: currentStartPoint.price },
        { time: xTs, value: yPrice },
      ];

      
      // Clear preview and set final line
      previewSeriesRef.current?.setData([]);
      lineSeriesRef.current?.setData(lineData);
      
      setStartPoint(null);
      startPointRef.current = null; // Update ref immediately
      setSelectedPoint(null);
      
      // Reset drawing mode and chart interactions
      setDrawingMode('none');
      drawingModeRef.current = 'none';
      if (chartRef.current) {
        chartRef.current.applyOptions({ 
          handleScroll: true, 
          handleScale: true 
        });
      }
      if (containerRef.current) {
        containerRef.current.style.cursor = "default";
      }
    }
  };

  const handleHoverEffect = (xTs: number, yPrice: number) => {
    // Simplified hover effect - disabled to prevent infinite loops
    return;
  };

  const isLineHovered = (xTs: number, yPrice: number, point1: any, point2: any) => {
    // Check if hovering over line endpoints (for resizing)
    const pointRadius = 3; // Smaller radius for more precise point detection
    const timeThreshold = 2; // Smaller time threshold
    const priceThreshold = 0.001; // Much smaller price threshold for precise detection
    
    // Check if hovering over point1 (start point)
    const isPoint1 = 
      Math.abs(xTs - point1.time) < timeThreshold && 
      Math.abs(yPrice - point1.price) / point1.price < priceThreshold;
    if (isPoint1) {
      setSelectedPoint(0);
      return true;
    }
    
    // Check if hovering over point2 (end point)
    const isPoint2 = 
      Math.abs(xTs - point2.time) < timeThreshold && 
      Math.abs(yPrice - point2.price) / point2.price < priceThreshold;
    if (isPoint2) {
      setSelectedPoint(1);
      return true;
    }
    
    // Check if hovering over the line itself (much smaller area)
    setSelectedPoint(null);
    const m = (point2.price - point1.price) / (point2.time - point1.time);
    const c = point1.price - m * point1.time;
    const estimatedY = m * xTs + c;
    const distance = Math.abs(yPrice - estimatedY) / yPrice;
    
    // Check if point is within line bounds
    const minTime = Math.min(point1.time, point2.time);
    const maxTime = Math.max(point1.time, point2.time);
    const isWithinBounds = xTs >= minTime && xTs <= maxTime;
    
    // Much smaller hover threshold for precise line detection
    const lineHoverThreshold = 0.0005; // Very small threshold
    
    return distance < lineHoverThreshold && isWithinBounds;
  };

  const startHover = () => {

    setIsHovered(true);
    if (lineSeriesRef.current) {
      lineSeriesRef.current.applyOptions({ color: 'orange' });
    }
    if (containerRef.current) {
      // Show different cursor based on what we're hovering over
      if (selectedPoint !== null) {
        containerRef.current.style.cursor = 'crosshair'; // For resizing endpoints
      } else {
        containerRef.current.style.cursor = 'pointer'; // For dragging line
      }
    }
    if (chartRef.current) {
      chartRef.current.applyOptions({ handleScroll: false, handleScale: false });
    }
  };

  const endHover = () => {

    setIsHovered(false);
    setSelectedPoint(null);
    if (lineSeriesRef.current) {
      lineSeriesRef.current.applyOptions({ color: 'dodgerblue' });
    }
    if (containerRef.current && !isDragging) {
      containerRef.current.style.cursor = 'default';
    }
    if (chartRef.current && !isDragging) {
      chartRef.current.applyOptions({ handleScroll: true, handleScale: true });
    }
  };

  const startDrag = (xTs: number, yPrice: number) => {

    setIsDragging(true);
    setDragStartPoint({ x: xTs, y: yPrice });
    
    // Get current line data for dragging
    if (currentLineIndex !== null && drawings.length > currentLineIndex) {
      const currentLine = drawings[currentLineIndex];
      if (currentLine.type === 'line' && currentLine.points.length === 2) {
        const lineData = currentLine.points.map(point => ({
          time: point.time,
          value: point.price
        }));
        setDragStartLineData(lineData);
     
        
        // Check if we're resizing (dragging an endpoint)
        if (selectedPoint !== null) {

          // For resizing, we'll modify the specific point instead of the whole line
        } else {

        }
      }
    }
    
    // Disable chart interactions during drag
    if (chartRef.current) {
      chartRef.current.applyOptions({ handleScroll: false, handleScale: false });
    }
    if (containerRef.current) {
      // Show different cursor based on what we're dragging
      if (selectedPoint !== null) {
        containerRef.current.style.cursor = 'crosshair'; // For resizing endpoints
      } else {
        containerRef.current.style.cursor = 'grabbing'; // For dragging entire line
      }
    }
  };

  const endDrag = () => {
 
    setIsDragging(false);
    setDragStartPoint(null);
    setDragStartLineData([]);
    
    // Don't clear selectedPoint and currentLineIndex immediately
    // Let the hover detection handle this properly
    
    // Reset cursor and chart interactions
    if (containerRef.current) {
      containerRef.current.style.cursor = 'default';
    }
    if (chartRef.current) {
      chartRef.current.applyOptions({ handleScroll: true, handleScale: true });
    }
    
    // Force a hover check to update the state properly
    setTimeout(() => {
      if (!isDragging && currentLineIndex !== null) {
        // If we're still hovering over the line, restore hover state
        if (isHovered) {
          if (lineSeriesRef.current) {
            lineSeriesRef.current.applyOptions({ color: 'orange' });
          }
          if (containerRef.current) {
            // Show different cursor based on what we're hovering over
            if (selectedPoint !== null) {
              containerRef.current.style.cursor = 'crosshair'; // For resizing endpoints
            } else {
              containerRef.current.style.cursor = 'pointer'; // For dragging line
            }
          }
        } else {
          // If not hovering, clear the state
          setSelectedPoint(null);
          setCurrentLineIndex(null);
        }
      }
    }, 10);
  };

  const updateLine = (xTs: number, yPrice: number) => {
    if (!startPointRef.current) return;
    
    setIsUpdatingLine(true);
    const lineData = [
      { time: startPointRef.current.time, value: startPointRef.current.price },
      { time: xTs, value: yPrice },
    ];
    previewSeriesRef.current?.setData(lineData);
    setIsUpdatingLine(false);
  };

  const dragLine = (newCoords: any[]) => {

    setIsUpdatingLine(true);
    
    // Validate coordinates before setting
    const validCoords = newCoords.filter(coord => 
      coord && coord.time != null && coord.value != null && 
      !isNaN(coord.time) && !isNaN(coord.value)
    );
    
    if (validCoords.length === 2) {
      // Update the line series display
      lineSeriesRef.current?.setData(validCoords);
      
      // Update the drawings state to persist changes
      if (currentLineIndex !== null && drawings.length > currentLineIndex) {
        const updatedDrawings = [...drawings];
        updatedDrawings[currentLineIndex] = {
          type: 'line',
          points: validCoords.map(coord => ({
            time: coord.time,
            price: coord.value
          }))
        };
        setDrawings(updatedDrawings);
  
      }
    } else {

    }
    
    setIsUpdatingLine(false);
  };

  // Autofocus function - show last candle with space to the right
  const autofocusChart = () => {
    if (!chartRef.current || !candles || candles.length === 0) return;
    
    const timeScale = chartRef.current.timeScale();
    const lastTime = candles[candles.length - 1].time;
    
    // Calculate the time range to show the last 50 candles with space to the right
    const visibleBars = 50;
    const firstVisibleTime = candles[Math.max(0, candles.length - visibleBars)].time;
    const lastVisibleTime = lastTime + (xspanRef.current * 10); // Add 10 bars of space to the right
    
    timeScale.setVisibleRange({
      from: firstVisibleTime,
      to: lastVisibleTime,
    });
  };

  // Chart initialization
  useEffect(() => {

    if (!containerRef.current) {
      return;
    }
    
    if (!LightweightCharts) {
      return;
    }
    
    if (!isLoaded) {
      return;
    }
    
    if (!isLibraryLoaded) {
      return;
    }


    if (chartRef.current) {
      chartRef.current.remove();
    }

    const container = containerRef.current;
    const { createChart, CrosshairMode } = LightweightCharts;

    // Calculate xspan from candles
    if (candles && candles.length > 1) {
      xspanRef.current = candles[1].time - candles[0].time;
    }

    chartRef.current = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: { background: { color: 'hsl(260, 20%, 10%)' }, textColor: '#d1d4dc' },
      grid: { vertLines: { color: '#1e1e1e' }, horzLines: { color: '#1e1e1e' } },
      timeScale: { timeVisible: true, secondsVisible: true, borderColor: '#2B2B43' },
      rightPriceScale: { borderColor: '#2B2B43' },
      crosshair: { mode: CrosshairMode.Normal },
    });

    candleSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
      wickUpColor: '#26a69a', wickDownColor: '#ef5350',
    });

    lineSeriesRef.current = chartRef.current.addLineSeries({
      color: 'dodgerblue',
      lineWidth: 2,
    });

    previewSeriesRef.current = chartRef.current.addLineSeries({
      color: 'rgba(255, 255, 255, 0.3)',
      lineWidth: 1,
      lineStyle: 1, // Dashed line
    });


    chartReadyRef.current = true;

    // Only subscribe to events after all series are created
    if (chartRef.current && candleSeriesRef.current) {
      chartRef.current.subscribeClick(handleChartClick);
      chartRef.current.subscribeCrosshairMove(handleCrosshairMove);
    }

    // If we have fetched candles ready, set them now
    if (fetchedCandlesRef.current.length > 0) {

      const bars = fetchedCandlesRef.current.map((candle: any) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));
      
      candleSeriesRef.current.setData(bars);
      lastCandleRef.current = bars[bars.length - 1];
      historicalDataLoadedRef.current = true;
      
      // Clear fetched candles since they're now set
      fetchedCandlesRef.current = [];
      
      // Autofocus after a short delay
      setTimeout(() => {
        autofocusChart();
        setIsChartLoading(false);
      }, 100);
    }

    const handleResize = () => {
      if (chartRef.current && container) {
        chartRef.current.resize(container.clientWidth, container.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
    
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
      lineSeriesRef.current = null;
      previewSeriesRef.current = null;
      lastCandleRef.current = null;
      chartReadyRef.current = false;
    };
  }, [isLoaded, isLibraryLoaded, LightweightCharts]);

  // Fetch historical data when chart can't initialize
  useEffect(() => {
    if (!selectedSymbol || !timeframeInSeconds) return;
    
    // If chart can't initialize but we have a symbol, fetch historical data
    if ((!containerRef.current || !LightweightCharts || !isLoaded || !isLibraryLoaded) && selectedSymbol) {

      setIsChartLoading(true);
      
      const timeframe = getTimeframeString(timeframeInSeconds);
      const url = `https://api.aragon-trade.com/candles?symbol=${selectedSymbol}&timeframe=${timeframe}&count=100`;
      
      // Add a small delay for better UX (like sleep(1) in Python)
      setTimeout(() => {
        fetch(url)
          .then((res) => res.json())
          .then((data) => {

            if (data && data.length > 0) {
              // Store the fetched data
              fetchedCandlesRef.current = data;

              
              // If chart is already ready, set the data immediately
              if (chartReadyRef.current && candleSeriesRef.current) {
                const bars = data.map((candle: any) => ({
                  time: candle.time,
                  open: candle.open,
                  high: candle.high,
                  low: candle.low,
                  close: candle.close,
                }));
                
                candleSeriesRef.current.setData(bars);
                lastCandleRef.current = bars[bars.length - 1];
                historicalDataLoadedRef.current = true;
                fetchedCandlesRef.current = [];
                
                setTimeout(() => {
                  autofocusChart();
                  // Don't clear loading state here - let the 1-second timer handle it
                }, 100);
              } else {
                // Chart not ready yet, keep loading state
              }
            }
            // Don't clear loading state here - let the 1-second timer handle it
          })
          .catch((error) => {
            console.error('Failed to fetch historical data:', error);
            // Don't clear loading state here - let the 1-second timer handle it
          });
      }, 1000); // 1 second delay like sleep(1) in Python
    }
  }, [selectedSymbol, timeframeInSeconds, containerRef.current, LightweightCharts, isLoaded, isLibraryLoaded]);

  // Fetch data for symbol changes when chart is already ready
  useEffect(() => {
    if (!selectedSymbol || !timeframeInSeconds || !chartReadyRef.current || !candleSeriesRef.current) return;
    
    // If chart is ready but we don't have candles data for this symbol, fetch it
    if (selectedSymbol && (!candles || candles.length === 0)) {

      setIsChartLoading(true);
      
      const timeframe = getTimeframeString(timeframeInSeconds);
      const url = `https://api.aragon-trade.com/candles?symbol=${selectedSymbol}&timeframe=${timeframe}&count=100`;
      
      // Add a small delay for better UX
      setTimeout(() => {
        fetch(url)
          .then((res) => res.json())
          .then((data) => {

            if (data && data.length > 0) {
              const bars = data.map((candle: any) => ({
                time: candle.time,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
              }));
              
              candleSeriesRef.current.setData(bars);
              lastCandleRef.current = bars[bars.length - 1];
              historicalDataLoadedRef.current = true;
              
              setTimeout(() => {
                autofocusChart();
                // Don't clear loading state here - let the 1-second timer handle it
              }, 100);
            }
            // Don't clear loading state here - let the 1-second timer handle it
          })
          .catch((error) => {
            console.error('Failed to fetch historical data for symbol change:', error);
            // Don't clear loading state here - let the 1-second timer handle it
          });
      }, 1000); // 1 second delay
    }
  }, [selectedSymbol, timeframeInSeconds, candles]);

  // Helper function to convert timeframeInSeconds to string format
  const getTimeframeString = (seconds: number): string => {
    const timeframes: Record<number, string> = {
      60: 'M1',
      300: 'M5', 
      900: 'M15',
      1800: 'M30',
      3600: 'H1',
      14400: 'H4',
      86400: 'D1'
    };
    return timeframes[seconds] || 'M1';
  };

  // Set initial candles data and autofocus
  useEffect(() => {
   
    if (!candles || !candleSeriesRef.current || candles.length === 0) {
      historicalDataLoadedRef.current = false;
      return;
    }
    
    
    
    const bars = candles.map((candle) => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
    
    // Replace any existing data with historical data
    candleSeriesRef.current.setData(bars);
    lastCandleRef.current = bars[bars.length - 1]; // Save last one
    historicalDataLoadedRef.current = true; // Mark historical data as loaded

    
    // Autofocus after a short delay to ensure data is set
    setTimeout(() => {
      autofocusChart();
    }, 100);
  }, [candles, selectedSymbol]);

  // Reset drawing state when symbol changes
  useEffect(() => {
    setStartPoint(null);
    setSelectedPoint(null);
    setIsHovered(false);
    setIsDragging(false);
    setDragStartPoint(null);
    setDragStartLineData([]);
    setLastCrosshairPosition(null);
    
    // Reset historical data flag when symbol changes
    historicalDataLoadedRef.current = false;
    
    // Always show loading animation for 1 second when symbol changes
    if (selectedSymbol) {
      setIsChartLoading(true);
      
      // Always show loading for exactly 1 second
      setTimeout(() => {
        setIsChartLoading(false);
      }, 1000);
    }
    
    // Only clear drawings when symbol actually changes
    // This prevents drawings from being cleared on every render
    if (lineSeriesRef.current) {
      lineSeriesRef.current.setData([]);
    }
  }, [selectedSymbol]);

  // Live updates
  useEffect(() => {
    if (!liveTickers?.length || !candleSeriesRef.current) return;

    const tick = liveTickers.find(d => d.symbol === selectedSymbol);
    if (!tick || !tick.time || typeof tick.bid !== 'number') return;

      const price = tick.bid;
      const tickTime = Math.floor(tick.time);
    const candleTime = Math.floor(tickTime / timeframeInSeconds) * timeframeInSeconds;
      const last = lastCandleRef.current;

      if (!last) {
      // No candle yet - create first one if no historical data is loaded
      // This handles the case where historical data is still loading
      const newCandle = {
          time: candleTime,
          open: price,
          high: price,
          low: price,
          close: price,
        };
        candleSeriesRef.current.update(newCandle);
        lastCandleRef.current = newCandle;
        return;
      }

      if (candleTime === last.time) {
      // Tick falls within current candle timeframe — update candle
      const updated = {
          time: last.time,
          open: last.open,
          high: Math.max(last.high, price),
          low: Math.min(last.low, price),
          close: price,
        };
        candleSeriesRef.current.update(updated);
        lastCandleRef.current = updated;
      } else if (candleTime > last.time) {
      // Tick belongs to a new candle timeframe — create new candle
      const newCandle = {
          time: candleTime,
          open: price,
          high: price,
          low: price,
          close: price,
        };
        candleSeriesRef.current.update(newCandle);
        lastCandleRef.current = newCandle;
    } else {
      // Older tick? Ignore or handle accordingly
      console.warn('Received older tick ignored:', tickTime, 'last candle time:', last.time);
    }
  }, [liveTickers, selectedSymbol, timeframeInSeconds]);

  // Drawing tools
  const startDrawing = (mode: 'line') => {

    setDrawingMode(mode);
    setStartPoint(null);
    setSelectedPoint(null);
    
    // Change crosshair mode and disable chart interactions when drawing
    if (chartRef.current) {
      chartRef.current.applyOptions({ 
        handleScroll: false, 
        handleScale: false 
      });
    }
    if (containerRef.current) {
      containerRef.current.style.cursor = "crosshair";
    }
  };

  const clearDrawings = () => {
 
    setDrawings([]);
    setPreview(null);
    setStartPoint(null);
    setSelectedPoint(null);
    // Clear line series
    if (lineSeriesRef.current) {
      lineSeriesRef.current.setData([]);
    }
    if (previewSeriesRef.current) {
      previewSeriesRef.current.setData([]);
    }
    
    // Reset chart interactions
    if (chartRef.current) {
      chartRef.current.applyOptions({ 
        handleScroll: true, 
        handleScale: true 
      });
    }
    if (containerRef.current) {
      containerRef.current.style.cursor = "default";
    }
  };

  // Zoom functions
  const zoomIn = () => {
    if (!chartRef.current) return;
    
    const timeScale = chartRef.current.timeScale();
    const currentBarSpacing = timeScale.options().barSpacing || 6;
    timeScale.applyOptions({
      rightOffset: 0,
      barSpacing: currentBarSpacing * 1.2,
    });
  };

  const zoomOut = () => {
    if (!chartRef.current) return;
    
    const timeScale = chartRef.current.timeScale();
    const currentBarSpacing = timeScale.options().barSpacing || 6;
    timeScale.applyOptions({
      rightOffset: 0,
      barSpacing: currentBarSpacing / 1.2,
    });
  };

  // Render all drawings and preview
  useEffect(() => {

    
    if (!lineSeriesRef.current || !previewSeriesRef.current) {
   
      return;
    }

    // Render all lines
    const allLines = drawings
      .filter(d => d.type === 'line')
      .map(d => d.points)
      .filter(p => p.length === 2 && p.every(pt => pt && pt.time != null && pt.price != null && !isNaN(pt.time) && !isNaN(pt.price)));
 
    if (allLines.length > 0) {
      // For now, show the most recent line (like the vanilla JS example)
      // The vanilla JS example only shows one line at a time
      const latestLine = allLines[allLines.length - 1];
      const lineData = latestLine.map(point => ({
        time: point.time,
        value: point.price
      })).filter(point => point.time != null && point.value != null && !isNaN(point.time) && !isNaN(point.value));
      
      if (lineData.length === 2) {
        lineSeriesRef.current.setData(lineData);
 
      } else {

        lineSeriesRef.current.setData([]);
      }
    } else {
      lineSeriesRef.current.setData([]);
 
    }

    // Render preview
    if (
      preview &&
      preview.points.every(pt => pt && pt.time != null && pt.price != null) &&
      preview.type === 'line' && preview.points.length === 2
    ) {
      previewSeriesRef.current.setData(preview.points);

    } else {
      // Don't clear preview here - let mouse move handler manage it
      // previewSeriesRef.current.setData([]);
      // console.log('Cleared preview series data');
    }
  }, [drawings, preview]);

  return {
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
  };
}; 