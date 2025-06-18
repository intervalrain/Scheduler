import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, side = 'right' }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const sideClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 ${sideClasses[side]}`}>
          <div className="bg-popover border rounded-lg shadow-lg p-3 w-max max-w-xs">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};