import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const Tooltip: React.FC<TooltipProps> = ({ children, content, side = 'right' }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const getPositionStyle = (side: string) => {
    switch (side) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px'
        };
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px'
        };
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px'
        };
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '8px'
        };
      default:
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px'
        };
    }
  };

  console.log('Tooltip render:', { isVisible, content });

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => {
        console.log('Mouse enter tooltip');
        setIsVisible(true);
      }}
      onMouseLeave={() => {
        console.log('Mouse leave tooltip');
        setIsVisible(false);
      }}
    >
      {children}
      {isVisible && (
        <div 
          className="pointer-events-none"
          style={{
            position: 'absolute',
            zIndex: 9999,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxWidth: '300px',
            fontSize: '14px',
            ...getPositionStyle(side)
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};