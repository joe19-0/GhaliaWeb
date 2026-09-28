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