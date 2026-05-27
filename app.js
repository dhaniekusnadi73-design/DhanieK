const FREE_LIMIT = 1;
const FREE_MAX_QUESTIONS = 20;
const PREMIUM_MAX_QUESTIONS = 100;
const TOKEN_PRICE_LABEL = "Rp15.000";
const VALID_TOKENS = new Set([
  "BANKSOAL-15000",
  "PREMIUM-15000",
  "LYNKID-15000",
  "GURUHEBAT-15000"
]);

const levelGrades = {
  SD: ["1", "2", "3", "4", "5", "6"],
  SMP: ["7", "8", "9"],
  SMA: ["10", "11", "12"]
};

const subjects = {
  SD: [
    "Matematika", "Bahasa Indonesia", "IPAS", "PPKn", "PKN", "Bahasa Inggris",
    "Pendidikan Agama Islam", "Pendidikan Agama Kristen", "Pendidikan Agama Katolik",
    "Pendidikan Agama Buddha", "Pendidikan Agama Hindu", "Pendidikan Agama Konghucu",
    "PJOK", "Seni Budaya", "Seni Rupa", "Seni Musik", "Seni Tari", "Prakarya",
    "Bahasa Arab", "Bahasa Daerah", "Informatika"
  ],
  SMP: [
    "Matematika", "Bahasa Indonesia", "IPA", "IPS", "PPKn", "PKN", "Bahasa Inggris",
    "Informatika", "Pendidikan Agama Islam", "Pendidikan Agama Kristen",
    "Pendidikan Agama Katolik", "Pendidikan Agama Buddha", "Pendidikan Agama Hindu",
    "Pendidikan Agama Konghucu", "PJOK", "Seni Budaya", "Prakarya",
    "Bahasa Arab", "Bahasa Jepang", "Bahasa Mandarin", "Bahasa Daerah"
  ],
  SMA: [
    "Matematika", "Bahasa Indonesia", "Fisika", "Kimia", "Biologi", "Ekonomi",
    "Sejarah", "Geografi", "Sosiologi", "Antropologi", "PPKn", "PKN",
    "Bahasa Inggris", "Informatika", "Pendidikan Agama Islam",
    "Pendidikan Agama Kristen", "Pendidikan Agama Katolik", "Pendidikan Agama Buddha",
    "Pendidikan Agama Hindu", "Pendidikan Agama Konghucu", "PJOK", "Seni Budaya",
    "Prakarya dan Kewirausahaan", "Bahasa Arab", "Bahasa Jepang", "Bahasa Mandarin",
    "Bahasa Korea", "Bahasa Jerman", "Bahasa Prancis", "Bahasa Daerah"
  ]
};

const curriculumNotes = {
  "Kurikulum Merdeka 2024": "Berbasis CP fase A-F Kurikulum Merdeka 2024, menekankan kompetensi, literasi, numerasi, dan penalaran kontekstual.",
  "Kurikulum 2013": "Mengacu pada pola KI/KD Kurikulum 2013, kompetensi sikap, pengetahuan, keterampilan, serta pembelajaran tematik atau mapel.",
  "Gabungan Kurikulum Merdeka 2024 + Kurikulum 2013": "Menggabungkan CP Kurikulum Merdeka 2024 dengan acuan KD Kurikulum 2013 untuk variasi latihan."
};

const semesterFocus = {
  "1": ["konsep dasar", "pemahaman awal", "contoh dekat kehidupan sehari-hari", "identifikasi informasi penting"],
  "2": ["penerapan lanjutan", "integrasi beberapa konsep", "pemecahan masalah kontekstual", "evaluasi akhir pembelajaran"]
};

