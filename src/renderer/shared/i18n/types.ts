export type Locale = 'tr' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko' | 'ar';

export interface TranslationDictionary {
  // TitleBar
  'title.minimize': string;
  'title.maximize': string;
  'title.restore': string;
  'title.close': string;

  // Sidebar
  'nav.my-drive': string;
  'nav.shared': string;
  'nav.recent': string;
  'nav.starred': string;
  'nav.trash': string;
  'nav.navigation': string;
  'nav.cloud-services': string;
  'nav.mount.mounting': string;
  'nav.mount.unmount': string;
  'nav.mount.install': string;
  'nav.mount.mount': string;
  'nav.mount.open': string;
  'nav.mount.error': string;
  'nav.mount.install-error': string;
  'nav.upcoming': string;
  'auth.logout': string;
  'auth.connected': string;

  // Header
  'header.search': string;
  'header.upload': string;
  'header.new-folder': string;
  'header.view.list': string;
  'header.view.grid': string;

  // File Explorer
  'files.empty.title': string;
  'files.empty.desc': string;
  'files.connect': string;
  'files.connecting': string;
  'files.login.btn': string;
  'files.loading': string;
  'files.table.name': string;
  'files.table.modified': string;
  'files.table.size': string;
  'files.folder': string;
  'files.status.idle': string;
  'files.status.syncing': string;
  'files.status.paused': string;
  'files.status.error': string;
  'files.status.offline': string;

  'section.my-drive.desc': string;
  'section.shared.title': string;
  'section.shared.desc': string;
  'section.recent.title': string;
  'section.recent.desc': string;
  'section.starred.title': string;
  'section.starred.desc': string;
  'section.trash.title': string;
  'section.trash.desc': string;
  'section.empty.suffix': string;

  // Actions
  'action.download': string;
  'action.delete': string;
  'action.star': string;
  'action.unstar': string;
  'action.restore': string;
  'action.delete-perm': string;
  'action.confirm-delete': string;
  'action.confirm-delete-perm': string;
  'action.download.success': string;
  'action.error.auth': string;
  'action.error.download': string;
  'action.error.delete': string;
  'action.error.restore': string;
  'action.error.star': string;

  // Modals
  'modal.new-folder.title': string;
  'modal.new-folder.placeholder': string;
  'modal.cancel': string;
  'modal.confirm': string;

  // Status Bar
  'status.all-synced': string;
  'status.syncing': string;
  'status.error': string;
  'status.storage': string;
  'status.storage.used': string;
  'status.storage.not-logged-in': string;
}

export type TranslationKey = keyof TranslationDictionary;
