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

const NAV_ITEMS: Array<{ id: NavSection; label: string; icon: React.ReactNode }> = [
  { id: 'my-drive', label: 'Dosyalarım', icon: <Files size={18} /> },
  { id: 'shared', label: 'Paylaşılanlar', icon: <Users size={18} /> },
  { id: 'recent', label: 'Son Kullanılanlar', icon: <Clock size={18} /> },
  { id: 'starred', label: 'Yıldızlılar', icon: <Star size={18} /> },
  { id: 'trash', label: 'Çöp Kutusu', icon: <Trash2 size={18} /> },
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
             alert('Sistem bağımlılıkları (rclone/fuse) kurulamadı. Lütfen manuel olarak sisteminize kurun.');
             return;
          }
        }
        await window.drivenest.invoke('mount:start');
      }
    } catch (err: any) {
      alert(`Sanal disk hatası: ${err.message}`);
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
        <div className="sidebar__section-label">Gezinti</div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`sidebar__item ${activeNav === item.id ? 'sidebar__item--active' : ''}`}
            onClick={() => onNavChange(item.id)}
          >
            <span className="sidebar__item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}

        <div className="sidebar__section-label" style={{ marginTop: 12 }}>
          Bulut Servisleri
        </div>
        <div className="sidebar__item">
          <Cloud className="sidebar__item-icon" size={18} />
          <span style={{ flex: 1 }}>Google Drive</span>
        </div>
        
        {isLoggedIn && (
          <>
            <div 
              className={`sidebar__item ${mountStatus === 'mounting' ? 'sidebar__item--disabled' : ''}`}
              onClick={handleMountAction}
              style={{ paddingLeft: '28px' }}
            >
              {mountStatus === 'mounting' ? <RefreshCcw size={18} className="animate-spin" /> : 
               mountStatus === 'mounted' ? <CheckCircle size={18} color="#10b981" /> :
               mountStatus === 'error' ? <AlertCircle size={18} color="#ef4444" /> :
               depStatus === 'missing' ? <Download size={18} /> :
               <HardDrive size={18} />}
              <span>
                {mountStatus === 'mounting' ? 'Bağlanıyor...' : 
                 mountStatus === 'mounted' ? 'Sanal Diski Ayır' :
                 depStatus === 'missing' ? 'Sanal Disk Kur (Gerekli)' :
                 'Sanal Diski Bağla'}
              </span>
            </div>
            
            {mountStatus === 'mounted' && (
              <div 
                className="sidebar__item" 
                onClick={handleOpenMountFolder} 
                style={{ paddingLeft: '32px', color: 'var(--color-primary)' }}
              >
                <FolderOpen size={16} />
                <span>Diski Dosya Yöneticisinde Aç</span>
              </div>
            )}
          </>
        )}
        <div className="sidebar__item" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
          <Box className="sidebar__item-icon" size={18} />
          <span>Dropbox <small style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>(yakında)</small></span>
        </div>
        <div className="sidebar__item" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
          <HardDrive className="sidebar__item-icon" size={18} />
          <span>OneDrive <small style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>(yakında)</small></span>
        </div>
      </nav>

      {/* Footer: User Info + Storage */}
      <div className="sidebar__footer">
        {isLoggedIn && (
          <div className="sidebar__user">
            <div className="sidebar__user-info">
              <User size={14} />
              <span className="sidebar__user-email" title={userEmail}>
                {userEmail || 'Bağlı'}
              </span>
            </div>
            <button className="sidebar__logout-btn" onClick={onLogout} title="Çıkış Yap">
              <LogOut size={14} />
            </button>
          </div>
        )}
        <div className="sidebar__storage">
          <div className="sidebar__storage-label">Depolama</div>
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
              ? `${formatBytes(quota.usage)} / ${formatBytes(quota.limit)} kullanılıyor`
              : 'Giriş yapılmadı'
            }
          </div>
        </div>
      </div>
    </aside>
  );
}
