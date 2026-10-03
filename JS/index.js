// Add Products To The recommended products section
products = JSON.parse(localStorage.getItem("products")) || []

let productsDiv = document.querySelector("main .rec-products .products")

products.forEach(function (product) {
    productsDiv.innerHTML += `
        <a href="#" class="product">
            <div class="img">
                <i class="fa-regular fa-heart fav-product"></i>
                <img src="${product.img}" alt="product image">
                <div class="msg">
                    <i class="fa-solid fa-circle-info"></i>
                    <p> اضغطي للتفاصيل.</p>
                </div>
            </div>
            <div class="content">
                <p class="name">${product.name}</p>
                <p class="benf">${product.benf}</p>
                <p class="ingred">${product.ingred}</p>
                <div class="prices">
                    <p class="price">ج.م <span>${product.price}</span></p>
                    <p class="old-price"> <span></span></p>
                </div>
            </div>
            <div class="stars">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
            </div>
            <p class="rec">مقترحة لكِ</p>
        </a>
    `
})

// Favorite toggle
document.querySelectorAll(".fav-product").forEach((favBtn) => {
    favBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log(1)
    });
});