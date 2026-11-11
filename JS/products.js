// ===== Products Page JS =====
// Always fetch fresh data on the products page
localStorage.removeItem('products');

// ===== Helper: Check if key & value are not null/empty =====
function hasVal(val) {
    return val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim() !== 'undefined' && String(val).trim() !== 'null';
}

// ===== Category Definitions =====
var categoryLabels = {
    soaps:    'الصابون الطبيعي',
    diffuser: 'الفواحات',
    deodrant: 'مزيل العرق',
    specBox:  'بوكس الهدايا'
};

var categoryIcons = {
    soaps:    'fa-soap',
    diffuser: 'fa-wind',
    deodrant: 'fa-spray-can-sparkles',
    specBox:  'fa-gift'
};

var FIXED_CATEGORIES = [
    { key: 'soaps',    label: 'الصابون الطبيعي', icon: 'fa-soap' },
    { key: 'diffuser', label: 'الفواحات',         icon: 'fa-wind' },
    { key: 'deodrant', label: 'مزيل العرق',      icon: 'fa-spray-can-sparkles' },
    { key: 'specBox',  label: 'بوكس الهدايا',    icon: 'fa-gift' }
];

// ===== Helper: Get All Variants for a Product =====
function getAllVariants(product) {
    if (!product || !Array.isArray(product.variants) || !product.variants.length) return [];
    var list = [];
    if (hasVal(product.label)) {
        list.push({
            id: product.id,
            img: product.img,
            wieght: product.wieght,
            price: product.price,
            label: product.label
        });
    }
    product.variants.forEach(function (v) {
        if (!v) return;
        var exists = list.some(function (item) {
            return item.id === v.id || (hasVal(item.label) && item.label === v.label);
        });
        if (!exists) {
            list.push(v);
        }
    });
    return list;
}

// ===== Helper: Get Descriptive Variant Selector Label =====
function getVariantSelectorLabel(variants) {
    if (!variants || !variants.length) return '<i class="fa-solid fa-palette"></i> الخيار:';
    var labels = variants.map(function(v) { return hasVal(v.label) ? v.label : ''; }).join(' ');
    if (/عطر|رائحة|فانيليا|ورد|ليمون|فراولة/.test(labels) && /حجم|كبير|صغير/.test(labels)) {
        return '<i class="fa-solid fa-ruler-combined"></i> الحجم والعطر:';
    }
    if (/عطر|رائحة/.test(labels)) {
        return '<i class="fa-solid fa-bottle-droplet"></i> العطر:';
    }
    if (/شكل بحري|شكل حيوانات|شكل فواكه|شكل حروف|بحري|حيوانات|فواكه|حروف/.test(labels)) {
        return '<i class="fa-solid fa-shapes"></i> الشكل:';
    }
    if (/حجم|كبير|صغير/.test(labels)) {
        return '<i class="fa-solid fa-ruler-combined"></i> الحجم:';
    }
    return '<i class="fa-solid fa-palette"></i> الخيار:';
}

// ===== Session Storage Filter State =====
var SESSION_KEY = 'ghalia_filters';