const materialBank = {
  Matematika: ["bilangan", "operasi hitung", "pecahan", "perbandingan", "geometri", "pengukuran", "data dan peluang", "aljabar", "fungsi", "statistika"],
  "Bahasa Indonesia": ["ide pokok", "teks narasi", "teks deskripsi", "teks eksplanasi", "teks argumentasi", "puisi", "kaidah bahasa", "simpulan bacaan", "teks laporan"],
  IPAS: ["makhluk hidup", "ekosistem", "gaya dan gerak", "energi", "bumi dan antariksa", "perubahan wujud", "lingkungan", "sistem tubuh manusia"],
  IPA: ["klasifikasi makhluk hidup", "zat dan perubahannya", "sistem organ", "ekologi", "energi", "getaran dan gelombang", "listrik", "tata surya"],
  IPS: ["interaksi sosial", "kegiatan ekonomi", "sejarah Indonesia", "peta dan wilayah", "globalisasi", "keragaman budaya", "mobilitas sosial"],
  PPKn: ["Pancasila", "UUD 1945", "hak dan kewajiban", "Bhinneka Tunggal Ika", "musyawarah", "norma", "demokrasi"],
  PKN: ["Pancasila", "UUD 1945", "hak dan kewajiban warga negara", "Bhinneka Tunggal Ika", "musyawarah", "norma sosial", "demokrasi"],
  "Bahasa Inggris": ["vocabulary", "simple present", "descriptive text", "recount text", "procedure text", "dialogue", "reading comprehension", "announcement"],
  Informatika: ["berpikir komputasional", "algoritma", "struktur data sederhana", "keamanan digital", "etika digital", "jaringan komputer", "pemrograman dasar", "analisis data"],
  "Pendidikan Agama Islam": ["iman kepada Allah", "Al-Qur'an dan hadis", "akhlak terpuji", "ibadah", "kisah nabi", "muamalah", "toleransi", "sejarah kebudayaan Islam"],
  "Pendidikan Agama Kristen": ["kasih Allah", "Alkitab", "doa", "keteladanan Yesus", "gereja", "pelayanan", "pengampunan", "hidup bersyukur"],
  "Pendidikan Agama Katolik": ["iman Katolik", "Kitab Suci", "sakramen", "doa", "gereja", "teladan Yesus", "moral Kristiani", "pelayanan"],
  "Pendidikan Agama Buddha": ["Triratna", "Pancasila Buddhis", "Dhamma", "meditasi", "karma", "welas asih", "riwayat Buddha", "hari raya Buddhis"],
  "Pendidikan Agama Hindu": ["Weda", "Tri Hita Karana", "Panca Sraddha", "karma phala", "dharma", "sembahyang", "yadnya", "hari suci Hindu"],
  "Pendidikan Agama Konghucu": ["Tian", "Nabi Kongzi", "Wu Chang", "bakti", "li", "ren", "harmoni", "kitab suci Konghucu"],
  PJOK: ["kebugaran jasmani", "permainan bola besar", "permainan bola kecil", "atletik", "senam", "renang", "pola hidup sehat", "keselamatan olahraga"],
  "Seni Budaya": ["apresiasi seni", "seni rupa", "seni musik", "seni tari", "seni teater", "ragam hias", "kritik seni", "pameran karya"],
  "Seni Rupa": ["unsur seni rupa", "gambar bentuk", "warna", "ragam hias", "komposisi", "karya dua dimensi", "karya tiga dimensi", "pameran"],
  "Seni Musik": ["ritme", "melodi", "tempo", "notasi", "alat musik", "musik daerah", "aransemen", "pertunjukan musik"],
  "Seni Tari": ["gerak tari", "wiraga", "wirama", "wirasa", "tari daerah", "pola lantai", "properti tari", "kreasi tari"],
  Prakarya: ["kerajinan", "rekayasa sederhana", "budidaya", "pengolahan makanan", "desain produk", "bahan alam", "bahan buatan", "kewirausahaan"],
  "Prakarya dan Kewirausahaan": ["perencanaan usaha", "analisis peluang", "produksi", "kemasan", "pemasaran", "biaya produksi", "kerajinan", "pengolahan"],
  "Bahasa Arab": ["mufradat", "hiwar", "qira'ah", "kitabah", "istima'", "tarkib", "isim dan fi'il", "jumlah mufidah"],
  "Bahasa Jepang": ["hiragana", "katakana", "aisatsu", "jikoshoukai", "kosakata sehari-hari", "pola kalimat dasar", "angka dan waktu", "budaya Jepang"],
  "Bahasa Mandarin": ["pinyin", "hanzi dasar", "sapaan", "angka", "keluarga", "aktivitas harian", "nada", "kalimat sederhana"],
  "Bahasa Korea": ["hangul", "sapaan", "angka Korea", "keluarga", "aktivitas harian", "partikel dasar", "kalimat sederhana", "budaya Korea"],
  "Bahasa Jerman": ["begrüßung", "zahlen", "familie", "artikel", "verben", "kalimat sederhana", "waktu", "kegiatan sehari-hari"],
  "Bahasa Prancis": ["salutations", "nombres", "famille", "articles", "verbes dasar", "kalimat sederhana", "waktu", "aktivitas harian"],
  "Bahasa Daerah": ["kosakata daerah", "unggah-ungguh", "aksara daerah", "cerita rakyat", "tembang", "peribahasa", "dialog sederhana", "budaya lokal"],
  Fisika: ["besaran dan satuan", "gerak lurus", "hukum Newton", "usaha dan energi", "momentum", "gelombang", "listrik dinamis", "fluida"],
  Kimia: ["struktur atom", "ikatan kimia", "stoikiometri", "larutan", "asam basa", "redoks", "termokimia", "kimia organik"],
  Biologi: ["sel", "genetika", "evolusi", "ekosistem", "sistem organ", "bioteknologi", "keanekaragaman hayati", "metabolisme"],
  Ekonomi: ["kelangkaan", "permintaan dan penawaran", "pasar", "inflasi", "pendapatan nasional", "akuntansi", "kebijakan fiskal", "perdagangan internasional"],
  Sejarah: ["praaksara", "kerajaan Hindu-Buddha", "kerajaan Islam", "kolonialisme", "pergerakan nasional", "proklamasi", "demokrasi Indonesia"],
  Geografi: ["litosfer", "atmosfer", "hidrosfer", "peta", "penginderaan jauh", "kependudukan", "mitigasi bencana", "wilayah"],
  Sosiologi: ["interaksi sosial", "nilai dan norma", "kelompok sosial", "konflik", "perubahan sosial", "penelitian sosial", "stratifikasi"],
  Antropologi: ["budaya", "tradisi", "sistem kekerabatan", "ritual", "bahasa dan identitas", "perubahan budaya", "etnografi", "keragaman masyarakat"]
};

