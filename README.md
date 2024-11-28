# Siktirt.me-backend

## Nedir

Siktirt.me, bir sıfır uzunluk URL kısaltma sistemidir. Javascript ile yazılmış ve SQL ile desteklenmiştir.

## Gereksinimler

- PostgreSQL
- Node.js
- npm

## Frontend Kurulumu

1. Projeyi klonlayın

```bash
git clone https://github.com/ssarpv/siktirt.me.git
```

2. Proje dizinine girin ve gerekli paketleri yükleyin

```bash
cd siktirt.me
npm install
```

3Sunucuyu başlatın

```bash
npm run dev
```

## Backend Kurulumu

1. Projeyi klonlayın

```bash
git clone https://github.com/ssarpv/siktirt.me-backend.git
```

2. Proje dizinine girin ve gerekli paketleri yükleyin

```bash
cd siktirt.me-backend
npm install
```

3. PostgreSQL veritabanını oluşturun ve bağlantı bilgilerini `.env` dosyasına ekleyin

```sql
CREATE DATABASE url_shortener;

\c url_shortener

CREATE TABLE urls (
    id SERIAL PRIMARY KEY,
    short_url VARCHAR(8) UNIQUE NOT NULL,
    zero_width_url VARCHAR(255) UNIQUE NOT NULL,
    long_url TEXT NOT NULL,
    expires_at TIMESTAMP
);
```

```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=siktirtme
```

4. Sunucuyu başlatın

```bash
npm run start
```

## Kullanım

1. Tarayıcınızda uygulamayı açın
2. Kısaltmak istediğiniz bağlantıyı girin
3. "Kısalt" tuşuna basın
4. Kısaltılmış bağlantıyı kopyalayın ve paylaşın

## Lisans

Bu proje GPL Lisansı ile lisanslanmıştır - ayrıntılar için [LICENSE](LICENSE) dosyasına bakın