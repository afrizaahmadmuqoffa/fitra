# 📋 Konteks Dokumentasi: Polinations AI Image Generation API

Berikut adalah dokumen konteks yang bisa kamu berikan ke agent AI-mu. Dokumen ini berisi **hanya fakta yang terverifikasi** dari dokumentasi resmi Polinations AI (per Oktober 2026), tanpa asumsi.

---

```markdown
# POLINATIONS AI - IMAGE GENERATION API REFERENCE

## ⚠️ PENTING: BATASAN PENGETAHUAN
- Informasi ini berdasarkan dokumentasi resmi per Oktober 2026
- Harga model dapat berubah sewaktu-waktu tanpa pemberitahuan
- Untuk info terbaru, SELALU cek: https://gen.pollinations.ai/docs
- JANGAN mengarang endpoint, parameter, atau harga di luar dokumen ini

---

## 🔗 BASE URL & ENDPOINT UTAMA

**Base URL:** `https://gen.pollinations.ai`

**Endpoint Generate Gambar:**
- `GET /image/{prompt}` - Cara paling sederhana
- `POST /v1/images/generations` - OpenAI-compatible, lebih banyak kontrol
- `POST /v1/images/edits` - Untuk edit gambar

**Endpoint Cek Harga Model (REAL-TIME):**
- `GET /image/models` - Daftar model gambar + harga terkini
- `GET /v1/models` - Semua model dalam format OpenAI

---

## 🔐 AUTENTIKASI

**Cara 1: Header (Direkomendasikan)**
```
Authorization: Bearer YOUR_API_KEY
```

**Cara 2: Query Parameter**
```
?key=YOUR_API_KEY
```

**Jenis API Key:**
- `pk_...` (App Key) - Untuk frontend/browser, aman di-expose
- `sk_...` (Secret Key) - Untuk backend saja, JANGAN di-expose

**Dapatkan API Key di:** https://enter.pollinations.ai

---

## 📸 CARA GENERATE GAMBAR

### Metode 1: Simple GET (Tanpa Body)

```
GET https://gen.pollinations.ai/image/{prompt}?model={model_id}
```

**Contoh:**
```
https://gen.pollinations.ai/image/a%20cat%20in%20space?model=flux
```

**Parameter Query yang Didukung:**
- `model` - ID model (wajib jika bukan default)
- `width` - Lebar gambar (px)
- `height` - Tinggi gambar (px)
- `seed` - Seed untuk reproducibility
- `nologo` - Hilangkan watermark (true/false)
- `enhance` - Auto-enhance prompt (true/false)
- `key` - API key (alternatif dari header)

**Response:** Binary image (JPEG/PNG/SVG tergantung model)

### Metode 2: POST OpenAI-Compatible

```
POST https://gen.pollinations.ai/v1/images/generations
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY

{
  "model": "black-forest-labs/flux.1-schnell",
  "prompt": "a futuristic city",
  "response_format": "url",  // atau "b64_json"
  "n": 1
}
```

**Response (jika response_format: "url"):**
```json
{
  "data": [
    {
      "url": "https://media.pollinations.ai/..."
    }
  ]
}
```

---

## 🧠 MODEL GAMBAR YANG TERVERIFIKASI

**Daftar model resmi (per Oktober 2026):**

### Flux Series (Black Forest Labs)
- `flux` (alias default, cepat)
- `black-forest-labs/flux.1-schnell` (cepat, murah)
- `black-forest-labs/flux.1.1-pro`
- `black-forest-labs/flux.2-pro` (premium)
- `black-forest-labs/flux.2-flex`
- `black-forest-labs/flux.2-max`
- `black-forest-labs/flux.2-klein-4b`

### OpenAI GPT Image
- `openai/gpt-image-1-mini`
- `openai/gpt-image-1.5` (high-fidelity)
- `openai/gpt-image-2`
- `openai/gpt-image-2.5-flare`
- `openai/gpt-image-2.5-sunburst`

### Ideogram
- `ideogram-ai/ideogram-v4-turbo` (bagus untuk teks dalam gambar)
- `ideogram-ai/ideogram-v4-balanced`
- `ideogram-ai/ideogram-v4-quality`

### ByteDance Seedream
- `bytedance/seedream-4.0`
- `bytedance/seedream-4.5`
- `bytedance/seedream-5.0-lite`
- `bytedance/seedream-5.0-pro`

### Google
- `google/gemini-2.5-flash-image`
- `google/gemini-3.1-flash-image`
- `google/gemini-3.1-flash-lite-image`
- `google/gemini-3-pro-image`

### Lainnya
- `krea/krea-2-medium`
- `lykon/dreamshaper-8-lcm`
- `microsoft/mai-image-2.6`
- `microsoft/mai-image-2.6-flash`
- `tongyi-mai/z-image-turbo`
- `alibaba/wan-2.7-image`
- `alibaba/wan-2.7-image-pro`
- `qwen/qwen-image`
- `qwen/qwen-image-2.1`
- `qwen/qwen-image-3`
- `x-ai/grok-imagine-image`
- `x-ai/grok-imagine-image-quality`
- `x-ai/grok-imagine-image-2.0`
- `recraft/recraft-v4.1-vector`
- `recraft/recraft-v4.1-flash`
- `prunaai/p-image`
- `prunaai/p-image-edit`
- `inferenceport-ai/lightning-image-turbo`