function loadFilterState() {
    try {
        var saved = sessionStorage.getItem(SESSION_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
}

function saveFilterState(state) {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch (e) {}
}

function clearFilterState() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
}

// ===== Global State =====
var allProducts    = [];
var activeCategory = 'all';
var activeSort     = 'default';
var minPrice       = 0;
var maxPrice       = Infinity;

// ===== Wait for Products Data =====
window.productsReady.then(function (products) {
    // Filter out empty/invalid entries
    products = (products || []).filter(function (p) {
        return p && p.id !== undefined && hasVal(p.name) && hasVal(p.img);
    });

    // Update hero stat products count to match JSON
    var heroCountSpan = document.getElementById('hero-products-count');
    if (heroCountSpan) {
        heroCountSpan.textContent = products.length;
    } else {
        var heroStat = document.querySelector('.hero-stats .hero-stat');
        if (heroStat) {
            heroStat.innerHTML = '<i class="fa-solid fa-boxes-stacked"></i> ' + products.length + ' منتج';
        }
    }

    if (!products.length) {
        var c = document.getElementById('products-page-container');
        if (c) c.innerHTML = '<div class="no-results"><i class="fa-solid fa-box-open"></i><p>لا توجد منتجات حالياً.</p></div>';
        return;
    }

    allProducts = products;

    // Compute price bounds
    var prices = [];
    products.forEach(function (p) {
        if (hasVal(p.price) && !isNaN(Number(p.price))) prices.push(Number(p.price));
        var vars = getAllVariants(p);
        vars.forEach(function (v) {
            if (hasVal(v.price) && !isNaN(Number(v.price))) prices.push(Number(v.price));
        });
    });
    var dataMin = prices.length ? Math.min.apply(null, prices) : 0;
    var dataMax = prices.length ? Math.max.apply(null, prices) : 100;

    var minInput  = document.getElementById('price-min');
    var maxInput  = document.getElementById('price-max');
    var sortSel   = document.getElementById('sort-select');
    var resetBtn  = document.getElementById('reset-filters');

    if (minInput) { minInput.min = dataMin; minInput.max = dataMax; minInput.placeholder = dataMin + ' ج.م'; }
    if (maxInput) { maxInput.min = dataMin; maxInput.max = dataMax; maxInput.placeholder = dataMax + ' ج.م'; }

    // Check URL parameters first (?cat=... / ?prod=... / ?var=...)
    var urlParams = new URLSearchParams(window.location.search);
    var urlCat  = urlParams.get('cat');
    var urlProd = urlParams.get('prod');
    var urlVar  = urlParams.get('var');

    if (urlProd) {
        var targetP = products.find(function (p) { return String(p.id) === String(urlProd); });
        if (targetP && targetP.category) {
            activeCategory = targetP.category;
        } else {
            activeCategory = 'all';
        }
    } else if (urlCat) {
        activeCategory = urlCat;
    } else {
        // Restore saved session state
        var saved = loadFilterState();
        if (saved) {
            activeCategory = saved.category  || 'all';
            activeSort     = saved.sort      || 'default';
            minPrice       = saved.minPrice  || 0;
            maxPrice       = (saved.maxPrice !== null && saved.maxPrice !== undefined) ? saved.maxPrice : Infinity;

            if (sortSel)  sortSel.value  = activeSort;
            if (minInput && minPrice > 0)        minInput.value = minPrice;
            if (maxInput && maxPrice < Infinity) maxInput.value = maxPrice;
        }
    }

    // Build the fixed category tabs
    buildCategoryTabs();

    // Initialize Filter Bar Open / Close Toggle
    initFilterToggle();

    applyFilters();

    // Check if opened with ?prod=... (&var=...)
    if (urlProd) {
        setTimeout(function () {
            if (typeof window.scrollToProduct === 'function') {
                window.scrollToProduct(urlProd, urlVar);
            }
        }, 220);
    }

    // Filter Tab Clicks
    document.addEventListener('click', function (e) {
        var tab = e.target.closest('.filter-tab');
        if (!tab) return;
        document.querySelectorAll('.filter-tab').forEach(function (t) {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        activeCategory = tab.dataset.category;
        persistAndApply();
    });

    // Sort
    if (sortSel) {
        sortSel.addEventListener('change', function () {
            activeSort = sortSel.value;
            persistAndApply();
        });
    }

    // Price Range (debounced)
    var priceTimer;
    function onPriceChange() {
        clearTimeout(priceTimer);
        priceTimer = setTimeout(function () {
            minPrice = minInput && minInput.value !== '' ? parseFloat(minInput.value) : 0;
            maxPrice = maxInput && maxInput.value !== '' ? parseFloat(maxInput.value) : Infinity;
            persistAndApply();
        }, 350);
    }
    if (minInput) minInput.addEventListener('input', onPriceChange);
    if (maxInput) maxInput.addEventListener('input', onPriceChange);

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            activeCategory = 'all';
            activeSort     = 'default';
            minPrice       = 0;
            maxPrice       = Infinity;
            if (minInput) minInput.value = '';
            if (maxInput) maxInput.value = '';
            if (sortSel)  sortSel.value  = 'default';
            document.querySelectorAll('.filter-tab').forEach(function (t) {
                t.classList.toggle('active', t.dataset.category === 'all');
                t.setAttribute('aria-selected', t.dataset.category === 'all' ? 'true' : 'false');
            });
            clearFilterState();
            applyFilters();
        });
    }
});

// ===== Build Category Tabs =====
function buildCategoryTabs() {
    var tabsContainer = document.getElementById('filter-tabs');
    if (!tabsContainer) return;

    var html = '<button class="filter-tab' + (activeCategory === 'all' ? ' active' : '') +
               '" data-category="all" role="tab" aria-selected="' + (activeCategory === 'all') + '">الكل</button>';

    FIXED_CATEGORIES.forEach(function (cat) {
        var isActive = activeCategory === cat.key;
        html += '<button class="filter-tab' + (isActive ? ' active' : '') +
                '" data-category="' + cat.key + '" role="tab" aria-selected="' + isActive + '">' +
                '<i class="fa-solid ' + cat.icon + '"></i> ' + cat.label + '</button>';
    });

    tabsContainer.innerHTML = html;
}

