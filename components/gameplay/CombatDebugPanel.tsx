import React, { useState, useEffect, useRef, useCallback } from 'react';
import Button from '../ui/Button';

interface CombatDebugPanelProps {
  sentPrompts: string[];
  rawResponses: string[];
  onClose: () => void;
}

// Re-using constants for consistency
const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;
const INITIAL_WIDTH = 400;
const INITIAL_HEIGHT = 450;
const HANDLE_SIZE = 12;

const CombatDebugPanel: React.FC<CombatDebugPanelProps> = ({ sentPrompts, rawResponses, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  const [position, setPosition] = useState(() => {
    const top = window.innerHeight - INITIAL_HEIGHT - 80; // position it a bit higher than the corner button
    const left = window.innerWidth - INITIAL_WIDTH - 20;
    return { top: Math.max(0, top), left: Math.max(0, left) };
  });
  const [dimensions, setDimensions] = useState({ width: INITIAL_WIDTH, height: INITIAL_HEIGHT });
  
  const interactionStartRef = useRef({ 
    mouseX: 0, 
    mouseY: 0, 
    panelX: 0, 
    panelY: 0, 
    panelW: 0, 
    panelH: 0 
  });

  const handleMouseDownDrag = useCallback((e: React.MouseEvent<HTMLHeadingElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    interactionStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panelX: position.left,
      panelY: position.top,
      panelW: dimensions.width,
      panelH: dimensions.height,
    };
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, [position, dimensions]);

  const handleMouseDownResize = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setIsResizing(true);
    interactionStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panelX: position.left,
      panelY: position.top,
      panelW: dimensions.width,
      panelH: dimensions.height,
    };
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, [position, dimensions]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - interactionStartRef.current.mouseX;
      const deltaY = e.clientY - interactionStartRef.current.mouseY;
      
      let newLeft = interactionStartRef.current.panelX + deltaX;
      let newTop = interactionStartRef.current.panelY + deltaY;

      newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - dimensions.width));
      newTop = Math.max(0, Math.min(newTop, window.innerHeight - dimensions.height));
      
      setPosition({ left: newLeft, top: newTop });
    } else if (isResizing) {
      const deltaX = e.clientX - interactionStartRef.current.mouseX;
      const deltaY = e.clientY - interactionStartRef.current.mouseY;
      
      let newWidth = interactionStartRef.current.panelW + deltaX;
      let newHeight = interactionStartRef.current.panelH + deltaY;

      newWidth = Math.max(MIN_WIDTH, newWidth);
      newHeight = Math.max(MIN_HEIGHT, newHeight);

      newWidth = Math.min(newWidth, window.innerWidth - position.left);
      newHeight = Math.min(newHeight, window.innerHeight - position.top);
      
      setDimensions({ width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, dimensions.width, dimensions.height, position.left, position.top]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div 
      ref={panelRef}
      className="fixed bg-gray-900/90 backdrop-blur-sm border-2 border-cyan-500 rounded-lg shadow-2xl overflow-y-auto custom-scrollbar z-50 flex flex-col"
      style={{ 
        top: `${position.top}px`, 
        left: `${position.left}px`, 
        width: `${dimensions.width}px`, 
        height: `${dimensions.height}px`,
      }}
    >
      <h4 
        className="text-lg font-bold text-cyan-400 mb-2 border-b border-cyan-600 pb-2 p-3 cursor-move flex-shrink-0 flex justify-between items-center"
        onMouseDown={handleMouseDownDrag}
      >
        <span>Combat Debug</span>
        <Button variant="ghost" size="sm" onClick={onClose} className="!p-1 text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </Button>
      </h4>

      <div className="p-3 overflow-y-auto flex-grow custom-scrollbar"> 
        <div className="mb-4">
          <h5 className="text-md font-semibold text-sky-300 mb-1">Sent Prompts ({sentPrompts.length} latest)</h5>
          {sentPrompts.length === 0 ? (
            <p className="text-xs italic text-gray-500">No prompts sent yet.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar text-xs">
              {sentPrompts.map((promptEntry, index) => (
                <details key={`sent-${index}`} className="bg-gray-800 rounded group">
                  <summary className="p-1.5 text-sky-200 cursor-pointer text-[11px] group-open:font-semibold">
                    Prompt #{sentPrompts.length - index} (Click to view)
                  </summary>
                  <pre className="p-1.5 bg-gray-850 text-sky-100 whitespace-pre-wrap break-all text-[10px] leading-relaxed max-h-80 overflow-y-auto custom-scrollbar">
                    {promptEntry}
                  </pre>
                </details>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <h5 className="text-md font-semibold text-lime-300 mb-1">Raw AI Responses ({rawResponses.length} latest)</h5>
          {rawResponses.length === 0 ? (
            <p className="text-xs italic text-gray-500">No raw responses yet.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar text-xs">
              {rawResponses.map((responseEntry, index) => (
                 <details key={`raw-${index}`} className="bg-gray-800 rounded group">
                  <summary className="p-1.5 text-lime-200 cursor-pointer text-[11px] group-open:font-semibold">
                    Response #{rawResponses.length - index} (Click to view)
                  </summary>
                  <pre className="p-1.5 bg-gray-850 text-lime-100 whitespace-pre-wrap break-all text-[10px] leading-relaxed max-h-80 overflow-y-auto custom-scrollbar">
                    {responseEntry}
                  </pre>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
      <div 
        className="absolute bg-cyan-600 opacity-50 hover:opacity-100"
        style={{
            width: `${HANDLE_SIZE}px`,
            height: `${HANDLE_SIZE}px`,
            bottom: '0px',
            right: '0px',
            cursor: 'nwse-resize',
        }}
        onMouseDown={handleMouseDownResize}
      />
    </div>
  );
};

export default CombatDebugPanel;