const stallIdInput = document.getElementById("stallId");
    const loadBtn = document.getElementById("loadBtn");
    const topMessage = document.getElementById("topMessage");
    const menuTable = document.getElementById("menuTable");
    const menuBody = document.getElementById("menuBody");
    const emptyNote = document.getElementById("emptyNote");
    const itemCount = document.getElementById("itemCount");
    const addCard = document.getElementById("addCard");
    const addForm = document.getElementById("addForm");
    const addMessage = document.getElementById("addMessage");
    const loginRequiredNotice = document.getElementById("loginRequiredNotice");

    let isLoggedIn = false;
    let ownsCurrentStall = false;

    // ---- Auth helpers ----
    function getToken() {
      return localStorage.getItem("jwtToken");
    }

    function authHeaders() {
      const token = getToken();
      return token ? { "Authorization": "Bearer " + token } : {};
    }

    function showBanner(el, text, type) {
      el.textContent = text;
      el.className = "banner show " + type;
    }

    function showBannerHTML(el, html, type) {
      el.innerHTML = html;
      el.className = "banner show " + type;
    }

    function clearBanner(el) {
      el.className = "banner";
    }

    function menuUrl(extra = "") {
      const stallId = stallIdInput.value.trim();
      return `/api/stall/${encodeURIComponent(stallId)}/menu${extra}`;
    }

    // ---- Check session status via the stored JWT ----
    async function checkSession() {
      try {
        const res = await fetch("/api/session", { headers: authHeaders() });
        const data = await res.json();
        isLoggedIn = !!data.loggedIn;
      } catch (err) {
        isLoggedIn = false;
      }
    }

    // ---- Check whether the logged-in user owns the currently selected stall ----
    async function checkOwnership() {
      ownsCurrentStall = false;

      if (!isLoggedIn) {
        addCard.style.display = "none";
        showBannerHTML(loginRequiredNotice, `You need to <a href="/login">log in</a> to manage items.`, "error");
        return;
      }

      try {
        const stallId = stallIdInput.value.trim();
        const res = await fetch(`/api/stall/${encodeURIComponent(stallId)}/owns`, { headers: authHeaders() });
        const data = await res.json();

        ownsCurrentStall = !!data.owns;

        if (ownsCurrentStall) {
          addCard.style.display = "block";
          clearBanner(loginRequiredNotice);
        } else {
          addCard.style.display = "none";
          showBanner(loginRequiredNotice, "You don't own this stall, so you can't manage its items.", "error");
        }
      } catch (err) {
        ownsCurrentStall = false;
        addCard.style.display = "none";
        showBanner(loginRequiredNotice, "Couldn't verify stall ownership — try reloading.", "error");
      }
    }

    async function loadMenu() {
      clearBanner(topMessage);
      menuBody.innerHTML = "";
      menuTable.style.display = "none";
      emptyNote.style.display = "none";
      itemCount.textContent = "—";

      try {
        const res = await fetch(menuUrl());
        const data = await res.json();

        if (!res.ok) {
          showBanner(topMessage, `${res.status}: ${data.error || "Failed to load menu."}`, "error");
          return;
        }

        itemCount.textContent = `${data.length} item${data.length === 1 ? "" : "s"}`;

        if (data.length === 0) {
          emptyNote.style.display = "block";
          return;
        }

        renderRows(data);
        menuTable.style.display = "table";
      } catch (err) {
        showBanner(topMessage, "Could not reach the server: " + err.message, "error");
      }
    }

    function renderRows(items) {
      menuBody.innerHTML = "";

      items.forEach(item => {
        const row = document.createElement("tr");

        const thumb = item.ImagePath
          ? `<img src="${item.ImagePath}" alt="${item.ItemDesc}" class="item-thumb">`
          : `<div class="item-thumb placeholder"></div>`;

        const actions = ownsCurrentStall
          ? `<div class="row-actions"><button class="save-btn">Save</button><button class="delete-btn">Delete</button></div>`
          : `<span class="pill">Not your stall</span>`;

        row.innerHTML = `
          <td>${thumb}</td>
          <td>${item.ItemCode}</td>
          <td><input type="text" class="edit-desc" value="${item.ItemDesc}" ${ownsCurrentStall ? "" : "disabled"}></td>
          <td><input type="number" step="0.01" class="edit-price" value="${item.ItemPrice}" ${ownsCurrentStall ? "" : "disabled"}></td>
          <td><input type="text" class="edit-category" value="${item.ItemCategory}" ${ownsCurrentStall ? "" : "disabled"}></td>
          <td>${actions}</td>
        `;

        if (ownsCurrentStall) {
          row.querySelector(".save-btn").addEventListener("click", () => updateItem(item.ItemCode, row));
          row.querySelector(".delete-btn").addEventListener("click", () => deleteItem(item.ItemCode, row));
        }

        menuBody.appendChild(row);
      });
    }

    async function updateItem(code, row) {
      clearBanner(topMessage);

      const payload = {
        ItemDesc: row.querySelector(".edit-desc").value,
        ItemPrice: parseFloat(row.querySelector(".edit-price").value),
        ItemCategory: row.querySelector(".edit-category").value
      };

      try {
        const res = await fetch(menuUrl(`/${encodeURIComponent(code)}`), {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
          showBanner(topMessage, `${code} updated.`, "success");
        } else {
          showBanner(topMessage, `${res.status}: ${data.error || "Update failed."}`, "error");
        }
      } catch (err) {
        showBanner(topMessage, "Could not reach the server: " + err.message, "error");
      }
    }

    async function deleteItem(code, row) {
      clearBanner(topMessage);

      if (!confirm(`Delete item ${code}?`)) return;

      try {
        const res = await fetch(menuUrl(`/${encodeURIComponent(code)}`), {
          method: "DELETE",
          headers: authHeaders()
        });

        const data = await res.json();

        if (res.ok) {
          showBanner(topMessage, `${code} deleted.`, "success");
          row.remove();
          const remaining = menuBody.querySelectorAll("tr").length;
          itemCount.textContent = `${remaining} item${remaining === 1 ? "" : "s"}`;
          if (remaining === 0) {
            menuTable.style.display = "none";
            emptyNote.style.display = "block";
          }
        } else {
          showBanner(topMessage, `${res.status}: ${data.error || "Delete failed."}`, "error");
        }
      } catch (err) {
        showBanner(topMessage, "Could not reach the server: " + err.message, "error");
      }
    }

    addForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearBanner(addMessage);

      const formData = new FormData();
      formData.append("itemCode", document.getElementById("newCode").value);
      formData.append("ItemDesc", document.getElementById("newDesc").value);
      formData.append("ItemPrice", document.getElementById("newPrice").value);
      formData.append("ItemCategory", document.getElementById("newCategory").value);

      const photoFile = document.getElementById("newPhoto").files[0];
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      try {
        // No Content-Type header — the browser sets the correct multipart
        // boundary automatically for FormData. Auth header still required.
        const res = await fetch(menuUrl(), {
          method: "POST",
          headers: authHeaders(),
          body: formData
        });

        const data = await res.json();

        if (res.ok) {
          showBanner(addMessage, data.message || "Item added.", "success");
          addForm.reset();
          loadMenu();
        } else {
          showBanner(addMessage, `${res.status}: ${data.error || "Add failed."}`, "error");
        }
      } catch (err) {
        showBanner(addMessage, "Could not reach the server: " + err.message, "error");
      }
    });

    loadBtn.addEventListener("click", () => {
      checkOwnership();
      loadMenu();
    });

    checkSession().then(() => {
      checkOwnership();
      loadMenu();
    });