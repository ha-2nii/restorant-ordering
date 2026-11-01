/**
 * Habesha Bites - Restaurant Admin & Kitchen Management Portal
 * Full interactive controller: Dashboard KPIs, Live Orders, Menu CRUD, Customers
 */

document.addEventListener("DOMContentLoaded", () => {
  // ===========================================================================
  // 1. STATE & CACHE INITIALIZATION
  // ===========================================================================
  const state = {
    user: null,
    stats: {
      total_revenue: 0,
      today_revenue: 0,
      total_orders: 0,
      active_orders: 0,
      delivered_orders: 0,
      total_menu_items: 0,
      available_menu_items: 0,
      total_customers: 0
    },
    orders: [],
    menu: [],
    customers: [],
    filters: {
      orderStatus: "all",
      orderSearch: "",
      menuCuisine: "all",
      menuSearch: "",
      customerSearch: ""
    },
    isBackendOnline: true
  };

  // ===========================================================================
  // 2. DOM ELEMENT REFERENCES
  // ===========================================================================
  const dom = {
    // Sidebar & Navigation
    adminSidebar: document.getElementById("adminSidebar"),
    btnMobileSidebar: document.getElementById("btnMobileSidebar"),
    navButtons: document.querySelectorAll(".sidebar-nav .nav-btn"),
    sections: document.querySelectorAll(".admin-section"),
    headerTitle: document.getElementById("headerTitle"),
    headerSubtitle: document.getElementById("headerSubtitle"),
    adminUserName: document.getElementById("adminUserName"),
    adminAvatar: document.getElementById("adminAvatar"),
    btnAdminLogout: document.getElementById("btnAdminLogout"),
    btnRefreshData: document.getElementById("btnRefreshData"),
    btnHeaderAddDish: document.getElementById("btnHeaderAddDish"),
    pendingOrdersBadge: document.getElementById("pendingOrdersBadge"),

    // Dashboard Elements
    kpiTotalRevenue: document.getElementById("kpiTotalRevenue"),
    kpiTotalOrders: document.getElementById("kpiTotalOrders"),
    kpiDeliveredSub: document.getElementById("kpiDeliveredSub"),
    kpiActiveOrders: document.getElementById("kpiActiveOrders"),
    kpiTotalMenu: document.getElementById("kpiTotalMenu"),
    kpiAvailableSub: document.getElementById("kpiAvailableSub"),
    dashRecentOrdersBody: document.getElementById("dashRecentOrdersBody"),
    dashPrepCount: document.getElementById("dashPrepCount"),
    dashDeliveryCount: document.getElementById("dashDeliveryCount"),
    dashCustomerCount: document.getElementById("dashCustomerCount"),

    // Orders Section
    orderStatusTabs: document.getElementById("orderStatusTabs"),
    orderSearchInput: document.getElementById("orderSearchInput"),
    ordersTableBody: document.getElementById("ordersTableBody"),
    countAll: document.getElementById("countAll"),
    countPending: document.getElementById("countPending"),
    countPreparing: document.getElementById("countPreparing"),
    countOnTheWay: document.getElementById("countOnTheWay"),
    countDelivered: document.getElementById("countDelivered"),
    countCancelled: document.getElementById("countCancelled"),

    // Menu Section
    menuCuisineTabs: document.getElementById("menuCuisineTabs"),
    menuSearchInput: document.getElementById("menuSearchInput"),
    menuGridAdmin: document.getElementById("menuGridAdmin"),

    // Customers Section
    customerCountBadge: document.getElementById("customerCountBadge"),
    customerSearchInput: document.getElementById("customerSearchInput"),
    customersTableBody: document.getElementById("customersTableBody"),

    // Modals
    dishModalOverlay: document.getElementById("dishModalOverlay"),
    dishModalTitle: document.getElementById("dishModalTitle"),
    dishForm: document.getElementById("dishForm"),
    dishFormId: document.getElementById("dishFormId"),
    dishName: document.getElementById("dishName"),
    dishCategory: document.getElementById("dishCategory"),
    dishPrice: document.getElementById("dishPrice"),
    dishImage: document.getElementById("dishImage"),
    dishDescription: document.getElementById("dishDescription"),
    dishIsAvailable: document.getElementById("dishIsAvailable"),
    orderModalOverlay: document.getElementById("orderModalOverlay"),
    orderModalContent: document.getElementById("orderModalContent"),
    toastContainer: document.getElementById("toastContainer")
  };

  // ===========================================================================
  // 3. AUTHENTICATION & GUARD
  // ===========================================================================
  function verifyAdminAccess() {
    try {
      const stored = localStorage.getItem("habeshabites_user");
      if (stored) {
        state.user = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Storage read error", e);
    }

    if (!state.user || state.user.role !== "admin") {
      // In standalone demo, offer to continue as admin or redirect
      const confirmDemoAdmin = confirm(
        "Notice: You are not currently signed in as an Admin.\n\n" +
        "Click OK to sign in as 'Habesha Bites Admin' (Demo Mode), or Cancel to go to the login page."
      );
      if (confirmDemoAdmin) {
        state.user = {
          id: 1,
          name: "Habesha Bites Admin",
          email: "admin@habeshabites.com",
          role: "admin",
          city: "Addis Ababa, Ethiopia",
          isLoggedIn: true
        };
        localStorage.setItem("habeshabites_user", JSON.stringify(state.user));
      } else {
        window.location.href = "login.html#login";
        return;
      }
    }

    if (dom.adminUserName && state.user) {
      dom.adminUserName.textContent = state.user.name || "Admin Manager";
      const initial = (state.user.name || "A").trim().charAt(0).toUpperCase();
      if (dom.adminAvatar) dom.adminAvatar.textContent = initial;
    }
  }

  // ===========================================================================
  // 4. TOAST SYSTEM
  // ===========================================================================
  function showToast(message, type = "info") {
    if (!dom.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-circle-check";
    if (type === "error") icon = "fa-triangle-exclamation";
    if (type === "warning") icon = "fa-bell";

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
      </div>
    `;

    toast.style.cssText = `
      background: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#1e3a8a'};
      color: #fff;
      padding: 12px 18px;
      border-radius: 10px;
      margin-bottom: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      box-shadow: 0 4px 14px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: space-between;
      animation: slideInToast 0.3s ease;
    `;

    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(40px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ===========================================================================
  // 5. NAVIGATION & SECTION SWITCHING
  // ===========================================================================
  window.switchSection = function(targetSectionId) {
    dom.sections.forEach(sec => {
      sec.classList.remove("active");
      if (sec.id === targetSectionId) {
        sec.classList.add("active");
      }
    });

    dom.navButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.target === targetSectionId);
    });

    // Update Titles
    if (targetSectionId === "dashboardSection") {
      dom.headerTitle.textContent = "Dashboard Overview";
      dom.headerSubtitle.textContent = "Real-time store performance and live kitchen activity";
    } else if (targetSectionId === "ordersSection") {
      dom.headerTitle.textContent = "Live Orders Management";
      dom.headerSubtitle.textContent = "Track incoming orders and update delivery status";
    } else if (targetSectionId === "menuSection") {
      dom.headerTitle.textContent = "Menu Dishes & Availability";
      dom.headerSubtitle.textContent = "Add, edit, or toggle dish availability for online ordering";
    } else if (targetSectionId === "customersSection") {
      dom.headerTitle.textContent = "Registered Customers";
      dom.headerSubtitle.textContent = "Directory of food lovers and their order history";
    }

    // Close mobile sidebar if open
    if (dom.adminSidebar) {
      dom.adminSidebar.classList.remove("show");
    }
  };

  dom.navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      if (target) switchSection(target);
    });
  });

  if (dom.btnMobileSidebar) {
    dom.btnMobileSidebar.addEventListener("click", () => {
      dom.adminSidebar.classList.toggle("show");
    });
  }

  // ===========================================================================
  // 6. DATA FETCHING (HYBRID: API FIRST, FALLBACK LOCAL DEMO)
  // ===========================================================================
  async function loadAllAdminData() {
    if (dom.btnRefreshData) {
      dom.btnRefreshData.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Refreshing...';
    }

    try {
      // 1. Fetch Stats
      const statsRes = await fetch("api/admin/stats.php");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          state.stats = statsData.stats;
          state.isBackendOnline = true;
        }
      }

      // 2. Fetch Orders
      const ordersRes = await fetch("api/admin/get_orders.php");
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          state.orders = ordersData.orders;
        }
      }

      // 3. Fetch Menu Items
      const menuRes = await fetch("api/admin/manage_menu.php");
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        if (menuData.success) {
          state.menu = menuData.items;
        }
      }

      // 4. Fetch Customers
      const custRes = await fetch("api/admin/customers.php");
      if (custRes.ok) {
        const custData = await custRes.json();
        if (custData.success) {
          state.customers = custData.customers;
        }
      }
    } catch (err) {
      console.warn("Backend API not reachable. Switching to Local Demo Mode:", err);
      state.isBackendOnline = false;
      loadLocalDemoData();
    } finally {
      renderAll();
      if (dom.btnRefreshData) {
        dom.btnRefreshData.innerHTML = '<i class="fa-solid fa-rotate"></i> Refresh';
      }
    }
  }

  function loadLocalDemoData() {
    // Check if stored in localStorage
    const savedOrders = localStorage.getItem("habeshabites_admin_orders");
    const savedMenu   = localStorage.getItem("habeshabites_admin_menu");

    if (savedOrders) {
      state.orders = JSON.parse(savedOrders);
    } else {
      state.orders = [
        {
          id: 1,
          order_number: "ET-9182",
          total_amount: 46.50,
          customer_name: "Almaz Bekele",
          contact_phone: "+251 91 234 5678",
          delivery_address: "Kazanchis, Near ECA Building, Addis Ababa",
          status: "pending",
          created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          items: [
            { item_name: "Special Sizzling Ribeye Tibs", unit_price: 24.50, quantity: 1, subtotal: 24.50 },
            { item_name: "Grand Doro Wat with Ayib", unit_price: 22.00, quantity: 1, subtotal: 22.00 }
          ]
        },
        {
          id: 2,
          order_number: "ET-8721",
          total_amount: 38.49,
          customer_name: "Dawit Haile",
          contact_phone: "+251 92 888 1234",
          delivery_address: "Bole Medhanialem, Atlas Road, Addis Ababa",
          status: "preparing",
          created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          items: [
            { item_name: "Royal Beyaynetu Vegan Platter", unit_price: 19.50, quantity: 1, subtotal: 19.50 },
            { item_name: "Black Truffle Pizza Margherita", unit_price: 18.99, quantity: 1, subtotal: 18.99 }
          ]
        },
        {
          id: 3,
          order_number: "ET-7319",
          total_amount: 61.50,
          customer_name: "Selamawit Tadesse",
          contact_phone: "+251 93 456 7890",
          delivery_address: "Sarbet, Old Airport area, Addis Ababa",
          status: "on_the_way",
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          items: [
            { item_name: "Special Kitfo with Kocho", unit_price: 23.50, quantity: 2, subtotal: 47.00 },
            { item_name: "Crispy Falafel Mezze Platter", unit_price: 14.50, quantity: 1, subtotal: 14.50 }
          ]
        },
        {
          id: 4,
          order_number: "ET-6104",
          total_amount: 38.49,
          customer_name: "Michael Yohannes",
          contact_phone: "+251 91 555 4321",
          delivery_address: "CMC Michael, Addis Ababa",
          status: "delivered",
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          items: [
            { item_name: "Tokyo Spicy Tonkotsu Ramen", unit_price: 16.50, quantity: 1, subtotal: 16.50 },
            { item_name: "Lemon Herb Grilled Salmon", unit_price: 21.99, quantity: 1, subtotal: 21.99 }
          ]
        }
      ];
      localStorage.setItem("habeshabites_admin_orders", JSON.stringify(state.orders));
    }

    if (savedMenu) {
      try {
        const parsed = JSON.parse(savedMenu);
        // Clear old mock dishes if present
        if (Array.isArray(parsed) && parsed.some(d => d.name === "Special Sizzling Ribeye Tibs" && d.id === 1)) {
          state.menu = [];
          localStorage.setItem("habeshabites_admin_menu", JSON.stringify([]));
        } else {
          state.menu = parsed;
        }
      } catch (e) {
        state.menu = [];
      }
    } else {
      state.menu = [];
      localStorage.setItem("habeshabites_admin_menu", JSON.stringify([]));
    }

    state.customers = [
      { id: 1, name: "Almaz Bekele", email: "almaz@example.com", phone: "+251 91 234 5678", city: "Kazanchis, Addis Ababa", total_orders: 4, total_spent: 124.50, created_at: "2026-09-15" },
      { id: 2, name: "Dawit Haile", email: "dawit.h@gmail.com", phone: "+251 92 888 1234", city: "Bole Medhanialem, Addis Ababa", total_orders: 2, total_spent: 68.20, created_at: "2026-10-02" },
      { id: 3, name: "Selamawit Tadesse", email: "selam@yahoo.com", phone: "+251 93 456 7890", city: "Sarbet, Addis Ababa", total_orders: 6, total_spent: 215.00, created_at: "2026-08-20" },
      { id: 4, name: "Michael Yohannes", email: "michael.y@outlook.com", phone: "+251 91 555 4321", city: "CMC Michael, Addis Ababa", total_orders: 1, total_spent: 38.49, created_at: "2026-10-28" }
    ];

    // Compute stats from local orders
    const nonCancelled = state.orders.filter(o => o.status !== "cancelled");
    const totalRev = nonCancelled.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    const active = state.orders.filter(o => ["pending", "preparing", "on_the_way"].includes(o.status)).length;
    const delivered = state.orders.filter(o => o.status === "delivered").length;
    const availMenu = state.menu.filter(m => m.is_available == 1).length;

    state.stats = {
      total_revenue: totalRev,
      today_revenue: totalRev * 0.45,
      total_orders: state.orders.length,
      active_orders: active,
      delivered_orders: delivered,
      total_menu_items: state.menu.length,
      available_menu_items: availMenu,
      total_customers: state.customers.length
    };
  }

  // ===========================================================================
  // 7. RENDER FUNCTIONS
  // ===========================================================================
  function renderAll() {
    renderKPIs();
    renderOrders();
    renderMenu();
    renderCustomers();
  }

  function renderKPIs() {
    // Recalculate stats dynamically if needed
    const activeOrders = state.orders.filter(o => ["pending", "preparing", "on_the_way"].includes(o.status)).length;
    const pendingOrders = state.orders.filter(o => o.status === "pending").length;
    const prepOrders = state.orders.filter(o => o.status === "preparing").length;
    const deliveryOrders = state.orders.filter(o => o.status === "on_the_way").length;
    const deliveredOrders = state.orders.filter(o => o.status === "delivered").length;
    const totalRev = state.orders
      .filter(o => o.status !== "cancelled")
      .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

    dom.kpiTotalRevenue.textContent = `$${totalRev.toFixed(2)}`;
    dom.kpiTotalOrders.textContent = state.orders.length;
    dom.kpiDeliveredSub.textContent = `${deliveredOrders} delivered`;
    dom.kpiActiveOrders.textContent = activeOrders;
    dom.kpiTotalMenu.textContent = state.menu.length;
    const availCount = state.menu.filter(m => m.is_available == 1).length;
    dom.kpiAvailableSub.textContent = `${availCount} available`;

    dom.dashPrepCount.textContent = prepOrders;
    dom.dashDeliveryCount.textContent = deliveryOrders;
    dom.dashCustomerCount.textContent = state.customers.length;

    // Sidebar pending badge
    if (dom.pendingOrdersBadge) {
      dom.pendingOrdersBadge.textContent = pendingOrders;
      dom.pendingOrdersBadge.style.display = pendingOrders > 0 ? "inline-block" : "none";
    }

    // Tab counts in Orders section
    if (dom.countAll) dom.countAll.textContent = state.orders.length;
    if (dom.countPending) dom.countPending.textContent = pendingOrders;
    if (dom.countPreparing) dom.countPreparing.textContent = prepOrders;
    if (dom.countOnTheWay) dom.countOnTheWay.textContent = deliveryOrders;
    if (dom.countDelivered) dom.countDelivered.textContent = deliveredOrders;
    if (dom.countCancelled) dom.countCancelled.textContent = state.orders.filter(o => o.status === "cancelled").length;
  }

  function renderOrders() {
    // 1. Dashboard Recent Orders (Limit 5)
    const recent = [...state.orders].slice(0, 5);
    if (recent.length === 0) {
      dom.dashRecentOrdersBody.innerHTML = `
        <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No orders found yet.</td></tr>
      `;
    } else {
      dom.dashRecentOrdersBody.innerHTML = recent.map(order => `
        <tr>
          <td><strong>#${escapeHtml(order.order_number)}</strong></td>
          <td>${escapeHtml(order.customer_name || 'Customer')}</td>
          <td>${order.items ? order.items.length : 1} item(s)</td>
          <td><strong>$${parseFloat(order.total_amount).toFixed(2)}</strong></td>
          <td><span class="badge-status status-badge-${order.status}">${formatStatus(order.status)}</span></td>
          <td>
            <button class="btn-icon-action" title="View Order" onclick="viewOrderDetails(${order.id})">
              <i class="fa-solid fa-eye"></i>
            </button>
          </td>
        </tr>
      `).join("");
    }

    // 2. Full Orders Table in Live Orders Section
    const filtered = state.orders.filter(order => {
      const matchStatus = state.filters.orderStatus === "all" || order.status === state.filters.orderStatus;
      const search = state.filters.orderSearch.toLowerCase();
      const matchSearch = !search ||
        (order.order_number && order.order_number.toLowerCase().includes(search)) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(search)) ||
        (order.contact_phone && order.contact_phone.toLowerCase().includes(search));
      return matchStatus && matchSearch;
    });

    if (filtered.length === 0) {
      dom.ordersTableBody.innerHTML = `
        <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">No matching orders found.</td></tr>
      `;
      return;
    }

    dom.ordersTableBody.innerHTML = filtered.map(order => {
      const itemsSummary = (order.items && order.items.length)
        ? order.items.map(it => `${it.quantity}x ${it.item_name}`).join(", ")
        : "Meal Order";

      const timeAgo = formatTimeAgo(order.created_at);

      return `
        <tr>
          <td>
            <div style="font-weight: 800; color: var(--text-main);">#${escapeHtml(order.order_number)}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
              <i class="fa-regular fa-clock"></i> ${timeAgo}
            </div>
          </td>
          <td>
            <div style="font-weight: 700;">${escapeHtml(order.customer_name || 'Guest Customer')}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">
              <a href="tel:${order.contact_phone}" style="color: var(--primary); text-decoration: none;">
                <i class="fa-solid fa-phone"></i> ${escapeHtml(order.contact_phone || 'N/A')}
              </a>
            </div>
          </td>
          <td>
            <div style="font-size: 0.85rem; max-width: 220px; line-height: 1.35;" title="${escapeHtml(order.delivery_address || '')}">
              ${escapeHtml(order.delivery_address || 'Addis Ababa, Ethiopia')}
            </div>
          </td>
          <td>
            <div style="font-size: 0.85rem; max-width: 200px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(itemsSummary)}">
              ${escapeHtml(itemsSummary)}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${order.items ? order.items.length : 1} line item(s)</div>
          </td>
          <td>
            <div style="font-weight: 800; font-size: 0.98rem; color: var(--text-main);">$${parseFloat(order.total_amount).toFixed(2)}</div>
            <div style="font-size: 0.72rem; color: #10b981; font-weight: 700;"><i class="fa-solid fa-wallet"></i> Telebirr / Paid</div>
          </td>
          <td>
            <select class="status-dropdown" onchange="changeOrderStatus(${order.id}, this.value)">
              <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ Pending (New)</option>
              <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>👨‍🍳 Preparing</option>
              <option value="on_the_way" ${order.status === 'on_the_way' ? 'selected' : ''}>🛵 Out for Delivery</option>
              <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>✅ Delivered</option>
              <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            </select>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn-icon-action" title="View Full Details & Receipt" onclick="viewOrderDetails(${order.id})">
                <i class="fa-solid fa-receipt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderMenu() {
    const filtered = state.menu.filter(dish => {
      const matchCuisine = state.filters.menuCuisine === "all" || dish.category === state.filters.menuCuisine;
      const search = state.filters.menuSearch.toLowerCase();
      const matchSearch = !search ||
        (dish.name && dish.name.toLowerCase().includes(search)) ||
        (dish.description && dish.description.toLowerCase().includes(search));
      return matchCuisine && matchSearch;
    });

    if (filtered.length === 0) {
      dom.menuGridAdmin.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 50px; background: #fff; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
          <i class="fa-solid fa-bowl-food" style="font-size: 2.5rem; margin-bottom: 12px; color: var(--border-light);"></i>
          <h3>No dishes found matching criteria.</h3>
          <p style="margin-top: 6px;">Click "Add Dish" to introduce new culinary specialties.</p>
        </div>
      `;
      return;
    }

    dom.menuGridAdmin.innerHTML = filtered.map(dish => {
      const isAvail = dish.is_available == 1;
      return `
        <div class="menu-card-admin" id="menuCard-${dish.id}">
          <div class="menu-card-img-wrap">
            <img src="${escapeHtml(dish.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80')}" alt="${escapeHtml(dish.name)}" class="menu-card-img">
            <span class="menu-category-tag">${escapeHtml(dish.category)}</span>
            <span class="menu-price-tag">$${parseFloat(dish.price).toFixed(2)}</span>
          </div>
          <div class="menu-card-body">
            <h4 class="menu-card-title">${escapeHtml(dish.name)}</h4>
            <p class="menu-card-desc">${escapeHtml(dish.description || 'Delicious dish made with authentic ingredients.')}</p>
            <div class="menu-card-actions">
              <label class="switch-label" title="Toggle customer availability">
                <input type="checkbox" class="switch-input" ${isAvail ? 'checked' : ''} onchange="toggleDishAvailability(${dish.id})">
                <span style="font-size: 0.78rem; color: ${isAvail ? '#065f46' : '#991b1b'};">
                  ${isAvail ? '● Available' : '○ Sold Out'}
                </span>
              </label>
              <div style="display: flex; gap: 6px;">
                <button class="btn-icon-action" title="Edit Dish" onclick="editDish(${dish.id})">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-icon-action btn-icon-delete" title="Delete Dish" onclick="deleteDish(${dish.id})">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderCustomers() {
    if (dom.customerCountBadge) {
      dom.customerCountBadge.textContent = state.customers.length;
    }

    const filtered = state.customers.filter(c => {
      const search = state.filters.customerSearch.toLowerCase();
      if (!search) return true;
      return (
        (c.name && c.name.toLowerCase().includes(search)) ||
        (c.email && c.email.toLowerCase().includes(search)) ||
        (c.phone && c.phone.toLowerCase().includes(search))
      );
    });

    if (filtered.length === 0) {
      dom.customersTableBody.innerHTML = `
        <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">No customers found.</td></tr>
      `;
      return;
    }

    dom.customersTableBody.innerHTML = filtered.map(c => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary-light); color: var(--primary); font-weight: 800; display: flex; align-items: center; justify-content: center;">
              ${(c.name || 'C').charAt(0).toUpperCase()}
            </div>
            <strong>${escapeHtml(c.name)}</strong>
          </div>
        </td>
        <td>${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.phone || 'N/A')}</td>
        <td>${escapeHtml(c.city || 'Addis Ababa, Ethiopia')}</td>
        <td><strong>${c.total_orders || 0}</strong> order(s)</td>
        <td><strong style="color: #065f46;">$${parseFloat(c.total_spent || 0).toFixed(2)}</strong></td>
        <td style="color: var(--text-muted); font-size: 0.82rem;">${formatDate(c.created_at)}</td>
      </tr>
    `).join("");
  }

  // ===========================================================================
  // 8. ORDER STATUS MANAGEMENT
  // ===========================================================================
  window.changeOrderStatus = async function(orderId, newStatus) {
    const order = state.orders.find(o => o.id == orderId);
    if (!order) return;

    const prevStatus = order.status;
    order.status = newStatus;

    // If backend online, update via API
    if (state.isBackendOnline) {
      try {
        const res = await fetch("api/admin/update_order_status.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId, status: newStatus })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Order #${order.order_number} marked as '${formatStatus(newStatus)}'!`, "success");
        } else {
          showToast(`Warning: Could not save on server (${data.message || 'Error'}). Updating locally.`, "warning");
        }
      } catch (err) {
        showToast(`Updated locally: Order #${order.order_number} status set to ${formatStatus(newStatus)}.`, "info");
      }
    } else {
      localStorage.setItem("habeshabites_admin_orders", JSON.stringify(state.orders));
      showToast(`Order #${order.order_number} marked as '${formatStatus(newStatus)}'!`, "success");
    }

    renderKPIs();
    renderOrders();
  };

  window.viewOrderDetails = function(orderId) {
    const order = state.orders.find(o => o.id == orderId);
    if (!order) return;

    const itemsHtml = (order.items || []).map(it => `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-light);">
        <div>
          <span style="font-weight: 700;">${it.quantity}x</span>
          <span>${escapeHtml(it.item_name)}</span>
        </div>
        <div style="font-weight: 700;">$${parseFloat(it.subtotal || it.unit_price * it.quantity).toFixed(2)}</div>
      </div>
    `).join("");

    dom.orderModalTitle.textContent = `Order Details #${order.order_number}`;
    dom.orderModalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border-light);">
        <div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Current Status</div>
          <span class="badge-status status-badge-${order.status}" style="font-size: 0.85rem; margin-top: 4px;">
            ${formatStatus(order.status)}
          </span>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.8rem; color: var(--text-muted);">Placed At</div>
          <div style="font-weight: 700; font-size: 0.9rem;">${formatDate(order.created_at)}</div>
        </div>
      </div>

      <div style="background: var(--bg-surface-alt); padding: 16px; border-radius: var(--radius-sm); margin-bottom: 20px;">
        <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Customer Information</h4>
        <div style="font-weight: 800; font-size: 1.05rem;">${escapeHtml(order.customer_name || 'Guest Customer')}</div>
        <div style="font-size: 0.88rem; color: var(--text-main); margin-top: 4px;">
          <i class="fa-solid fa-phone" style="color: var(--primary); width: 16px;"></i> ${escapeHtml(order.contact_phone || 'N/A')}
        </div>
        <div style="font-size: 0.88rem; color: var(--text-main); margin-top: 4px;">
          <i class="fa-solid fa-location-dot" style="color: var(--accent); width: 16px;"></i> ${escapeHtml(order.delivery_address || 'Addis Ababa')}
        </div>
      </div>

      <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px;">Ordered Items</h4>
      <div style="margin-bottom: 18px;">
        ${itemsHtml || '<p style="color: var(--text-muted);">No line item breakdown available.</p>'}
      </div>

      <div style="background: #faf9f6; padding: 14px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--text-muted); margin-bottom: 4px;">
          <span>Subtotal</span>
          <span>$${parseFloat(order.total_amount).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--text-muted); margin-bottom: 8px;">
          <span>Delivery & Service</span>
          <span>$0.00 (Standard)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.15rem; color: var(--text-main); padding-top: 8px; border-top: 1px solid var(--border-light);">
          <span>Total Amount</span>
          <span style="color: var(--primary);">$${parseFloat(order.total_amount).toFixed(2)}</span>
        </div>
      </div>
    `;

    dom.orderModalOverlay.classList.add("active");
  };

  window.closeOrderModal = function() {
    dom.orderModalOverlay.classList.remove("active");
  };

  // ===========================================================================
  // 9. MENU CRUD OPERATIONS
  // ===========================================================================
  window.openDishModal = function(dish = null) {
    dom.dishForm.reset();
    if (dish) {
      dom.dishModalTitle.textContent = "Edit Dish";
      dom.dishFormId.value = dish.id;
      dom.dishName.value = dish.name;
      dom.dishCategory.value = dish.category;
      dom.dishPrice.value = dish.price;
      dom.dishImage.value = dish.image;
      dom.dishDescription.value = dish.description || "";
      dom.dishIsAvailable.checked = dish.is_available == 1;
    } else {
      dom.dishModalTitle.textContent = "Add New Dish";
      dom.dishFormId.value = "";
      dom.dishIsAvailable.checked = true;
    }
    dom.dishModalOverlay.classList.add("active");
  };

  window.closeDishModal = function() {
    dom.dishModalOverlay.classList.remove("active");
  };

  window.editDish = function(dishId) {
    const dish = state.menu.find(d => d.id == dishId);
    if (dish) openDishModal(dish);
  };

  window.toggleDishAvailability = async function(dishId) {
    const dish = state.menu.find(d => d.id == dishId);
    if (!dish) return;

    dish.is_available = dish.is_available == 1 ? 0 : 1;

    if (state.isBackendOnline) {
      try {
        await fetch("api/admin/manage_menu.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggle", id: dishId })
        });
      } catch (e) {
        console.warn("Toggle server sync failed", e);
      }
    } else {
      localStorage.setItem("habeshabites_admin_menu", JSON.stringify(state.menu));
    }

    showToast(`${dish.name} is now ${dish.is_available ? 'Available' : 'Sold Out'}!`, "success");
    renderKPIs();
    renderMenu();
  };

  window.deleteDish = async function(dishId) {
    const dish = state.menu.find(d => d.id == dishId);
    if (!dish) return;

    if (!confirm(`Are you sure you want to permanently delete "${dish.name}" from the menu?`)) {
      return;
    }

    state.menu = state.menu.filter(d => d.id != dishId);

    if (state.isBackendOnline) {
      try {
        await fetch("api/admin/manage_menu.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", id: dishId })
        });
      } catch (e) {
        console.warn("Delete server sync failed", e);
      }
    } else {
      localStorage.setItem("habeshabites_admin_menu", JSON.stringify(state.menu));
    }

    showToast(`"${dish.name}" removed from menu.`, "info");
    renderKPIs();
    renderMenu();
  };

  window.handleDishFormSubmit = async function(e) {
    e.preventDefault();
    const id = dom.dishFormId.value;
    const isEdit = !!id;

    const payload = {
      action: isEdit ? "update" : "create",
      id: isEdit ? parseInt(id) : undefined,
      name: dom.dishName.value.trim(),
      category: dom.dishCategory.value,
      price: parseFloat(dom.dishPrice.value),
      image: dom.dishImage.value.trim() || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
      description: dom.dishDescription.value.trim(),
      is_available: dom.dishIsAvailable.checked ? 1 : 0
    };

    if (isEdit) {
      const idx = state.menu.findIndex(d => d.id == id);
      if (idx !== -1) {
        state.menu[idx] = { ...state.menu[idx], ...payload };
      }
    } else {
      payload.id = Date.now();
      state.menu.unshift(payload);
    }

    if (state.isBackendOnline) {
      try {
        const res = await fetch("api/admin/manage_menu.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.dish && !isEdit) {
          state.menu[0].id = data.dish.id;
        }
      } catch (err) {
        console.warn("Save menu failed on backend", err);
      }
    } else {
      localStorage.setItem("habeshabites_admin_menu", JSON.stringify(state.menu));
    }

    closeDishModal();
    showToast(isEdit ? "Dish updated successfully!" : "🎉 New dish added to menu!", "success");
    renderKPIs();
    renderMenu();
  };

  // Header shortcut button
  if (dom.btnHeaderAddDish) {
    dom.btnHeaderAddDish.addEventListener("click", () => openDishModal());
  }

  // ===========================================================================
  // 10. FILTER & SEARCH LISTENERS
  // ===========================================================================
  // Order status tabs
  if (dom.orderStatusTabs) {
    dom.orderStatusTabs.querySelectorAll(".status-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        dom.orderStatusTabs.querySelectorAll(".status-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.filters.orderStatus = btn.dataset.status;
        renderOrders();
      });
    });
  }

  // Order search
  if (dom.orderSearchInput) {
    dom.orderSearchInput.addEventListener("input", (e) => {
      state.filters.orderSearch = e.target.value.trim();
      renderOrders();
    });
  }

  // Menu cuisine tabs
  if (dom.menuCuisineTabs) {
    dom.menuCuisineTabs.querySelectorAll(".status-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        dom.menuCuisineTabs.querySelectorAll(".status-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.filters.menuCuisine = btn.dataset.cuisine;
        renderMenu();
      });
    });
  }

  // Menu search
  if (dom.menuSearchInput) {
    dom.menuSearchInput.addEventListener("input", (e) => {
      state.filters.menuSearch = e.target.value.trim();
      renderMenu();
    });
  }

  // Customer search
  if (dom.customerSearchInput) {
    dom.customerSearchInput.addEventListener("input", (e) => {
      state.filters.customerSearch = e.target.value.trim();
      renderCustomers();
    });
  }

  // Refresh button
  if (dom.btnRefreshData) {
    dom.btnRefreshData.addEventListener("click", () => {
      loadAllAdminData();
      showToast("Data refreshed successfully!", "info");
    });
  }

  // Logout button
  if (dom.btnAdminLogout) {
    dom.btnAdminLogout.addEventListener("click", async () => {
      try {
        await fetch("api/auth/logout.php");
      } catch (e) {}
      localStorage.removeItem("habeshabites_user");
      window.location.href = "login.html#login";
    });
  }

  // ===========================================================================
  // 11. HELPER UTILITIES
  // ===========================================================================
  function formatStatus(status) {
    switch (status) {
      case "pending": return "Pending";
      case "preparing": return "Preparing";
      case "on_the_way": return "On The Way";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return "Just now";
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return formatDate(dateStr);
  }

  function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Close modals on clicking overlay background
  [dom.dishModalOverlay, dom.orderModalOverlay].forEach(overlay => {
    if (overlay) {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("active");
        }
      });
    }
  });

  // ===========================================================================
  // 12. BOOTSTRAP INITIALIZATION
  // ===========================================================================
  verifyAdminAccess();
  loadAllAdminData();

  // Auto-refresh orders every 30 seconds
  setInterval(() => {
    if (state.isBackendOnline) {
      loadAllAdminData();
    }
  }, 30000);
});

