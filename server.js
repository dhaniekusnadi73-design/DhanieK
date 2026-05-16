const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createStorage } = require("./storage");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const isProduction = process.env.NODE_ENV === "production";
const storage = createStorage(root);

const FREE_LIMIT = 1;
const SESSION_DAYS = 30;
const PAYMENT_AMOUNT = 15000;
const RECEIVER_NAME = process.env.PAYMENT_RECEIVER_NAME || "Dhanie Kusnadi";
const RECEIVER_NUMBER = process.env.PAYMENT_RECEIVER_NUMBER || "085271550657";
const ADMIN_SECRET = process.env.ADMIN_SECRET || (isProduction ? "" : "dev-admin-secret");
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "manual";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const materialBank = {
  Matematika: ["bilangan", "operasi hitung", "pecahan", "geometri", "statistika", "aljabar"],
  "Bahasa Indonesia": ["ide pokok", "teks narasi", "teks eksplanasi", "kaidah bahasa", "simpulan bacaan"],
  IPAS: ["makhluk hidup", "ekosistem", "energi", "bumi dan antariksa", "lingkungan"],
  IPA: ["zat dan perubahannya", "sistem organ", "ekologi", "energi", "listrik", "tata surya"],
  IPS: ["interaksi sosial", "kegiatan ekonomi", "sejarah Indonesia", "peta", "globalisasi"],
  PPKn: ["Pancasila", "UUD 1945", "hak dan kewajiban", "Bhinneka Tunggal Ika", "demokrasi"],
  PKN: ["Pancasila", "UUD 1945", "hak dan kewajiban", "Bhinneka Tunggal Ika", "demokrasi"],
  Informatika: ["berpikir komputasional", "algoritma", "keamanan digital", "pemrograman dasar", "analisis data"],
  PJOK: ["kebugaran jasmani", "permainan bola besar", "atletik", "senam", "pola hidup sehat"],
  "Bahasa Inggris": ["vocabulary", "simple present", "descriptive text", "dialogue", "reading comprehension"],
  "Bahasa Arab": ["mufradat", "hiwar", "qira'ah", "kitabah", "tarkib"],
  "Bahasa Jepang": ["hiragana", "katakana", "aisatsu", "jikoshoukai", "pola kalimat dasar"],
  "Pendidikan Agama Islam": ["akidah", "Al-Qur'an dan hadis", "akhlak", "ibadah", "sejarah kebudayaan Islam"],
  "Pendidikan Agama Kristen": ["kasih Allah", "Alkitab", "doa", "keteladanan Yesus", "pelayanan"],
  "Pendidikan Agama Katolik": ["iman Katolik", "Kitab Suci", "sakramen", "doa", "pelayanan"],
  "Pendidikan Agama Buddha": ["Triratna", "Pancasila Buddhis", "Dhamma", "karma", "welas asih"],
  default: ["konsep utama", "penerapan sehari-hari", "analisis sederhana", "pemecahan masalah", "refleksi pembelajaran"]
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Body terlalu besar"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Format JSON tidak valid"));
      }
    });
  });
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").filter(Boolean).map((item) => {
    const [key, ...rest] = item.trim().split("=");
    return [key, decodeURIComponent(rest.join("="))];
  }));
}

