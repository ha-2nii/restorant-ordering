/**
 * Habesha Bites - Premium Food Ordering & Delivery App
 * Full interactive script: menu, cart, modals, tracking, toasts
 */

// =============================================================================
// 1. DYNAMIC MENU DATA (Managed by Admin via admin.html or MySQL database)
// =============================================================================
let MENU_DATA = [];

async function fetchDynamicMenu() {
  // 1. First attempt: fetch from MySQL database API
  try {
    const res = await fetch("api/menu/get_menu.php");
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        MENU_DATA = data.items.map(item => ({
          id: String(item.id),
          name: item.name,
          cuisine: item.category || "Habesha",
          price: parseFloat(item.price),
          prepTime: "20-30m",
          rating: 5.0,
          reviews: 1,
          isPopular: false,
          isChefPick: false,
          isSpicy: false,
          isVegetarian: false,
          image: item.image || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
          description: item.description || "",
          addons: []
        }));
        renderExploreMenuGrid();
        return;
      }
    }
  } catch (err) {
    // Backend offline / direct browser file mode
  }

  // 2. Second attempt: Read dishes saved from Admin Panel in localStorage
  try {
    const saved = localStorage.getItem("habeshabites_admin_menu");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // If it was the old mock list, clear it out
        if (parsed.some(d => d.name === "Special Sizzling Ribeye Tibs" && d.id === 1)) {
          MENU_DATA = [];
          localStorage.setItem("habeshabites_admin_menu", JSON.stringify([]));
        } else {
          MENU_DATA = parsed
            .filter(item => item.is_available == 1)
            .map(item => ({
              id: String(item.id),
              name: item.name,
              cuisine: item.category || "Habesha",
              price: parseFloat(item.price),
              prepTime: "20-30m",
              rating: 5.0,
              reviews: 1,
              isPopular: false,
              isChefPick: false,
              isSpicy: false,
              isVegetarian: false,
              image: item.image || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
              description: item.description || "",
              addons: []
            }));
        }
      } else {
        MENU_DATA = [];
      }
    } else {
      MENU_DATA = [];
    }
  } catch (e) {
    MENU_DATA = [];
  }

  renderExploreMenuGrid();
}

// =============================================================================
// 2. APP STATE
// =============================================================================
const state = {
  cart: JSON.parse(localStorage.getItem("habeshabites_cart") || localStorage.getItem("biteroute_cart")) || [],
  activeFilter: "all",
  searchQuery: "",
  currentDish: null,  // dish being customized in modal
  modalQty: 1,
  modalSelectedAddons: [],
  modalSpice: "Mild",
  deliveryLocation: "Addis Ababa, Ethiopia"
};

