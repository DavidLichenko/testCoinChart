import React, { useState, useRef } from 'react'
import Plot from 'react-plotly.js'

const LIGHT_BLUE = '#42A5F5'
const LIGHT_BLUE_RGBA = 'rgba(66,165,245,0.2)'

const mockCandles = [
    { time: 1687411140, open: 1.0726, high: 1.07268, low: 1.07235, close: 1.07237 },
    { time: 1687411200, open: 1.07237, high: 1.07248, low: 1.07222, close: 1.07236 },
    { time: 1687411260, open: 1.07237, high: 1.07256, low: 1.07233, close: 1.07256 },
    { time: 1687411320, open: 1.07255, high: 1.07259, low: 1.07236, close: 1.07236 },
    { time: 1687411380, open: 1.07236, high: 1.07256, low: 1.07231, close: 1.07252 },
    { time: 1687411440, open: 1.07251, high: 1.07262, low: 1.07241, close: 1.07259 },
]

export default function PlotlyChart() {
    const [dragMode, setDragMode] = useState<'pan' | 'drawline' | 'drawrect'>('pan')
    const [shapes, setShapes] = useState<any[]>([])

    const shapesRef = useRef(shapes)
    shapesRef.current = shapes

    const styleShape = (shape: any) => {
        if (shape.type === 'line') {
            return {
                ...shape,
                line: { color: LIGHT_BLUE, width: 2 },
                editable: true,
            }
        }
        if (shape.type === 'rect') {
            return {
                ...shape,
                line: { color: LIGHT_BLUE, width: 2 },
                fillcolor: LIGHT_BLUE_RGBA,
                editable: true,
            }
        }
        return shape
    }

    const handleRelayout = (event: any) => {
        const shapeKeys = Object.keys(event).filter((k) => k.startsWith('shapes'))
        if (shapeKeys.length === 0) return

        const newShapes = [...shapesRef.current]

        shapeKeys.forEach((key) => {
            const match = key.match(/shapes\[(\d+)\]\.(.+)/)
            if (!match) return
            const index = Number(match[1])
            const prop = match[2]

            if (newShapes[index]) {
                newShapes[index] = {
                    ...newShapes[index],
                    [prop]: event[key],
                }
            }
        })

        setShapes(newShapes.map(styleShape))
    }

    const onRelayout = (event: any) => {
        if ('shapes' in event && Array.isArray(event.shapes)) {
            setShapes(event.shapes.map(styleShape))
        } else {
            handleRelayout(event)
        }
    }

    return (
        <>
            <style>{`
        /* Disable text selection and pointer events on all plot texts except plot area */
        .js-plotly-plot text, 
        .js-plotly-plot .infolayer, 
        .js-plotly-plot .modebar,
        .js-plotly-plot .main-svg {
          user-select: none !important;
          pointer-events: none !important;
        }
        /* Enable pointer events only on modebar buttons and shapes */
        .js-plotly-plot .modebar * {
          pointer-events: auto !important;
        }
        .js-plotly-plot .shapelayer path {
          pointer-events: auto !important;
          cursor: grab;
        }
      `}</style>

            <div className="w-full min-h-screen bg-gray-900 p-4 text-white select-none">
                <div className="flex justify-center mb-4 gap-4 flex-wrap">
                    <button
                        onClick={() => setDragMode('pan')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            dragMode === 'pan' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        🖐 Pan
                    </button>
                    <button
                        onClick={() => setDragMode('drawline')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            dragMode === 'drawline' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        📏 Line
                    </button>
                    <button
                        onClick={() => setDragMode('drawrect')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            dragMode === 'drawrect' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        🟦 Rectangle
                    </button>
                    <button
                        onClick={() => setShapes([])}
                        className="px-4 py-2 rounded-lg text-sm font-semibold transition bg-red-600 hover:bg-red-500"
                    >
                        🗑 Clear All
                    </button>
                </div>

                <Plot
                    data={[
                        {
                            x: mockCandles.map((c) => new Date(c.time * 1000)),
                            open: mockCandles.map((c) => c.open),
                            high: mockCandles.map((c) => c.high),
                            low: mockCandles.map((c) => c.low),
                            close: mockCandles.map((c) => c.close),
                            type: 'candlestick',
                            name: 'EURUSD',
                            increasing: { line: { color: '#26a69a' } },
                            decreasing: { line: { color: '#ef5350' } },
                            whiskerwidth: 0.2,
                        },
                    ]}
                    layout={{
                        plot_bgcolor: '#1e293b',
                        paper_bgcolor: '#1e293b',
                        font: { color: '#ffffff' },
                        dragmode: dragMode,
                        shapes: shapes,
                        title: {
                            text:'',
                            subtitle: {
                                text:''
                            }
                        },
                        xaxis: {
                            title: {
                                text:''
                            },
                            type: 'date',
                            showgrid: false,
                            rangeslider: { visible: false },
                            tickformat: '%H:%M',
                            ticks: 'outside',
                            showline: true,
                            zeroline: false,
                            mirror: 'ticks',
                            automargin: true,
                        },
                        yaxis: {
                            title: {
                                text:''
                            },
                            side: 'right', // price axis on right side
                            showgrid: false,
                            ticks: 'outside',
                            showline: true,
                            zeroline: false,
                            mirror: 'ticks',
                            tickformat: '.5f',
                            automargin: true,
                        },
                        margin: { t: 20, b: 40, l: 60, r: 60 }, // add right margin for price axis
                        width: 900,
                        height: 600,
                    }}
                    config={{
                        responsive: true,
                        displaylogo: false,
                        editable: true,
                        edits: { shapePosition: true },
                        modeBarButtonsToRemove: [
                            'zoom2d',
                            'pan2d',
                            'select2d',
                            'lasso2d',
                            'zoomIn2d',
                            'zoomOut2d',
                            'autoScale2d',
                            'resetScale2d',
                            'hoverClosestCartesian',
                            'hoverCompareCartesian',
                            'toggleSpikelines',
                            'toImage',
                            'sendDataToCloud',
                            'zoom3d',
                            'pan3d',
                            'orbitRotation',
                            'tableRotation',
                            'resetCameraDefault3d',
                            'resetCameraLastSave3d',
                            'drawline',
                            'drawrect',
                            'eraseshape'
                        ],
                        scrollZoom: true,
                        displayModeBar: true,
                        showTips: false,
                        doubleClick: false,
                    }}
                    onRelayout={onRelayout}
                    style={{ width: '100%', maxWidth: 900, height: 600, margin: '0 auto', userSelect: 'none' }}
                />
            </div>
        </>
    )
}
