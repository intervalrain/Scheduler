import React from 'react';
import { BaseModal } from './ui/base-modal';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface SettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingModal: React.FC<SettingModalProps> = ({ isOpen, onClose }) => {

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">設定</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>應用程式設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">📋 時間設定已移至側邊欄</p>
                <p className="mb-2">🎨 主題設定</p>
                <p className="mb-2">💾 資料匯入/匯出</p>
                <p className="mb-2">🔔 通知設定</p>
                <p>⚙️ 更多設定選項將在未來版本中加入...</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onClose}>
            確定
          </Button>
        </div>
      </div>
    </BaseModal>
  );
}; 