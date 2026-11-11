// ===== Helper: Check if key & value are not null/empty =====
function hasVal(val) {
    return val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim() !== 'undefined' && String(val).trim() !== 'null';
}

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

// ===== Render Recommended Products =====
// Wait for productsReady promise from main.js (handles both cache & fresh fetch)
window.productsReady.then(function (products) {
    const productsContainer = document.getElementById("products-container");
    const productsCount = document.getElementById("products-count");
    const seeMoreBtn = document.getElementById("see-more-btn");

    if (!products || products.length === 0) {
        productsContainer.innerHTML = `
            <div class="products-loading">
                <i class="fa-solid fa-box-open"></i>
                <p>لا توجد منتجات حالياً. تفضلي بزيارتنا لاحقاً.</p>
            </div>`;
        return;
    }

    // Filter valid products (exclude specBox from homepage featured)
    const validProducts = products.filter(function (p) {
        return p && p.id !== undefined && hasVal(p.name) && hasVal(p.img) && p.category !== 'specBox';
    });

    // Show first 6 products
    let visibleCount = Math.min(6, validProducts.length);
    let showAll = false;

    function renderProducts(count) {
        const toShow = showAll ? validProducts : validProducts.slice(0, count);

        productsContainer.innerHTML = toShow.map(function (product) {
            const variants = getAllVariants(product);
            const initialVarId = variants.length ? variants[0].id : null;
            const isFav = typeof window.isFavorite === "function" ?
                window.isFavorite(product.id, initialVarId) :
                window.favorites.some(function (f) { return f.id === product.id; });

            let variantsHtml = '';
            if (variants.length > 0) {
                const selectorLabel = getVariantSelectorLabel(variants);
                const chips = variants.map(function (v, idx) {
                    return `<button class="variant-chip ${idx === 0 ? 'active' : ''}" data-variant-id="${v.id}" type="button">${v.label}</button>`;
                }).join('');
                variantsHtml = `
                    <div class="variant-selector">
                        <span class="variant-label">${selectorLabel}</span>
                        <div class="variant-chips">${chips}</div>
                    </div>`;
            }

            const initialImg    = variants.length && hasVal(variants[0].img) ? variants[0].img : product.img;
            const initialWeight = variants.length && hasVal(variants[0].wieght) ? variants[0].wieght : product.wieght;
            const initialPrice  = variants.length && hasVal(variants[0].price) ? variants[0].price : product.price;

            const nameHtml   = hasVal(product.name) ? `<p class="name">${product.name}</p>` : '';
            const benfHtml   = hasVal(product.benf) ? `<p class="benf">${product.benf}</p>` : '';
            const ingredHtml = hasVal(product.ingred) ? `<p class="ingred">${product.ingred}</p>` : '';
            const weightHtml = hasVal(initialWeight) ? `<p class="product-weight"><i class="fa-solid fa-weight-hanging"></i> ${initialWeight}</p>` : '';
            const priceHtml  = hasVal(initialPrice) ? `<div class="prices"><p class="price">${initialPrice} <span>ج.م</span></p></div>` : '';

            return `
                <div class="product" id="product-${product.id}" data-id="${product.id}" ${variants.length ? `data-selected-variant-id="${variants[0].id}"` : ''} role="article">
                    <div class="img">
                        <div class="fav-product ${isFav ? "active" : ""}" 
                            data-id="${product.id}"
                            aria-label="أضيفيه للمفضلة"
                            title="أضيفيه للمفضلة">
                            <i class="${isFav ? "fa-solid" : "fa-regular"} fa-heart"></i>
                        </div>
                        <img src="${initialImg}" alt="${product.name}" loading="lazy">
                        <div class="msg">
                            <i class="fa-solid fa-circle-info"></i>
                            <p>اضغطي للتفاصيل</p>
                        </div>
                    </div>
                    <div class="content">
                        ${nameHtml}
                        ${benfHtml}
                        ${ingredHtml}
                        ${weightHtml}
                        ${variantsHtml}
                        ${priceHtml}
                    </div>
                    <div class="stars">
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                    <button class="add-cart-btn" aria-label="أضيفيه للسلة">
                        <i class="fa-solid fa-cart-plus"></i>
                        أضيفيه للسلة
                    </button>
                    <span class="rec-badge">مقترحة لكِ</span>
                </div>`;
        }).join("");

        // Update count text & progress bar percentage
        const total = validProducts.length;
        if (productsCount) productsCount.textContent = `يتم عرض ${toShow.length} من أصل ${total}+ منتجاً`;

        const productsLine = document.querySelector(".rec-products .lower .line");
        if (productsLine && total > 0) {
            const pct = Math.min(100, Math.round((toShow.length / total) * 100));
            productsLine.style.setProperty("--progress-pct", pct + "%");
        }

        // Update see-more button
        if (seeMoreBtn) {
            if (showAll || toShow.length >= total) {
                seeMoreBtn.style.display = "none";
            } else {
                seeMoreBtn.style.display = "inline-block";
            }
        }

        // Attach event listeners after rendering
        attachProductEvents();
    }

    function attachProductEvents() {
        // Variant chip click
        productsContainer.querySelectorAll(".product").forEach(function (card) {
            const id = parseInt(card.dataset.id);
            const product = validProducts.find(function (p) { return p.id === id; });
            if (!product) return;
            const variants = getAllVariants(product);
            if (!variants.length) return;

            const chips = card.querySelectorAll(".variant-chip");
            chips.forEach(function (chip) {
                chip.addEventListener("click", function (e) {
                    e.stopPropagation();
                    chips.forEach(function (c) { c.classList.remove("active"); });
                    chip.classList.add("active");

                    const vid = chip.dataset.variantId;
                    card.dataset.selectedVariantId = vid;
                    const variant = variants.find(function (v) { return String(v.id) === String(vid); });
                    if (variant) {
                        const imgEl = card.querySelector(".img img");
                        if (imgEl && hasVal(variant.img)) {
                            imgEl.classList.remove('img-variant-switch');
                            void imgEl.offsetWidth;
                            imgEl.src = variant.img;
                            imgEl.classList.add('img-variant-switch');
                        }

                        const weightEl = card.querySelector(".product-weight");
                        if (weightEl) {
                            const w = hasVal(variant.wieght) ? variant.wieght : product.wieght;
                            if (hasVal(w)) {
                                weightEl.innerHTML = `<i class="fa-solid fa-weight-hanging"></i> ${w}`;
                                weightEl.style.display = "";
                            }
                        }

                        const priceEl = card.querySelector(".price");
                        if (priceEl && hasVal(variant.price)) {
                            priceEl.innerHTML = `${variant.price} <span>ج.م</span>`;
                            priceEl.classList.remove('price-updated');
                            void priceEl.offsetWidth;
                            priceEl.classList.add('price-updated');
                        }

                        // Update Heart Button for this variant
                        const favBtn = card.querySelector(".fav-product");
                        if (favBtn && typeof window.isFavorite === "function") {
                            const isVFav = window.isFavorite(product.id, variant.id);
                            favBtn.classList.toggle("active", isVFav);
                            const hIcon = favBtn.querySelector("i");
                            if (hIcon) {
                                if (isVFav) {
                                    hIcon.classList.remove("fa-regular");
                                    hIcon.classList.add("fa-solid");
                                } else {
                                    hIcon.classList.remove("fa-solid");
                                    hIcon.classList.add("fa-regular");
                                }
                            }
                        }
                    }
                });
            });
        });

        // Product card click → open modal
        productsContainer.querySelectorAll(".product").forEach(function (card) {
            card.addEventListener("click", function (e) {
                // Don't open modal if clicking fav or add-to-cart or variant chip
                if (e.target.closest(".fav-product") || e.target.closest(".add-cart-btn") || e.target.closest(".variant-chip")) return;
                const id = parseInt(card.dataset.id);
                const product = validProducts.find(function (p) { return p.id === id; });
                if (product) openProductModal(product);
            });
        });

        // Favorite button
        productsContainer.querySelectorAll(".fav-product").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                const card = btn.closest(".product");
                const id = parseInt(card ? card.dataset.id : btn.dataset.id);
                const product = validProducts.find(function (p) { return p.id === id; });
                if (!product) return;

                const variants = getAllVariants(product);
                let selVariant = null;
                if (variants.length) {
                    const selId = card ? card.dataset.selectedVariantId : null;
                    selVariant = variants.find(function (v) { return String(v.id) === String(selId); }) || variants[0];
                }

                if (typeof window.toggleFavorite === "function") {
                    window.toggleFavorite(product, btn, selVariant);
                }
            });
        });

        // Add to cart button
        productsContainer.querySelectorAll(".add-cart-btn").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                const card = btn.closest(".product");
                const id = parseInt(card.dataset.id);
                const product = validProducts.find(function (p) { return p.id === id; });
                if (product) {
                    let productToAdd = Object.assign({}, product);
                    const variants = getAllVariants(product);
                    if (variants.length) {
                        const selId = card.dataset.selectedVariantId;
                        const selVariant = variants.find(function (v) { return String(v.id) === String(selId); }) || variants[0];
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
                    // Animate button
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> تمت الإضافة';
                    btn.style.backgroundColor = "#4caf50";
                    setTimeout(function () {
                        btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i> أضيفيه للسلة';
                        btn.style.backgroundColor = "";
                    }, 1500);
                }
            });
        });
    }

    // See more button
    // seeMoreBtn.addEventListener("click", function (e) {
    //     e.preventDefault();
    //     showAll = true;
    //     renderProducts(visibleCount);
    // });

    // Initial render
    renderProducts(visibleCount);
});