const stemTemplates = {
  Matematika: [
    "Dalam konteks {topic}, langkah paling tepat untuk menyelesaikan masalah pada kelas {grade} adalah ...",
    "Sebuah soal {topic} meminta peserta didik membandingkan dua nilai. Konsep yang paling sesuai adalah ...",
    "Jika data pada permasalahan {topic} berubah, hal pertama yang perlu dihitung adalah ..."
  ],
  "Bahasa Indonesia": [
    "Pada teks tentang {topic}, informasi utama biasanya ditemukan melalui ...",
    "Kalimat yang paling sesuai untuk menyimpulkan bacaan bertema {topic} adalah ...",
    "Ciri kebahasaan yang tepat untuk teks dengan topik {topic} adalah ..."
  ],
  default: [
    "Pada materi {topic}, pernyataan yang paling tepat sesuai pembelajaran kelas {grade} adalah ...",
    "Contoh penerapan konsep {topic} dalam kehidupan sehari-hari adalah ...",
    "Jika peserta didik mengamati fenomena {topic}, kesimpulan yang paling tepat adalah ..."
  ]
};

let generatedQuestions = [];
let generatedMeta = {};

const els = {
  level: document.querySelector("#level"),
  grade: document.querySelector("#grade"),
  subject: document.querySelector("#subject"),
  semester: document.querySelector("#semester"),
  count: document.querySelector("#count"),
  curriculum: document.querySelector("#curriculum"),
  difficulty: document.querySelector("#difficulty"),
  topic: document.querySelector("#topic"),
  includeAnswerKey: document.querySelector("#includeAnswerKey"),
  form: document.querySelector("#generatorForm"),
  paper: document.querySelector("#paper"),
  paperTitle: document.querySelector("#paperTitle"),
  questionCount: document.querySelector("#questionCount"),
  emptyState: document.querySelector("#emptyState"),
  exportBtn: document.querySelector("#exportBtn"),
  quotaText: document.querySelector("#quotaText"),
  planBadge: document.querySelector("#planBadge"),
  tokenForm: document.querySelector("#tokenForm"),
  tokenInput: document.querySelector("#tokenInput"),
  tokenMessage: document.querySelector("#tokenMessage"),
  accountStatus: document.querySelector("#accountStatus"),
  accountEmail: document.querySelector("#accountEmail"),
  accountPassword: document.querySelector("#accountPassword"),
  loginBtn: document.querySelector("#loginBtn"),
  registerBtn: document.querySelector("#registerBtn"),
  paymentForm: document.querySelector("#paymentForm"),
  buyerEmail: document.querySelector("#buyerEmail"),
  paymentMethod: document.querySelector("#paymentMethod"),
  paymentStatus: document.querySelector("#paymentStatus"),
  simulatePaidBtn: document.querySelector("#simulatePaidBtn")
};

