# Maintainer: topalemirfaruk <topalemirfaruk1@gmail.com>
pkgname=drivenest-bin
pkgver=0.1.0
pkgrel=1
pkgdesc="Modern and beautiful Google Drive client for Linux with VFS support"
arch=('x86_64')
url="https://github.com/topalemirfaruk/DriveNest"
license=('MIT')
depends=('fuse2' 'gtk3' 'nss' 'alsa-lib')
provides=('drivenest')
conflicts=('drivenest')
options=('!strip' '!debug')
source=("DriveNest-${pkgver}-x64.AppImage::https://github.com/topalemirfaruk/DriveNest/releases/download/v${pkgver}/DriveNest-${pkgver}-x64.AppImage")
sha256sums=('SKIP') # Use 'makepkg -g' to generate this

package() {
    install -Dm755 "${srcdir}/DriveNest-${pkgver}-x64.AppImage" "${pkgdir}/usr/bin/drivenest"
}