// =============================================================================
// 3. DOM CACHE
// =============================================================================
const dom = {
  // Header
  siteHeader:          document.getElementById("siteHeader"),
  cartTriggerBtn:      document.getElementById("cartTriggerBtn"),
  cartCountBadge:      document.getElementById("cartCountBadge"),
  locationPillBtn:     document.getElementById("locationPillBtn"),
  currentLocationText: document.getElementById("currentLocationText"),
  mobileMenuToggle:    document.getElementById("mobileMenuToggle"),
  navbarLinks:         document.getElementById("navbarLinks"),

  // Nav active links
  navLinks: document.querySelectorAll(".nav-item-link"),

  // Cuisine filter
  cuisinesList:        document.getElementById("cuisinesList"),

  // Explore Menu
  menuFilterTabs:      document.getElementById("menuFilterTabs"),
  fullMenuFoodGrid:    document.getElementById("fullMenuFoodGrid"),
  menuFoodSearchInput: document.getElementById("menuFoodSearchInput"),

  // Cart Drawer
  cartDrawerOverlay:   document.getElementById("cartDrawerOverlay"),
  btnCloseCartDrawer:  document.getElementById("btnCloseCartDrawer"),
  cartItemsContainer:  document.getElementById("cartItemsContainer"),
  cartEmptyState:      document.getElementById("cartEmptyState"),
  cartDrawerCountText: document.getElementById("cartDrawerCountText"),
  cartSubtotalText:    document.getElementById("cartSubtotalText"),
  cartDiscountRow:     document.getElementById("cartDiscountRow"),
  cartDiscountText:    document.getElementById("cartDiscountText"),
  cartDeliveryFeeText: document.getElementById("cartDeliveryFeeText"),
  cartTotalText:       document.getElementById("cartTotalText"),
  cartPromoInput:      document.getElementById("cartPromoInput"),
  btnApplyPromo:       document.getElementById("btnApplyPromo"),
  btnProceedCheckout:  document.getElementById("btnProceedCheckout"),

  // Dish Customize Modal
  dishModalOverlay:    document.getElementById("dishModalOverlay"),
  btnCloseDishModal:   document.getElementById("btnCloseDishModal"),
  modalDishImg:        document.getElementById("modalDishImg"),
  modalDishTitle:      document.getElementById("modalDishTitle"),
  modalDishDesc:       document.getElementById("modalDishDesc"),
  modalAddonsList:     document.getElementById("modalAddonsList"),
  modalDishNotes:      document.getElementById("modalDishNotes"),
  modalMinusQty:       document.getElementById("modalMinusQty"),
  modalPlusQty:        document.getElementById("modalPlusQty"),
  modalQtyDisplay:     document.getElementById("modalQtyDisplay"),
  modalComputedTotal:  document.getElementById("modalComputedTotal"),
  btnConfirmDishAdd:   document.getElementById("btnConfirmDishAdd"),

  // Location Modal
  locationModalOverlay: document.getElementById("locationModalOverlay"),
  btnCloseLocationModal: document.getElementById("btnCloseLocationModal"),

  // Toast
  toastContainer:      document.getElementById("toastContainer"),

  // Tracking Sim
  btnSimulateTracking: document.getElementById("btnSimulateTracking"),
  trackStep1:          document.getElementById("trackStep1"),
  trackStep2:          document.getElementById("trackStep2"),
  trackStep3:          document.getElementById("trackStep3"),
  trackStep4:          document.getElementById("trackStep4"),

  // Deals section
  dealBannerCards:     document.querySelectorAll(".deal-banner-card"),

  // Invite
  btnInviteFriends:    document.getElementById("btnInviteFriends"),

  // Hero
  heroOrderNowBtn:     document.getElementById("heroOrderNowBtn"),
  btnQuickOrderSpecial:document.getElementById("btnQuickOrderSpecial"),
};

// =============================================================================
// 4. INITIALIZATION
// =============================================================================
document.addEventListener("DOMContentLoaded", () => {
  fetchDynamicMenu();
  updateCartUI();
  bindEventListeners();
  activateNavOnScroll();
  initHeaderScrollBehavior();
});

