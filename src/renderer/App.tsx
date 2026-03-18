import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { FileExplorer } from './components/files/FileExplorer';
import { StatusBar } from './components/layout/StatusBar';
import { TitleBar } from './components/layout/TitleBar';

export type NavSection = 'my-drive' | 'shared' | 'recent' | 'starred' | 'trash';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavSection>('my-drive');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Check auth status on mount (handles app restart with saved tokens)
  useEffect(() => {
    if (!window.drivenest) {
      setIsCheckingAuth(false);
      return;
    }
    window.drivenest
      .invoke('auth:status')
      .then((status) => {
        setIsLoggedIn(status.isLoggedIn);
        setUserEmail(status.email);
      })
      .catch((err) => console.error('Failed to check auth status:', err))
      .finally(() => setIsCheckingAuth(false));
  }, []);

  const handleLoginSuccess = (email?: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
  };

  const handleLogout = async () => {
    if (!window.drivenest) return;
    await window.drivenest.invoke('auth:logout');
    setIsLoggedIn(false);
    setUserEmail(undefined);
    setCurrentFolderId('root');
    setFolderStack([]);
  };

  const handleUpload = async () => {
    if (!window.drivenest || !isLoggedIn) return;
    
    try {
      const localPath = await window.drivenest.invoke('app:selectFile');
      if (!localPath) return;

      await window.drivenest.invoke('files:upload', { 
        localPath, 
        parentId: currentFolderId 
      });
      
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to upload file:', err);
      alert('Dosya yüklenirken bir hata oluştu.');
    }
  };

  const handleCreateFolder = async () => {
    if (!window.drivenest || !isLoggedIn) return;
    setIsModalOpen(true);
    setNewFolderName('');
  };

  const confirmCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await window.drivenest.invoke('files:createFolder', { 
        name: newFolderName, 
        parentId: currentFolderId 
      });
      setIsModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to create folder:', err);
      alert('Klasör oluşturulurken bir hata oluştu.');
    }
  };

  const handleNavigate = (folderId: string, folderName?: string) => {
    if (folderId === 'root') {
      setCurrentFolderId('root');
      setFolderStack([]);
    } else if (folderName) {
      // Check if already in stack to avoid React key issues
      if (folderStack.some(f => f.id === folderId)) return;
      
      setCurrentFolderId(folderId);
      setFolderStack(prev => [...prev, { id: folderId, name: folderName }]);
    }
  };

  const handleGoBack = () => {
    if (folderStack.length === 0) return;
    const newStack = [...folderStack];
    newStack.pop();
    const parent = newStack.length > 0 ? newStack[newStack.length - 1] : { id: 'root', name: 'root' };
    setCurrentFolderId(parent.id);
    setFolderStack(newStack);
  };

  return (
    <div className="app-layout">
      <TitleBar />
      <Sidebar
        activeNav={activeNav}
        onNavChange={(nav) => {
          setActiveNav(nav);
          if (nav !== 'my-drive') {
            setCurrentFolderId('root');
            setFolderStack([]);
          }
        }}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        onLogout={handleLogout}
      />
      <div className="main-content">
        <Header
          activeNav={activeNav}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onUpload={handleUpload}
          onCreateFolder={handleCreateFolder}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          folderStack={folderStack}
          onNavigateBack={handleGoBack}
        />
        <FileExplorer
          activeNav={activeNav}
          searchQuery={searchQuery}
          isLoggedIn={isLoggedIn}
          isCheckingAuth={isCheckingAuth}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          refreshTrigger={refreshTrigger}
          viewMode={viewMode}
          currentFolderId={currentFolderId}
          onNavigate={handleNavigate}
          onRefresh={() => setRefreshTrigger(prev => prev + 1)}
        />
      </div>
      <StatusBar />

      {/* New Folder Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal__title">Yeni Klasör Oluştur</h3>
            <input 
              className="modal__input" 
              type="text" 
              placeholder="Klasör adı"
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && confirmCreateFolder()}
            />
            <div className="modal__actions">
              <button className="modal__btn modal__btn--cancel" onClick={() => setIsModalOpen(false)}>İptal</button>
              <button className="modal__btn modal__btn--confirm" onClick={confirmCreateFolder}>Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