let currentOrderId = localStorage.getItem("banksoalOrderId") || "";
let paymentPoller = null;
let appConfig = { allowPaymentSimulation: false };
let currentUser = null;

function getFreePeriodKey(date = new Date()) {
  return `${date.getFullYear()}`;
}

function getState() {
  return {
    premium: localStorage.getItem("banksoalPremium") === "true",
    week: localStorage.getItem("banksoalWeek") || getFreePeriodKey(),
    uses: Number(localStorage.getItem("banksoalUses") || 0)
  };
}

function saveUses(uses) {
  localStorage.setItem("banksoalWeek", getFreePeriodKey());
  localStorage.setItem("banksoalUses", String(uses));
}

function normalizeWeeklyState() {
  const state = getState();
  if (state.week !== getFreePeriodKey()) {
    saveUses(0);
  }
}

function updateQuota() {
  normalizeWeeklyState();
  const state = getState();
  const premium = Boolean(currentUser?.premium) || state.premium;
  els.planBadge.textContent = premium ? "Premium" : "Gratis";
  els.planBadge.classList.toggle("muted", !premium);
  if (premium) {
    els.quotaText.textContent = "Premium aktif: pemakaian bebas";
    els.count.max = String(PREMIUM_MAX_QUESTIONS);
    return;
  }
  els.count.max = String(FREE_MAX_QUESTIONS);
  if (Number(els.count.value || 0) > FREE_MAX_QUESTIONS) els.count.value = String(FREE_MAX_QUESTIONS);
  const remaining = Math.max(0, FREE_LIMIT - state.uses);
  els.quotaText.textContent = `Sisa gratis: ${remaining}x tahun ini, maksimal ${FREE_MAX_QUESTIONS} soal`;
}

function setPremiumActive(message = "Premium aktif. Pemakaian sekarang bebas.") {
  localStorage.setItem("banksoalPremium", "true");
  els.tokenMessage.textContent = message;
  els.tokenMessage.className = "message success";
  updateQuota();
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const field = document.createElement("textarea");
  field.value = text;
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

function renderPaymentStatus(order, extra = "") {
  if (!order) return;
  const statusLabel = order.status === "paid" ? "Lunas" : "Menunggu pembayaran";
  const tokenHtml = order.status === "paid" && order.token
    ? `<div class="token-result">
        <span><strong>Token premium:</strong> <code>${escapeHtml(order.token)}</code></span>
        <button type="button" class="mini-button" data-token-action="copy" data-token="${escapeHtml(order.token)}">Salin</button>
        <button type="button" class="mini-button" data-token-action="activate" data-token="${escapeHtml(order.token)}">Pakai</button>
      </div>`
    : "";
  els.paymentStatus.classList.remove("hidden");
  els.paymentStatus.innerHTML = `
    <strong>Order ${escapeHtml(order.id)}</strong><br>
    Email: ${escapeHtml(order.email)}<br>
    Metode: ${escapeHtml(order.method)}<br>
    Nominal: Rp${Number(order.amount).toLocaleString("id-ID")}<br>
    Status: ${escapeHtml(statusLabel)}
    ${tokenHtml}
    ${order.paymentUrl ? `<br><a class="payment-link" href="${escapeHtml(order.paymentUrl)}" target="_blank" rel="noopener">Bayar otomatis sekarang</a>` : ""}
    ${extra ? `<br>${extra}` : ""}
  `;
  els.simulatePaidBtn.classList.toggle("hidden", order.status === "paid" || !appConfig.allowPaymentSimulation);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Permintaan gagal.");
  return payload;
}

async function loadAppConfig() {
  try {
    appConfig = await apiRequest("/api/config");
  } catch {
    appConfig = { allowPaymentSimulation: false };
  }
  els.simulatePaidBtn.classList.toggle("hidden", !appConfig.allowPaymentSimulation);
}

function renderAccount() {
  if (currentUser) {
    els.accountStatus.textContent = `Login sebagai ${currentUser.email}${currentUser.premium ? " - Premium aktif" : ""}.`;
    els.buyerEmail.value = currentUser.email;
  } else {
    els.accountStatus.textContent = "Belum login. Limit gratis tetap dihitung oleh server.";
  }
  updateQuota();
}

async function loadCurrentUser() {
  const payload = await apiRequest("/api/me");
  currentUser = payload.user;
  renderAccount();
}

async function checkOrderStatus() {
  if (!currentOrderId) return;
  const payload = await apiRequest(`/api/order/${encodeURIComponent(currentOrderId)}`);
  const paidMessage = payload.order.token
    ? "Token juga ditampilkan di sini sebagai cadangan jika email belum aktif."
    : "Pembayaran diterima. Jika email belum aktif, hubungi admin dengan Order ID ini.";
  renderPaymentStatus(payload.order, payload.order.status === "paid" ? paidMessage : "");
  if (payload.order.status === "paid") {
    if (payload.order.token) els.tokenInput.value = payload.order.token;
    setPremiumActive(payload.order.token ? "Pembayaran diterima. Premium aktif, token tersedia di status order." : "Pembayaran diterima. Premium aktif.");
    clearInterval(paymentPoller);
    paymentPoller = null;
  }
}

function startPaymentPolling() {
  clearInterval(paymentPoller);
  paymentPoller = setInterval(() => {
    checkOrderStatus().catch(() => {});
  }, 5000);
}

function fillSelect(select, values) {
  select.innerHTML = values.map((value) => `<option value="${value}">${value}</option>`).join("");
}

function syncSelectors() {
  fillSelect(els.grade, levelGrades[els.level.value]);
  fillSelect(els.subject, subjects[els.level.value]);
}

function pick(items, index) {
  return items[index % items.length];
}

function makeVariationSeed() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return `${Date.now()}-${array[0]}`;
}

