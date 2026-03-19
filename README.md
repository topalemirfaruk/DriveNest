# 🌌 DriveNest: Akıllı Masaüstü Bulut Yönetimi

**DriveNest**, Google Drive deneyiminizi masaüstüne taşıyan, performans ve estetik odaklı, modern bir **Electron** istemcisidir. Sadece bir dosya yöneticisi değil, aynı zamanda iş akışınızı hızlandıran bir yardımcıdır.

---

## ✨ Öne Çıkan Özellikler

### 🛡️ Güvenli ve Özel
- **OAuth 2.0 Entegrasyonu**: Verileriniz doğrudan Google üzerinden işlenir.
- **Keychain/Keytar**: Erişim anahtarlarınız (tokens) sisteminizin en güvenli katmanında şifrelenmiş olarak saklanır.
- **Veri Gizliliği**: Dosya içerikleriniz hiçbir harici sunucuya iletilmez, her şey sizin cihazınızda kalır.

### 🎨 Premium Kullanıcı Deneyimi
- **Modern Glassmorphism**: Saydamlık efektleri ve derinlik katan UI elementleri.
- **Özel Pencere Tasarımı**: Standart OS çerçevesinden kurtarılmış, uygulamaya özel şık başlık çubuğu (Title Bar).
- **Dinamik Görünümler**: İhtiyacınıza göre **Izgara (Grid)** veya **Liste (List)** görünümü arasında anlık geçiş.
- **Gece Modu**: Göz yormayan, kontrastı dengelenmiş derin karanlık tema.

### 📂 Gelişmiş Dosya Yönetimi
- **Akıllı Yıldızlama**: Önemli dosyalarınızı "Yıldızlılar" sekmesinden anında bulun.
- **Gelişmiş Çöp Kutusu**: Yanlışlıkla silinen dosyaları tek tıkla geri yükleyin veya kalıcı olarak temizleyin.
- **Hızlı Breadcrumb Navigasyonu**: Klasörler arasında kaybolmadan gezinin.
- **Anlık Arama**: Google Drive API'sinin gücüyle dosyalarınızı saniyeler içinde filtreleyin.

### 🌐 Sanal Disk (FUSE Mount) - **Özel**
- **Native Deneyim**: Google Drive'ı işletim sisteminize gerçek bir "Yerel Disk" gibi bağlayın (Dolphin, Nautilus ile uyumlu).
- **Akıllı VFS Önbellekleme**: Dosyaları açarken gecikme yaşamamanız için gelişmiş önbellekleme ve okuma optimizasyonları.
- **Tek Tıkla Kurulum**: Gerekli sistem araçlarını (rclone/fuse) otomatik algılayan ve kuran sihirbaz.
- **Sessiz Automount**: Giriş yapıldığında diski otomatik bağlama ve uygulama kapanırken güvenli ayırma.

---

## 🏗️ Teknik Mimari

DriveNest, modern web teknolojileri ile masaüstü gücünü birleştirir:

- **Frontend (Renderer)**: 
  - **React 18** ile reaktif bileşen yapısı.
  - **TypeScript** ile tip güvenli kodlama.
  - **Tailwind CSS** ile özelleştirilmiş, hızlı ve hafif stil yönetimi.
  - **Lucide Icons** ile tutarlı ikonografi.

- **Backend (Main Process)**:
  - **Electron** ana süreci üzerinden dosya sistemi ve ağ yönetimi.
  - **IPC (Inter-Process Communication)**: Güvenli ve optimize edilmiş süreçler arası iletişim.
  - **SQLite**: Dosya meta verilerinin yerel takibi ve hızlı erişim için.

- **API Katmanı**:
  - **Google Drive API v3**: Resmî Google kütüphaneleri ile stabil bağlantı.

---

## 🚀 Geliştirici Rehberi

### Kurulum ve Çalıştırma

1. **Bağımlılıkları Yükleyin**:
   ```bash
   npm install
   ```

2. **Ortam Değişkenlerini Ayarlayın**:
   `.env` dosyasını oluşturun ve şunları ekleyin:
   ```env
   GOOGLE_CLIENT_ID=GCP_Müşteri_Kimliği
   GOOGLE_CLIENT_SECRET=GCP_Müşteri_Sırrı
   ```

3. **Geliştirme Modunda Başlatın**:
   ```bash
   npm run dev
   ```

4. **Biçimlendirme ve Kontrol**:
   ```bash
   npm run typecheck  # TypeScript kontrolü
   ```

---

## 💡 İpuçları ve Çözümler

### Google Verification (Doğrulama) Uyarısı
Uygulama henüz Google tarafından resmen doğrulanmadığı için giriş yaparken bir uyarı penceresi görebilirsiniz.
1. "Gelişmiş" (Advanced) butonuna tıklayın.
2. "DriveNest (güvenli değil) sitesine git" linkine tıklayın.
Bu durum sadece uygulamanın "geliştirme aşamasında" olduğunu belirtir; verileriniz tamamen güvenli altındadır.

---

## 📄 Lisans ve Katkıda Bulunma

Bu proje **MIT Lisansı** ile korunmaktadır. Katkıda bulunmak isterseniz lütfen bir 'Pull Request' açın veya hata raporu (Issue) bildirin.

---
*DriveNest — Bulut dosyalarınız, artık daha yakın.*