// ===== Filter Bar Open / Close Toggle =====
function initFilterToggle() {
    var filterBar    = document.getElementById('products-filter-bar');
    var toggleHeader = document.getElementById('filter-toggle-header');
    var toggleBtn    = document.getElementById('filter-toggle-btn');
    var toggleText   = document.getElementById('toggle-filter-text');
    if (!filterBar || !toggleHeader) return;

    function toggleFilterState(openExplicitly) {
        var isCurrentlyCollapsed = filterBar.classList.contains('is-collapsed');
        var shouldOpen = (openExplicitly !== undefined) ? openExplicitly : isCurrentlyCollapsed;

        if (shouldOpen) {
            filterBar.classList.remove('is-collapsed');
            toggleHeader.setAttribute('aria-expanded', 'true');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
            if (toggleText) toggleText.textContent = 'إخفاء الفلاتر';
        } else {
            filterBar.classList.add('is-collapsed');
            toggleHeader.setAttribute('aria-expanded', 'false');
            if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
            if (toggleText) toggleText.textContent = 'عرض الفلاتر';
        }
    }

    toggleHeader.addEventListener('click', function (e) {
        toggleFilterState();
    });

    toggleHeader.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleFilterState();
        }
    });
}

// ===== Update Active Filter Badge in Header =====
function updateFilterActiveIndicator() {
    var indicator = document.getElementById('filter-active-indicator');
    if (!indicator) return;

    var activeItems = [];
    if (activeCategory !== 'all') {
        activeItems.push(categoryLabels[activeCategory] || activeCategory);
    }
    if (minPrice > 0 || (maxPrice !== Infinity && maxPrice !== null && maxPrice < 1000)) {
        activeItems.push('تحديد السعر');
    }
    if (activeSort !== 'default') {
        activeItems.push(activeSort === 'asc' ? 'الأقل سعراً' : 'الأعلى سعراً');
    }

    if (activeItems.length > 0) {
        indicator.textContent = activeItems.join(' • ');
        indicator.style.display = 'inline-flex';
    } else {
        indicator.style.display = 'none';
    }
}

// ===== Persist & Apply =====
function persistAndApply() {
    saveFilterState({
        category: activeCategory,
        sort:     activeSort,
        minPrice: minPrice < Infinity ? minPrice : 0,
        maxPrice: maxPrice < Infinity ? maxPrice : null
    });
    applyFilters();
}

// ===== Apply Filters & Sort =====
function applyFilters() {
    updateFilterActiveIndicator();

    var filtered = allProducts.filter(function (p) {
        if (activeCategory !== 'all' && p.category !== activeCategory) return false;
        var pPrice = hasVal(p.price) && !isNaN(Number(p.price)) ? Number(p.price) : null;
        if (pPrice !== null) {
            if (pPrice < minPrice) return false;
            if (maxPrice !== Infinity && pPrice > maxPrice) return false;
        } else if (p.category === 'specBox') {
            // specBox starts at 300
            if (minPrice > 300) return false;
        }
        return true;
    });

    if (activeSort === 'asc')  filtered.sort(function (a, b) { return (Number(a.price) || 300) - (Number(b.price) || 300); });
    if (activeSort === 'desc') filtered.sort(function (a, b) { return (Number(b.price) || 300) - (Number(a.price) || 300); });

    renderProducts(filtered);
}