function shuffleAnswer(options, answer, index) {
  const answerIndex = index % 4;
  const result = options.filter((option) => option !== answer).slice(0, 3);
  result.splice(answerIndex, 0, answer);
  return {
    options: result,
    answer: String.fromCharCode(65 + answerIndex)
  };
}

function buildOptions(subject, topic, index) {
  const correctBySubject = {
    Matematika: `menggunakan konsep ${topic} secara runtut dan memeriksa kembali hasilnya`,
    "Bahasa Indonesia": `menemukan gagasan utama dan bukti pendukung dalam teks`,
    "Bahasa Inggris": `memahami konteks kalimat sebelum memilih struktur bahasa`,
    Informatika: `menyusun langkah algoritmis dan menjaga keamanan digital sesuai masalah`,
    PPKn: `mengaitkan nilai Pancasila, aturan, hak, dan kewajiban dengan situasi nyata`,
    PKN: `mengaitkan nilai Pancasila, aturan, hak, dan kewajiban dengan situasi nyata`,
    PJOK: `menerapkan teknik gerak yang benar dan memperhatikan keselamatan`,
    "Seni Budaya": `mengapresiasi unsur karya seni dan menjelaskan fungsinya`,
    "Seni Rupa": `menganalisis unsur rupa, media, teknik, dan komposisi karya`,
    "Seni Musik": `mengenali unsur musik seperti ritme, melodi, tempo, dan ekspresi`,
    "Seni Tari": `mengaitkan gerak, irama, ekspresi, dan pola lantai dalam tari`,
    Prakarya: `merancang produk sederhana berdasarkan bahan, fungsi, dan kebutuhan`,
    "Prakarya dan Kewirausahaan": `menganalisis peluang, biaya, produksi, dan pemasaran secara logis`,
    "Bahasa Arab": `memahami kosakata, struktur kalimat, dan konteks komunikasi bahasa Arab`,
    "Bahasa Jepang": `memahami huruf, kosakata, dan pola kalimat dasar bahasa Jepang`,
    "Bahasa Mandarin": `memahami pinyin, nada, kosakata, dan pola kalimat sederhana`,
    "Bahasa Korea": `memahami hangul, kosakata, partikel, dan kalimat sederhana`,
    "Bahasa Jerman": `memahami kosakata, artikel, verba, dan kalimat sederhana`,
    "Bahasa Prancis": `memahami kosakata, artikel, verba, dan kalimat sederhana`,
    "Bahasa Daerah": `menggunakan kosakata, tata krama bahasa, dan budaya lokal sesuai konteks`,
    "Pendidikan Agama Islam": `menghubungkan ajaran Islam dengan akhlak, ibadah, dan kehidupan sehari-hari`,
    "Pendidikan Agama Kristen": `menghubungkan ajaran kasih dengan sikap iman dan kehidupan sehari-hari`,
    "Pendidikan Agama Katolik": `menghubungkan iman Katolik dengan doa, moral, dan pelayanan`,
    "Pendidikan Agama Buddha": `menghubungkan Dhamma dengan kebijaksanaan, welas asih, dan tindakan baik`,
    "Pendidikan Agama Hindu": `menghubungkan ajaran dharma dengan perilaku, ibadah, dan harmoni`,
    "Pendidikan Agama Konghucu": `menghubungkan ajaran kebajikan dengan bakti, harmoni, dan perilaku luhur`,
    Fisika: `menghubungkan gejala dengan besaran, satuan, dan hukum yang berlaku`,
    Kimia: `menganalisis partikel, reaksi, dan perubahan zat berdasarkan data`,
    Biologi: `mengaitkan struktur, fungsi, dan proses pada makhluk hidup`,
    Ekonomi: `menganalisis pilihan ekonomi berdasarkan kelangkaan dan kebutuhan`,
    Sejarah: `menyusun peristiwa berdasarkan waktu, sebab, dan akibat`,
    Geografi: `membaca pola ruang dan hubungan manusia dengan lingkungan`,
    Sosiologi: `mengamati hubungan sosial, nilai, norma, dan perubahan masyarakat`,
    default: `menggunakan konsep ${topic} dengan bukti yang sesuai`
  };
  const answer = correctBySubject[subject] || correctBySubject.default;
  const distractors = [
    "menghafal istilah tanpa menghubungkannya dengan konteks soal",
    "memilih jawaban paling panjang meskipun tidak sesuai data",
    "mengabaikan informasi penting yang tersedia pada stimulus",
    "menjawab berdasarkan tebakan tanpa alasan yang dapat diperiksa",
    "menyalin contoh lama tanpa menyesuaikan kondisi soal"
  ];
  return shuffleAnswer([answer, ...distractors], answer, index);
}