function setCookie(res, name, value, maxAgeSeconds) {
  const flags = [`${name}=${encodeURIComponent(value)}`, "Path=/", `Max-Age=${maxAgeSeconds}`, "HttpOnly", "SameSite=Lax"];
  if (isProduction) flags.push("Secure");
  res.setHeader("Set-Cookie", flags.join("; "));
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function makeId(prefix) {
  return `${prefix}-${crypto.randomBytes(12).toString("hex")}`;
}

function makeToken() {
  return `BANKSOAL-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

function makeOrderId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `BS-${stamp}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function getFreePeriodKey(date = new Date()) {
  return `${date.getFullYear()}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 210000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const actual = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(actual));
}

async function getCurrentUser(req) {
  const sessionId = parseCookies(req).banksoal_session;
  if (!sessionId) return null;
  const session = await storage.getSession(sessionId);
  if (!session) return null;
  return storage.getUserById(session.userId);
}

function getAnonId(req, res) {
  const cookies = parseCookies(req);
  if (cookies.banksoal_anon) return cookies.banksoal_anon;
  const anonId = makeId("anon");
  setCookie(res, "banksoal_anon", anonId, 60 * 60 * 24 * 365);
  return anonId;
}

async function createSession(res, user) {
  const session = {
    id: makeId("sess"),
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86400000).toISOString(),
    createdAt: new Date().toISOString()
  };
  await storage.createSession(session);
  setCookie(res, "banksoal_session", session.id, SESSION_DAYS * 86400);
}

async function sendPremiumEmail(order, token) {
  const subject = "Token Premium BankSoal Pro";
  const body = `Halo, pembayaran order ${order.id} sudah diterima. Token premium Anda: ${token}`;
  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "BankSoal Pro <noreply@example.com>",
        to: order.email,
        subject,
        text: body
      })
    });
    if (!response.ok) throw new Error("Gagal mengirim email token.");
  }
  await storage.recordEmail({ id: makeId("email"), to: order.email, subject, body, createdAt: new Date().toISOString() });
}

async function createMidtransPayment(order) {
  if (PAYMENT_PROVIDER !== "midtrans" || !process.env.PAYMENT_SERVER_KEY) return order;
  const isSandbox = process.env.MIDTRANS_IS_PRODUCTION !== "true";
  const baseUrl = isSandbox ? "https://app.sandbox.midtrans.com" : "https://app.midtrans.com";
  const auth = Buffer.from(`${process.env.PAYMENT_SERVER_KEY}:`).toString("base64");
  const response = await fetch(`${baseUrl}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      transaction_details: { order_id: order.id, gross_amount: order.amount },
      customer_details: { email: order.email },
      item_details: [{ id: "premium-banksoal", price: order.amount, quantity: 1, name: "Premium BankSoal Pro" }],
      enabled_payments: ["gopay", "qris"],
      callbacks: { finish: `${process.env.APP_URL || ""}/` },
      gopay: { enable_callback: true, callback_url: `${process.env.APP_URL || ""}/api/payment-webhook` }
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_messages?.join(" ") || "Gagal membuat pembayaran Midtrans.");
  order.paymentUrl = payload.redirect_url;
  order.paymentProvider = "midtrans";
  return storage.updateOrder(order);
}

async function markOrderPaid(orderId, paymentProvider = "gateway") {
  const order = await storage.getOrder(orderId);
  if (!order) return null;
  if (order.status === "paid") return order;
  order.status = "paid";
  order.paidAt = new Date().toISOString();
  order.paymentProvider = paymentProvider;
  order.token = makeToken();
  order.tokenSentAt = new Date().toISOString();
  const updated = await storage.updateOrder(order);
  if (updated.userId) await storage.setUserPremium(updated.userId, true);
  await sendPremiumEmail(updated, updated.token);
  return updated;
}

function buildFallbackQuestions(meta) {
  const topics = meta.topic
    ? String(meta.topic).split(",").map((item) => item.trim()).filter(Boolean)
    : materialBank[meta.subject] || materialBank.default;
  return Array.from({ length: meta.count }, (_, index) => {
    const topic = topics[index % topics.length];
    const answerIndex = index % 4;
    const correct = `menerapkan konsep ${topic} sesuai konteks soal dan data yang tersedia`;
    const options = [
      correct,
      "menghafal istilah tanpa memahami konteks",
      "mengabaikan informasi penting pada soal",
      "memilih jawaban berdasarkan tebakan"
    ];
    options.splice(answerIndex, 0, options.shift());
    return {
      number: index + 1,
      stem: `Pada materi ${topic}, pernyataan yang paling tepat untuk kelas ${meta.grade} ${meta.level} adalah ...`,
      topic,
      difficulty: meta.difficulty === "Campuran" ? ["Mudah", "Sedang", "Sulit"][index % 3] : meta.difficulty,
      options,
      answer: String.fromCharCode(65 + answerIndex),
      explanation: `Jawaban benar karena menerapkan ${topic} sesuai ${meta.curriculum}.`
    };
  });
}

async function generateWithOpenAI(meta) {
  if (!process.env.OPENAI_API_KEY) return buildFallbackQuestions(meta);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content: "Buat soal pilihan ganda berbahasa Indonesia sesuai kurikulum Indonesia. Output harus JSON valid saja."
        },
        {
          role: "user",
          content: JSON.stringify(meta)
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "question_set",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["questions"],
            properties: {
              questions: {
                type: "array",
                minItems: meta.count,
                maxItems: meta.count,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["number", "stem", "topic", "difficulty", "options", "answer", "explanation"],
                  properties: {
                    number: { type: "integer" },
                    stem: { type: "string" },
                    topic: { type: "string" },
                    difficulty: { type: "string" },
                    options: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
                    answer: { type: "string", enum: ["A", "B", "C", "D"] },
                    explanation: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    })
  });
  if (!response.ok) return buildFallbackQuestions(meta);
  const payload = await response.json();
  const text = payload.output_text || payload.output?.flatMap((item) => item.content || []).find((item) => item.text)?.text;
  const parsed = JSON.parse(text);
  return parsed.questions;
}