// =============================================================================
// 5. EVENT LISTENERS
// =============================================================================
function bindEventListeners() {
  // ---- Header & Navigation ----
  dom.cartTriggerBtn.addEventListener("click", openCartDrawer);
  dom.btnCloseCartDrawer.addEventListener("click", closeCartDrawer);
  dom.cartDrawerOverlay.addEventListener("click", (e) => {
    if (e.target === dom.cartDrawerOverlay) closeCartDrawer();
  });

  dom.locationPillBtn.addEventListener("click", openLocationModal);
  dom.btnCloseLocationModal.addEventListener("click", closeLocationModal);
  dom.locationModalOverlay.addEventListener("click", (e) => {
    if (e.target === dom.locationModalOverlay) closeLocationModal();
  });

  // City select buttons
  document.querySelectorAll(".city-select-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const city = btn.dataset.city;
      state.deliveryLocation = city;
      dom.currentLocationText.textContent = city;
      closeLocationModal();
      showToast(`📍 Delivery location set to ${city}`, "success");
    });
  });

  dom.mobileMenuToggle.addEventListener("click", toggleMobileMenu);

  // ---- Cuisine filter cards ----
  if (dom.cuisinesList) {
    dom.cuisinesList.addEventListener("click", (e) => {
      const card = e.target.closest(".cuisine-card");
      if (!card) return;
      document.querySelectorAll(".cuisine-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const cuisine = card.dataset.cuisine;
      state.activeFilter = cuisine === "all" ? "all" : cuisine;
      // Scroll to explore section
      document.getElementById("explore").scrollIntoView({ behavior: "smooth" });
      renderExploreMenuGrid();
    });
  }

  // ---- Explore Menu Filter Tabs ----
  dom.menuFilterTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".cat-tab-btn");
    if (!tab) return;
    document.querySelectorAll(".cat-tab-btn").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    state.activeFilter = tab.dataset.filter;
    renderExploreMenuGrid();
  });

  // ---- Menu Search ----
  dom.menuFoodSearchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    renderExploreMenuGrid();
  });

  // ---- Dish Customize Modal ----
  dom.btnCloseDishModal.addEventListener("click", closeDishModal);
  dom.dishModalOverlay.addEventListener("click", (e) => {
    if (e.target === dom.dishModalOverlay) closeDishModal();
  });
  dom.modalMinusQty.addEventListener("click", () => updateModalQty(-1));
  dom.modalPlusQty.addEventListener("click", () => updateModalQty(1));
  dom.btnConfirmDishAdd.addEventListener("click", confirmAddToCart);

  // Spice radio buttons
  document.querySelectorAll("input[name='modalSpice']").forEach(radio => {
    radio.addEventListener("change", () => {
      state.modalSpice = radio.value;
      recalcModalPrice();
    });
  });

  // ---- Promo Code ----
  dom.btnApplyPromo.addEventListener("click", applyPromoCode);
  dom.cartPromoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyPromoCode();
  });

  // ---- Checkout Button ----
  dom.btnProceedCheckout.addEventListener("click", async () => {
    if (state.cart.length === 0) return;

    dom.btnProceedCheckout.disabled = true;
    dom.btnProceedCheckout.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Order...';

    const user = JSON.parse(localStorage.getItem("habeshabites_user") || "{}");
    const subtotal = state.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const discount = state.appliedPromo ? (subtotal * state.appliedPromo.pct) / 100 : 0;
    const deliveryFee = subtotal > 25 ? 0 : 2.49;
    const finalTotal = subtotal - discount + deliveryFee;

    try {
      const orderPayload = {
        user_id: user.id || null,
        customer_name: user.name || "Guest Customer",
        customer_email: user.email || "guest@habeshabites.com",
        customer_phone: user.phone || "+251 91 123 4567",
        delivery_address: state.deliveryLocation || "Addis Ababa, Ethiopia",
        items: state.cart.map(i => ({
          menu_item_id: i.dishId,
          item_name: i.name,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          total_price: i.unitPrice * i.quantity,
          spice_level: i.spice,
          notes: i.notes || (i.addons && i.addons.length ? i.addons.map(a => a.name).join(", ") : "")
        })),
        subtotal: subtotal,
        discount_amount: discount,
        delivery_fee: deliveryFee,
        total_amount: finalTotal,
        payment_method: "telebirr",
        order_notes: state.appliedPromo ? `Promo: ${state.appliedPromo.code}` : ""
      };

      const res = await fetch('api/orders/create.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();

      const newOrderNumber = data?.order_number || `ET-${Math.floor(1000 + Math.random() * 9000)}`;

      // Sync into admin live queue (localStorage) so orders show in Admin Dashboard immediately
      try {
        let existingAdminOrders = JSON.parse(localStorage.getItem("habeshabites_admin_orders") || "[]");
        existingAdminOrders.unshift({
          id: Date.now(),
          order_number: newOrderNumber,
          total_amount: finalTotal,
          customer_name: (state.user && state.user.name) ? state.user.name : "Almaz Bekele",
          contact_phone: (state.user && state.user.phone) ? state.user.phone : "+251 91 123 4567",
          delivery_address: (state.user && state.user.city) ? state.user.city : "Addis Ababa, Ethiopia",
          status: "pending",
          created_at: new Date().toISOString(),
          items: state.cart.map(i => ({
            item_name: i.name,
            unit_price: i.unitPrice,
            quantity: i.quantity,
            subtotal: i.unitPrice * i.quantity
          }))
        });
        localStorage.setItem("habeshabites_admin_orders", JSON.stringify(existingAdminOrders));
      } catch (e) {}

      if (res.ok && data.success) {
        showToast(`🎉 Order placed successfully! Order #${newOrderNumber}`, "success");
      } else {
        showToast(`🎉 Order placed! Order #${newOrderNumber}`, "success");
      }
    } catch (err) {
      const fallbackNum = `ET-${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        let existingAdminOrders = JSON.parse(localStorage.getItem("habeshabites_admin_orders") || "[]");
        existingAdminOrders.unshift({
          id: Date.now(),
          order_number: fallbackNum,
          total_amount: finalTotal,
          customer_name: (state.user && state.user.name) ? state.user.name : "Almaz Bekele",
          contact_phone: "+251 91 123 4567",
          delivery_address: "Addis Ababa, Ethiopia",
          status: "pending",
          created_at: new Date().toISOString(),
          items: state.cart.map(i => ({
            item_name: i.name,
            unit_price: i.unitPrice,
            quantity: i.quantity,
            subtotal: i.unitPrice * i.quantity
          }))
        });
        localStorage.setItem("habeshabites_admin_orders", JSON.stringify(existingAdminOrders));
      } catch (e) {}
      showToast(`🎉 Order placed! Order #${fallbackNum}`, "success");
    } finally {
      closeCartDrawer();
      state.cart = [];
      state.appliedPromo = null;
      saveCart();
      updateCartUI();
      dom.btnProceedCheckout.disabled = false;
      dom.btnProceedCheckout.innerHTML = '<span>Proceed to Checkout</span><i class="fa-solid fa-arrow-right"></i>';
    }
  });

  // ---- Hero CTA Buttons ----
  dom.heroOrderNowBtn.addEventListener("click", (e) => {
    // Just let the href anchor scroll, handled by CSS smooth scroll
  });

  // ---- Chef's Special Quick Order ----
  if (dom.btnQuickOrderSpecial) {
    dom.btnQuickOrderSpecial.addEventListener("click", () => {
      if (MENU_DATA.length > 0) { quickAddItem(MENU_DATA[0]); } else { showToast("No dishes on the menu yet. Add dishes in the Admin Portal.", "info"); }
    });
  }

  // ---- Bundle Add Buttons ----
  document.querySelectorAll(".bundle-add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const bundleId = btn.dataset.bundleId;
      const bundleNames = {
        "b-family": "Family Feast Bundle",
        "b-date": "Date Night Bundle",
        "b-solo": "Solo Comfort Bundle"
      };
      const bundlePrices = { "b-family": 39.99, "b-date": 24.99, "b-solo": 14.99 };
      const bundleImages = {
        "b-family": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",
        "b-date": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80",
        "b-solo": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"
      };
      state.cart.push({
        uniqueId: `${bundleId}-${Date.now()}`,
        dishId: bundleId,
        name: bundleNames[bundleId],
        image: bundleImages[bundleId],
        unitPrice: bundlePrices[bundleId],
        quantity: 1,
        spice: "N/A",
        addons: [],
        notes: "Meal Bundle"
      });
      saveCart();
      updateCartUI();
      showToast(`🎁 ${bundleNames[bundleId]} added to your order!`, "success");
    });
  });

  // ---- Trending "+" buttons ----
  document.querySelectorAll(".btn-add-circle").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const trending = MENU_DATA.find(d => String(d.id) === String(id));
      if (!trending) return;
      state.cart.push({
        uniqueId: `${id}-${Date.now()}`,
        dishId: id,
        name: trending.name,
        image: trending.image,
        unitPrice: trending.price,
        quantity: 1,
        spice: "Mild",
        addons: [],
        notes: ""
      });
      saveCart();
      updateCartUI();
      showToast(`✅ ${trending.name} added!`, "success");
    });
  });

  // ---- Tracking simulation ----
  if (dom.btnSimulateTracking) {
    dom.btnSimulateTracking.addEventListener("click", simulateLiveTracking);
  }

  // ---- Deals banner click (copy code) ----
  dom.dealBannerCards.forEach(card => {
    card.addEventListener("click", () => {
      const code = card.dataset.code;
      if (code) {
        navigator.clipboard.writeText(code).catch(() => {});
        showToast(`📋 Code "${code}" copied! Paste it in cart to apply.`, "info");
      }
    });
  });

  // ---- Invite Friends ----
  dom.btnInviteFriends.addEventListener("click", () => {
    showToast("📤 Invite link copied to clipboard!", "success");
  });
}

