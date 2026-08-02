let currentCustomerId = null;
let menuItems = [];
let cart = []; // { itemCode, itemName, unitPrice, quantity }
let paymentMethod = "PayNow";
let ticketCounter = Math.floor(100 + Math.random() * 900);

// ---------- Elements ----------
const whoBtn = document.getElementById("whoBtn");
const menuGroupsEl = document.getElementById("menuGroups");
const cartListEl = document.getElementById("cartList");
const cartTotalEl = document.getElementById("cartTotal");
const ticketNoEl = document.getElementById("ticketNo");
const placeOrderBtn = document.getElementById("placeOrderBtn");
const orderMsgEl = document.getElementById("orderMsg");
const historyListEl = document.getElementById("historyList");
const tabs = document.querySelectorAll(".tab");
const views = document.querySelectorAll(".view");
const payButtons = document.querySelectorAll(".pay-btn");

// ---------- Tabs ----------
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.view;
    views.forEach((v) => v.classList.remove("active"));
    document.getElementById(`view-${target}`).classList.add("active");
    if (target === "history") loadHistory();
  });
});

// ---------- Payment method ----------
payButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    payButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    paymentMethod = btn.dataset.method;
  });
});

// ---------- Who's ordering (guest vs logged-in customer) ----------
// Mirrors the same login pattern as dashboard.html: JWT in localStorage,
// userId/userType in sessionStorage after a successful login.
// Guests can still browse the menu - this only controls the pill in the
// top bar and whether currentCustomerId gets set.
async function initWho() {
  const jwtToken = localStorage.getItem("jwtToken");
  const userType = sessionStorage.getItem("userType");
  const userId = sessionStorage.getItem("userId");

  const isLoggedInCustomer = Boolean(jwtToken && userType === "Customer" && userId);

  if (!isLoggedInCustomer) {
    currentCustomerId = null;
    whoBtn.textContent = "Guest";
    whoBtn.addEventListener("click", () => {
      window.location.href = "/login";
    });
    return;
  }

  currentCustomerId = userId;
  whoBtn.textContent = "Loading...";

  whoBtn.addEventListener("click", () => {
    window.location.href = "/profile";
  });

  try {
    const res = await fetch(`/api/Customer/get-profile/${userId}`, {
      headers: { "Authorization": `Bearer ${jwtToken}` }
    });
    const data = await res.json();
    whoBtn.textContent = data.CustName || userId;
  } catch (err) {
    whoBtn.textContent = userId;
    console.error(err);
  }
}

// ---------- Load menu ----------
async function loadMenu() {
  try {
    const res = await fetch("/api/menu");
    const data = await res.json();
    menuItems = data.items || [];
    renderMenu();
  } catch (err) {
    menuGroupsEl.innerHTML = '<p class="history-empty">Could not load the menu. Is the server running?</p>';
    console.error(err);
  }
}

function renderMenu() {
  const byStall = {};
  menuItems.forEach((item) => {
    if (!byStall[item.StallID]) {
      byStall[item.StallID] = { name: item.StallName, items: [] };
    }
    byStall[item.StallID].items.push(item);
  });

  menuGroupsEl.innerHTML = "";
  Object.values(byStall).forEach((stall) => {
    const group = document.createElement("div");
    group.className = "stall-group";

    const heading = document.createElement("div");
    heading.className = "stall-heading";
    heading.innerHTML = `<h3>${escapeHtml(stall.name)}</h3>`;
    group.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "item-grid";

    stall.items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "menu-item";
      card.innerHTML = `
        <span class="category">${escapeHtml(item.ItemCategory)}</span>
        <span class="name">${escapeHtml(item.ItemDesc)}</span>
        <span class="price">$${Number(item.ItemPrice).toFixed(2)}</span>

        <div class="food-actions">
          <button class="add-btn" type="button">Add to chit</button>
          <button class="like-btn" type="button">♡ Like</button>
        </div>
      `;
      card.querySelector(".add-btn").addEventListener("click", () => addToCart(item));
      grid.appendChild(card);

      card.querySelector(".like-btn").addEventListener("click", () => {
        likeFood(item);
      });
    });

    group.appendChild(grid);
    menuGroupsEl.appendChild(group);
  });
}

// ---------- Cart ----------
function addToCart(item) {
  const existing = cart.find((c) => c.itemCode === item.ItemCode);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      stallId: item.StallID,
      itemCode: item.ItemCode,
      itemName: item.ItemDesc,
      unitPrice: Number(item.ItemPrice),
      quantity: 1
    });
    ticketNoEl.textContent = ticketCounter;
  }
  renderCart();
}

function changeQty(itemCode, delta) {
  const line = cart.find((c) => c.itemCode === itemCode);
  if (!line) return;
  line.quantity += delta;
  if (line.quantity <= 0) {
    cart = cart.filter((c) => c.itemCode !== itemCode);
  }
  renderCart();
}