// ===== Render Products =====
function renderProducts(products) {
    var container = document.getElementById('products-page-container');
    var countEl   = document.getElementById('results-count');
    if (!container) return;

    // Update results count
    if (countEl) {
        countEl.innerHTML = '<i class="fa-solid fa-layer-group" style="font-size:11px;opacity:.7;"></i> يتم عرض ' + products.length + ' منتج';
    }

    if (!products.length) {
        container.innerHTML =
            '<div class="no-results">' +
                '<i class="fa-solid fa-magnifying-glass"></i>' +
                '<p>لا توجد منتجات تطابق معايير البحث.</p>' +
                '<p class="no-results-sub">جربي تغيير الفلاتر أو اضغطي على «إعادة ضبط».</p>' +
            '</div>';
        return;
    }

    var html = '<div class="products-page-grid products-grid-fade-in">';
    products.forEach(function (product) {
        var catLabel = hasVal(product.category) && categoryLabels[product.category] ? categoryLabels[product.category] : '';
        var catIcon  = hasVal(product.category) && categoryIcons[product.category]  ? categoryIcons[product.category]  : 'fa-tag';

        // Variants
        var variants = getAllVariants(product);
        var initialVarId = variants.length ? variants[0].id : null;
        var isFav = (typeof window.isFavorite === 'function') ?
            window.isFavorite(product.id, initialVarId) :
            window.favorites.some(function (f) { return f.id === product.id; });

        var variantsHtml = '';
        if (variants.length > 0) {
            var selectorLabel = getVariantSelectorLabel(variants);
            var chips = variants.map(function (v, i) {
                return '<button class="variant-chip' + (i === 0 ? ' active' : '') +
                       '" data-variant-id="' + v.id + '" type="button">' +
                       escHtml(v.label) + '</button>';
            }).join('');
            variantsHtml =
                '<div class="variant-selector">' +
                    '<span class="variant-label">' + selectorLabel + '</span>' +
                    '<div class="variant-chips">' + chips + '</div>' +
                '</div>';
        }

        // Selected / initial values
        var initialImg    = variants.length && hasVal(variants[0].img) ? variants[0].img : product.img;
        var initialWeight = variants.length && hasVal(variants[0].wieght) ? variants[0].wieght : product.wieght;
        var initialPrice  = variants.length && hasVal(variants[0].price)  ? variants[0].price  : product.price;

        // Content items
        var isSpecBox = product.category === 'specBox';
        var nameHtml   = hasVal(product.name) ? '<p class="name">' + escHtml(product.name) + '</p>' : '';
        var benfHtml   = hasVal(product.benf) ? '<p class="benf">' + escHtml(product.benf) + '</p>' : '';
        var weightHtml = hasVal(initialWeight) ? '<p class="product-weight"><i class="fa-solid fa-weight-hanging"></i> ' + escHtml(initialWeight) + '</p>' : '';
        var noteHtml   = hasVal(product.note)  ? '<p class="benf specbox-card-note"><i class="fa-solid fa-sparkles"></i> ' + escHtml(product.note) + '</p>' : '';
        
        var priceHtml  = '';
        if (hasVal(initialPrice) && !isNaN(Number(initialPrice))) {
            priceHtml = '<div class="prices"><p class="price">' + initialPrice + ' <span>ج.م</span></p></div>';
        } else if (isSpecBox) {
            priceHtml = '<div class="prices specbox-card-prices">' +
                '<p class="price specbox-start-price">يبدأ من 300 <span>ج.م</span></p>' +
                '<p class="specbox-note-sub"><i class="fa-solid fa-gift"></i> حسب اختيارك وتنسيقك</p>' +
            '</div>';
        } else if (hasVal(initialPrice)) {
            priceHtml = '<div class="prices"><p class="price" style="font-size:13px;color:var(--text-sec);">' + escHtml(initialPrice) + '</p></div>';
        }

        var cardBtnHtml = isSpecBox ?
            '<a href="https://wa.me/201204308077?text=' + encodeURIComponent('مرحباً، أريد طلب وتنسيق بوكس الهدايا المميز من متجر غالية 🎁') + '" target="_blank" rel="noopener" class="add-cart-btn specbox-card-btn" aria-label="نسقي بوكسك عبر واتساب">' +
                '<i class="fa-brands fa-whatsapp"></i> نسّقي واطلبي بوكسكِ' +
            '</a>' :
            '<button class="add-cart-btn" type="button" aria-label="أضيفيه للسلة">' +
                '<i class="fa-solid fa-cart-plus"></i> أضيفيه للسلة' +
            '</button>';

        html +=
            '<article class="product products-page-card' + (isSpecBox ? ' product-specbox-card' : '') + '" id="product-' + product.id + '" data-id="' + product.id + '"' +
                (variants.length ? ' data-selected-variant-id="' + variants[0].id + '"' : '') + '>' +
                // Category badge
                (catLabel ?
                    '<span class="cat-badge" data-cat="' + product.category + '"><i class="fa-solid ' + catIcon + '"></i> ' + escHtml(catLabel) + '</span>'
                    : '') +
                // Image
                '<div class="img">' +
                    '<button class="fav-product ' + (isFav ? 'active' : '') + '" data-id="' + product.id + '" type="button" aria-label="أضيفيه للمفضلة" title="أضيفيه للمفضلة">' +
                        '<i class="' + (isFav ? 'fa-solid' : 'fa-regular') + ' fa-heart"></i>' +
                    '</button>' +
                    '<img src="' + escHtml(initialImg) + '" alt="' + escHtml(product.name) + '" loading="lazy">' +
                    '<div class="img-overlay"><i class="fa-solid fa-circle-info"></i><span>التفاصيل</span></div>' +
                '</div>' +
                // Content
                '<div class="content">' +
                    nameHtml +
                    benfHtml +
                    noteHtml +
                    weightHtml +
                    variantsHtml +
                    priceHtml +
                '</div>' +
                // Stars
                '<div class="stars">' +
                    '<i class="fa-solid fa-star"></i>' +
                    '<i class="fa-solid fa-star"></i>' +
                    '<i class="fa-solid fa-star"></i>' +
                    '<i class="fa-solid fa-star"></i>' +
                    '<i class="fa-solid fa-star"></i>' +
                    '<span class="stars-text">5.0</span>' +
                '</div>' +
                // Cart / Order button
                cardBtnHtml +
            '</article>';
    });
    html += '</div>';

    container.innerHTML = html;
    attachProductEvents(products);
}