function generateQuestions(meta) {
  const topics = meta.topic
    ? meta.topic.split(",").map((item) => item.trim()).filter(Boolean)
    : materialBank[meta.subject] || materialBank.IPAS;
  const offset = Number(String(meta.variationSeed || "").replace(/\D/g, "").slice(-4)) || Math.floor(Math.random() * 9999);
  const focuses = semesterFocus[meta.semester] || semesterFocus["1"];

  return Array.from({ length: meta.count }, (_, index) => {
    const variedIndex = index + offset;
    const topic = pick(topics, variedIndex);
    const focus = pick(focuses, variedIndex);
    const templateList = stemTemplates[meta.subject] || stemTemplates.default;
    const template = pick(templateList, variedIndex);
    const stem = template
      .replaceAll("{topic}", topic)
      .replaceAll("{grade}", meta.grade)
      .replaceAll("{level}", meta.level) + ` Fokus soal: ${focus} semester ${meta.semester}.`;
    const optionSet = buildOptions(meta.subject, topic, variedIndex);
    const difficulty = meta.difficulty === "Campuran"
      ? pick(["Mudah", "Sedang", "Sulit"], variedIndex)
      : meta.difficulty;
    return {
      number: index + 1,
      stem,
      topic,
      difficulty,
      options: optionSet.options,
      answer: optionSet.answer,
      explanation: `Jawaban benar karena pilihan tersebut menerapkan konsep ${topic} pada fokus ${focus} sesuai ${meta.curriculum}.`
    };
  });
}

