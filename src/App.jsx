import { useState, useRef, useCallback } from "react";

const STYLES = [
  { id: "ugc", label: "1️⃣ UGC", desc: "User Generated Content" },
  { id: "storytelling", label: "2️⃣ Storytelling", desc: "Alur cerita jelas" },
  { id: "softselling", label: "3️⃣ Soft Selling", desc: "Edukatif & halus" },
  { id: "problemsolution", label: "4️⃣ Problem–Solution", desc: "Relatable & trigger" },
  { id: "cinematic", label: "5️⃣ Cinematic", desc: "Visual dominan" },
  { id: "listicle", label: "6️⃣ Listicle", desc: "Terstruktur & jelas" },
];

const CATEGORIES = ["Makanan/Minuman", "Hotel", "Tempat Wisata"];

function useCopy() {
  const [copiedKey, setCopiedKey] = useState(null);
  const copy = useCallback((text, key) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try { document.execCommand("copy"); } catch (_) {}
    document.body.removeChild(el);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);
  return { copy, copiedKey };
}

function CopyBtn({ text, id, copiedKey, copy }) {
  const ok = copiedKey === id;
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); copy(text, id); }}
      style={{
        background: ok ? "#14532d" : "#111c2e",
        border: `1px solid ${ok ? "#22c55e" : "#243450"}`,
        color: ok ? "#86efac" : "#64748b",
        padding: "5px 13px",
        borderRadius: "7px",
        fontSize: "12px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontWeight: "600",
        transition: "all 0.18s",
        flexShrink: 0,
        whiteSpace: "nowrap"
      }}
    >
      {ok ? "✓ Tersalin!" : "📋 Salin"}
    </button>
  );
}