// ===== Attach Events =====
function attachProductEvents(products) {
    var container = document.getElementById('products-page-container');
    if (!container) return;

    // Variant chip clicks on card
    container.querySelectorAll('.product').forEach(function (card) {
        var id = parseInt(card.dataset.id);
        var product = products.find(function (p) { return p.id === id; });
        if (!product) return;
        var variants = getAllVariants(product);
        if (!variants.length) return;

        var chips = card.querySelectorAll('.variant-chip');
        chips.forEach(function (chip) {
            chip.addEventListener('click', function (e) {
                e.stopPropagation();
                chips.forEach(function (c) { c.classList.remove('active'); });
                chip.classList.add('active');

                var vid = chip.dataset.variantId;
                card.dataset.selectedVariantId = vid;
                var variant = variants.find(function (v) { return String(v.id) === String(vid); });
                if (variant) {
                    // Update Image with smooth soft fade
                    var imgEl = card.querySelector('.img img');
                    if (imgEl && hasVal(variant.img)) {
                        imgEl.classList.remove('img-variant-switch');
                        void imgEl.offsetWidth;
                        imgEl.src = variant.img;
                        imgEl.classList.add('img-variant-switch');
                    }

                    // Update Weight
                    var weightEl = card.querySelector('.product-weight');
                    if (weightEl) {
                        var w = hasVal(variant.wieght) ? variant.wieght : product.wieght;
                        if (hasVal(w)) {
                            weightEl.innerHTML = '<i class="fa-solid fa-weight-hanging"></i> ' + escHtml(w);
                            weightEl.style.display = '';
                        }
                    }

                    // Update Price with animation
                    var priceEl = card.querySelector('.price');
                    if (priceEl && hasVal(variant.price)) {
                        priceEl.innerHTML = variant.price + ' <span>ج.م</span>';
                        priceEl.classList.remove('price-updated');
                        void priceEl.offsetWidth;
                        priceEl.classList.add('price-updated');
                    }

                    // Update Heart Button for this variant
                    var favBtn = card.querySelector('.fav-product');
                    if (favBtn && typeof window.isFavorite === 'function') {
                        var isVFav = window.isFavorite(product.id, variant.id);
                        favBtn.classList.toggle('active', isVFav);
                        var hIcon = favBtn.querySelector('i');
                        if (hIcon) {
                            if (isVFav) {
                                hIcon.classList.remove('fa-regular');
                                hIcon.classList.add('fa-solid');
                            } else {
                                hIcon.classList.remove('fa-solid');
                                hIcon.classList.add('fa-regular');
                            }
                        }
                    }
                }
            });
        });
    });

    // Card click → modal (skip fav, cart, variant chip)
    container.querySelectorAll('.product').forEach(function (card) {
        card.addEventListener('click', function (e) {
            if (e.target.closest('.fav-product') ||
                e.target.closest('.add-cart-btn') ||
                e.target.closest('.variant-chip')) return;
            var id = parseInt(card.dataset.id);
            var product = products.find(function (p) { return p.id === id; });
            if (product) openProductModalEnhanced(product, card);
        });
    });

    // Favorite toggle
    container.querySelectorAll('.fav-product').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var card = btn.closest('.product');
            var id = parseInt(card ? card.dataset.id : btn.dataset.id);
            var product = products.find(function (p) { return p.id === id; });
            if (!product) return;

            var variants = getAllVariants(product);
            var selVariant = null;
            if (variants.length) {
                var selId = card ? card.dataset.selectedVariantId : null;
                selVariant = variants.find(function (v) { return String(v.id) === String(selId); }) || variants[0];
            }

            if (typeof window.toggleFavorite === 'function') {
                window.toggleFavorite(product, btn, selVariant);
            }
        });
    });

    // Add to cart
    container.querySelectorAll('.add-cart-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var card    = btn.closest('.product');
            var id      = parseInt(card.dataset.id);
            var product = products.find(function (p) { return p.id === id; });
            if (!product) return;

            var productToAdd = Object.assign({}, product);
            var variants = getAllVariants(product);
            if (variants.length) {
                var selId = card.dataset.selectedVariantId;
                var selVariant = variants.find(function (v) { return String(v.id) === String(selId); }) || variants[0];
                if (selVariant) {
                    productToAdd = Object.assign({}, product, {
                        id: selVariant.id,
                        name: product.name + (hasVal(selVariant.label) ? ' — ' + selVariant.label : ''),
                        img: selVariant.img || product.img,
                        price: hasVal(selVariant.price) ? selVariant.price : product.price,
                        wieght: hasVal(selVariant.wieght) ? selVariant.wieght : product.wieght
                    });
                }
            }

            window.addToCart(productToAdd);

            // Button feedback
            var orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> تمت الإضافة';
            btn.classList.add('added');
            setTimeout(function () {
                btn.innerHTML = orig;
                btn.classList.remove('added');
            }, 1600);
        });
    });
}

