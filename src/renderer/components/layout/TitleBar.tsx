import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!window.drivenest) return;
    
    // Check initial state
    window.drivenest.invoke('window:isMaximized').then(setIsMaximized);
    
    // In a full implementation, we would register a listener for resize events
    // but for now we'll update state on button click for immediate feedback.
  }, []);

  const handleMinimize = () => window.drivenest?.invoke('window:minimize');
  
  const handleMaximize = async () => {
    if (!window.drivenest) return;
    if (isMaximized) {
      await window.drivenest.invoke('window:unmaximize');
    } else {
      await window.drivenest.invoke('window:maximize');
    }
    setIsMaximized(!isMaximized);
  };
  
  const handleClose = () => window.drivenest?.invoke('window:close');

  return (
    <div className="titlebar">
      <div className="titlebar__drag">
        <div className="titlebar__logo">
          <div className="titlebar__logo-icon">DN</div>
          <span className="titlebar__logo-text">DriveNest</span>
        </div>
      </div>
      <div className="titlebar__controls">
        <button className="titlebar__btn" onClick={handleMinimize} title="Küçült">
          <Minus size={14} />
        </button>
        <button className="titlebar__btn" onClick={handleMaximize} title={isMaximized ? "Aşağı Geri Getir" : "Ekranı Kapla"}>
          {isMaximized ? <Copy size={12} /> : <Square size={12} />}
        </button>
        <button className="titlebar__btn titlebar__btn--close" onClick={handleClose} title="Kapat">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
