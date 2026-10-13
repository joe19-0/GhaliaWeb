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

    // Show first 6 products
    let visibleCount = Math.min(6, products.length);
    let showAll = false;

    function renderProducts(count) {
        // Filter out products that have no valid image (soup11 doesn't exist)
        const validProducts = products.filter(function (p) {
            return p.img && !p.img.includes("soup11");
        });

        const toShow = showAll ? validProducts : validProducts.slice(0, count);

        productsContainer.innerHTML = toShow.map(function (product) {
            const isFav = window.favorites.some(function (f) { return f.id === product.id; });
            return `
                <div class="product" data-id="${product.id}" role="article">
                    <div class="img">
                        <div class="fav-product ${isFav ? "active" : ""}" 
                            data-id="${product.id}"
                            aria-label="أضيفيه للمفضلة"
                            title="أضيفيه للمفضلة">
                            <i class="${isFav ? "fa-solid" : "fa-regular"} fa-heart"></i>
                        </div>
                        <img src="${product.img}" alt="${product.name}" loading="lazy">
                        <div class="msg">
                            <i class="fa-solid fa-circle-info"></i>
                            <p>اضغطي للتفاصيل</p>
                        </div>
                    </div>
                    <div class="content">
                        <p class="name">${product.name}</p>
                        <p class="benf">${product.benf}</p>
                        <p class="ingred">${product.ingred}</p>
                        <div class="prices">
                            <p class="price">${product.price} <span>ج.م</span></p>
                        </div>
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

        // Update count text
        const total = products.filter(function (p) { return !p.img.includes("soup11"); }).length;
        productsCount.textContent = `يتم عرض ${toShow.length} من أصل ${total}+ منتجاً`;

        // Update see-more button
        if (showAll || toShow.length >= total) {
            seeMoreBtn.style.display = "none";
        } else {
            seeMoreBtn.style.display = "inline-block";
        }

        // Attach event listeners after rendering
        attachProductEvents();
    }

    function attachProductEvents() {
        // Product card click → open modal
        productsContainer.querySelectorAll(".product").forEach(function (card) {
            card.addEventListener("click", function (e) {
                // Don't open modal if clicking fav or add-to-cart
                if (e.target.closest(".fav-product") || e.target.closest(".add-cart-btn")) return;
                const id = parseInt(card.dataset.id);
                const product = products.find(function (p) { return p.id === id; });
                if (product) openProductModal(product);
            });
        });

        // Favorite button
        productsContainer.querySelectorAll(".fav-product").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const product = products.find(function (p) { return p.id === id; });
                if (product) toggleFavorite(product, btn);
            });
        });

        // Add to cart button
        productsContainer.querySelectorAll(".add-cart-btn").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                const card = btn.closest(".product");
                const id = parseInt(card.dataset.id);
                const product = products.find(function (p) { return p.id === id; });
                if (product) {
                    addToCart(product);
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

            // Update reviews count text
            if (reviewsCount) {
                reviewsCount.textContent = `يتم عرض ${initialReviews.length} من أصل ${reviews.length}+ تقييماً`;
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

// Get The Year
let yearSpan = document.querySelector(".year");
if (yearSpan) {
    let year = new Date().getFullYear();
    yearSpan.textContent = year;
}