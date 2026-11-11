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

function hasVal(val) {
    return val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim() !== 'undefined' && String(val).trim() !== 'null';
}

function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#39;');
}

// ===== Check if product/variant is favorited =====
window.isFavorite = function (productId, variantId) {
    if (!Array.isArray(window.favorites)) return false;
    var targetProdId = String(productId);
    var hasTargetVar = (variantId !== null && variantId !== undefined && String(variantId) !== '');
    var targetVarId  = hasTargetVar ? String(variantId) : null;

    return window.favorites.some(function (f) {
        var fProdId = String(f.productId !== undefined ? f.productId : f.id);
        var fHasVar = (f.variantId !== null && f.variantId !== undefined && String(f.variantId) !== '');
        var fVarId  = fHasVar ? String(f.variantId) : null;

        // If target specifically has a variant:
        if (targetVarId !== null) {
            if (fVarId !== null) {
                return fProdId === targetProdId && fVarId === targetVarId;
            }
            // Match legacy favorites where f.id matches variantId
            return String(f.id) === targetVarId || (fProdId === targetProdId && !f.label);
        }

        // Target has no variant specified (base product check)
        return fProdId === targetProdId;
    });
};

// ===== Sync all visible heart buttons on page =====
window.updateHeartButtons = function () {
    document.querySelectorAll('.product').forEach(function (card) {
        var prodId = card.dataset.id;
        if (!prodId) return;
        var varId = card.dataset.selectedVariantId;
        var btn = card.querySelector('.fav-product');
        if (!btn) return;

        var isFav = window.isFavorite(prodId, varId);
        btn.classList.toggle('active', isFav);
        var icon = btn.querySelector('i');
        if (icon) {
            if (isFav) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
            } else {
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
            }
        }
    });
};

// ===== Navigate to Exact Product on products.html =====
window.goToProductFromFav = function (productId, variantId) {
    if (typeof closeFav === 'function') closeFav();

    var isProductsPage = window.location.pathname.endsWith('products.html') || window.location.href.indexOf('products.html') !== -1;

    if (isProductsPage && typeof window.scrollToProduct === 'function') {
        window.scrollToProduct(productId, variantId);
    } else {
        var url = 'products.html?prod=' + encodeURIComponent(productId);
        if (variantId !== null && variantId !== undefined && String(variantId) !== '') {
            url += '&var=' + encodeURIComponent(variantId);
        }
        url += '#product-' + productId;
        window.location.href = url;
    }
};

function renderFavorites() {
    if (!favItemsDiv) return;
    if (window.favorites.length === 0) {
        favItemsDiv.innerHTML = `
            <div class="fav-empty">
                <i class="fa-regular fa-heart"></i>
                <p>لم تضيفي أي منتج إلى المفضلة بعد.</p>
                <a href="products.html" class="shop-btn" onclick="closeFav()">تصفحي المنتجات</a>
            </div>`;
        return;
    }
    favItemsDiv.innerHTML = window.favorites.map(function (item, idx) {
        var prodId = item.productId !== undefined ? item.productId : item.id;
        var varId = (item.variantId !== null && item.variantId !== undefined) ? item.variantId : '';
        var labelHtml = hasVal(item.label) ?
            `<span class="fav-item-shape"><i class="fa-solid fa-shapes"></i> ${escHtml(item.label)}</span>` : '';

        return `
            <div class="fav-item-card" data-product-id="${prodId}" data-variant-id="${varId}" onclick="goToProductFromFav(${prodId}, '${varId}')" role="button" tabindex="0" title="اضغطي للانتقال إلى هذا المنتج في المتجر">
                <img src="${escHtml(item.img)}" alt="${escHtml(item.name)}">
                <div class="fav-item-info">
                    <p class="fav-item-name">${escHtml(item.name)}</p>
                    ${labelHtml}
                    <p class="fav-item-price">${item.price} <span>ج.م</span></p>
                </div>
                <div class="fav-item-actions">
                    <button type="button" class="fav-item-goto" title="عرض في المتجر" aria-label="عرض في المتجر">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <i class="fa-solid fa-heart-crack fav-item-remove" title="إزالة من المفضلة" onclick="event.stopPropagation(); removeFavItem(${idx});" role="button" aria-label="إزالة من المفضلة"></i>
                </div>
            </div>`;
    }).join("");
}

window.removeFavItem = function (idx) {
    if (idx < 0 || idx >= window.favorites.length) return;
    const removed = window.favorites.splice(idx, 1)[0];
    saveFavorites();
    updateBadges();
    renderFavorites();
    window.updateHeartButtons();
    var labelTxt = removed.label ? " (" + removed.label + ")" : "";
    showToast("تمت إزالة «" + (removed.name || "المنتج") + labelTxt + "» من المفضلة 💔");
};

