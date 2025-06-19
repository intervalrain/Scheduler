import React, { useState } from "react";
import { Code, Timer } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Tooltip } from "./ui/tooltip";
import { useAppContext } from "../contexts/AppContext";

interface TimeStatsPanelProps {
  collapsed: boolean;
}

export const TimeStatsPanel: React.FC<TimeStatsPanelProps> = ({
  collapsed,
}) => {
  const { calculateRemainingHours, calculateDevelopHours } = useAppContext();
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);

  const statCards = [
    {
      id: 'remaining',
      value: calculateRemainingHours(),
      title: "剩餘時間 (小時)",
      icon: Timer,
      description: "還可以安排的空閒時段",
    },
    {
      id: 'development',
      value: calculateDevelopHours(),
      title: "開發時間 (小時)",
      icon: Code,
      description: "已安排的開發工作時間",
    },
  ];

  if (collapsed) {
    const selectedCard = statCards[selectedCardIndex];
    const Icon = selectedCard.icon;
    
    return (
      <div className="text-center">
        <Tooltip
          content={
            <div className="w-64">
              <h3 className="font-semibold mb-3">選擇要顯示的統計</h3>
              <div className="space-y-2">
                {statCards.map((card, index) => {
                  const CardIcon = card.icon;
                  return (
                    <div
                      key={card.id}
                      className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                        selectedCardIndex === index
                          ? "bg-primary/20 ring-1 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedCardIndex(index)}
                    >
                      <CardIcon className="w-4 h-4 text-primary" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{card.title}</div>
                        <div className="text-xs text-muted-foreground">{card.description}</div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {card.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          }
        >
          <div className="flex flex-col items-center justify-center space-y-1 cursor-pointer hover:bg-muted/30 rounded-md p-3 transition-colors w-full">
            <Icon className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold text-primary">
              {selectedCard.value}
            </span>
          </div>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={card.id} className="mb-4">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Icon className="w-6 h-6 text-primary mr-2" />
                  <p className="text-2xl font-bold text-primary">
                    {card.value}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};