function consumeQuota() {
  normalizeWeeklyState();
  const state = getState();
  if (state.premium) return true;
  if (state.uses >= FREE_LIMIT) return false;
  saveUses(state.uses + 1);
  updateQuota();
  return true;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPaper(meta, questions) {
  const title = `Soal ${meta.subject} Kelas ${meta.grade} ${meta.level} Semester ${meta.semester}`;
  els.paperTitle.textContent = title;
  els.questionCount.textContent = `${questions.length} soal`;
  els.emptyState.classList.add("hidden");
  els.paper.classList.remove("hidden");
  els.exportBtn.disabled = false;

  const questionHtml = questions.map((question) => `
    <section class="question">
      <p><strong>${question.number}. [${question.difficulty}]</strong> ${escapeHtml(question.stem)}</p>
      <div class="options">
        ${question.options.map((option, optionIndex) => `<div>${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}</div>`).join("")}
      </div>
    </section>
  `).join("");

  const keyHtml = meta.includeAnswerKey ? `
    <section class="answer-key">
      <h3>Kunci Jawaban dan Pembahasan Singkat</h3>
      ${questions.map((question) => `<p><strong>${question.number}. ${question.answer}</strong> - ${escapeHtml(question.explanation)}</p>`).join("")}
    </section>
  ` : "";

  els.paper.innerHTML = `
    <header class="paper-header">
      <h3>${escapeHtml(title)}</h3>
      <div class="meta-grid">
        <div>Jenjang: ${escapeHtml(meta.level)}</div>
        <div>Kelas: ${escapeHtml(meta.grade)}</div>
        <div>Semester: ${escapeHtml(meta.semester)}</div>
        <div>Mata pelajaran: ${escapeHtml(meta.subject)}</div>
        <div>Kurikulum: ${escapeHtml(meta.curriculum)}</div>
        <div>Jumlah: ${questions.length} soal</div>
        <div>Tanggal: ${new Date().toLocaleDateString("id-ID")}</div>
      </div>
      <p>${escapeHtml(curriculumNotes[meta.curriculum])}</p>
    </header>
    ${questionHtml}
    ${keyHtml}
  `;
}

function getMetaFromForm() {
  const premium = Boolean(currentUser?.premium) || getState().premium;
  const maxQuestions = premium ? PREMIUM_MAX_QUESTIONS : FREE_MAX_QUESTIONS;
  return {
    level: els.level.value,
    grade: els.grade.value,
    subject: els.subject.value,
    semester: els.semester.value,
    count: Math.max(1, Math.min(maxQuestions, Number(els.count.value || 1))),
    curriculum: els.curriculum.value,
    difficulty: els.difficulty.value,
    topic: els.topic.value.trim(),
    includeAnswerKey: els.includeAnswerKey.checked,
    variationSeed: makeVariationSeed()
  };
}

function exportWord() {
  if (!generatedQuestions.length) return;
  const styles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.45; color: #111; }
      h1 { text-align: center; font-size: 18pt; }
      .meta { margin-bottom: 18px; border-bottom: 2px solid #111; padding-bottom: 10px; }
      .question { margin-bottom: 12px; page-break-inside: avoid; }
      .options { margin-left: 18px; }
      .answer-key { margin-top: 24px; border-top: 1px solid #999; padding-top: 12px; }
    </style>
  `;
  const title = `Soal ${generatedMeta.subject} Kelas ${generatedMeta.grade} ${generatedMeta.level} Semester ${generatedMeta.semester}`;
  const content = `
    <!doctype html>
    <html>
      <head><meta charset="utf-8">${styles}</head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="meta">
          <p><strong>Jenjang:</strong> ${escapeHtml(generatedMeta.level)}<br>
          <strong>Kelas:</strong> ${escapeHtml(generatedMeta.grade)}<br>
          <strong>Semester:</strong> ${escapeHtml(generatedMeta.semester)}<br>
          <strong>Mata pelajaran:</strong> ${escapeHtml(generatedMeta.subject)}<br>
          <strong>Kurikulum:</strong> ${escapeHtml(generatedMeta.curriculum)}<br>
          <strong>Jumlah:</strong> ${generatedQuestions.length} soal<br>
          <strong>Tanggal:</strong> ${new Date().toLocaleDateString("id-ID")}</p>
          <p>${escapeHtml(curriculumNotes[generatedMeta.curriculum])}</p>
        </div>
        ${generatedQuestions.map((question) => `
          <div class="question">
            <p><strong>${question.number}. [${question.difficulty}]</strong> ${escapeHtml(question.stem)}</p>
            <div class="options">
              ${question.options.map((option, optionIndex) => `<div>${String.fromCharCode(65 + optionIndex)}. ${escapeHtml(option)}</div>`).join("")}
            </div>
          </div>
        `).join("")}
        ${generatedMeta.includeAnswerKey ? `
          <div class="answer-key">
            <h2>Kunci Jawaban dan Pembahasan Singkat</h2>
            ${generatedQuestions.map((question) => `<p><strong>${question.number}. ${question.answer}</strong> - ${escapeHtml(question.explanation)}</p>`).join("")}
          </div>
        ` : ""}
      </body>
    </html>
  `;
  const blob = new Blob([content], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replaceAll(" ", "-")}.doc`;
  link.click();
  URL.revokeObjectURL(url);
}

els.level.addEventListener("change", syncSelectors);
els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  generatedMeta = getMetaFromForm();
  els.paperTitle.textContent = "Sedang membuat soal...";
  els.emptyState.classList.remove("hidden");
  els.emptyState.textContent = "Generator sedang menyiapkan soal.";
  els.paper.classList.add("hidden");
  try {
    const payload = await apiRequest("/api/generate", {
      method: "POST",
      body: JSON.stringify(generatedMeta)
    });
    generatedMeta = payload.meta;
    generatedQuestions = payload.questions;
    renderPaper(generatedMeta, generatedQuestions);
    consumeQuota();
  } catch (error) {
    els.paperTitle.textContent = "Belum ada soal";
    els.emptyState.textContent = error.message || `Kuota gratis tahun ini sudah habis. Aktifkan premium ${TOKEN_PRICE_LABEL}.`;
  }
});

els.exportBtn.addEventListener("click", exportWord);

async function handleAccount(action) {
  els.accountStatus.textContent = action === "login" ? "Login..." : "Mendaftarkan akun...";
  try {
    const payload = await apiRequest(`/api/${action}`, {
      method: "POST",
      body: JSON.stringify({
        email: els.accountEmail.value,
        password: els.accountPassword.value
      })
    });
    currentUser = payload.user;
    renderAccount();
  } catch (error) {
    els.accountStatus.textContent = error.message;
  }
}

els.loginBtn.addEventListener("click", () => handleAccount("login"));
els.registerBtn.addEventListener("click", () => handleAccount("register"));

els.paymentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.paymentStatus.classList.remove("hidden");
  els.paymentStatus.textContent = "Membuat order premium...";
  try {
    const payload = await apiRequest("/api/create-order", {
      method: "POST",
      body: JSON.stringify({
        email: els.buyerEmail.value,
        method: els.paymentMethod.value
      })
    });
    currentOrderId = payload.order.id;
    localStorage.setItem("banksoalOrderId", currentOrderId);
    renderPaymentStatus(
      payload.order,
      payload.order.paymentUrl ? "Selesaikan pembayaran melalui halaman pembayaran otomatis." : "Silakan transfer ke nomor 085271550657 atas nama Dhanie Kusnadi."
    );
    startPaymentPolling();
  } catch (error) {
    els.paymentStatus.textContent = error.message;
  }
});