function verifyMidtransSignature(body) {
  if (!process.env.PAYMENT_SERVER_KEY || !body.signature_key) return true;
  const raw = `${body.order_id}${body.status_code}${body.gross_amount}${process.env.PAYMENT_SERVER_KEY}`;
  const expected = crypto.createHash("sha512").update(raw).digest("hex");
  return expected === body.signature_key;
}

function normalizePaymentWebhook(body, headers) {
  if (body.order_id && body.transaction_status) {
    const paid = ["settlement", "capture"].includes(String(body.transaction_status).toLowerCase());
    return { provider: "midtrans", orderId: body.order_id, paid };
  }
  if (body.external_id && body.status) {
    if (process.env.XENDIT_CALLBACK_TOKEN && headers["x-callback-token"] !== process.env.XENDIT_CALLBACK_TOKEN) {
      throw new Error("Webhook Xendit tidak valid.");
    }
    return { provider: "xendit", orderId: body.external_id, paid: String(body.status).toUpperCase() === "PAID" };
  }
  return { provider: body.provider || "gateway", orderId: body.orderId, paid: String(body.status).toLowerCase() === "paid" };
}

function isAdminRequest(req) {
  return Boolean(ADMIN_SECRET) && req.headers["x-admin-secret"] === ADMIN_SECRET;
}

