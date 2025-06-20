import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Eye, Edit, Save, Image, Upload } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  placeholder?: string;
  className?: string;
}

// Simple markdown renderer for basic formatting
const renderMarkdown = (text: string): string => {
  let html = text;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2 text-foreground">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2 text-foreground">$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-foreground">$1</em>');
  
  // Code blocks
  html = html.replace(/```([^`]+)```/g, '<pre class="bg-muted p-3 rounded-md my-2 text-sm overflow-x-auto"><code class="text-foreground">$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm text-foreground">$1</code>');
  
  // Images (process before links to avoid conflicts)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-md my-2 border" loading="lazy" />');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Lists
  html = html.replace(/^\* (.+)$/gm, '<li class="ml-4 text-foreground">• $1</li>');
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 text-foreground">• $1</li>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-foreground">$1</li>');
  
  // Line breaks
  html = html.replace(/\n\n/g, '</p><p class="mb-2 text-foreground">');
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in paragraphs
  if (html && !html.startsWith('<')) {
    html = '<p class="mb-2 text-foreground">' + html + '</p>';
  }
  
  return html;
};

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onSave,
  placeholder = "在此處撰寫 Markdown 筆記...",
  className = ""
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Insert image markdown at cursor position
  const insertImageMarkdown = (imageSrc: string, altText: string = 'image') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const imageMarkdown = `![${altText}](${imageSrc})`;
    
    const newValue = value.slice(0, selectionStart) + imageMarkdown + value.slice(selectionEnd);
    onChange(newValue);
    
    // Set cursor position after the inserted image
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectionStart + imageMarkdown.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Handle clipboard paste
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        setIsUploading(true);
        
        try {
          const file = item.getAsFile();
          if (file) {
            const base64 = await fileToBase64(file);
            const altText = `image-${Date.now()}`;
            insertImageMarkdown(base64, altText);
          }
        } catch (error) {
          console.error('Error processing pasted image:', error);
        } finally {
          setIsUploading(false);
        }
        break;
      }
    }
  };

  // Handle file upload from input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const altText = file.name.split('.')[0] || 'image';
      insertImageMarkdown(base64, altText);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }

    // Clear the input
    e.target.value = '';
  };

  // Trigger file input
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant={isPreview ? "outline" : "default"}
            size="sm"
            onClick={() => setIsPreview(false)}
          >
            <Edit className="w-4 h-4 mr-1" />
            編輯
          </Button>
          <Button
            variant={isPreview ? "default" : "outline"}
            size="sm"
            onClick={togglePreview}
          >
            <Eye className="w-4 h-4 mr-1" />
            預覽
          </Button>
          {!isPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={triggerFileUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <Upload className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Image className="w-4 h-4 mr-1" />
              )}
              {isUploading ? '上傳中...' : '圖片'}
            </Button>
          )}
        </div>
        {onSave && (
          <Button onClick={onSave} size="sm" variant="outline">
            <Save className="w-4 h-4 mr-2" />
            儲存
          </Button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        {isPreview ? (
          <div className="flex-1 p-4 overflow-y-auto">
            {value ? (
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
              />
            ) : (
              <p className="text-muted-foreground italic">沒有內容可預覽</p>
            )}
          </div>
        ) : (
          <>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder}
              className="flex-1 resize-none border-0 rounded-none focus:ring-0 focus:border-0"
            />
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        )}
      </div>
      
      {!isPreview && (
        <div className="p-3 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>支援：**粗體** *斜體* `程式碼` ```程式碼區塊``` # 標題 - 清單 [連結](url)</div>
            <div>🖼️ 圖片：直接貼上剪貼簿圖片或點擊「圖片」按鈕上傳</div>
          </div>
        </div>
      )}
    </Card>
  );
};