export default function SoraPromptMamas() {
  const [category, setCategory] = useState("Makanan/Minuman");
  const [name, setName] = useState("");
  const [character, setCharacter] = useState("");
  const [segDuration, setSegDuration] = useState("10");
  const [totalDuration, setTotalDuration] = useState("30");
  const [jumlahKonten, setJumlahKonten] = useState("1");
  const [selectedStyles, setSelectedStyles] = useState(["ugc"]);
  const [imageRef, setImageRef] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const { copy, copiedKey } = useCopy();

  const toggleStyle = (id) => {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageRef(file.name);
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const updateSeg = (ci, si, val) => {
    setResults(prev => prev.map((r, ri) => {
      if (ri !== ci) return r;
      const segs = [...r.segments];
      segs[si] = val;
      return { ...r, segments: segs };
    }));
  };

  // Copy segmen: hapus header "- SEGMEN X (Ys)" agar tidak ikut dicopy
  const getSegCopyText = (seg) => {
    return seg
      .replace(/^[-\s]*SEGMEN\s*\d+\s*\(\d+\s*detik\)\s*\n?/i, "")
      .trim();
  };

  const getAllText = () =>
    results.map((r, i) =>
      `=== KONTEN ${i + 1} ===\nGaya: ${r.gaya}\n\n` +
      r.segments.map((s, si) =>
        `- SEGMEN ${si + 1} (${segDuration} detik)\n${getSegCopyText(s)}`
      ).join("\n\n---\n")
    ).join("\n\n\n");

  const getContentText = (r, i) =>
    `=== KONTEN ${i + 1} ===\nGaya: ${r.gaya}\n\n` +
    r.segments.map((s, si) =>
      `- SEGMEN ${si + 1} (${segDuration} detik)\n${getSegCopyText(s)}`
    ).join("\n\n---\n");

  // ─── System Prompt ───────────────────────────────────────────────────────────
  const systemPrompt = `Kamu adalah "Sora Video Prompt Mamas", AI spesialis prompt video Sora 2 untuk konten affiliate review di Indonesia.

LANGKAH WAJIB:
Gunakan web_search untuk mencari info lengkap tentang yang direview sebelum menulis apapun.

LARANGAN KERAS — WAJIB DIPATUHI:
- DILARANG KERAS menulis kalimat pengantar seperti "Baik, saya sudah mendapatkan informasi...", "Sekarang saya akan membuat...", "Berdasarkan hasil pencarian...", atau kalimat apapun sebelum output prompt
- DILARANG menulis penjelasan, catatan, atau kalimat apapun setelah konten terakhir selesai
- DILARANG menulis label "visual 1:", "visual 2:", "scene 1:", "adegan 1:", atau label apapun sebelum deskripsi adegan
- DILARANG menyebut harga spesifik
- DILARANG menggunakan kata "murah"
- DILARANG melebihi batas kata dialog
- Output HARUS langsung dimulai dari baris "=== KONTEN 1 ===" — tidak ada teks sebelumnya

FORMAT OUTPUT — IKUTI PERSIS SEPERTI INI:

=== KONTEN [nomor] ===
Gaya: [nama gaya konten]
- SEGMEN [nomor] ([durasi] detik)
[karakter dengan deskripsi penampilan singkat], mereview [nama tempat/produk dengan detail spesifik hasil pencarian] dengan gaya konten [gaya]. Visual tiap adegan sekitar 2–3 detik.
[deskripsi adegan sinematik — langsung tanpa label apapun]
[deskripsi adegan berikutnya — boleh 2 adegan berturut-turut sebelum 1 dialog]
Dialog: "[isi dialog]"
[deskripsi adegan selanjutnya]
Dialog: "[isi dialog]"
[dst...]
Sudut kamera: [urutan sudut antar scene, contoh: wide → medium → close-up → ambience → medium]
Suasana natural, [audio ambient spesifik sesuai tempat], tanpa musik tambahan.
Video tanpa teks, tanpa musik, tanpa watermark, boleh ada ambient/suara alami.
Tone visual real-video, bukan animasi atau gambar statis.
Video berkualitas ultra HD 4K, bright & clean tone.
---
- SEGMEN [nomor] ([durasi] detik)
[lanjut format sama...]

=== KONTEN [nomor] ===
[dst...]

ATURAN JUMLAH ADEGAN PER SEGMEN:
- Segmen 15 detik: 5–6 adegan visual, tiap adegan 2–3 detik
- Segmen 10 detik: 4–5 adegan visual, tiap adegan 2–3 detik
- Boleh 2 adegan berturut-turut diikuti 1 dialog (tulis 2 baris deskripsi, baru 1 baris Dialog:)
- Variasikan: tidak semua adegan harus punya dialog sendiri

ATURAN DIALOG PER SEGMEN — WAJIB HITUNG KATA:
- Segmen 10 detik: total SEMUA kata dialog dalam 1 segmen = 18–25 kata
- Segmen 15 detik: total SEMUA kata dialog dalam 1 segmen = 30–38 kata
- Dialog per adegan harus pendek dan padat

ATURAN HOOK SEGMEN 1 (dialog pertama wajib):
Beritahu penonton bahwa order/booking lewat tag lokasi di bawah lebih worth it. Buat natural sesuai gaya konten. Contoh variasi:
- "Klik tag lokasi dulu ya, harganya beda lho."
- "Eh, pesan lewat tag lokasi bawah lebih worth it deh."
- "Guys, mending booking lewat tag lokasi di bawah."

ATURAN SEGMEN TERAKHIR (dialog terakhir wajib):
Tutup dengan ajakan tegas untuk order/cek tag lokasi bawah.

ATURAN KONEKSI ANTAR SEGMEN:
- Dialog antar segmen nyambung seperti percakapan dipotong
- Akhir segmen menggantung → awal segmen melanjutkan
- Filler natural (maks 2/segmen): "Eh...", "Jujur ya,", "Guys,", "Astaga.", "Nggak nyangka."

ATURAN KALIMAT PERTAMA TIAP SEGMEN:
- Wajib deskripsikan penampilan karakter + konteks produk/tempat yang sedang direview di segmen itu
- Sertakan detail spesifik dari hasil pencarian (nama menu, fasilitas, suasana, dll.)
- Jika faceless: "Kamera faceless menangkap [detail visual produk/tempat]..."`;

  // ─── User Prompt ─────────────────────────────────────────────────────────────
  const buildUserPrompt = () => {
    const segCount = Math.floor(parseInt(totalDuration) / parseInt(segDuration));
    const styleNames = selectedStyles
      .map(s => STYLES.find(x => x.id === s))
      .map(s => `${s.label} (${s.desc})`)
      .join(", ");
    return `Buat ${jumlahKonten} konten affiliate review. LANGSUNG mulai output dari "=== KONTEN 1 ===" tanpa kalimat pembuka apapun.

Kategori: ${category}
Yang direview: ${name}
Karakter: ${character || "faceless — tidak ada manusia, hanya visual produk/tempat + voice over"}
Durasi per segmen: ${segDuration} detik
Total durasi: ${totalDuration} detik → ${segCount} segmen per konten
Gaya konten: ${styleNames}
${imageBase64 ? "Gambar referensi dilampirkan — analisa tone warna, suasana, lighting-nya." : ""}

Batas kata dialog per segmen: ${segDuration === "10" ? "18–25 kata TOTAL" : "30–38 kata TOTAL"}

WAJIB: cari info "${name}" dulu via web search, lalu LANGSUNG tulis output tanpa kata pembuka. Jangan tulis apapun sesudah konten terakhir selesai.`;
  };

  // ─── Parse Results ────────────────────────────────────────────────────────────
  const parseResults = (raw) => {
    // Buang semua teks sebelum === KONTEN 1 ===
    const startIdx = raw.search(/===\s*KONTEN\s*1\s*===/i);
    const cleaned = startIdx >= 0 ? raw.slice(startIdx) : raw;

    const contentBlocks = cleaned.split(/===\s*KONTEN\s*\d+\s*===/gi).filter(b => b.trim());
    if (!contentBlocks.length) return [{ title: "KONTEN 1", gaya: "", segments: [cleaned.trim()] }];

    return contentBlocks.map((block, i) => {
      // Ambil baris gaya
      const gayaMatch = block.match(/^\s*Gaya:\s*(.+)/im);
      const gaya = gayaMatch ? gayaMatch[1].trim() : "";

      // Hapus baris Gaya: dari block
      const blockClean = block.replace(/^\s*Gaya:\s*.+\n?/im, "");

      // Split per segmen berdasarkan "- SEGMEN X (Y detik)"
      const segParts = blockClean
        .split(/\n\s*-\s*SEGMEN\s*\d+\s*\(\d+\s*detik\)\s*\n/gi)
        .filter(s => s.trim());

      return {
        title: `KONTEN ${i + 1}`,
        gaya,
        segments: segParts.length ? segParts.map(s => s.trim()) : [blockClean.trim()]
      };
    });
  };

  // ─── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!name.trim()) { setError("Nama yang direview wajib diisi!"); return; }
    if (!selectedStyles.length) { setError("Pilih minimal 1 gaya konten!"); return; }
    setError("");
    setLoading(true);
    setResults([]);

    try {
      const content = imageBase64
        ? [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
            { type: "text", text: buildUserPrompt() }
          ]
        : buildUserPrompt();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: systemPrompt,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content }],
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

      const fullText = (data.content || [])
        .filter(b => b.type === "text")
        .map(b => b.text)
        .join("");

      setResults(parseResults(fullText));
    } catch (e) {
      setError("Gagal generate: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Shared Styles ───────────────────────────────────────────────────────────
  const inp = {
    width: "100%", background: "#080d18", border: "1px solid #1a2e4a",
    borderRadius: "9px", color: "#e2e8f0", padding: "11px 14px",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
    fontFamily: "inherit", transition: "border-color 0.2s"
  };
  const lbl = {
    display: "block", color: "#4a6080", fontSize: "11px", fontWeight: "700",
    marginBottom: "5px", letterSpacing: "0.08em", textTransform: "uppercase"
  };
  const card = {
    background: "linear-gradient(160deg,#090f1e,#0d1829)",
    border: "1px solid #182a42", borderRadius: "16px",
    padding: "20px", marginBottom: "14px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.5)"
  };

  const segCount = totalDuration && segDuration
    ? Math.floor(parseInt(totalDuration) / parseInt(segDuration))
    : 0;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#040a14", fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#e2e8f0" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(90deg,#040a14,#0c1829,#040a14)",
        borderBottom: "1px solid #182a42", padding: "16px 18px",
        textAlign: "center", position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🎬</span>
          <div>
            <h1 style={{
              margin: 0, fontSize: "clamp(15px,3.5vw,22px)", fontWeight: "900",
              background: "linear-gradient(135deg,#38bdf8,#818cf8,#e879f9)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.3px"
            }}>
              Sora Video Prompt Mamas
            </h1>
            <p style={{ margin: 0, fontSize: "10px", color: "#283a52", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              AI Generator Prompt Sora 2 · Affiliate Review
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "18px 13px 40px" }}>

        {/* Input Card */}
        <div style={card}>
          <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "16px" }}>
            📥 Detail Konten
          </div>

          <div style={{ marginBottom: "13px" }}>
            <label style={lbl}>Kategori</label>
            <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit",
                  border: `1px solid ${category === cat ? "#38bdf8" : "#182a42"}`,
                  background: category === cat ? "#38bdf812" : "transparent",
                  color: category === cat ? "#7dd3fc" : "#3d5570",
                  fontSize: "13px", fontWeight: category === cat ? "700" : "400", transition: "all 0.2s"
                }}>{cat}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "13px" }}>
            <label style={lbl}>Nama yang Direview <span style={{ color: "#ef4444" }}>*</span></label>
            <input
              style={inp}
              placeholder="Kopi Kenangan CSB Cirebon / Hotel Santika Bandung / Pantai Kuta Bali..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <div style={{ fontSize: "11px", color: "#283a52", marginTop: "3px" }}>
              💡 AI otomatis cari informasi lengkap dari web
            </div>
          </div>

          <div style={{ marginBottom: "13px" }}>
            <label style={lbl}>Karakter <span style={{ color: "#283a52", textTransform: "none", fontSize: "10px", fontWeight: "400" }}>— kosong = faceless</span></label>
            <input
              style={inp}
              placeholder="@username perempuan 25th, hijab krem, makeup natural, ekspresif..."
              value={character}
              onChange={e => setCharacter(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "13px" }}>
            <div>
              <label style={lbl}>Durasi/Segmen</label>
              <select style={{ ...inp, cursor: "pointer" }} value={segDuration} onChange={e => setSegDuration(e.target.value)}>
                <option value="10">10 detik</option>
                <option value="15">15 detik</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Total Durasi (detik)</label>
              <input style={inp} type="number" placeholder="30" value={totalDuration}
                onChange={e => setTotalDuration(e.target.value)} min="10" max="120" step="5" />
            </div>
            <div>
              <label style={lbl}>Jumlah Konten</label>
              <input style={inp} type="number" placeholder="1" value={jumlahKonten}
                onChange={e => setJumlahKonten(e.target.value)} min="1" max="5" />
            </div>
          </div>

          {segCount > 0 && (
            <div style={{
              background: "#06101e", border: "1px solid #182a42", borderRadius: "8px",
              padding: "9px 14px", marginBottom: "13px", fontSize: "12px", color: "#5a8ab0",
              display: "flex", gap: "14px", flexWrap: "wrap"
            }}>
              <span>📊 {segCount} segmen × {segDuration}s = {totalDuration}s</span>
              <span>📝 Dialog/segmen: {segDuration === "10" ? "18–25" : "30–38"} kata total</span>
              <span>🎬 {jumlahKonten} konten</span>
            </div>
          )}

          <div>
            <label style={lbl}>Gambar Referensi <span style={{ textTransform: "none", fontWeight: "400", color: "#283a52" }}>— opsional</span></label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed #182a42", borderRadius: "9px", padding: "14px",
                textAlign: "center", cursor: "pointer",
                background: imageBase64 ? "#06101e" : "transparent"
              }}
            >
              {imageBase64 ? (
                <>
                  <div style={{ fontSize: "16px" }}>✅</div>
                  <div style={{ fontSize: "12px", color: "#38bdf8", marginTop: "2px" }}>{imageRef}</div>
                  <div style={{ fontSize: "10px", color: "#283a52" }}>Klik untuk ganti</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "18px" }}>🖼️</div>
                  <div style={{ fontSize: "12px", color: "#283a52", marginTop: "2px" }}>Upload gambar referensi visual</div>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
            </div>
          </div>
        </div>

        {/* Style Card */}
        <div style={card}>
          <div style={{ fontSize: "11px", color: "#818cf8", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "13px" }}>
            🎨 Gaya Konten <span style={{ color: "#283a52", textTransform: "none", fontWeight: "400" }}>— pilih lebih dari 1</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(185px,1fr))", gap: "8px" }}>
            {STYLES.map(s => {
              const on = selectedStyles.includes(s.id);
              return (
                <button key={s.id} onClick={() => toggleStyle(s.id)} style={{
                  padding: "10px 13px", borderRadius: "10px", cursor: "pointer", textAlign: "left",
                  fontFamily: "inherit", transition: "all 0.18s",
                  border: `1px solid ${on ? "#6366f1" : "#182a42"}`,
                  background: on ? "linear-gradient(135deg,#6366f115,#e879f908)" : "transparent",
                  color: on ? "#c4b5fd" : "#3d5570"
                }}>
                  <div style={{ fontWeight: "700", fontSize: "13px" }}>{s.label}</div>
                  <div style={{ fontSize: "11px", marginTop: "2px", opacity: 0.7 }}>{s.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{
            background: "#1e0808", border: "1px solid #7f1d1d", borderRadius: "9px",
            padding: "10px 15px", marginBottom: "13px", color: "#fca5a5", fontSize: "13px"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: "12px", border: "none",
            background: loading ? "#0c1525" : "linear-gradient(135deg,#0ea5e9,#6366f1,#a855f7)",
            color: loading ? "#283a52" : "white", fontSize: "15px", fontWeight: "800",
            cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.04em",
            transition: "all 0.3s", boxShadow: loading ? "none" : "0 6px 22px rgba(99,102,241,0.3)",
            fontFamily: "inherit", marginBottom: "22px"
          }}
        >
          {loading ? "⚙️  Mencari info & menyusun prompt..." : "🚀  Generate Prompt Sora"}
        </button>

        {loading && (
          <div style={{ ...card, textAlign: "center", padding: "28px" }}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
            <div style={{ color: "#5a9aba", fontWeight: "600", marginBottom: "5px" }}>
              Mencari informasi tentang "{name}"...
            </div>
            <div style={{ color: "#283a52", fontSize: "12px" }}>
              AI menjelajahi web · menyusun dialog · merangkai adegan sinematik
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "13px" }}>
              <div style={{ fontSize: "14px", color: "#22d3ee", fontWeight: "700" }}>
                ✨ Hasil ({results.length} konten)
              </div>
              <CopyBtn text={getAllText()} id="all" copiedKey={copiedKey} copy={copy} />
            </div>

            {results.map((r, ci) => (
              <div key={ci} style={{ ...card, marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div>
                    <div style={{
                      background: "linear-gradient(135deg,#0ea5e9,#6366f1)", color: "white",
                      padding: "4px 13px", borderRadius: "20px", fontSize: "11px",
                      fontWeight: "800", letterSpacing: "0.06em", display: "inline-block", marginBottom: "4px"
                    }}>
                      🎬 {r.title}
                    </div>
                    {r.gaya && (
                      <div style={{ fontSize: "12px", color: "#818cf8", marginLeft: "2px" }}>
                        Gaya: {r.gaya}
                      </div>
                    )}
                  </div>
                  <CopyBtn text={getContentText(r, ci)} id={`c${ci}`} copiedKey={copiedKey} copy={copy} />
                </div>

                {r.segments.map((seg, si) => (
                  <div key={si} style={{
                    background: "#050c18", border: "1px solid #182a42",
                    borderRadius: "11px", padding: "14px", marginBottom: "9px"
                  }}>
                    {/* Label segmen — TIDAK ikut dicopy */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{
                        fontSize: "11px", color: "#38bdf8", fontWeight: "700",
                        letterSpacing: "0.08em", textTransform: "uppercase"
                      }}>
                        ▶ Segmen {si + 1} · {segDuration}s
                      </span>
                      {/* Copy hanya isi konten, tanpa label "SEGMEN X" */}
                      <CopyBtn
                        text={getSegCopyText(seg)}
                        id={`s${ci}-${si}`}
                        copiedKey={copiedKey}
                        copy={copy}
                      />
                    </div>
                    <textarea
                      value={seg}
                      onChange={e => updateSeg(ci, si, e.target.value)}
                      style={{
                        width: "100%", minHeight: "220px", background: "transparent",
                        border: "none", borderTop: "1px solid #182a42",
                        paddingTop: "11px", color: "#b8cce0", fontSize: "13px",
                        lineHeight: "1.85", fontFamily: "'Segoe UI',system-ui,sans-serif",
                        outline: "none", resize: "vertical", boxSizing: "border-box",
                        whiteSpace: "pre-wrap"
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", color: "#182a42", fontSize: "11px", paddingTop: "8px" }}>
          Sora Video Prompt Mamas · Powered by Claude AI + Web Search
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        input:focus, select:focus { border-color: #38bdf8 !important; box-shadow: 0 0 0 2px rgba(56,189,248,0.07); }
        textarea:focus { outline: none; }
        button:not(:disabled):active { opacity: 0.85; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #040a14; }
        ::-webkit-scrollbar-thumb { background: #182a42; border-radius: 3px; }
      `}</style>
    </div>
  );
}