function sanitizeOrder(order, includeToken = false) {
  return {
    id: order.id,
    email: order.email,
    amount: order.amount,
    currency: order.currency,
    method: order.method,
    status: order.status,
    paymentUrl: order.paymentUrl || null,
    token: includeToken ? order.token || null : undefined,
    tokenSentAt: order.tokenSentAt || null,
    paidAt: order.paidAt || null,
    createdAt: order.createdAt || null
  };
}

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/config") {
    sendJson(res, 200, {
      appName: "BankSoal Pro",
      amount: PAYMENT_AMOUNT,
      currency: "IDR",
      receiverName: RECEIVER_NAME,
      receiverNumber: RECEIVER_NUMBER,
      allowPaymentSimulation: !isProduction
    });
    return true;
  }

  if (req.method === "GET" && pathname === "/api/admin/orders") {
    if (!isAdminRequest(req)) return sendJson(res, 401, { error: "Admin secret tidak valid." });
    const orders = await storage.listOrders(100);
    sendJson(res, 200, { orders: orders.map((order) => sanitizeOrder(order, true)) });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/admin/mark-paid") {
    if (!isAdminRequest(req)) return sendJson(res, 401, { error: "Admin secret tidak valid." });
    const body = await readBody(req);
    const order = await markOrderPaid(String(body.orderId || ""), "manual-admin");
    sendJson(res, order ? 200 : 404, order ? { ok: true, order: sanitizeOrder(order, true) } : { error: "Order tidak ditemukan." });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/register") {
    const body = await readBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!isEmail(email) || password.length < 8) return sendJson(res, 400, { error: "Email valid dan password minimal 8 karakter." });
    if (await storage.getUserByEmail(email)) return sendJson(res, 409, { error: "Email sudah terdaftar." });
    const user = await storage.createUser({ id: makeId("usr"), email, passwordHash: hashPassword(password), premium: false, createdAt: new Date().toISOString() });
    await createSession(res, user);
    sendJson(res, 201, { user: { id: user.id, email: user.email, premium: user.premium } });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/login") {
    const body = await readBody(req);
    const user = await storage.getUserByEmail(String(body.email || "").trim().toLowerCase());
    if (!user || !verifyPassword(String(body.password || ""), user.passwordHash)) return sendJson(res, 401, { error: "Email atau password salah." });
    await createSession(res, user);
    sendJson(res, 200, { user: { id: user.id, email: user.email, premium: user.premium } });
    return true;
  }

  if (req.method === "GET" && pathname === "/api/me") {
    const user = await getCurrentUser(req);
    sendJson(res, 200, { user: user ? { id: user.id, email: user.email, premium: user.premium } : null });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/create-order") {
    const body = await readBody(req);
    const currentUser = await getCurrentUser(req);
    const email = String(body.email || currentUser?.email || "").trim().toLowerCase();
    const method = String(body.method || "QRIS").trim();
    if (!isEmail(email)) return sendJson(res, 400, { error: "Email tidak valid." });
    let order = await storage.createOrder({
      id: makeOrderId(),
      userId: currentUser?.id || null,
      email,
      amount: PAYMENT_AMOUNT,
      currency: "IDR",
      method,
      receiverName: RECEIVER_NAME,
      receiverNumber: RECEIVER_NUMBER,
      status: "pending",
      createdAt: new Date().toISOString()
    });
    order = await createMidtransPayment(order);
    sendJson(res, 201, { order });
    return true;
  }

  if (req.method === "GET" && pathname.startsWith("/api/order/")) {
    const order = await storage.getOrder(decodeURIComponent(pathname.replace("/api/order/", "")));
    if (!order) return sendJson(res, 404, { error: "Order tidak ditemukan." });
    sendJson(res, 200, { order: { id: order.id, email: order.email, amount: order.amount, method: order.method, status: order.status, paymentUrl: order.paymentUrl || null, tokenSentAt: order.tokenSentAt || null } });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/redeem-token") {
    const body = await readBody(req);
    const order = await storage.getOrderByToken(String(body.token || "").trim().toUpperCase());
    if (!order) return sendJson(res, 400, { error: "Token tidak valid atau belum lunas." });
    const user = await getCurrentUser(req);
    if (user) await storage.setUserPremium(user.id, true);
    sendJson(res, 200, { ok: true });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/generate") {
    const body = await readBody(req);
    const user = await getCurrentUser(req);
    const anonId = getAnonId(req, res);
    const meta = {
      level: String(body.level || "SD"),
      grade: String(body.grade || "1"),
      subject: String(body.subject || "Matematika"),
      count: Math.max(1, Math.min(100, Number(body.count || 10))),
      curriculum: String(body.curriculum || "Kurikulum Merdeka 2024"),
      difficulty: String(body.difficulty || "Campuran"),
      topic: String(body.topic || ""),
      includeAnswerKey: body.includeAnswerKey !== false
    };
    const weekKey = getFreePeriodKey();
    if (!user?.premium) {
      const used = await storage.countGenerations({ userId: user?.id || null, anonId, weekKey });
      if (used >= FREE_LIMIT) return sendJson(res, 402, { error: "Kuota gratis tahun ini sudah habis. Silakan aktifkan premium." });
    }
    const questions = await generateWithOpenAI(meta);
    await storage.createGeneration({ id: makeId("gen"), userId: user?.id || null, anonId, weekKey, level: meta.level, grade: meta.grade, subject: meta.subject, count: meta.count, createdAt: new Date().toISOString() });
    sendJson(res, 200, { meta, questions, premium: Boolean(user?.premium) });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/payment-webhook") {
    const body = await readBody(req);
    if (body.order_id && !verifyMidtransSignature(body)) return sendJson(res, 403, { error: "Signature webhook tidak valid." });
    const event = normalizePaymentWebhook(body, req.headers);
    if (!event.paid) return sendJson(res, 200, { ok: true, ignored: true });
    const order = await markOrderPaid(event.orderId, event.provider);
    sendJson(res, order ? 200 : 404, order ? { ok: true } : { error: "Order tidak ditemukan." });
    return true;
  }

  if (req.method === "POST" && pathname === "/api/dev/mark-paid") {
    if (isProduction) return sendJson(res, 403, { error: "Simulasi pembayaran nonaktif di production." });
    const body = await readBody(req);
    const order = await markOrderPaid(String(body.orderId || ""), "simulasi-lokal");
    sendJson(res, order ? 200 : 404, order ? { ok: true, token: order.token } : { error: "Order tidak ditemukan." });
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  if (urlPath.startsWith("/api/")) {
    try {
      const handled = await handleApi(req, res, urlPath);
      if (!handled) sendJson(res, 404, { error: "Endpoint tidak ditemukan." });
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: error.message || "Server error." });
    }
    return;
  }

  const normalizedPath = path.normalize(urlPath);
  const safePath = normalizedPath.replace(/^([/\\])+/, "").replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, safePath === "" ? "index.html" : safePath);
  if (!filePath.startsWith(root) || safePath.startsWith("payment-data") || safePath === ".env") {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

storage.init().then(() => {
  const host = isProduction ? "0.0.0.0" : "127.0.0.1";
  server.listen(port, host, () => {
    console.log(`BankSoal Pro running at http://${host}:${port}`);
  });
});
