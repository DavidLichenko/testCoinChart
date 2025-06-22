import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Square, Pencil, MousePointer } from 'lucide-react';

type DrawingType = 'none' | 'line' | 'rectangle';

interface DrawingToolsProps {
  currentTool: DrawingType;
  onToolSelect: (tool: DrawingType) => void;
}

const drawingTools: { tool: DrawingType; icon: React.ElementType; title: string }[] = [
  { tool: 'none', icon: MousePointer, title: 'Select' },
  { tool: 'line', icon: Pencil, title: 'Line' },
  { tool: 'rectangle', icon: Square, title: 'Rectangle' },
];

export const DrawingTools: React.FC<DrawingToolsProps> = ({ currentTool, onToolSelect }) => {
  return (
    <div className="flex flex-col gap-2">
      {drawingTools.map(({ tool, icon: Icon, title }) => (
        <Button
          key={tool}
          variant={currentTool === tool ? "default" : "outline"}
          size="icon"
          onClick={() => onToolSelect(tool)}
          title={title}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}; 