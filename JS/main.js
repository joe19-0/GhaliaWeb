// Menu btns
let linksUl = document.querySelector("ul.links")
let bars = document.querySelector(".bars")
let closeBtn = document.querySelector(".close-btn")

bars.onclick = function () {
    linksUl.classList.add("active")
}
closeBtn.onclick = function () {
    linksUl.classList.remove("active")
}

// Fetch Json Products
let products = JSON.parse(localStorage.getItem("products")) || []

fetch("products.json")
.then(function (response) {
    return response.json()
})
.then(function (data) {
    products = data
    localStorage.setItem("products", JSON.stringify(products))
})