// ===== Render Reviews (First 4 from reviews.json) =====
(function () {
    const reviewsContainer = document.getElementById("reviews-container");
    const reviewsCount = document.getElementById("reviews-count");
    if (!reviewsContainer) return;

    function renderStarIcons(starsCount) {
        const count = Math.max(1, Math.min(5, Number(starsCount) || 5));
        let starsHtml = "";
        for (let i = 1; i <= 5; i++) {
            if (i <= count) {
                starsHtml += '<i class="fa-solid fa-star"></i>';
            } else {
                starsHtml += '<i class="fa-regular fa-star"></i>';
            }
        }
        return starsHtml;
    }

    function sanitizeText(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    fetch("reviews.json")
        .then(function (response) {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
        })
        .then(function (reviews) {
            if (!Array.isArray(reviews) || reviews.length === 0) {
                reviewsContainer.innerHTML = `
                    <div class="products-loading" style="grid-column: 1 / -1;">
                        <i class="fa-solid fa-star-half-stroke"></i>
                        <p>لا توجد آراء متاحة حالياً.</p>
                    </div>`;
                if (reviewsCount) {
                    reviewsCount.style.display = "none";
                }
                return;
            }

            // Slice the first 4 reviews for the home page
            const initialReviews = reviews.slice(0, 4);

            reviewsContainer.innerHTML = initialReviews.map(function (rev) {
                const stars = renderStarIcons(rev.stars);
                const reviewText = sanitizeText(rev.review);
                const authorName = sanitizeText(rev.name || "عميلة غالية");
                const countryName = sanitizeText(rev.country || "مصر");

                return `
                    <div class="review-card">
                        <div class="review-card-top">
                            <div class="review-stars" aria-label="${rev.stars || 5} نجوم">
                                ${stars}
                            </div>
                            <p class="review-text">"${reviewText}"</p>
                        </div>
                        <div class="review-author">
                            <div class="author-avatar"><i class="fa-solid fa-user"></i></div>
                            <div class="author-info">
                                <strong>${authorName}</strong>
                                <span>${countryName}</span>
                            </div>
                        </div>
                    </div>`;
            }).join("");

            // Update reviews count text & progress bar percentage
            if (reviewsCount) {
                reviewsCount.textContent = `يتم عرض ${initialReviews.length} من أصل ${reviews.length}+ تقييماً`;
            }

            const reviewsLine = document.querySelector(".reviews-section .lower .line");
            if (reviewsLine && reviews.length > 0) {
                const pct = Math.min(100, Math.round((initialReviews.length / reviews.length) * 100));
                reviewsLine.style.setProperty("--progress-pct", pct + "%");
            }
        })
        .catch(function (error) {
            console.error("خطأ في تحميل التقييمات:", error);
            reviewsContainer.innerHTML = `
                <div class="products-loading" style="grid-column: 1 / -1;">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p>تعذر تحميل التقييمات حالياً، يرجى المحاولة لاحقاً.</p>
                </div>`;
            if (reviewsCount) {
                reviewsCount.style.display = "none";
            }
        });
})();

// Add Special Gift Box to Cart from Home Page
window.addSpecialBoxToCart = function () {
    window.addToCart({
        id: 33,
        name: "بوكس الهدايا المميز",
        img: "images/specialBox1.jpg",
        price: "حسب الاختيار والتنسيق",
        category: "specBox"
    });
};

// Get The Year
let yearSpan = document.querySelector(".year");
if (yearSpan) {
    let year = new Date().getFullYear();
    yearSpan.textContent = year;
}