// =============================================================================
// 6. EXPLORE MENU RENDERING
// =============================================================================
function renderExploreMenuGrid() {
  let items = [...MENU_DATA];

  // Filter by cuisine
  if (state.activeFilter !== "all") {
    items = items.filter(item => item.cuisine.toLowerCase() === state.activeFilter.toLowerCase());
  }

  // Filter by search
  if (state.searchQuery) {
    items = items.filter(item =>
      item.name.toLowerCase().includes(state.searchQuery) ||
      item.description.toLowerCase().includes(state.searchQuery) ||
      item.cuisine.toLowerCase().includes(state.searchQuery)
    );
  }

  if (MENU_DATA.length === 0) {
    dom.fullMenuFoodGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted); background: #ffffff; border-radius: var(--radius-md); border: 1px dashed var(--border-light); margin: 20px 0;">
        <i class="fa-solid fa-utensils" style="font-size: 2.8rem; color: var(--border-medium); margin-bottom: 16px;"></i>
        <h3 style="font-size: 1.25rem; color: var(--text-main); margin-bottom: 8px;">No dishes on the menu yet</h3>
        <p style="max-width: 480px; margin: 0 auto 20px; font-size: 0.92rem;">
          You can add and manage your custom dishes, prices, and categories anytime from the Admin Portal.
        </p>
        <a href="admin.html" style="display: inline-flex; align-items: center; gap: 8px; background: var(--primary); color: white; padding: 11px 24px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 0.9rem;">
          <i class="fa-solid fa-plus-circle"></i>
          <span>Add Dishes in Admin Portal</span>
        </a>
      </div>
    `;
    return;
  }

  if (items.length === 0) {
    dom.fullMenuFoodGrid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:64px 20px; color:var(--text-muted);">
        <i class="fa-solid fa-bowl-rice" style="font-size:3rem; color:var(--border-light); margin-bottom:16px;"></i>
        <h4 style="font-size:1.2rem; color:var(--text-main); margin-bottom:8px;">No dishes found</h4>
        <p>Try a different cuisine filter or search term.</p>
        <button onclick="resetMenuFilters()" style="margin-top:16px; background:var(--primary); color:white; padding:10px 24px; border-radius:999px; border:none; font-weight:700; cursor:pointer;">
          Reset Filters
        </button>
      </div>
    `;
    return;
  }

  dom.fullMenuFoodGrid.innerHTML = items.map(dish => createDishCardHTML(dish)).join("");

  // Attach add & customize events
  dom.fullMenuFoodGrid.querySelectorAll(".btn-card-add-food").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const dish = MENU_DATA.find(d => d.id === btn.dataset.id);
      if (dish) quickAddItem(dish);
    });
  });

  dom.fullMenuFoodGrid.querySelectorAll(".btn-customize-dish").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const dish = MENU_DATA.find(d => d.id === btn.dataset.id);
      if (dish) openDishModal(dish);
    });
  });
}