// ===== Enhanced Modal with Variants & Null Checks =====
function openProductModalEnhanced(product, cardEl) {
    var modalContent = document.getElementById('modal-content');
    var productModal = document.getElementById('product-modal');
    var modalOverlay = document.getElementById('modal-overlay');
    if (!modalContent || !productModal) {
        if (typeof window.openProductModal === 'function') window.openProductModal(product);
        return;
    }

    var variants = getAllVariants(product);
    var activeVariant = null;

    if (cardEl && variants.length) {
        activeVariant = variants.find(function(v) { return String(v.id) === String(cardEl.dataset.selectedVariantId); }) || variants[0];
    }
    if (!activeVariant && variants.length) {
        activeVariant = variants[0];
    }

    var currentImg    = activeVariant && hasVal(activeVariant.img) ? activeVariant.img : product.img;
    var currentPrice  = activeVariant && hasVal(activeVariant.price) ? activeVariant.price : product.price;
    var currentWeight = activeVariant && hasVal(activeVariant.wieght) ? activeVariant.wieght : product.wieght;

    var catLabel = hasVal(product.category) && categoryLabels[product.category] ? categoryLabels[product.category] : '';
    var catIcon  = hasVal(product.category) && categoryIcons[product.category]  ? categoryIcons[product.category]  : 'fa-tag';

    // Variants UI for modal
    var variantsHtml = '';
    if (variants.length) {
        var selectorLabel = getVariantSelectorLabel(variants);
        var chips = variants.map(function (v) {
            var isActive = activeVariant && String(v.id) === String(activeVariant.id);
            return '<button class="variant-chip modal-vchip' + (isActive ? ' active' : '') +
                   '" data-variant-id="' + v.id + '" type="button">' +
                   escHtml(v.label) + '</button>';
        }).join('');
        variantsHtml =
            '<div class="modal-variant-selector">' +
                '<span class="variant-label">' + selectorLabel + '</span>' +
                '<div class="variant-chips modal-vchips">' + chips + '</div>' +
            '</div>';
    }

    // Modal info
    var infoLines = '';
    if (hasVal(product.benf)) {
        infoLines += '<p><i class="fa-solid fa-leaf modal-info-icon"></i>' + escHtml(product.benf) + '</p>';
    }
    if (hasVal(product.ingred)) {
        infoLines += '<p><i class="fa-solid fa-flask modal-info-icon"></i>' + escHtml(product.ingred) + '</p>';
    }
    if (hasVal(product.note)) {
        infoLines += '<p style="color:var(--main-color);font-weight:600;"><i class="fa-solid fa-circle-info modal-info-icon"></i>' + escHtml(product.note) + '</p>';
    }
    if (hasVal(currentWeight)) {
        infoLines += '<p class="modal-info-weight"><i class="fa-solid fa-weight-hanging modal-info-icon"></i>' + escHtml(currentWeight) + '</p>';
    }
    var infoDiv = infoLines ? '<div class="modal-info">' + infoLines + '</div>' : '';

    var isModalSpecBox = product.category === 'specBox';
    var priceDisplay = hasVal(currentPrice) && !isNaN(Number(currentPrice))
        ? '<p class="modal-price" id="modal-product-price">' + currentPrice + ' <span>ج.م</span></p>'
        : (isModalSpecBox
            ? '<div class="modal-specbox-pricing"><p class="modal-price" id="modal-product-price">يبدأ من 300 <span>ج.م</span></p><p class="modal-price-note"><i class="fa-solid fa-wand-magic-sparkles"></i> السعر النهائي حسب عدد ونوع قطع الصابون والفواحات المختارة</p></div>'
            : '');

    var waItemName = product.name + (activeVariant && hasVal(activeVariant.label) ? ' — ' + activeVariant.label : '');
    var waUrl = isModalSpecBox
        ? 'https://wa.me/201204308077?text=' + encodeURIComponent('مرحباً، أريد طلب وتنسيق بوكس الهدايا المميز من متجر غالية 🎁')
        : 'https://wa.me/201204308077?text=' + encodeURIComponent('أريد الطلب: ' + waItemName + (hasVal(currentPrice) && !isNaN(Number(currentPrice)) ? ' - ' + currentPrice + ' ج.م' : ''));

    var modalActionsHtml = isModalSpecBox
        ? '<div class="modal-actions">' +
            '<a class="modal-wa-order specbox-wa-fullbtn" id="modal-wa-link" href="' + waUrl + '" target="_blank" rel="noopener">' +
                '<i class="fa-brands fa-whatsapp"></i> نسّقي واطلبي بوكسكِ الآن' +
            '</a>' +
          '</div>'
        : '<div class="modal-actions">' +
            '<button class="modal-add-cart" id="modal-add-cart-btn" type="button">' +
                '<i class="fa-solid fa-cart-plus"></i> أضيفيه للسلة' +
            '</button>' +
            '<a class="modal-wa-order" id="modal-wa-link" href="' + waUrl + '" target="_blank" rel="noopener">' +
                '<i class="fa-brands fa-whatsapp"></i> اطلبيه الآن' +
            '</a>' +
          '</div>';

    modalContent.innerHTML =
        '<img id="modal-product-img" src="' + escHtml(currentImg) + '" alt="' + escHtml(product.name) + '">' +
        '<div class="modal-cat-row">' +
            (catLabel ? '<span class="modal-cat-pill" data-cat="' + product.category + '"><i class="fa-solid ' + catIcon + '"></i> ' + escHtml(catLabel) + '</span>' : '') +
            '<div class="modal-stars">' +
                '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>' +
                '<i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>' +
                '<i class="fa-solid fa-star"></i>' +
            '</div>' +
        '</div>' +
        '<h3>' + escHtml(product.name) + '</h3>' +
        infoDiv +
        variantsHtml +
        priceDisplay +
        modalActionsHtml;

    // Variant selection inside modal
    if (variants.length) {
        var vchips = modalContent.querySelectorAll('.modal-vchip');
        vchips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                vchips.forEach(function (c) { c.classList.remove('active'); });
                chip.classList.add('active');

                var vid = chip.dataset.variantId;
                activeVariant = variants.find(function (v) { return String(v.id) === String(vid); });
                if (!activeVariant) return;

                // Update modal image
                var mImg = document.getElementById('modal-product-img');
                if (mImg && hasVal(activeVariant.img)) {
                    mImg.classList.remove('img-variant-switch');
                    void mImg.offsetWidth;
                    mImg.src = activeVariant.img;
                    mImg.classList.add('img-variant-switch');
                }

                // Update modal price with animation
                var mPrice = document.getElementById('modal-product-price');
                if (mPrice && hasVal(activeVariant.price)) {
                    mPrice.innerHTML = activeVariant.price + ' <span>ج.م</span>';
                    mPrice.classList.remove('price-updated');
                    void mPrice.offsetWidth;
                    mPrice.classList.add('price-updated');
                }

                // Update modal weight
                var mWeight = modalContent.querySelector('.modal-info-weight');
                if (mWeight) {
                    var w = hasVal(activeVariant.wieght) ? activeVariant.wieght : product.wieght;
                    if (hasVal(w)) mWeight.innerHTML = '<i class="fa-solid fa-weight-hanging modal-info-icon"></i>' + escHtml(w);
                }

                // Update WA link
                var waLink = document.getElementById('modal-wa-link');
                if (waLink) {
                    var title = product.name + (hasVal(activeVariant.label) ? ' — ' + activeVariant.label : '');
                    var p = hasVal(activeVariant.price) ? activeVariant.price : product.price;
                    waLink.href = 'https://wa.me/201204308077?text=' +
                        encodeURIComponent('أريد الطلب: ' + title + (hasVal(p) && !isNaN(Number(p)) ? ' - ' + p + ' ج.م' : ''));
                }

                // Sync back to card on page if available
                if (cardEl) {
                    cardEl.dataset.selectedVariantId = activeVariant.id;
                    var cardChips = cardEl.querySelectorAll('.variant-chip');
                    cardChips.forEach(function (cc) {
                        cc.classList.toggle('active', String(cc.dataset.variantId) === String(activeVariant.id));
                    });
                    var cardImg = cardEl.querySelector('.img img');
                    if (cardImg && hasVal(activeVariant.img)) {
                        cardImg.classList.remove('img-variant-switch');
                        void cardImg.offsetWidth;
                        cardImg.src = activeVariant.img;
                        cardImg.classList.add('img-variant-switch');
                    }
                    var cardPrice = cardEl.querySelector('.price');
                    if (cardPrice && hasVal(activeVariant.price)) {
                        cardPrice.innerHTML = activeVariant.price + ' <span>ج.م</span>';
                        cardPrice.classList.remove('price-updated');
                        void cardPrice.offsetWidth;
                        cardPrice.classList.add('price-updated');
                    }
                    var cardWeight = cardEl.querySelector('.product-weight');
                    if (cardWeight) {
                        var w2 = hasVal(activeVariant.wieght) ? activeVariant.wieght : product.wieght;
                        if (hasVal(w2)) cardWeight.innerHTML = '<i class="fa-solid fa-weight-hanging"></i> ' + escHtml(w2);
                    }
                }
            });
        });
    }

    // Modal add to cart
    var cartBtn = document.getElementById('modal-add-cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', function () {
            var productToAdd = Object.assign({}, product);
            if (activeVariant) {
                productToAdd = Object.assign({}, product, {
                    id: activeVariant.id,
                    name: product.name + (hasVal(activeVariant.label) ? ' — ' + activeVariant.label : ''),
                    img: activeVariant.img || product.img,
                    price: hasVal(activeVariant.price) ? activeVariant.price : product.price,
                    wieght: hasVal(activeVariant.wieght) ? activeVariant.wieght : product.wieght
                });
            }
            window.addToCart(productToAdd);
            window.closeProductModal();
        });
    }

    productModal.classList.add('active');
    if (modalOverlay) modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== Scroll to & Highlight Product (from Favorites or URL) =====
