import React, { useState, useEffect } from 'react';
import { 
  Files, 
  Users, 
  Clock, 
  Star, 
  Trash2, 
  Cloud, 
  Box, 
  HardDrive,
  LogOut,
  User,
  HardDriveUpload,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  Download,
  FolderOpen
} from 'lucide-react';
import type { NavSection } from '../../App';
import { TranslationKey, t } from '../../shared/i18n';

interface SidebarProps {
  activeNav: NavSection;
  onNavChange: (nav: NavSection) => void;
  isLoggedIn?: boolean;
  userEmail?: string;
  onLogout?: () => void;
}

type MountStatus = 'unmounted' | 'mounting' | 'mounted' | 'error';
type DependencyStatus = 'installed' | 'missing' | 'checking';

interface StorageQuota {
  limit: string;
  usage: string;
  usageInDrive: string;
}

const NAV_ITEMS: Array<{ id: NavSection; labelKey: TranslationKey; icon: React.ReactNode }> = [
  { id: 'my-drive', labelKey: 'nav.my-drive', icon: <Files size={20} /> },
  { id: 'shared', labelKey: 'nav.shared', icon: <Users size={20} /> },
  { id: 'recent', labelKey: 'nav.recent', icon: <Clock size={20} /> },
  { id: 'starred', labelKey: 'nav.starred', icon: <Star size={20} /> },
  { id: 'trash', labelKey: 'nav.trash', icon: <Trash2 size={20} /> },
];

function formatBytes(bytes: string | number): string {
  const b = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(b) || b <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function Sidebar({ activeNav, onNavChange, isLoggedIn, userEmail, onLogout }: SidebarProps) {
  const [quota, setQuota] = useState<StorageQuota | null>(null);
  const [mountStatus, setMountStatus] = useState<MountStatus>('unmounted');
  const [depStatus, setDepStatus] = useState<DependencyStatus>('checking');

  useEffect(() => {
    if (!window.drivenest) return;

    if (isLoggedIn) {
      window.drivenest.invoke('app:getStorageQuota')
        .then(setQuota)
        .catch(err => console.error('Failed to fetch storage quota:', err));
        
      window.drivenest.invoke('mount:status').then(setMountStatus);
      window.drivenest.invoke('mount:check').then(setDepStatus);
    } else {
      setQuota(null);
      setMountStatus('unmounted');
    }

    const unsubscribeMount = window.drivenest.on('mount:statusChanged', (status) => {
      setMountStatus(status);
    });

    return () => {
      unsubscribeMount();
    };
  }, [isLoggedIn]);

  const handleMountAction = async () => {
    if (!window.drivenest) return;
    if (mountStatus === 'mounting') return;
    
    try {
      if (mountStatus === 'mounted') {
        await window.drivenest.invoke('mount:stop');
      } else {
        // Wait for check to finish if currently checking
        let activeDep = depStatus;
        if (activeDep === 'checking') {
          activeDep = await window.drivenest.invoke('mount:check');
          setDepStatus(activeDep);
        }

        if (activeDep === 'missing') {
          setDepStatus('checking');
          await window.drivenest.invoke('mount:install');
          const newDeps = await window.drivenest.invoke('mount:check');
          setDepStatus(newDeps);
          if (newDeps !== 'installed') {
             alert(t('nav.mount.install-error'));
             return;
          }
        }
        await window.drivenest.invoke('mount:start');
      }
    } catch (err: any) {
      alert(t('nav.mount.error', { error: err.message }));
    }
  };

  const handleOpenMountFolder = () => {
    window.drivenest?.invoke('mount:openFolder');
  };

  const usagePercent = quota && quota.limit !== '0' 
    ? (parseInt(quota.usage, 10) / parseInt(quota.limit, 10)) * 100 
    : 0;

  return (
    <aside className="sidebar">
      {/* Navigation */}
      <nav className="sidebar__nav">
        <div className="sidebar__section-label">{t('nav.navigation')}</div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`sidebar__item ${activeNav === item.id ? 'sidebar__item--active' : ''}`}
            onClick={() => onNavChange(item.id)}
          >
            <span className="sidebar__item-icon">{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </div>
        ))}

        <div className="sidebar__section-label" style={{ marginTop: 12 }}>
          {t('nav.cloud-services')}
        </div>
        <div className="sidebar__item">
          <Cloud className="sidebar__item-icon" size={20} />
          <span style={{ flex: 1 }}>Google Drive</span>
        </div>
        
        {isLoggedIn && (
          <>
            <div 
              className={`sidebar__item ${mountStatus === 'mounting' ? 'sidebar__item--disabled' : ''}`}
              onClick={handleMountAction}
              style={{ paddingLeft: '28px' }}
            >
              {mountStatus === 'mounting' ? <RefreshCcw size={20} className="animate-spin" /> : 
               mountStatus === 'mounted' ? <CheckCircle size={20} color="#10b981" /> :
               mountStatus === 'error' ? <AlertCircle size={20} color="#ef4444" /> :
               depStatus === 'missing' ? <Download size={20} /> :
               <HardDrive size={20} />}
              <span>
                {mountStatus === 'mounting' ? t('nav.mount.mounting') : 
                 mountStatus === 'mounted' ? t('nav.mount.unmount') :
                 depStatus === 'missing' ? t('nav.mount.install') :
                 t('nav.mount.mount')}
              </span>
            </div>
            
            {mountStatus === 'mounted' && (
              <div 
                className="sidebar__item" 
                onClick={handleOpenMountFolder} 
                style={{ paddingLeft: '32px', color: 'var(--color-primary)' }}
              >
                <FolderOpen size={16} />
                <span>{t('nav.mount.open')}</span>
              </div>
            )}
          </>
        )}
        <div className="sidebar__item" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
          <Box className="sidebar__item-icon" size={18} />
          <span>Dropbox <small style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>({t('nav.upcoming')})</small></span>
        </div>
        <div className="sidebar__item" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
          <HardDrive className="sidebar__item-icon" size={18} />
          <span>OneDrive <small style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>({t('nav.upcoming')})</small></span>
        </div>
      </nav>

      {/* Footer: User Info + Storage */}
      <div className="sidebar__footer">
        {isLoggedIn && (
          <div className="sidebar__user">
            <div className="sidebar__user-info">
              <User size={14} />
              <span className="sidebar__user-email" title={userEmail}>
                {userEmail || t('auth.connected')}
              </span>
            </div>
            <button className="sidebar__logout-btn" onClick={onLogout} title={t('auth.logout')}>
              <LogOut size={14} />
            </button>
          </div>
        )}
        <div className="sidebar__storage">
          <div className="sidebar__storage-label">{t('status.storage')}</div>
          <div className="sidebar__storage-bar">
            {quota && (
              <div 
                className="sidebar__storage-fill" 
                style={{ width: `${Math.min(100, usagePercent)}%` }} 
              />
            )}
          </div>
          <div className="sidebar__storage-text">
            {quota 
              ? t('status.storage.used', { used: formatBytes(quota.usage), total: formatBytes(quota.limit) })
              : t('status.storage.not-logged-in')
            }
          </div>
        </div>
      </div>
    </aside>
  );
}