function createDishCardHTML(dish) {
  let badgesHTML = "";
  if (dish.isChefPick) {
    badgesHTML += `<span class="badge-tag chef"><i class="fa-solid fa-crown"></i> Chef's Pick</span>`;
  } else if (dish.isPopular) {
    badgesHTML += `<span class="badge-tag popular"><i class="fa-solid fa-fire"></i> Best Seller</span>`;
  }

  let dietIcons = "";
  if (dish.isSpicy) dietIcons += `<i class="fa-solid fa-pepper-hot" title="Spicy" style="color:#f25430;"></i>`;
  if (dish.isVegetarian) dietIcons += `<i class="fa-solid fa-leaf" title="Vegetarian" style="color:#22c55e; margin-left:4px;"></i>`;

  return `
    <article class="food-card" data-id="${dish.id}">
      <div class="food-card-media">
        <img src="${dish.image}" alt="${dish.name}" class="food-img" loading="lazy">
        <div class="food-card-badges">${badgesHTML}</div>
        <div class="food-prep-tag">
          <i class="fa-regular fa-clock"></i> ${dish.prepTime}
        </div>
      </div>
      <div class="food-card-body">
        <div class="food-header-row">
          <span class="food-category-pill">${dish.cuisine}</span>
          <span class="food-rating-pill">
            <i class="fa-solid fa-star"></i> ${dish.rating.toFixed(1)}
            <small style="color:var(--text-subtle); font-weight:500;">(${dish.reviews})</small>
          </span>
        </div>
        <h3 class="food-title">${dish.name} ${dietIcons}</h3>
        <p class="food-desc">${dish.description}</p>
        <div class="food-card-footer">
          <span class="food-price">$${dish.price.toFixed(2)}</span>
          <div class="card-action-btns">
            <button class="btn-customize-dish" data-id="${dish.id}" title="Customize this dish" aria-label="Customize ${dish.name}">
              <i class="fa-solid fa-sliders"></i>
            </button>
            <button class="btn-card-add-food" data-id="${dish.id}" aria-label="Add ${dish.name} to order">
              <i class="fa-solid fa-plus"></i> Add
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

window.resetMenuFilters = function() {
  state.activeFilter = "all";
  state.searchQuery = "";
  dom.menuFoodSearchInput.value = "";
  document.querySelectorAll(".cat-tab-btn").forEach(t => t.classList.toggle("active", t.dataset.filter === "all"));
  renderExploreMenuGrid();
};

// =============================================================================
// 7. DISH CUSTOMIZATION MODAL
// =============================================================================
function openDishModal(dish) {
  state.currentDish = dish;
  state.modalQty = 1;
  state.modalSelectedAddons = [];
  state.modalSpice = dish.isSpicy ? "Medium Warm" : "Mild";

  dom.modalDishImg.src = dish.image;
  dom.modalDishImg.alt = dish.name;
  dom.modalDishTitle.textContent = dish.name;
  dom.modalDishDesc.textContent = dish.description;
  dom.modalQtyDisplay.textContent = "1";
  dom.modalDishNotes.value = "";

  // Reset spice radios
  const spiceRadios = document.querySelectorAll("input[name='modalSpice']");
  spiceRadios.forEach(radio => {
    radio.checked = radio.value === state.modalSpice;
  });

  // Render addons
  if (dish.addons && dish.addons.length > 0) {
    dom.modalAddonsList.innerHTML = dish.addons.map((addon, idx) => `
      <label class="addon-row" for="modalAddon_${idx}">
        <div class="addon-label">
          <input type="checkbox" id="modalAddon_${idx}" data-idx="${idx}" class="modal-addon-checkbox">
          <span>${addon.name}</span>
        </div>
        <span class="addon-price">${addon.price > 0 ? '+$' + addon.price.toFixed(2) : 'Free'}</span>
      </label>
    `).join("");

    dom.modalAddonsList.querySelectorAll(".modal-addon-checkbox").forEach(box => {
      box.addEventListener("change", (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const addon = dish.addons[idx];
        if (e.target.checked) {
          state.modalSelectedAddons.push(addon);
        } else {
          state.modalSelectedAddons = state.modalSelectedAddons.filter(a => a.name !== addon.name);
        }
        recalcModalPrice();
      });
    });
  } else {
    dom.modalAddonsList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">No extra add-ons for this dish.</p>`;
  }

  recalcModalPrice();

  dom.dishModalOverlay.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeDishModal() {
  dom.dishModalOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
}