function renderCart() {
  cartListEl.innerHTML = "";
  if (cart.length === 0) {
    cartListEl.innerHTML = '<li class="cart-empty">Your chit is empty. Tap items to add.</li>';
    placeOrderBtn.disabled = true;
    cartTotalEl.textContent = "$0.00";
    return;
  }

  let total = 0;
  cart.forEach((line) => {
    total += line.unitPrice * line.quantity;
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <span class="ci-name">${escapeHtml(line.itemName)}</span>
      <span class="ci-qty">
        <button class="qty-btn" type="button" aria-label="Remove one">−</button>
        <span>${line.quantity}</span>
        <button class="qty-btn" type="button" aria-label="Add one">+</button>
      </span>
    `;
    li.querySelectorAll(".qty-btn")[0].addEventListener("click", () => changeQty(line.itemCode, -1));
    li.querySelectorAll(".qty-btn")[1].addEventListener("click", () => changeQty(line.itemCode, 1));
    cartListEl.appendChild(li);
  });

  cartTotalEl.textContent = `$${total.toFixed(2)}`;
  placeOrderBtn.disabled = false;
}

// ---------- Place order (SHMS-7) ----------
placeOrderBtn.addEventListener("click", async () => {
  if (cart.length === 0) return;

  if (!currentCustomerId) {
    orderMsgEl.textContent = "Please log in to place an order.";
    orderMsgEl.className = "order-msg error";
    return;
  }

  const stallId = cart[0].stallId; // one order = one stall

  placeOrderBtn.disabled = true;
  placeOrderBtn.textContent = "Placing order…";
  orderMsgEl.textContent = "";
  orderMsgEl.className = "order-msg";

  try {
    const res = await fetch("/api/order/create", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
       },
      body: JSON.stringify({
        customerId: currentCustomerId,
        stallId,
        paymentMethod,
        items: cart.map((c) => ({ itemCode: c.itemCode, quantity: c.quantity }))
      })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Order failed");

    orderMsgEl.textContent = `Order #${data.order.orderId} placed — paid ${paymentMethod}.`;
    orderMsgEl.className = "order-msg success";
    cart = [];
    ticketCounter += 1;
    renderCart();
  } catch (err) {
    orderMsgEl.textContent = err.message;
    orderMsgEl.className = "order-msg error";
  } finally {
    placeOrderBtn.textContent = "Place Order";
    placeOrderBtn.disabled = cart.length === 0;
  }
});

// ---------- Order history (SHMS-9) ----------
async function loadHistory() {
  if (!currentCustomerId) {
    historyListEl.innerHTML = '<p class="history-empty">Log in to view your order history.</p>';
    return;
  }
  historyListEl.innerHTML = '<p class="history-empty">Loading…</p>';

  try {
    const res = await fetch(`/api/order/history/${currentCustomerId}`, {
      headers: {
        "Authorization": `Bearer ${jwtToken}`
      }
    });
    const data = await res.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      historyListEl.innerHTML = '<p class="history-empty">No past orders yet for this customer.</p>';
      return;
    }

    historyListEl.innerHTML = "";
    orders.forEach((order) => {
      const card = document.createElement("div");
      card.className = "history-card";
      const itemsHtml = order.items
        .map((i) => `<li>${i.quantity} × ${escapeHtml(i.itemName)}</li>`)
        .join("");
      card.innerHTML = `
        <div class="hc-top">
          <span class="hc-stall">${escapeHtml(order.stallName || "")}</span>
          <span class="hc-date">${new Date(order.orderDate).toLocaleString()}</span>
        </div>
        <span class="hc-status">${escapeHtml(order.paymentMethod)}</span>
        <ul class="hc-items">${itemsHtml}</ul>
        <div class="hc-total">$${Number(order.totalAmount).toFixed(2)}</div>
      `;
      historyListEl.appendChild(card);
    });
  } catch (err) {
    historyListEl.innerHTML = '<p class="history-empty">Could not load order history.</p>';
    console.error(err);
  }
}

// ---------- Utils ----------
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---------- Init ----------
(async function init() {
  await initWho();
  await loadMenu();
})();


// ---------- Like Food ----------
async function likeFood(item) {
  if (!currentCustomerId) {
    alert("Please log in to like a food item.");
    return;
  }

  const jwtToken = localStorage.getItem("jwtToken");

  try {
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwtToken}`
      },
      body: JSON.stringify({
        customerId: currentCustomerId,
        stallId: item.StallID,
        itemCode: item.ItemCode
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Unable to like food.");
    }

    alert("Food item liked!");

  } catch (err) {
    console.error("Like error:", err);
    alert(err.message);
  }
}