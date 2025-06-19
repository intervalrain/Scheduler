import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Tooltip } from './ui/tooltip';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  value: number;
  title: string;
  collapsed: boolean;
  icon: LucideIcon;
  description?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  title,
  collapsed,
  icon: Icon,
  description,
  onClick,
}) => {
  const [isHighlighted, setIsHighlighted] = useState(false);

  if (collapsed) {
    return (
      <div 
        className="flex-1 text-center"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`StatCard outer div clicked: ${title}`);
          setIsHighlighted(!isHighlighted);
          onClick?.();
        }}
      >
        <Tooltip
          content={
            <div>
              <h3 className="font-semibold mb-2">{title}</h3>
              {description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {description}
                </p>
              )}
              <p className="text-lg text-muted-foreground">
                目前有 {value} 小時
              </p>
            </div>
          }
        >
          <div 
            className={`flex flex-col items-center justify-center space-y-1 cursor-pointer rounded-md p-3 transition-all duration-200 mx-auto w-full ${
              isHighlighted 
                ? 'bg-primary/30 scale-110 shadow-lg ring-2 ring-primary/50' 
                : 'hover:bg-muted/30 hover:scale-102'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log(`StatCard inner div clicked: ${title}`);
              setIsHighlighted(!isHighlighted);
              onClick?.();
            }}
          >
            <Icon className={`w-5 h-5 mx-auto transition-colors ${
              isHighlighted ? 'text-white' : 'text-primary'
            }`} />
            <span className={`text-xs font-bold transition-colors ${
              isHighlighted ? 'text-white' : 'text-primary'
            }`}>
              {value}
            </span>
            {isHighlighted && (
              <span className="text-xs text-white">已選中</span>
            )}
          </div>
        </Tooltip>
      </div>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Icon className="w-6 h-6 text-primary mr-2" />
            <p className="text-2xl font-bold text-primary">
              {value}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};