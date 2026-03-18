# 🌌 DriveNest

**DriveNest**, Google Drive dosyalarınızı modern, hızlı ve şık bir arayüzle masaüstünden yönetmenizi sağlayan açık kaynaklı bir **Electron** uygulamasıdır. 

![DriveNest UI Concept](https://raw.githubusercontent.com/topalemirfaruk/DriveNest/main/assets/preview.png) *(Görsel temsilidir)*

## ✨ Özellikler

- **Modern Tasarım**: Glassmorphism ve karanlık tema ile premium kullanıcı deneyimi.
- **Kesintisiz Senkronizasyon**: Google Drive ile hızlı ve güvenilir dosya alışverişi.
- **Yıldızlı Dosyalar**: Önemli dosyalarınıza tek tıkla erişin.
- **Gelişmiş Çöp Kutusu**: Dosyaları geri yükleyin veya kalıcı olarak silin.
- **Izgara ve Liste Görünümü**: Dosyalarınızı dilediğiniz gibi görüntüleyin.
- **Güvenli Kimlik Doğrulama**: Google OAuth2 ile güvenli giriş ve Keychain/Keytar ile şifrelenmiş token saklama.

## 🛠️ Teknolojiler

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Electron, Node.js
- **Veritabanı**: SQLite (Yerel dosya takibi için)
- **API**: Google Drive API v3

## 🚀 Başlangıç

### Gereksinimler

- Node.js (v18+)
- npm veya yarn

### Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/topalemirfaruk/DriveNest.git
   cd DriveNest
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. `.env.example` dosyasını `.env` olarak kopyalayın ve Google Cloud Console'dan aldığınız bilgileri doldurun:
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

4. Uygulamayı geliştirme modunda çalıştırın:
   ```bash
   npm run dev
   ```

## 🔐 Google Doğrulama Notu
Uygulama henüz Google tarafından resmi olarak doğrulanmadığı için giriş yaparken "Google has not verified this app" uyarısı alabilirsiniz. **Gelişmiş (Advanced)** -> **DriveNest'e git (Go to DriveNest)** diyerek güvenle devam edebilirsiniz. Verileriniz sadece yerel cihazınızda işlenir.

## 📄 Lisans
Bu proje MIT lisansı ile lisanslanmıştır.
