let currentOrder = null;
let editItems = []; // { itemCode, itemName, unitPrice, quantity }
let menuItems = [];

const orderIdInput = document.getElementById("orderIdInput");
const lookupBtn = document.getElementById("lookupBtn");
const lookupMsg = document.getElementById("lookupMsg");
const orderDetail = document.getElementById("orderDetail");
const orderIdLabel = document.getElementById("orderIdLabel");
const orderStallLabel = document.getElementById("orderStallLabel");
const orderDateLabel = document.getElementById("orderDateLabel");
const orderPmtLabel = document.getElementById("orderPmtLabel");
const editItemsList = document.getElementById("editItemsList");
const addItemSelect = document.getElementById("addItemSelect");
const addItemBtn = document.getElementById("addItemBtn");
const editTotal = document.getElementById("editTotal");
const saveBtn = document.getElementById("saveBtn");
const cancelOrderBtn = document.getElementById("cancelOrderBtn");
const actionMsg = document.getElementById("actionMsg");

// ---------- Load menu for the "add item" dropdown ----------
async function loadMenu() {
  try {
    const res = await fetch("/api/menu");
    const data = await res.json();
    menuItems = data.items || [];
  } catch (err) {
    console.error(err);
  }
}

function populateAddItemSelect(stallId) {
  const stallItems = menuItems.filter((m) => m.StallID === stallId);
  addItemSelect.innerHTML = stallItems
    .map((m) => `<option value="${m.ItemCode}">${escapeHtml(m.ItemDesc)} — $${Number(m.ItemPrice).toFixed(2)}</option>`)
    .join("");
}

// ---------- Look up an order ----------
lookupBtn.addEventListener("click", async () => {
  const orderId = orderIdInput.value.trim().toUpperCase();
  lookupMsg.textContent = "";
  lookupMsg.className = "lookup-msg";

  if (!orderId) {
    lookupMsg.textContent = "Enter an order ID.";
    lookupMsg.className = "lookup-msg error";
    return;
  }

  try {
    const res = await fetch(`/api/order/byId/${orderId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Order not found");

    currentOrder = data.order;
    editItems = currentOrder.items.map((i) => ({
      itemCode: i.itemCode,
      itemName: i.itemName,
      unitPrice: i.unitPrice,
      quantity: i.quantity
    }));

    orderIdLabel.textContent = currentOrder.orderId;
    orderStallLabel.textContent = currentOrder.stallName || "";
    orderDateLabel.textContent = new Date(currentOrder.orderDate).toLocaleString();
    orderPmtLabel.textContent = currentOrder.paymentMethod;

    populateAddItemSelect(currentOrder.stallId);
    renderEditItems();
    orderDetail.classList.remove("hidden");
  } catch (err) {
    orderDetail.classList.add("hidden");
    lookupMsg.textContent = err.message;
    lookupMsg.className = "lookup-msg error";
  }
});

// ---------- Render editable item list ----------
function renderEditItems() {
  editItemsList.innerHTML = "";
  let total = 0;

  editItems.forEach((item, index) => {
    total += item.unitPrice * item.quantity;
    const li = document.createElement("li");
    li.className = "edit-item";
    li.innerHTML = `
      <span class="ei-name">${escapeHtml(item.itemName)}</span>
      <input type="number" class="ei-qty" min="1" value="${item.quantity}" />
      <button class="ei-remove" type="button" aria-label="Remove item">✕</button>
    `;
    li.querySelector(".ei-qty").addEventListener("change", (e) => {
      const qty = parseInt(e.target.value, 10);
      editItems[index].quantity = qty > 0 ? qty : 1;
      renderEditItems();
    });
    li.querySelector(".ei-remove").addEventListener("click", () => {
      editItems.splice(index, 1);
      renderEditItems();
    });
    editItemsList.appendChild(li);
  });

  editTotal.textContent = `$${total.toFixed(2)}`;
}

// ---------- Add a new item to the order ----------
addItemBtn.addEventListener("click", () => {
  const itemCode = addItemSelect.value;
  if (!itemCode) return;
  const menuItem = menuItems.find((m) => m.ItemCode === itemCode);
  if (!menuItem) return;

  const existing = editItems.find((i) => i.itemCode === itemCode);
  if (existing) {
    existing.quantity += 1;
  } else {
    editItems.push({
      itemCode: menuItem.ItemCode,
      itemName: menuItem.ItemDesc,
      unitPrice: Number(menuItem.ItemPrice),
      quantity: 1
    });
  }
  renderEditItems();
});

// ---------- Save changes ----------
saveBtn.addEventListener("click", async () => {
  if (!currentOrder) return;
  if (editItems.length === 0) {
    actionMsg.textContent = "An order must have at least one item. Use Cancel Order to remove it entirely.";
    actionMsg.className = "action-msg error";
    return;
  }

  actionMsg.textContent = "";
  actionMsg.className = "action-msg";
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    const res = await fetch(`/api/order/update/${currentOrder.orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: editItems.map((i) => ({ itemCode: i.itemCode, quantity: i.quantity }))
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Update failed");

    actionMsg.textContent = "Order updated successfully.";
    actionMsg.className = "action-msg success";
  } catch (err) {
    actionMsg.textContent = err.message;
    actionMsg.className = "action-msg error";
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
  }
});

// ---------- Cancel order ----------
cancelOrderBtn.addEventListener("click", async () => {
  if (!currentOrder) return;
  const confirmed = confirm(`Cancel order ${currentOrder.orderId}? This cannot be undone.`);
  if (!confirmed) return;

  actionMsg.textContent = "";
  actionMsg.className = "action-msg";
  cancelOrderBtn.disabled = true;
  cancelOrderBtn.textContent = "Cancelling…";

  try {
    const res = await fetch(`/api/order/cancel/${currentOrder.orderId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Cancel failed");

    actionMsg.textContent = `Order ${currentOrder.orderId} has been cancelled.`;
    actionMsg.className = "action-msg success";
    orderDetail.classList.add("hidden");
    orderIdInput.value = "";
    currentOrder = null;
  } catch (err) {
    actionMsg.textContent = err.message;
    actionMsg.className = "action-msg error";
  } finally {
    cancelOrderBtn.disabled = false;
    cancelOrderBtn.textContent = "Cancel Order";
  }
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

loadMenu();