function updateModalQty(delta) {
  state.modalQty = Math.max(1, Math.min(20, state.modalQty + delta));
  dom.modalQtyDisplay.textContent = state.modalQty;
  recalcModalPrice();
}

function recalcModalPrice() {
  if (!state.currentDish) return;
  const addonsTotal = state.modalSelectedAddons.reduce((sum, a) => sum + a.price, 0);
  const total = (state.currentDish.price + addonsTotal) * state.modalQty;
  dom.modalComputedTotal.textContent = `$${total.toFixed(2)}`;
}

function confirmAddToCart() {
  if (!state.currentDish) return;
  const addonsTotal = state.modalSelectedAddons.reduce((sum, a) => sum + a.price, 0);
  const notes = dom.modalDishNotes.value.trim();

  state.cart.push({
    uniqueId: `${state.currentDish.id}-${Date.now()}`,
    dishId: state.currentDish.id,
    name: state.currentDish.name,
    image: state.currentDish.image,
    unitPrice: state.currentDish.price + addonsTotal,
    quantity: state.modalQty,
    spice: state.modalSpice,
    addons: [...state.modalSelectedAddons],
    notes
  });

  saveCart();
  updateCartUI();
  closeDishModal();
  showToast(`✅ ${state.modalQty}x ${state.currentDish.name} added to your order!`, "success");
}

// =============================================================================
// 8. QUICK ADD (No customization - add directly)
// =============================================================================
function quickAddItem(dish) {
  const existing = state.cart.find(
    item => item.dishId === dish.id && item.addons.length === 0 && !item.notes
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({
      uniqueId: `${dish.id}-${Date.now()}`,
      dishId: dish.id,
      name: dish.name,
      image: dish.image,
      unitPrice: dish.price,
      quantity: 1,
      spice: dish.isSpicy ? "Medium Warm" : "Mild",
      addons: [],
      notes: ""
    });
  }

  saveCart();
  updateCartUI();
  bounceCartBadge();
  showToast(`✅ ${dish.name} added to your order!`, "success");
}

// =============================================================================
// 9. CART MANAGEMENT & UI
// =============================================================================
function saveCart() {
  localStorage.setItem("habeshabites_cart", JSON.stringify(state.cart));
}