window.toggleFavorite = function (product, btn, variant) {
    if (!product) return;

    // Detect variant from card if not explicitly provided
    if (!variant && btn) {
        var card = btn.closest('.product');
        if (card && card.dataset.selectedVariantId && typeof getAllVariants === 'function') {
            var vars = getAllVariants(product);
            variant = vars.find(function (v) { return String(v.id) === String(card.dataset.selectedVariantId); });
        }
    }

    var targetProdId = String(product.id);
    var targetVarId  = variant ? String(variant.id) : null;

    var idx = window.favorites.findIndex(function (f) {
        var fProdId = String(f.productId !== undefined ? f.productId : f.id);
        var fHasVar = (f.variantId !== null && f.variantId !== undefined && String(f.variantId) !== '');
        var fVarId  = fHasVar ? String(f.variantId) : null;

        if (targetVarId !== null && fVarId !== null) {
            return fProdId === targetProdId && fVarId === targetVarId;
        }
        if (targetVarId !== null) {
            return String(f.id) === targetVarId || (fProdId === targetProdId && !f.label);
        }
        return fProdId === targetProdId;
    });

    if (idx === -1) {
        var favItem = {
            id: targetVarId !== null ? parseInt(targetVarId) : product.id,
            productId: product.id,
            variantId: targetVarId !== null ? parseInt(targetVarId) : null,
            name: product.name,
            label: (variant && hasVal(variant.label)) ? variant.label : (hasVal(product.label) ? product.label : ''),
            img: (variant && hasVal(variant.img)) ? variant.img : product.img,
            price: (variant && hasVal(variant.price)) ? variant.price : product.price,
            category: product.category || ''
        };
        window.favorites.push(favItem);
        var labelTxt = favItem.label ? " (" + favItem.label + ")" : "";
        showToast("تمت إضافة «" + favItem.name + labelTxt + "» إلى المفضلة ❤️");
    } else {
        var removed = window.favorites.splice(idx, 1)[0];
        var labelTxt2 = removed.label ? " (" + removed.label + ")" : "";
        showToast("تمت إزالة «" + removed.name + labelTxt2 + "» من المفضلة 💔");
    }

    saveFavorites();
    updateBadges();
    renderFavorites();
    window.updateHeartButtons();
};

// Auto-migrate legacy favorites when products load
window.productsReady.then(function (products) {
    if (!Array.isArray(products) || !products.length || !Array.isArray(window.favorites)) return;
    var changed = false;
    window.favorites.forEach(function (f) {
        if (f.productId === undefined) {
            f.productId = f.id;
            changed = true;
        }
        var prod = products.find(function (p) { return p.id === f.productId; });
        if (prod) {
            if (!hasVal(f.name) && prod.name) { f.name = prod.name; changed = true; }
            if (!hasVal(f.img) && prod.img)   { f.img = prod.img;   changed = true; }
            if (!hasVal(f.price) && prod.price) { f.price = prod.price; changed = true; }
            if (!hasVal(f.label)) {
                if (hasVal(prod.label)) {
                    f.label = prod.label;
                    changed = true;
                } else if (Array.isArray(prod.variants) && prod.variants.length && hasVal(prod.variants[0].label)) {
                    f.label = prod.variants[0].label;
                    changed = true;
                }
            }
            if (f.variantId === undefined && Array.isArray(prod.variants) && prod.variants.length) {
                var matched = prod.variants.find(function (v) { return v.img === f.img || v.label === f.label || v.id === f.id; });
                f.variantId = matched ? matched.id : prod.id;
                changed = true;
            }
        }
    });
    if (changed) {
        saveFavorites();
        renderFavorites();
        window.updateHeartButtons();
    }
});

// ===== Product Modal =====
const productModal = document.getElementById("product-modal");
const modalOverlay = document.getElementById("modal-overlay");
const closeModalBtn = document.getElementById("close-modal");
const modalContent = document.getElementById("modal-content");

function openModal(product) {
    var infoHtml = '';
    if (hasVal(product.benf)) {
        infoHtml += '<p><i class="fa-solid fa-leaf" style="color:var(--sec-color);margin-left:6px;"></i>' + product.benf + '</p>';
    }
    if (hasVal(product.ingred)) {
        infoHtml += '<p><i class="fa-solid fa-flask" style="color:var(--sec-color);margin-left:6px;"></i>' + product.ingred + '</p>';
    }
    if (hasVal(product.wieght)) {
        infoHtml += '<p><i class="fa-solid fa-weight-hanging" style="color:var(--sec-color);margin-left:6px;"></i>' + product.wieght + '</p>';
    }
    var infoDiv = infoHtml ? '<div class="modal-info">' + infoHtml + '</div>' : '';

    var priceHtml = hasVal(product.price) ? '<p class="modal-price">' + product.price + ' <span>ج.م</span></p>' : '';
    var waUrl = "https://wa.me/201204308077?text=" + encodeURIComponent("أريد الطلب: " + product.name + (hasVal(product.price) ? " - " + product.price + " ج.م" : ""));

    modalContent.innerHTML = `
        <img src="${product.img}" alt="${product.name}">
        <h3>${product.name}</h3>
        ${infoDiv}
        ${priceHtml}
        <div class="modal-actions">
            <button class="modal-add-cart" id="base-modal-add-cart" type="button">
                <i class="fa-solid fa-cart-plus"></i> أضيفيه للسلة
            </button>
            <a class="modal-wa-order" href="${waUrl}" target="_blank" rel="noopener">
                <i class="fa-brands fa-whatsapp"></i> اطلبيه الآن
            </a>
        </div>`;

    var cartBtn = document.getElementById("base-modal-add-cart");
    if (cartBtn) {
        cartBtn.addEventListener("click", function () {
            window.addToCart(product);
            window.closeProductModal();
        });
    }

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

// ===== Lightweight Scroll Animations (IntersectionObserver) =====
(function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
        // Fallback for very old browsers
        document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
            el.classList.add('revealed');
        });
        return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    window.observeScrollElements = function () {
        document.querySelectorAll('.reveal-on-scroll:not(.revealed)').forEach(function (el) {
            observer.observe(el);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.observeScrollElements);
    } else {
        window.observeScrollElements();
    }
})();
