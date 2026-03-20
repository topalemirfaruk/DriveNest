import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  Users, 
  Clock, 
  Star, 
  Trash2, 
  Cloud, 
  LogIn,
  File,
  Loader2,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  Code2,
  Table,
  Presentation,
  Download,
  X,
  Maximize2,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import type { NavSection } from '../../App';
import { t, TranslationKey, getLocale } from '../../shared/i18n';

interface FileExplorerProps {
  activeNav: NavSection;
  searchQuery: string;
  isLoggedIn: boolean;
  isCheckingAuth: boolean;
  refreshTrigger?: number;
  viewMode: 'grid' | 'list';
  onLoginSuccess: (email?: string) => void;
  onLogout: () => void;
  currentFolderId: string;
  onNavigate: (id: string, name?: string) => void;
  onRefresh: () => void;
}

interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  webViewLink?: string;
  starred?: boolean;
}

const SECTION_ICONS: Record<NavSection, React.ReactNode> = {
  'my-drive': <Cloud size={48} />,
  'shared': <Users size={48} />,
  'recent': <Clock size={48} />,
  'starred': <Star size={48} />,
  'trash': <Trash2 size={48} />,
};

const SECTION_TITLES: Record<NavSection, TranslationKey> = {
  'my-drive': 'files.connect',
  'shared': 'section.shared.title',
  'recent': 'section.recent.title',
  'starred': 'section.starred.title',
  'trash': 'section.trash.title',
};