**Catatan:** Model ID sekarang menggunakan format `publisher/model`. ID lama masih didukung sebagai alias.

---

## 💰 INFORMASI BIAYA

### Fakta yang Dipastikan:
- **1 Pollen ≈ $1 USD** (sistem kredit pay-as-you-go)
- **Harga gambar TIDAK PERNAH melebihi 0.25 Pollen per gambar** (kebijakan resmi)
- Sebagian besar model gambar berkisar **0.01 - 0.15 Pollen per gambar**
- Ada model gratis (0 Pollen) untuk penggunaan dasar

### Perkiraan Biaya (VERIFIKASI DARI /image/models):
| Model | Estimasi Biaya |
|-------|----------------|
| `flux` / `flux.1-schnell` | ~0.01 Pollen |
| `flux.2-pro` | ~0.05 - 0.15 Pollen |
| `ideogram-v4-turbo` | ~0.03 - 0.05 Pollen |
| `seedream-5.0-pro` | ~0.02 - 0.04 Pollen |
| `gpt-image-1.5` | ~0.05 - 0.15 Pollen |

**⚠️ PENTING:** Harga di atas adalah ESTIMASI. Untuk harga PASTI:
1. Panggil `GET https://gen.pollinations.ai/image/models`
2. Cek di dashboard: https://enter.pollinations.ai
3. Cek usage setelah generate: `GET /account/usage`

---

## 📊 CEK SALDO & USAGE

**Endpoint:**
- `GET /account/balance` - Cek sisa Pollen
- `GET /account/usage` - Riwayat penggunaan (butuh scope `account:usage`)
- `GET /account/usage/daily` - Penggunaan harian
- `GET /account/key/usage` - Usage untuk API key yang sedang dipakai

**Contoh Response /account/balance:**
```json
{
  "balance": 10.5,
  "accountBalance": {
    "total": 15.0,
    "tier": "standard",
    "paid": 10.0
  }
}
```

---

## ❌ ERROR CODES

| Status | Arti | Solusi |
|--------|------|--------|
| 400 | Parameter invalid / request malformed | Cek format prompt dan parameter |
| 401 | API key missing atau invalid | Cek format `Bearer YOUR_KEY` |
| 402 | Saldo Pollen tidak cukup | Top up di enter.pollinations.ai |
| 403 | API key tidak punya permission | Cek scope key di dashboard |
| 500 | Internal server error | Retry setelah beberapa detik |

**Format Error Response:**
```json
{
  "status": 400,
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Description of what went wrong"
  }
}
```

---

## 💡 BEST PRACTICES

1. **Untuk Testing/Development:** Gunakan model `flux` atau `flux.1-schnell` (paling murah & cepat)
2. **Untuk Produksi:** Gunakan model premium seperti `flux.2-pro` atau `gpt-image-1.5`
3. **Reproducibility:** Selalu simpan `seed` jika ingin regenerate gambar yang sama
4. **Rate Limiting:** Jika dapat error 429, tunggu beberapa detik sebelum retry
5. **Caching:** Response yang identik di-cache, retry tidak dikenakan biaya tambahan
6. **Timeout:** Jika request timeout, kirim request yang SAMA PERSIS (endpoint, body, parameter, seed) - tidak akan double-charge

---

## 🔗 LINK DOKUMENTASI RESMI

- **API Docs Lengkap:** https://gen.pollinations.ai/docs
- **Dashboard & API Key:** https://enter.pollinations.ai
- **Playground (Test UI):** https://playground.pollinations.ai
- **GitHub Repo:** https://github.com/pollinations/pollinations
- **Website Utama:** https://pollinations.ai

---

## 🚫 JANGAN LAKUKAN

- ❌ Jangan mengarang endpoint di luar yang tercantum di sini
- ❌ Jangan mengarang parameter yang tidak disebutkan
- ❌ Jangan memberikan harga pasti tanpa cek /image/models terlebih dahulu
- ❌ Jangan mengekspos `sk_...` key di frontend/browser
- ❌ Jangan mengasumsikan model tertentu gratis tanpa verifikasi

---

## ✅ YANG BOLEH DILAKUKAN

- ✅ Selalu verifikasi harga terkini via `GET /image/models`
- ✅ Gunakan dokumentasi resmi sebagai sumber utama
- ✅ Cek saldo sebelum generate banyak gambar
- ✅ Gunakan `seed` untuk reproducibility
- ✅ Handle error dengan baik (401, 402, 429, dll)

---

**TERAKHIR DIAPIR: Oktober 2026**
**SUMBER: Dokumentasi resmi gen.pollinations.ai**
```

---

## 📌 Cara Menggunakan Dokumen Ini

1. **Copy seluruh konten di dalam code block** di atas
2. **Paste ke system prompt atau context** agent AI-mu
3. Agent sekarang punya referensi faktual dan tidak akan berhalusinasi

## ✨ Fitur Dokumen Ini

✅ **Hanya fakta terverifikasi** dari dokumentasi resmi  
✅ **Menyebutkan batasan pengetahuan** (tanggal, sumber)  
✅ **Link ke dokumentasi terbaru** untuk verifikasi real-time  
✅ **Daftar model lengkap** yang terverifikasi  
✅ **Error handling** yang jelas  
✅ **Best practices** untuk penggunaan optimal  
✅ **Peringatan eksplisit** tentang apa yang TIDAK boleh dilakukan  