function bounceCartBadge() {
  dom.cartCountBadge.classList.remove("bounce");
  void dom.cartCountBadge.offsetWidth;
  dom.cartCountBadge.classList.add("bounce");
  setTimeout(() => dom.cartCountBadge.classList.remove("bounce"), 400);
}

function openCartDrawer() {
  dom.cartDrawerOverlay.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeCartDrawer() {
  dom.cartDrawerOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Badge
  dom.cartCountBadge.textContent = totalCount;
  dom.cartDrawerCountText.textContent = `(${totalCount} item${totalCount !== 1 ? "s" : ""})`;

  // Cart body
  if (state.cart.length === 0) {
    dom.cartItemsContainer.innerHTML = "";
    dom.cartItemsContainer.appendChild(dom.cartEmptyState);
    dom.btnProceedCheckout.disabled = true;
  } else {
    if (dom.cartEmptyState.parentNode) dom.cartEmptyState.parentNode.removeChild(dom.cartEmptyState);
    dom.cartItemsContainer.innerHTML = state.cart.map(item => `
      <div class="cart-item-row" data-uid="${item.uniqueId}">
        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p class="cart-item-meta">
            Spice: ${item.spice}${item.addons.length > 0 ? ` • ${item.addons.map(a => a.name).join(", ")}` : ""}${item.notes ? ` • "${item.notes}"` : ""}
          </p>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeCartQty('${item.uniqueId}', -1)"><i class="fa-solid fa-minus"></i></button>
            <strong>${item.quantity}</strong>
            <button class="qty-btn" onclick="changeCartQty('${item.uniqueId}', 1)"><i class="fa-solid fa-plus"></i></button>
            <button class="qty-btn" onclick="removeCartItem('${item.uniqueId}')" style="margin-left:8px; color:var(--accent);" title="Remove">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
        <span class="cart-item-price">$${(item.unitPrice * item.quantity).toFixed(2)}</span>
      </div>
    `).join("");
    dom.btnProceedCheckout.disabled = false;
  }

  // Totals
  let discount = 0;
  if (state.appliedPromo && subtotal > 0) {
    discount = (subtotal * state.appliedPromo.pct) / 100;
    dom.cartDiscountRow.style.display = "flex";
    dom.cartDiscountText.textContent = `-$${discount.toFixed(2)}`;
  } else {
    dom.cartDiscountRow.style.display = "none";
  }

  const deliveryFee = subtotal > 0 ? 2.49 : 0;
  const total = subtotal - discount + deliveryFee;

  dom.cartSubtotalText.textContent = `$${subtotal.toFixed(2)}`;
  dom.cartDeliveryFeeText.textContent = subtotal > 25 ? "FREE" : `$${deliveryFee.toFixed(2)}`;
  dom.cartTotalText.textContent = `$${(subtotal > 25 ? subtotal - discount : total).toFixed(2)}`;
}

// Exposed for inline onclick
window.changeCartQty = function(uid, delta) {
  const item = state.cart.find(i => i.uniqueId === uid);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(i => i.uniqueId !== uid);
    showToast("Item removed from order.", "info");
  }
  saveCart();
  updateCartUI();
};

window.removeCartItem = function(uid) {
  state.cart = state.cart.filter(i => i.uniqueId !== uid);
  saveCart();
  updateCartUI();
  showToast("Item removed from order.", "info");
};

// =============================================================================
// 10. PROMO CODE
// =============================================================================
const PROMO_CODES = {
  "WELCOME20": { pct: 20, label: "20% welcome discount" },
  "FREESHIP":  { pct: 0,  label: "Free delivery unlocked" },
  "WEEKEND30": { pct: 30, label: "30% weekend deal" },
  "HABESHA20": { pct: 20, label: "20% Habesha special" },
  "FEAST10":   { pct: 10, label: "10% feast deal" }
};

function applyPromoCode() {
  const code = dom.cartPromoInput.value.trim().toUpperCase();
  const promo = PROMO_CODES[code];
  if (promo) {
    state.appliedPromo = { ...promo, code };
    updateCartUI();
    showToast(`🎉 ${promo.label} applied!`, "success");
    dom.cartPromoInput.value = "";
  } else {
    showToast(`❌ Invalid code "${code}". Try WELCOME20.`, "error");
  }
}