const SECTION_DESCRIPTIONS: Record<NavSection, TranslationKey> = {
  'my-drive': 'section.my-drive.desc',
  'shared': 'section.shared.desc',
  'recent': 'section.recent.desc',
  'starred': 'section.starred.desc',
  'trash': 'section.trash.desc',
};

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/vnd.google-apps.folder') return <Folder size={20} />;
  if (mimeType.startsWith('image/')) return <Image size={20} />;
  if (mimeType.startsWith('video/')) return <Film size={20} />;
  if (mimeType.startsWith('audio/')) return <Music size={20} />;
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) return <Archive size={20} />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return <Table size={20} />;
  if (mimeType.includes('presentation') || mimeType.includes('slide')) return <Presentation size={20} />;
  if (mimeType.includes('text') || mimeType.includes('document') || mimeType.includes('pdf')) return <FileText size={20} />;
  if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('html') || mimeType.includes('xml')) return <Code2 size={20} />;
  return <File size={20} />;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const locale = getLocale() === 'tr' ? 'tr-TR' : 'en-US';
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FileExplorer({ activeNav, searchQuery, isLoggedIn, isCheckingAuth, refreshTrigger, viewMode, onLoginSuccess, onLogout, currentFolderId, onNavigate, onRefresh }: FileExplorerProps) {
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Fetch files when logged in
  useEffect(() => {
    if (!isLoggedIn || !window.drivenest) return;

    setIsLoadingFiles(true);
    window.drivenest
      .invoke('files:list', { 
        folderId: activeNav === 'my-drive' ? currentFolderId : 'root',
        section: activeNav 
      })
      .then((result) => {
        setFiles(result.items || []);
      })
      .catch((err) => {
        console.error('Failed to list files:', err);
        setFiles([]);
        const errStr = err.toString();
        if (errStr.includes('401') || errStr.includes('403') || errStr.includes('Unauthorized') || errStr.includes('Credentials')) {
          onLogout();
        }
      })
      .finally(() => setIsLoadingFiles(false));
  }, [isLoggedIn, activeNav, refreshTrigger, onLogout, currentFolderId]);

  const handleConnect = async () => {
    if (!window.drivenest || isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      const result = await window.drivenest.invoke('auth:login');
      if (result.success) {
        onLoginSuccess(result.email);
      } else {
        console.error('Login failed:', result);
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDownload = async (file: DriveFileItem) => {
    if (!window.drivenest) return;
    
    try {
      const savePath = await window.drivenest.invoke('app:selectSavePath', file.name);
      if (!savePath) return;

      await window.drivenest.invoke('files:download', { 
        fileId: file.id, 
        destPath: savePath 
      });
      alert(t('action.download.success'));
    } catch (err: any) {
      console.error('Download error:', err);
      const errStr = err.toString();
      if (errStr.includes('403') || errStr.includes('401') || errStr.includes('access') || errStr.includes('Unauthorized') || errStr.includes('Credentials')) {
        alert(t('action.error.auth'));
        onLogout();
      } else {
        alert(t('action.error.download'));
      }
    }
  };

  const handleFileClick = async (file: DriveFileItem) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      onNavigate(file.id, file.name);
    } else {
      handleDownload(file);
    }
  };

  const handleDelete = async (file: DriveFileItem) => {
    if (!window.drivenest) return;
    if (!confirm(t('action.confirm-delete', { name: file.name }))) return;

    try {
      await window.drivenest.invoke('files:delete', { fileId: file.id });
      onRefresh();
    } catch (err) {
      console.error('Delete failed:', err);
      alert(t('action.error.delete'));
    }
  };

  const handleRestore = async (file: DriveFileItem) => {
    if (!window.drivenest) return;

    try {
      await window.drivenest.invoke('files:restore', { fileId: file.id });
      onRefresh();
    } catch (err) {
      console.error('Restore failed:', err);
      alert(t('action.error.restore'));
    }
  };

  const handleDeletePermanently = async (file: DriveFileItem) => {
    if (!window.drivenest) return;
    if (!confirm(t('action.confirm-delete-perm', { name: file.name }))) return;

    try {
      await window.drivenest.invoke('files:deletePermanently', { fileId: file.id });
      onRefresh();
    } catch (err) {
      console.error('Permanent delete failed:', err);
      alert(t('action.error.delete'));
    }
  };

  const handleToggleStar = async (file: DriveFileItem) => {
    if (!window.drivenest) return;
    const newStarred = !file.starred;

    try {
      await window.drivenest.invoke('files:toggleStar', { 
        fileId: file.id, 
        starred: newStarred 
      });
      // Update local state for immediate feedback
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, starred: newStarred } : f));
      
      // If we are in starred section and unstarring, refresh to remove it
      if (activeNav === 'starred' && !newStarred) {
        onRefresh();
      }
    } catch (err) {
      console.error('Toggle star failed:', err);
      alert(t('action.error.star'));
    }
  };

  // Show loading spinner while checking auth
  if (isCheckingAuth) {
    return (
      <div className="file-explorer">
        <div className="empty-state animate-fade-in">
          <div className="empty-state__icon">
            <Loader2 size={48} className="spin" />
          </div>
          <h2 className="empty-state__title">{t('files.loading')}</h2>
        </div>
      </div>
    );
  }

  // Show connect screen when not logged in (only for my-drive)
  if (!isLoggedIn && activeNav === 'my-drive') {
    return (
      <div className="file-explorer">
        <div className="empty-state animate-fade-in">
          <div className="empty-state__icon">
            <Cloud size={48} />
          </div>
          <h2 className="empty-state__title">{t('files.connect')}</h2>
          <p className="empty-state__description">
            {t(SECTION_DESCRIPTIONS['my-drive'])}
          </p>
          <button
            className="empty-state__button"
            onClick={handleConnect}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 size={18} className="spin" style={{ marginRight: '8px' }} />
                <span>{t('files.connecting')}</span>
              </>
            ) : (
              <>
                <LogIn size={18} style={{ marginRight: '8px' }} />
                <span>{t('files.login.btn')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Show files when logged in
  if (isLoggedIn) {
    if (isLoadingFiles) {
      return (
        <div className="file-explorer">
          <div className="empty-state animate-fade-in">
            <div className="empty-state__icon">
              <Loader2 size={48} className="spin" />
            </div>
            <h2 className="empty-state__title">{t('files.loading')}</h2>
          </div>
        </div>
      );
    }

    if (files.length === 0) {
      return (
        <div className="file-explorer">
          <div className="empty-state animate-fade-in">
            <div className="empty-state__icon">
              {SECTION_ICONS[activeNav]}
            </div>
            <h2 className="empty-state__title">
              {activeNav === 'my-drive' ? t('files.empty.title') : t(SECTION_TITLES[activeNav]) + t('section.empty.suffix')}
            </h2>
            <p className="empty-state__description">
              {t(SECTION_DESCRIPTIONS[activeNav])}
            </p>
          </div>
        </div>
      );
    }

    // Filter files by search query
    const filteredFiles = searchQuery
      ? files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : files;

    return (
      <div className="file-explorer">
        {viewMode === 'list' ? (
          <div className="file-list animate-fade-in">
            <div className="file-list__header">
              <span className="file-list__col file-list__col--name">{t('files.table.name')}</span>
              <span className="file-list__col file-list__col--modified">{t('files.table.modified')}</span>
              <span className="file-list__col file-list__col--size">{t('files.table.size')}</span>
              <span className="file-list__col file-list__col--actions"></span>
            </div>
            {filteredFiles.map((file) => (
              <div 
                key={file.id} 
                className="file-list__row"
                onClick={() => handleFileClick(file)}
              >
                <span className="file-list__col file-list__col--name">
                  <span className="file-list__icon">{getFileIcon(file.mimeType)}</span>
                  <span className="file-list__filename" title={file.name}>{file.name}</span>
                </span>
                <span className="file-list__col file-list__col--modified">
                  {formatDate(file.modifiedTime)}
                </span>
                <span className="file-list__col file-list__col--size">
                  {file.mimeType === 'application/vnd.google-apps.folder' ? '—' : formatFileSize(file.size)}
                </span>
                <span className="file-list__col file-list__col--actions">
                  <div className="file-action-group">
                    {activeNav !== 'trash' && (
                      <button 
                        className={`file-action-btn ${file.starred ? 'file-action-btn--starred' : ''}`} 
                        title={file.starred ? t('action.unstar') : t('action.star')}
                        onClick={async (e) => {
                          e.stopPropagation();
                          handleToggleStar(file);
                        }}
                      >
                        <Star size={16} fill={file.starred ? "currentColor" : "none"} />
                      </button>
                    )}
                    {activeNav !== 'trash' && (
                      <button 
                        className="file-action-btn" 
                        title={t('action.download')}
                        onClick={async (e) => {
                          e.stopPropagation();
                          handleDownload(file);
                        }}
                      >
                        <Download size={16} />
                      </button>
                    )}
                    {activeNav === 'trash' ? (
                      <>
                        <button 
                          className="file-action-btn" 
                          title={t('action.restore')}
                          onClick={async (e) => {
                            e.stopPropagation();
                            handleRestore(file);
                          }}
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button 
                          className="file-action-btn file-action-btn--danger" 
                          title={t('action.delete-perm')}
                          onClick={async (e) => {
                            e.stopPropagation();
                            handleDeletePermanently(file);
                          }}
                        >
                          <AlertTriangle size={16} />
                        </button>
                      </>
                    ) : (
                      <button 
                        className="file-action-btn file-action-btn--danger" 
                        title={t('action.delete')}
                        onClick={async (e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="file-grid animate-fade-in">
            {filteredFiles.map((file) => (
              <div 
                key={file.id} 
                className="file-grid__item" 
                title={file.name}
                onClick={() => handleFileClick(file)}
              >
                <div className="file-grid__icon">
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="file-grid__info">
                  <span className="file-grid__name">{file.name}</span>
                  <span className="file-grid__meta">
                    {file.mimeType === 'application/vnd.google-apps.folder' ? t('files.folder') : formatFileSize(file.size)}
                  </span>
                </div>
                
                <div className="file-grid__actions">
                  {activeNav !== 'trash' && (
                    <button 
                      className={`file-grid__action ${file.starred ? 'file-grid__action--starred' : ''}`} 
                      title={file.starred ? t('action.unstar') : t('action.star')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStar(file);
                      }}
                    >
                      <Star size={14} fill={file.starred ? "currentColor" : "none"} />
                    </button>
                  )}
                  {activeNav !== 'trash' && (
                    <button 
                      className="file-grid__action" 
                      title={t('action.download')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}
                    >
                      <Download size={14} />
                    </button>
                  )}
                  {activeNav === 'trash' ? (
                    <>
                      <button 
                        className="file-grid__action" 
                        title={t('action.restore')}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(file);
                        }}
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button 
                        className="file-grid__action file-grid__action--danger" 
                        title={t('action.delete-perm')}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePermanently(file);
                        }}
                      >
                        <AlertTriangle size={14} />
                      </button>
                    </>
                  ) : (
                    <button 
                      className="file-grid__action file-grid__action--danger" 
                      title={t('action.delete')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Overlays */}
        
      </div>
    );
  }

  // Default empty state for other sections
  return (
    <div className="file-explorer">
      <div className="empty-state animate-fade-in">
        <div className="empty-state__icon">
          {SECTION_ICONS[activeNav]}
        </div>
        <h2 className="empty-state__title">{t(SECTION_TITLES[activeNav])}</h2>
        <p className="empty-state__description">
          {t(SECTION_DESCRIPTIONS[activeNav])}
        </p>
      </div>
    </div>
  );
}