window.scrollToProduct = function (productId, variantId) {
    if (!allProducts || !allProducts.length) return;

    var prodIdNum = parseInt(productId);
    var product = allProducts.find(function (p) { return p.id === prodIdNum; });
    if (!product) return;

    // 1. Ensure category of product is visible
    if (activeCategory !== 'all' && activeCategory !== product.category) {
        activeCategory = product.category || 'all';
        document.querySelectorAll('.filter-tab').forEach(function (t) {
            var isAct = t.dataset.category === activeCategory;
            t.classList.toggle('active', isAct);
            t.setAttribute('aria-selected', isAct ? 'true' : 'false');
        });
        applyFilters();
    }

    // 2. Ensure price filter includes this product
    var minInput = document.getElementById('price-min');
    var maxInput = document.getElementById('price-max');
    var pPrice = Number(product.price) || 0;
    var priceReset = false;
    if (minPrice > pPrice) {
        minPrice = 0;
        if (minInput) minInput.value = '';
        priceReset = true;
    }
    if (maxPrice < pPrice) {
        maxPrice = Infinity;
        if (maxInput) maxInput.value = '';
        priceReset = true;
    }
    if (priceReset) applyFilters();

    // 3. Find card in DOM
    var card = document.querySelector('.product[data-id="' + prodIdNum + '"]');
    if (!card) {
        activeCategory = 'all';
        document.querySelectorAll('.filter-tab').forEach(function (t) {
            t.classList.toggle('active', t.dataset.category === 'all');
        });
        applyFilters();
        card = document.querySelector('.product[data-id="' + prodIdNum + '"]');
    }

    if (!card) return;

    card.style.transform = 'none';
    card.style.opacity = '1';

    // 4. If variantId specified, select that variant
    if (variantId !== null && variantId !== undefined && String(variantId) !== '') {
        var chip = card.querySelector('.variant-chip[data-variant-id="' + variantId + '"]');
        if (chip) chip.click();
    }

    // 5. Scroll smoothly to card
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 6. Pulse highlight
    card.classList.remove('product-highlight-target');
    void card.offsetWidth;
    card.classList.add('product-highlight-target');
    setTimeout(function () {
        card.classList.remove('product-highlight-target');
    }, 2800);
};

// Global hook
window.openProductModal = openProductModalEnhanced;

// ===== HTML Escape Helper =====
function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#39;');
}

// ===== Footer Year =====
var yearSpan = document.querySelector('.year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();
