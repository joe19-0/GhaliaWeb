// ===== Mobile Menu =====
const linksUl = document.querySelector("ul.links");
const bars = document.querySelector(".bars");
const closeBtn = document.querySelector(".close-btn");
const menuOverlay = document.getElementById("menu-overlay");

function openMenu() {
    linksUl.classList.add("active");
    if (menuOverlay) menuOverlay.classList.add("active");
}

function closeMenu() {
    linksUl.classList.remove("active");
    if (menuOverlay) menuOverlay.classList.remove("active");
}

if (bars) bars.addEventListener("click", openMenu);
if (closeBtn) closeBtn.addEventListener("click", closeMenu);
if (menuOverlay) menuOverlay.addEventListener("click", closeMenu);

// Close menu when clicking a link inside it
if (linksUl) {
    linksUl.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeMenu);
    });
}

// ===== Fetch & Cache Products =====
// Using a Promise-based approach so index.js can wait for data
window.productsReady = new Promise(function (resolve) {
    const cached = localStorage.getItem("products");
    if (cached) {
        try {
            const data = JSON.parse(cached);
            if (Array.isArray(data) && data.length > 0) {
                resolve(data);
                // Still refresh cache in background
                fetch("products.json")
                    .then(r => r.json())
                    .then(function (fresh) {
                        localStorage.setItem("products", JSON.stringify(fresh));
                    })
                    .catch(function () {});
                return;
            }
        } catch (e) {}
    }
    fetch("products.json")
        .then(function (response) { return response.json(); })
        .then(function (data) {
            localStorage.setItem("products", JSON.stringify(data));
            resolve(data);
        })
        .catch(function (err) {
            console.error("فشل تحميل المنتجات:", err);
            resolve([]);
        });
});

// ===== Cart State =====
window.cart = JSON.parse(localStorage.getItem("ghalia_cart")) || [];
window.favorites = JSON.parse(localStorage.getItem("ghalia_favorites")) || [];

function saveCart() {
    localStorage.setItem("ghalia_cart", JSON.stringify(window.cart));
}
function saveFavorites() {
    localStorage.setItem("ghalia_favorites", JSON.stringify(window.favorites));
}

// ===== Toast Notification =====
window.showToast = function (msg, duration) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(function () { toast.classList.remove("show"); }, duration || 2500);
};

// ===== Badge Update =====
window.updateBadges = function () {
    const cartCount = window.cart.reduce(function (sum, item) { return sum + item.qty; }, 0);
    const favCount = window.favorites.length;
    const cartBadge = document.getElementById("cart-count");
    const favBadge = document.getElementById("fav-count");
    cartBadge.textContent = cartCount;
    cartBadge.style.display = cartCount > 0 ? "flex" : "none";
    favBadge.textContent = favCount;
    favBadge.style.display = favCount > 0 ? "flex" : "none";
};

// ===== Cart Drawer =====
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const closeCartBtn = document.getElementById("close-cart");
const cartItemsDiv = document.getElementById("cart-items");
const cartFooter = document.getElementById("cart-footer");
const cartTotalPrice = document.getElementById("cart-total-price");
const cartIcon = document.getElementById("cart-icon-wrapper");

function openCart() {
    cartDrawer.classList.add("active");
    cartOverlay.classList.add("active");
    renderCart();
}
function closeCart() {
    cartDrawer.classList.remove("active");
    cartOverlay.classList.remove("active");
}
if (cartIcon) cartIcon.addEventListener("click", openCart);
if (closeCartBtn) closeCartBtn.addEventListener("click", closeCart);
if (cartOverlay) cartOverlay.addEventListener("click", closeCart);

// Close cart when user clicks the nav link
const cartShopLink = document.getElementById("cart-shop-link");
if (cartShopLink) {
    cartShopLink.addEventListener("click", closeCart);
}

function renderCart() {
    if (window.cart.length === 0) {
        cartItemsDiv.innerHTML = `
            <div class="cart-empty">
                <i class="fa-solid fa-box-open"></i>
                <p>سلتكِ فارغة حتى الآن.</p>
                <a href="#rec-products" class="shop-btn" onclick="closeCart()">تصفحي المنتجات</a>
            </div>`;
        cartFooter.style.display = "none";
        return;
    }
    let total = 0;
    cartItemsDiv.innerHTML = window.cart.map(function (item, idx) {
        total += item.price * item.qty;
        return `
            <div class="cart-item-card">
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <p class="cart-item-name">${item.name}</p>
                    <p class="cart-item-price">${item.price} ج.م</p>
                    <div class="cart-item-qty">
                        <button onclick="changeQty(${idx}, -1)">−</button>
                        <span>${item.qty}</span>
                        <button onclick="changeQty(${idx}, 1)">+</button>
                    </div>
                </div>
                <i class="fa-solid fa-trash cart-item-remove" onclick="removeCartItem(${idx})"></i>
            </div>`;
    }).join("");
    cartFooter.style.display = "block";
    cartTotalPrice.textContent = total + " ج.م";
}

