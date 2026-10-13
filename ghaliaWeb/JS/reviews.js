// ===== Reviews Page Script (JS/reviews.js) =====
(function () {
    const allReviewsContainer = document.getElementById("all-reviews-container");
    const reviewsTotalCount = document.getElementById("reviews-total-count");

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

    if (allReviewsContainer) {
        fetch("reviews.json")
            .then(function (response) {
                if (!response.ok) throw new Error("Network response was not ok");
                return response.json();
            })
            .then(function (reviews) {
                if (!Array.isArray(reviews) || reviews.length === 0) {
                    allReviewsContainer.innerHTML = `
                        <div class="products-loading" style="grid-column: 1 / -1;">
                            <i class="fa-solid fa-star-half-stroke"></i>
                            <p>لا توجد آراء متاحة حالياً. كوني أول من يشاركنا رأيها!</p>
                        </div>`;
                    return;
                }

                if (reviewsTotalCount) {
                    reviewsTotalCount.textContent = `+${reviews.length}`;
                }

                allReviewsContainer.innerHTML = reviews.map(function (rev) {
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
            })
            .catch(function (error) {
                console.error("خطأ في تحميل التقييمات:", error);
                allReviewsContainer.innerHTML = `
                    <div class="products-loading" style="grid-column: 1 / -1;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <p>تعذر تحميل التقييمات حالياً، يرجى المحاولة لاحقاً.</p>
                    </div>`;
            });
    }

    // Update Year in footer
    const yearSpan = document.querySelector(".year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
})();
