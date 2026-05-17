const crypto = require("crypto");
const { createStorage } = require("../../storage");

const storage = createStorage(process.cwd());
let storageReady = null;

const FREE_LIMIT = 1;
const SESSION_DAYS = 30;
const PAYMENT_AMOUNT = 15000;
const RECEIVER_NAME = (process.env.PAYMENT_RECEIVER_NAME || "Dhanie Kusnadi").trim();
const RECEIVER_NUMBER = (process.env.PAYMENT_RECEIVER_NUMBER || "085271550657").trim();
const ADMIN_SECRET = (process.env.ADMIN_SECRET || "").trim();
const PAYMENT_PROVIDER = (process.env.PAYMENT_PROVIDER || "manual").trim().toLowerCase();
const PAYMENT_SERVER_KEY = (process.env.PAYMENT_SERVER_KEY || "").trim();
const APP_URL = (process.env.APP_URL || "").trim();

function isMidtransProductionMode() {
  if (PAYMENT_SERVER_KEY.startsWith("SB-Mid-server-")) return false;
  if (PAYMENT_SERVER_KEY.startsWith("Mid-server-")) return true;
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

function initStorage() {
  if (!storageReady) storageReady = storage.init();
  return storageReady;
}

function json(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
    body: JSON.stringify(body)
  };
}

function parseBody(event) {
  if (!event.body) return {};
  return JSON.parse(event.body);
}

function parseCookies(header = "") {
  return Object.fromEntries(String(header).split(";").filter(Boolean).map((item) => {
    const [key, ...rest] = item.trim().split("=");
    return [key, decodeURIComponent(rest.join("="))];
  }));
}

function cookie(name, value, maxAgeSeconds) {
  return [`${name}=${encodeURIComponent(value)}`, "Path=/", `Max-Age=${maxAgeSeconds}`, "HttpOnly", "SameSite=Lax", "Secure"].join("; ");
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

async function getCurrentUser(event) {
  const sessionId = parseCookies(event.headers.cookie).banksoal_session;
  if (!sessionId) return null;
  const session = await storage.getSession(sessionId);
  if (!session) return null;
  return storage.getUserById(session.userId);
}

async function createSession(user) {
  const session = {
    id: makeId("sess"),
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86400000).toISOString(),
    createdAt: new Date().toISOString()
  };
  await storage.createSession(session);
  return cookie("banksoal_session", session.id, SESSION_DAYS * 86400);
}

async function sendPremiumEmail(order, token) {
  const subject = "Token Premium BankSoal Pro";
  const body = `Halo, pembayaran order ${order.id} sudah diterima. Token premium Anda: ${token}`;
  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
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
  if (PAYMENT_PROVIDER !== "midtrans" || !PAYMENT_SERVER_KEY) return order;
  const isSandbox = !isMidtransProductionMode();
  const baseUrl = isSandbox ? "https://app.sandbox.midtrans.com" : "https://app.midtrans.com";
  const auth = Buffer.from(`${PAYMENT_SERVER_KEY}:`).toString("base64");
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
      callbacks: { finish: `${APP_URL}/` },
      gopay: { enable_callback: true, callback_url: `${APP_URL}/api/payment-webhook` }
    })
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error_messages?.join(" ") || "Gagal membuat pembayaran Midtrans.");
  order.paymentUrl = payload.redirect_url;
  order.paymentProvider = "midtrans";
  return storage.updateOrder(order);
}

