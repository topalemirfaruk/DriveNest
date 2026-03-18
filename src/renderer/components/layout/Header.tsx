import React from 'react';
import { 
  ChevronRight, 
  Search, 
  LayoutGrid, 
  List, 
  Plus,
  FolderPlus
} from 'lucide-react';
import type { NavSection } from '../../App';

interface HeaderProps {
  activeNav: NavSection;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onUpload?: () => void;
  onCreateFolder?: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  folderStack: { id: string; name: string }[];
  onNavigateBack: () => void;
}

const NAV_LABELS: Record<NavSection, string> = {
  'my-drive': 'Dosyalarım',
  'shared': 'Paylaşılanlar',
  'recent': 'Son Kullanılanlar',
  'starred': 'Yıldızlılar',
  'trash': 'Çöp Kutusu',
};

export function Header({ activeNav, searchQuery, onSearchChange, onUpload, onCreateFolder, viewMode, onViewModeChange, folderStack, onNavigateBack }: HeaderProps) {
  return (
    <header className="header">
      {/* Breadcrumb */}
      <div className="header__breadcrumb">
        <span 
          className="header__breadcrumb-item" 
          onClick={onNavigateBack}
          style={{ cursor: folderStack.length > 0 ? 'pointer' : 'default' }}
        >
          {NAV_LABELS[activeNav]}
        </span>
        {folderStack.map((folder) => (
          <React.Fragment key={folder.id}>
            <ChevronRight className="header__breadcrumb-separator" size={14} />
            <span className="header__breadcrumb-current" title={folder.name}>
              {folder.name}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Search + Actions */}
      <div className="header__actions">
        <div className="header__search">
          <Search className="header__search-icon" size={16} />
          <input
            className="header__search-input"
            type="text"
            placeholder="Dosya ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <button 
          className={`icon-btn ${viewMode === 'grid' ? 'icon-btn--active' : ''}`} 
          title="Grid görünüm"
          onClick={() => onViewModeChange('grid')}
        >
          <LayoutGrid size={18} />
        </button>
        <button 
          className={`icon-btn ${viewMode === 'list' ? 'icon-btn--active' : ''}`} 
          title="Liste görünüm"
          onClick={() => onViewModeChange('list')}
        >
          <List size={18} />
        </button>
        
        {activeNav === 'my-drive' && onUpload && (
          <>
            <button 
              className="icon-btn" 
              title="Yeni Klasör"
              onClick={onCreateFolder}
            >
              <FolderPlus size={18} />
            </button>
            <button 
              className="icon-btn icon-btn--accent" 
              title="Yükle"
              onClick={onUpload}
            >
              <Plus size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
