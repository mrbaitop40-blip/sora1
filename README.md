# 🎬 Sora Video Prompt Mamas

AI Generator Prompt Sora 2 untuk konten affiliate review di Indonesia.

---

## 🚀 Cara Deploy ke GitHub + Vercel

### 1. Dapatkan API Key Anthropic
1. Buka [console.anthropic.com](https://console.anthropic.com)
2. Login / daftar akun
3. Klik **API Keys** di sidebar → **Create Key**
4. Copy key-nya (hanya ditampilkan sekali!)

---

### 2. Setup Project di Komputer

```bash
# Install dependencies
npm install

# Coba jalankan di lokal (opsional)
npm run dev
```

Untuk test di lokal, isi dulu file `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

### 3. Upload ke GitHub

```bash
# Inisialisasi git (jika belum)
git init
git add .
git commit -m "first commit"

# Buat repo baru di github.com lalu:
git remote add origin https://github.com/USERNAME/sora-prompt-mamas.git
git branch -M main
git push -u origin main
```

> ⚠️ Pastikan `.env.local` TIDAK ikut ter-commit (sudah ada di `.gitignore`)

---

### 4. Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) → Login dengan GitHub
2. Klik **Add New Project**
3. Import repo `sora-prompt-mamas`
4. Framework Preset: pilih **Vite**
5. Klik **Environment Variables** dan tambahkan:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-xxxxx` (paste API key Anda)
6. Klik **Deploy** 🚀

Selesai! App Anda live di `https://nama-project.vercel.app`

---

## 📁 Struktur Project

```
sora-prompt-mamas/
├── api/
│   └── generate.js        ← Proxy ke Anthropic (API key aman di sini)
├── src/
│   ├── main.jsx
│   └── App.jsx            ← UI React
├── .env.local             ← API key lokal (JANGAN di-commit!)
├── .env.example           ← Template .env (aman di-commit)
├── .gitignore
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

---

## 🔒 Keamanan API Key

```
Browser (React)
    ↓ fetch("/api/generate")
Vercel Function (api/generate.js)  ← API key ada di sini, aman!
    ↓ fetch + x-api-key
Anthropic API
    ↓
Response ke Browser
```

API key **tidak pernah terekspos** ke browser / publik.