async function markOrderPaid(orderId, paymentProvider = "manual-admin") {
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

function buildFallbackQuestions(meta) {
  const topics = meta.topic ? String(meta.topic).split(",").map((item) => item.trim()).filter(Boolean) : ["konsep utama", "penerapan sehari-hari", "analisis sederhana"];
  return Array.from({ length: meta.count }, (_, index) => {
    const topic = topics[index % topics.length];
    const answerIndex = index % 4;
    const correct = `menerapkan konsep ${topic} sesuai konteks soal dan data yang tersedia`;
    const options = [correct, "menghafal istilah tanpa memahami konteks", "mengabaikan informasi penting pada soal", "memilih jawaban berdasarkan tebakan"];
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

function isAdmin(event) {
  return Boolean(ADMIN_SECRET) && event.headers["x-admin-secret"] === ADMIN_SECRET;
}

function verifyMidtransSignature(body) {
  if (!PAYMENT_SERVER_KEY || !body.signature_key) return true;
  const raw = `${body.order_id}${body.status_code}${body.gross_amount}${PAYMENT_SERVER_KEY}`;
  const expected = crypto.createHash("sha512").update(raw).digest("hex");
  return expected === body.signature_key;
}

function apiPath(event) {
  const raw = event.path || "";
  if (raw.startsWith("/api/")) return raw;
  return `/api/${raw.split("/.netlify/functions/api/")[1] || ""}`;
}

exports.handler = async (event) => {
  try {
    await initStorage();
    const path = apiPath(event);
    const method = event.httpMethod;
    const body = parseBody(event);

    if (method === "GET" && path === "/api/config") {
      return json(200, {
        appName: "BankSoal Pro",
        amount: PAYMENT_AMOUNT,
        currency: "IDR",
        receiverName: RECEIVER_NAME,
        receiverNumber: RECEIVER_NUMBER,
        paymentProvider: PAYMENT_PROVIDER,
        midtransConfigured: Boolean(PAYMENT_SERVER_KEY),
        midtransMode: isMidtransProductionMode() ? "production" : "sandbox",
        allowPaymentSimulation: false
      });
    }

    if (method === "POST" && path === "/api/register") {
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!isEmail(email) || password.length < 8) return json(400, { error: "Email valid dan password minimal 8 karakter." });
      if (await storage.getUserByEmail(email)) return json(409, { error: "Email sudah terdaftar." });
      const user = await storage.createUser({ id: makeId("usr"), email, passwordHash: hashPassword(password), premium: false, createdAt: new Date().toISOString() });
      return json(201, { user: { id: user.id, email: user.email, premium: user.premium } }, { "Set-Cookie": await createSession(user) });
    }

    if (method === "POST" && path === "/api/login") {
      const user = await storage.getUserByEmail(String(body.email || "").trim().toLowerCase());
      if (!user || !verifyPassword(String(body.password || ""), user.passwordHash)) return json(401, { error: "Email atau password salah." });
      return json(200, { user: { id: user.id, email: user.email, premium: user.premium } }, { "Set-Cookie": await createSession(user) });
    }

    if (method === "GET" && path === "/api/me") {
      const user = await getCurrentUser(event);
      return json(200, { user: user ? { id: user.id, email: user.email, premium: user.premium } : null });
    }

    if (method === "POST" && path === "/api/create-order") {
      const user = await getCurrentUser(event);
      const email = String(body.email || user?.email || "").trim().toLowerCase();
      if (!isEmail(email)) return json(400, { error: "Email tidak valid." });
      let order = await storage.createOrder({
        id: makeOrderId(),
        userId: user?.id || null,
        email,
        amount: PAYMENT_AMOUNT,
        currency: "IDR",
        method: String(body.method || "DANA"),
        receiverName: RECEIVER_NAME,
        receiverNumber: RECEIVER_NUMBER,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      order = await createMidtransPayment(order);
      return json(201, { order });
    }

    if (method === "GET" && path.startsWith("/api/order/")) {
      const order = await storage.getOrder(decodeURIComponent(path.replace("/api/order/", "")));
      return order ? json(200, { order: sanitizeOrder(order) }) : json(404, { error: "Order tidak ditemukan." });
    }

    if (method === "POST" && path === "/api/redeem-token") {
      const order = await storage.getOrderByToken(String(body.token || "").trim().toUpperCase());
      if (!order) return json(400, { error: "Token tidak valid atau belum lunas." });
      const user = await getCurrentUser(event);
      if (user) await storage.setUserPremium(user.id, true);
      return json(200, { ok: true });
    }

    if (method === "POST" && path === "/api/generate") {
      const user = await getCurrentUser(event);
      const cookies = parseCookies(event.headers.cookie);
      const anonId = cookies.banksoal_anon || makeId("anon");
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
        if (used >= FREE_LIMIT) return json(402, { error: "Kuota gratis tahun ini sudah habis. Silakan aktifkan premium." });
      }
      const questions = buildFallbackQuestions(meta);
      await storage.createGeneration({ id: makeId("gen"), userId: user?.id || null, anonId, weekKey, level: meta.level, grade: meta.grade, subject: meta.subject, count: meta.count, createdAt: new Date().toISOString() });
      return json(200, { meta, questions, premium: Boolean(user?.premium) }, { "Set-Cookie": cookie("banksoal_anon", anonId, 60 * 60 * 24 * 365) });
    }

    if (method === "GET" && path === "/api/admin/orders") {
      if (!isAdmin(event)) return json(401, { error: "Admin secret tidak valid." });
      const orders = await storage.listOrders(100);
      return json(200, { orders: orders.map((order) => sanitizeOrder(order, true)) });
    }

    if (method === "POST" && path === "/api/admin/mark-paid") {
      if (!isAdmin(event)) return json(401, { error: "Admin secret tidak valid." });
      const order = await markOrderPaid(String(body.orderId || ""), "manual-admin");
      return order ? json(200, { ok: true, order: sanitizeOrder(order, true) }) : json(404, { error: "Order tidak ditemukan." });
    }

    if (method === "POST" && path === "/api/payment-webhook") {
      if (body.order_id && !verifyMidtransSignature(body)) return json(403, { error: "Signature webhook tidak valid." });
      const orderId = String(body.orderId || body.order_id || body.external_id || "");
      const paid = ["paid", "settlement", "capture", "PAID"].includes(String(body.status || body.transaction_status));
      if (!paid) return json(200, { ok: true, ignored: true });
      const order = await markOrderPaid(orderId, body.provider || "gateway");
      return order ? json(200, { ok: true }) : json(404, { error: "Order tidak ditemukan." });
    }

    return json(404, { error: "Endpoint tidak ditemukan." });
  } catch (error) {
    console.error(error);
    return json(500, { error: error.message || "Server error." });
  }
};
