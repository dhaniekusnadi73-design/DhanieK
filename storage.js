const fs = require("fs");
const path = require("path");

class JsonStorage {
  constructor(root) {
    this.dataDir = path.join(root, "payment-data");
    this.files = {
      users: path.join(this.dataDir, "users.json"),
      sessions: path.join(this.dataDir, "sessions.json"),
      orders: path.join(this.dataDir, "orders.json"),
      generations: path.join(this.dataDir, "generations.json"),
      outbox: path.join(this.dataDir, "email-outbox.json")
    };
  }

  async init() {
    fs.mkdirSync(this.dataDir, { recursive: true });
    for (const filePath of Object.values(this.files)) {
      if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]");
    }
  }

  read(name) {
    try {
      return JSON.parse(fs.readFileSync(this.files[name], "utf8"));
    } catch {
      return [];
    }
  }

  write(name, value) {
    fs.writeFileSync(this.files[name], JSON.stringify(value, null, 2));
  }

  async getUserByEmail(email) {
    return this.read("users").find((user) => user.email === email) || null;
  }

  async getUserById(id) {
    return this.read("users").find((user) => user.id === id) || null;
  }

  async createUser(user) {
    const users = this.read("users");
    users.push(user);
    this.write("users", users);
    return user;
  }

  async setUserPremium(userId, premium) {
    const users = this.read("users");
    const user = users.find((item) => item.id === userId);
    if (user) user.premium = premium;
    this.write("users", users);
    return user || null;
  }

  async createSession(session) {
    const sessions = this.read("sessions");
    sessions.push(session);
    this.write("sessions", sessions);
    return session;
  }

  async getSession(id) {
    return this.read("sessions").find((session) => session.id === id && new Date(session.expiresAt) > new Date()) || null;
  }

  async createOrder(order) {
    const orders = this.read("orders");
    orders.push(order);
    this.write("orders", orders);
    return order;
  }

  async getOrder(id) {
    return this.read("orders").find((order) => order.id === id) || null;
  }

  async listOrders(limit = 50) {
    return this.read("orders")
      .slice()
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, limit);
  }

  async getOrderByToken(token) {
    return this.read("orders").find((order) => order.token === token && order.status === "paid") || null;
  }

  async updateOrder(order) {
    const orders = this.read("orders");
    const index = orders.findIndex((item) => item.id === order.id);
    if (index >= 0) orders[index] = order;
    this.write("orders", orders);
    return order;
  }

  async recordEmail(email) {
    const outbox = this.read("outbox");
    outbox.push(email);
    this.write("outbox", outbox);
  }

  async countGenerations({ userId, anonId, weekKey }) {
    return this.read("generations").filter((item) => {
      if (item.weekKey !== weekKey) return false;
      return userId ? item.userId === userId : item.anonId === anonId;
    }).length;
  }

  async createGeneration(generation) {
    const generations = this.read("generations");
    generations.push(generation);
    this.write("generations", generations);
    return generation;
  }
}

class PostgresStorage {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.pool = null;
  }

  async init() {
    const { Pool } = await import("pg");
    this.pool = new Pool({ connectionString: this.connectionString, ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false } });
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(73520420260516)");
      await client.query(schema);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async one(query, params = []) {
    const result = await this.pool.query(query, params);
    return result.rows[0] || null;
  }

  async getUserByEmail(email) {
    return this.one("SELECT id, email, password_hash AS \"passwordHash\", premium, created_at AS \"createdAt\" FROM users WHERE email = $1", [email]);
  }

  async getUserById(id) {
    return this.one("SELECT id, email, password_hash AS \"passwordHash\", premium, created_at AS \"createdAt\" FROM users WHERE id = $1", [id]);
  }

  async createUser(user) {
    return this.one(
      "INSERT INTO users (id, email, password_hash, premium, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, password_hash AS \"passwordHash\", premium, created_at AS \"createdAt\"",
      [user.id, user.email, user.passwordHash, user.premium, user.createdAt]
    );
  }

  async setUserPremium(userId, premium) {
    return this.one("UPDATE users SET premium = $2 WHERE id = $1 RETURNING id, email, password_hash AS \"passwordHash\", premium", [userId, premium]);
  }

  async createSession(session) {
    return this.one(
      "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES ($1, $2, $3, $4) RETURNING id, user_id AS \"userId\", expires_at AS \"expiresAt\"",
      [session.id, session.userId, session.expiresAt, session.createdAt]
    );
  }

  async getSession(id) {
    return this.one("SELECT id, user_id AS \"userId\", expires_at AS \"expiresAt\" FROM sessions WHERE id = $1 AND expires_at > NOW()", [id]);
  }

  async createOrder(order) {
    return this.one(
      `INSERT INTO orders (id, user_id, email, amount, currency, method, receiver_name, receiver_number, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, user_id AS "userId", email, amount, currency, method, receiver_name AS "receiverName", receiver_number AS "receiverNumber", status, created_at AS "createdAt"`,
      [order.id, order.userId, order.email, order.amount, order.currency, order.method, order.receiverName, order.receiverNumber, order.status, order.createdAt]
    );
  }

  async getOrder(id) {
    return this.one(
      `SELECT id, user_id AS "userId", email, amount, currency, method, receiver_name AS "receiverName",
       receiver_number AS "receiverNumber", status, token, payment_provider AS "paymentProvider",
       paid_at AS "paidAt", token_sent_at AS "tokenSentAt", created_at AS "createdAt" FROM orders WHERE id = $1`,
      [id]
    );
  }

  async listOrders(limit = 50) {
    const result = await this.pool.query(
      `SELECT id, user_id AS "userId", email, amount, currency, method, receiver_name AS "receiverName",
       receiver_number AS "receiverNumber", status, token, payment_provider AS "paymentProvider",
       paid_at AS "paidAt", token_sent_at AS "tokenSentAt", created_at AS "createdAt"
       FROM orders ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getOrderByToken(token) {
    return this.one(`SELECT id, user_id AS "userId", email, status, token FROM orders WHERE token = $1 AND status = 'paid'`, [token]);
  }

  async updateOrder(order) {
    return this.one(
      `UPDATE orders SET status=$2, token=$3, payment_provider=$4, paid_at=$5, token_sent_at=$6
       WHERE id=$1 RETURNING id, user_id AS "userId", email, amount, currency, method, status, token, token_sent_at AS "tokenSentAt"`,
      [order.id, order.status, order.token || null, order.paymentProvider || null, order.paidAt || null, order.tokenSentAt || null]
    );
  }

  async recordEmail(email) {
    console.log(`[EMAIL OUTBOX] To: ${email.to} | ${email.subject}`);
  }

  async countGenerations({ userId, anonId, weekKey }) {
    const result = userId
      ? await this.pool.query("SELECT COUNT(*)::int AS count FROM generations WHERE user_id = $1 AND week_key = $2", [userId, weekKey])
      : await this.pool.query("SELECT COUNT(*)::int AS count FROM generations WHERE anon_id = $1 AND week_key = $2", [anonId, weekKey]);
    return result.rows[0].count;
  }

  async createGeneration(generation) {
    await this.pool.query(
      "INSERT INTO generations (id, user_id, anon_id, week_key, level, grade, subject, count, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [generation.id, generation.userId, generation.anonId, generation.weekKey, generation.level, generation.grade, generation.subject, generation.count, generation.createdAt]
    );
    return generation;
  }
}

function createStorage(root) {
  return process.env.DATABASE_URL ? new PostgresStorage(process.env.DATABASE_URL) : new JsonStorage(root);
}

module.exports = { createStorage };
