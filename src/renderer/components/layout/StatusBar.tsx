import React, { useState, useEffect } from 'react';
import { Monitor, Loader2 } from 'lucide-react';
import type { SyncState } from '../../../shared/types/ipc';
import { t } from '../../shared/i18n';

export function StatusBar() {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [version, setVersion] = useState('0.1.0');
  const [activeTransfer, setActiveTransfer] = useState<{ file: string; percent: number } | null>(null);

  useEffect(() => {
    if (!window.drivenest) return;

    const unsubscribeState = window.drivenest.on('sync:stateChanged', (status) => {
      setSyncState(status.state);
    });

    const unsubscribeProgress = window.drivenest.on('sync:progress', (data) => {
      setActiveTransfer({ file: data.file, percent: data.percent });
      if (data.percent >= 100) {
        setTimeout(() => setActiveTransfer(null), 3000);
      }
    });

    window.drivenest.invoke('app:getVersion').then(setVersion).catch(() => {});

    return () => {
      unsubscribeState();
      unsubscribeProgress();
    };
  }, []);

  const stateLabels: Record<SyncState, string> = {
    idle: t('files.status.idle'),
    syncing: t('files.status.syncing'),
    paused: t('files.status.paused'),
    error: t('files.status.error'),
    offline: t('files.status.offline'),
  };

  return (
    <footer className="statusbar">
      <div className="statusbar__left">
        {activeTransfer ? (
          <div className="statusbar__item statusbar__item--transfer">
            <Loader2 size={12} className="spin" />
            <span className="statusbar__filename" title={activeTransfer.file}>{activeTransfer.file}</span>
            <div className="statusbar__progress-container">
              <div 
                className="statusbar__progress-bar" 
                style={{ width: `${activeTransfer.percent}%` }} 
              />
            </div>
            <span className="statusbar__percent">%{activeTransfer.percent}</span>
          </div>
        ) : (
          <div className="statusbar__item">
            <span className={`statusbar__dot statusbar__dot--${syncState}`} />
            <span>{stateLabels[syncState]}</span>
          </div>
        )}
      </div>
      <div className="statusbar__right">
        <span className="statusbar__item">
          <Monitor size={12} />
          <span>DriveNest v{version}</span>
        </span>
        <span className="statusbar__item">Linux</span>
      </div>
    </footer>
  );
}
