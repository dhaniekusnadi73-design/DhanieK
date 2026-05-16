const els = {
  form: document.querySelector("#adminForm"),
  secret: document.querySelector("#adminSecret"),
  orderId: document.querySelector("#adminOrderId"),
  message: document.querySelector("#adminMessage"),
  loadOrdersBtn: document.querySelector("#loadOrdersBtn"),
  orders: document.querySelector("#adminOrders")
};

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": els.secret.value,
      ...(options.headers || {})
    }
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Permintaan gagal.");
  return payload;
}

function renderOrders(orders) {
  if (!orders.length) {
    els.orders.className = "empty-state";
    els.orders.textContent = "Belum ada order.";
    return;
  }
  els.orders.className = "paper";
  els.orders.innerHTML = orders.map((order) => `
    <section class="question">
      <p><strong>${escapeHtml(order.id)}</strong> - ${escapeHtml(order.status)}</p>
      <div class="options">
        <div>Email: ${escapeHtml(order.email)}</div>
        <div>Metode: ${escapeHtml(order.method)}</div>
        <div>Nominal: Rp${Number(order.amount).toLocaleString("id-ID")}</div>
        <div>Token: ${escapeHtml(order.token || "-")}</div>
      </div>
    </section>
  `).join("");
}

async function loadOrders() {
  els.message.textContent = "Memuat order...";
  try {
    const payload = await api("/api/admin/orders");
    renderOrders(payload.orders);
    els.message.textContent = "Order terbaru dimuat.";
    els.message.className = "message success";
  } catch (error) {
    els.message.textContent = error.message;
    els.message.className = "message error";
  }
}

els.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  els.message.textContent = "Mengonfirmasi pembayaran...";
  try {
    const payload = await api("/api/admin/mark-paid", {
      method: "POST",
      body: JSON.stringify({ orderId: els.orderId.value })
    });
    els.message.textContent = `Order lunas. Token: ${payload.order.token}`;
    els.message.className = "message success";
    await loadOrders();
  } catch (error) {
    els.message.textContent = error.message;
    els.message.className = "message error";
  }
});

els.loadOrdersBtn.addEventListener("click", loadOrders);
