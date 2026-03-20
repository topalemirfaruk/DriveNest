import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Copy } from 'lucide-react';
import { t } from '../../shared/i18n';
// @ts-ignore - Ignore missing type declarations for png imports
import logoUrl from '../../../../assets/icons/logo.png';

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
        <div className="titlebar__logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="titlebar__logo-icon" style={{ background: 'none', padding: 0, width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }}>
            <img src={logoUrl} alt="DriveNest" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 4px rgba(var(--color-primary-rgb), 0.3))' }} />
          </div>
          <span className="titlebar__logo-text" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.9)' }}>DriveNest</span>
        </div>
      </div>
      <div className="titlebar__controls">
        <button className="titlebar__btn" onClick={handleMinimize} title={t('title.minimize')}>
          <Minus size={14} />
        </button>
        <button className="titlebar__btn" onClick={handleMaximize} title={isMaximized ? t('title.restore') : t('title.maximize')}>
          {isMaximized ? <Copy size={12} /> : <Square size={12} />}
        </button>
        <button className="titlebar__btn titlebar__btn--close" onClick={handleClose} title={t('title.close')}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
