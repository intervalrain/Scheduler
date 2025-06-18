import React from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, side = 'right' }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const [hideTimeout, setHideTimeout] = React.useState<NodeJS.Timeout | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      console.log('Container rect:', rect);
      
      let top = 0;
      let left = 0;
      
      switch (side) {
        case 'top':
          top = rect.top - 8;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 8;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 8;
          break;
        case 'right':
        default:
          top = rect.top + rect.height / 2;
          left = rect.right + 8;
          break;
      }
      
      setPosition({ top, left });
    }
  };

  const showTooltip = () => {
    console.log('Showing tooltip');
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
    updatePosition();
    setIsVisible(true);
  };

  const hideTooltip = () => {
    console.log('Starting hide tooltip countdown');
    const timeout = setTimeout(() => {
      console.log('Hiding tooltip');
      setIsVisible(false);
    }, 150);
    setHideTimeout(timeout);
  };

  const cancelHide = () => {
    console.log('Canceling tooltip hide');
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      setHideTimeout(null);
    }
  };

  React.useEffect(() => {
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [hideTimeout]);

  console.log('Tooltip render:', { isVisible, hasContent: !!content });

  const tooltipContent = isVisible ? (
    <div 
      onMouseEnter={cancelHide}
      onMouseLeave={hideTooltip}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        transform: 
          side === 'top' ? 'translate(-50%, -100%)' :
          side === 'bottom' ? 'translate(-50%, 0%)' :
          side === 'left' ? 'translate(-100%, -50%)' :
          'translate(0%, -50%)',
        zIndex: 999999,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        minWidth: '200px',
        maxWidth: '320px',
        fontSize: '14px',
        color: 'black',
        pointerEvents: 'auto'
      }}
    >
      {content}
    </div>
  ) : null;

  return (
    <>
      <div 
        ref={containerRef}
        className="relative inline-block"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {children}
      </div>
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
};