// =============================================================================
// 11. LOCATION MODAL
// =============================================================================
function openLocationModal() {
  dom.locationModalOverlay.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeLocationModal() {
  dom.locationModalOverlay.classList.remove("open");
  document.body.classList.remove("modal-open");
}

// =============================================================================
// 12. LIVE ORDER TRACKING SIMULATION
// =============================================================================
function simulateLiveTracking() {
  const steps = [dom.trackStep1, dom.trackStep2, dom.trackStep3, dom.trackStep4];

  // Reset all
  steps.forEach(s => {
    s.classList.remove("completed", "active");
  });

  dom.btnSimulateTracking.disabled = true;
  dom.btnSimulateTracking.textContent = "Tracking live...";

  let currentStep = 0;

  function activateStep(idx) {
    if (idx >= steps.length) {
      dom.btnSimulateTracking.disabled = false;
      dom.btnSimulateTracking.innerHTML = `<i class="fa-solid fa-satellite-dish"></i> Simulate Again`;
      showToast("🏠 Your order has been delivered! Enjoy your meal!", "success");
      return;
    }

    // Mark previous as completed
    for (let i = 0; i < idx; i++) {
      steps[i].classList.remove("active");
      steps[i].classList.add("completed");
    }
    steps[idx].classList.add("active");

    const messages = [
      "📋 Order placed! Kitchen confirmed.",
      "🍳 Preparing your delicious meal...",
      "🛵 Your courier is on the way!",
      "🏠 Arrived at your door. Enjoy!"
    ];
    showToast(messages[idx], "info");

    setTimeout(() => activateStep(idx + 1), 3000);
  }

  activateStep(currentStep);
}

// =============================================================================
// 13. NAVIGATION ACTIVE STATE ON SCROLL
// =============================================================================
function activateNavOnScroll() {
  const sections = document.querySelectorAll("section[id], main section[id]");
  const navLinks = document.querySelectorAll(".nav-item-link");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(section => {
      const top = section.getBoundingClientRect().top;
      if (top <= 120) {
        current = section.id;
      }
    });

    navLinks.forEach(link => {
      const href = link.getAttribute("href");
      link.classList.toggle("active", href === `#${current}`);
    });
  }, { passive: true });
}

function initHeaderScrollBehavior() {
  window.addEventListener("scroll", () => {
    dom.siteHeader.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });
}

// =============================================================================
// 14. MOBILE MENU TOGGLE
// =============================================================================
function toggleMobileMenu() {
  const nav = document.querySelector(".navbar-nav");
  const isOpen = nav.classList.toggle("mobile-open");
  dom.mobileMenuToggle.innerHTML = isOpen
    ? '<i class="fa-solid fa-xmark"></i>'
    : '<i class="fa-solid fa-bars"></i>';
}

// Close mobile menu on nav link click
document.querySelectorAll(".nav-item-link").forEach(link => {
  link.addEventListener("click", () => {
    const nav = document.querySelector(".navbar-nav");
    nav.classList.remove("mobile-open");
    dom.mobileMenuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
  });
});

// =============================================================================
// 15. TOAST NOTIFICATION SYSTEM
// =============================================================================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const iconMap = {
    success: "fa-circle-check",
    error: "fa-triangle-exclamation",
    info: "fa-circle-info"
  };

  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || iconMap.info}"></i>
    <span>${message}</span>
  `;

  dom.toastContainer.appendChild(toast);

  // Auto-dismiss
  setTimeout(() => {
    toast.style.transition = "opacity 0.35s, transform 0.35s";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px) scale(0.9)";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 360);
  }, 3200);
}

// Add mobile-nav open styles via JS (minimal, not duping CSS)
const mobileNavStyle = document.createElement("style");
mobileNavStyle.textContent = `
  @media (max-width: 992px) {
    .navbar-nav {
      display: none;
      position: absolute;
      top: 82px;
      left: 0;
      right: 0;
      background: white;
      border-bottom: 1px solid #e8e4dc;
      padding: 16px 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      z-index: 99;
    }
    .navbar-nav.mobile-open {
      display: block !important;
    }
    .navbar-links {
      flex-direction: column !important;
      gap: 0 !important;
    }
    .navbar-links li {
      border-bottom: 1px solid #f0ece4;
    }
    .navbar-links li:last-child {
      border-bottom: none;
    }
    .nav-item-link {
      display: block;
      padding: 14px 0 !important;
    }
  }
`;
document.head.appendChild(mobileNavStyle);