// ===== Checkout =====
function buildOrderMessage(customer) {
    let msg = "🛍️ *طلب جديد من متجر غالية*\n";
    msg += "─────────────────────\n";
    msg += "👤 *بيانات العميلة والتوصيل:*\n";
    msg += `• الاسم: ${customer.name}\n`;
    msg += `• الهاتف: ${customer.phone}\n`;
    msg += `• العنوان: ${customer.address}\n`;
    if (customer.notes) {
        msg += `• ملاحظات: ${customer.notes}\n`;
    }
    msg += "─────────────────────\n";
    msg += "📦 *تفاصيل المنتجات:*\n";
    let total = 0;
    window.cart.forEach(function (item, i) {
        const lineTotal = item.price * item.qty;
        total += lineTotal;
        msg += `\n${i + 1}. *${item.name}*\n`;
        msg += `   الكمية: ${item.qty} قطعة\n`;
        msg += `   السعر: ${item.price} ج.م × ${item.qty} = ${lineTotal} ج.م\n`;
    });
    msg += "\n─────────────────────\n";
    msg += `💰 *الإجمالي النهائي: ${total} ج.م*\n`;
    msg += "─────────────────────\n";
    msg += "أرجو تأكيد الطلب والبدء بالتجهيز. شكراً 🌸";
    return msg;
}

const checkoutBtn = document.getElementById("checkout-btn");
if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
    if (window.cart.length === 0) return;

    const nameInput = document.getElementById("order-customer-name");
    const phoneInput = document.getElementById("order-customer-phone");
    const addressInput = document.getElementById("order-customer-address");
    const notesInput = document.getElementById("order-customer-notes");

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const notes = notesInput ? notesInput.value.trim() : "";

    if (!name) {
        showToast("يرجى كتابة اسمكِ الكريم ✍️");
        nameInput.focus();
        return;
    }
    if (!phone) {
        showToast("يرجى إدخال رقم الهاتف للتواصل 📱");
        phoneInput.focus();
        return;
    }
    if (!address) {
        showToast("يرجى إدخال عنوان التوصيل بالتفصيل 📍");
        addressInput.focus();
        return;
    }

    const customer = { name: name, phone: phone, address: address, notes: notes };
    const message = buildOrderMessage(customer);
    const waUrl = "https://wa.me/201204308077?text=" + encodeURIComponent(message);

    // Open WhatsApp with the order and customer information
    window.open(waUrl, "_blank");

    // Clear form inputs
    nameInput.value = "";
    phoneInput.value = "";
    addressInput.value = "";
    if (notesInput) notesInput.value = "";

    // Clear the cart
    window.cart = [];
    saveCart();
    updateBadges();
    closeCart();
    showToast("✅ تم إرسال طلبكِ وبياناتكِ! سنتواصل معكِ قريباً.");
});
}

window.changeQty = function (idx, delta) {
    window.cart[idx].qty += delta;
    if (window.cart[idx].qty <= 0) window.cart.splice(idx, 1);
    saveCart();
    updateBadges();
    renderCart();
};
window.removeCartItem = function (idx) {
    window.cart.splice(idx, 1);
    saveCart();
    updateBadges();
    renderCart();
    showToast("تمت إزالة المنتج من السلة 🗑️");
};

window.addToCart = function (product) {
    const existing = window.cart.find(function (p) { return p.id === product.id; });
    if (existing) {
        existing.qty += 1;
        showToast("تمت إضافة قطعة أخرى إلى السلة ✨");
    } else {
        window.cart.push({ id: product.id, name: product.name, img: product.img, price: product.price, qty: 1 });
        showToast("تمت إضافة المنتج إلى سلتكِ 🛍️");
    }
    saveCart();
    updateBadges();
};