els.paymentStatus.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-token-action]");
  if (!button) return;
  const token = button.dataset.token || "";
  if (!token) return;
  if (button.dataset.tokenAction === "copy") {
    await copyText(token);
    els.tokenMessage.textContent = "Token sudah disalin.";
    els.tokenMessage.className = "message success";
    return;
  }
  els.tokenInput.value = token;
  els.tokenForm.requestSubmit();
});

els.simulatePaidBtn.addEventListener("click", async () => {
  if (!currentOrderId) return;
  els.paymentStatus.classList.remove("hidden");
  els.paymentStatus.textContent = "Memproses simulasi pembayaran...";
  try {
    const payload = await apiRequest("/api/dev/mark-paid", {
      method: "POST",
      body: JSON.stringify({ orderId: currentOrderId })
    });
    els.tokenInput.value = payload.token;
    await checkOrderStatus();
  } catch (error) {
    els.paymentStatus.textContent = error.message;
  }
});

els.tokenForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = els.tokenInput.value.trim().toUpperCase();
  if (VALID_TOKENS.has(token)) {
    setPremiumActive();
    return;
  }
  try {
    await apiRequest("/api/redeem-token", {
      method: "POST",
      body: JSON.stringify({ token })
    });
    setPremiumActive();
    await loadCurrentUser().catch(() => {});
  } catch {
    els.tokenMessage.textContent = "Token tidak valid. Pastikan token sesuai dari pembayaran.";
    els.tokenMessage.className = "message error";
  }
});

syncSelectors();
updateQuota();
loadAppConfig();
loadCurrentUser().catch(() => renderAccount());
if (currentOrderId) {
  checkOrderStatus().catch(() => {});
  startPaymentPolling();
}