// ===== Favorites Drawer =====
const favDrawer = document.getElementById("fav-drawer");
const favOverlay = document.getElementById("fav-overlay");
const closeFavBtn = document.getElementById("close-fav");
const favItemsDiv = document.getElementById("fav-items");
const favIcon = document.getElementById("fav-icon-wrapper");

function openFav() {
    favDrawer.classList.add("active");
    favOverlay.classList.add("active");
    renderFavorites();
}
function closeFav() {
    favDrawer.classList.remove("active");
    favOverlay.classList.remove("active");
}
if (favIcon) favIcon.addEventListener("click", openFav);
if (closeFavBtn) closeFavBtn.addEventListener("click", closeFav);
if (favOverlay) favOverlay.addEventListener("click", closeFav);

function renderFavorites() {
    if (window.favorites.length === 0) {
        favItemsDiv.innerHTML = `
            <div class="fav-empty">
                <i class="fa-regular fa-heart"></i>
                <p>لم تضيفي أي منتج إلى المفضلة بعد.</p>
            </div>`;
        return;
    }
    favItemsDiv.innerHTML = window.favorites.map(function (item, idx) {
        return `
            <div class="fav-item-card">
                <img src="${item.img}" alt="${item.name}">
                <div class="fav-item-info">
                    <p class="fav-item-name">${item.name}</p>
                    <p class="fav-item-price">${item.price} ج.م</p>
                </div>
                <i class="fa-solid fa-heart-crack fav-item-remove" onclick="removeFavItem(${idx})"></i>
            </div>`;
    }).join("");
}

window.removeFavItem = function (idx) {
    const removed = window.favorites.splice(idx, 1)[0];
    saveFavorites();
    updateBadges();
    renderFavorites();
    // Update heart button in product cards
    document.querySelectorAll(".fav-product").forEach(function (btn) {
        if (parseInt(btn.dataset.id) === removed.id) {
            btn.classList.remove("active");
            btn.querySelector("i").classList.replace("fa-solid", "fa-regular");
        }
    });
    showToast("تمت إزالة المنتج من المفضلة 💔");
};

window.toggleFavorite = function (product, btn) {
    const idx = window.favorites.findIndex(function (p) { return p.id === product.id; });
    if (idx === -1) {
        window.favorites.push(product);
        btn.classList.add("active");
        btn.querySelector("i").classList.replace("fa-regular", "fa-solid");
        showToast("تمت إضافة المنتج إلى المفضلة ❤️");
    } else {
        window.favorites.splice(idx, 1);
        btn.classList.remove("active");
        btn.querySelector("i").classList.replace("fa-solid", "fa-regular");
        showToast("تمت إزالة المنتج من المفضلة 💔");
    }
    saveFavorites();
    updateBadges();
};

// ===== Product Modal =====
const productModal = document.getElementById("product-modal");
const modalOverlay = document.getElementById("modal-overlay");
const closeModalBtn = document.getElementById("close-modal");
const modalContent = document.getElementById("modal-content");

function openModal(product) {
    modalContent.innerHTML = `
        <img src="${product.img}" alt="${product.name}">
        <h3>${product.name}</h3>
        <div class="modal-info">
            <p>${product.benf}</p>
            <p>${product.ingred}</p>
            <p>${product.wieght}</p>
        </div>
        <p class="modal-price">${product.price} ج.م</p>
        <div class="modal-actions">
            <button class="modal-add-cart" onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')}); closeProductModal();">
                <i class="fa-solid fa-cart-plus"></i> أضيفيه للسلة
            </button>
            <a class="modal-wa-order" href="https://wa.me/201204308077?text=أريد%20الطلب:%20${encodeURIComponent(product.name)}%20-%20${product.price}%20ج.م" target="_blank">
                <i class="fa-brands fa-whatsapp"></i> اطلبيه الآن
            </a>
        </div>`;
    productModal.classList.add("active");
    modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
}
window.closeProductModal = function () {
    productModal.classList.remove("active");
    modalOverlay.classList.remove("active");
    document.body.style.overflow = "";
};
if (closeModalBtn) closeModalBtn.addEventListener("click", closeProductModal);
if (modalOverlay) modalOverlay.addEventListener("click", closeProductModal);

window.openProductModal = openModal;

// ===== Contact Form =====
window.handleContactForm = function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const message = document.getElementById("message").value.trim();
    const text = `مرحباً، أنا ${name}\nرقم هاتفي: ${phone}\n\n${message}`;
    const waUrl = `https://wa.me/201204308077?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
};

// ===== Init =====
updateBadges();
