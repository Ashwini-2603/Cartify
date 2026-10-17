let products = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

// DOM Elements
const productsGrid = document.getElementById("products-grid");
const searchInput = document.getElementById("search-input");
const categoryFilter = document.getElementById("category-filter");
const sortFilter = document.getElementById("sort-filter");
const cartCount = document.getElementById("cart-count");
const themeToggleBtn = document.getElementById("theme-toggle-btn");

// 1. Fetch Real Products & Populate Categories Dynamically
async function loadProducts() {
    try {
        productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; font-size: 1.2rem; padding: 2rem;">Loading products...</p>`;
        
        const response = await fetch('https://fakestoreapi.com/products');
        const data = await response.json();
        
        products = data.map(item => ({
            id: item.id,
            title: item.title,
            price: Math.round(item.price * 80), // Convert USD to INR
            category: item.category,
            image: item.image,
            description: item.description,
            rating: item.rating ? item.rating.rate : 4.5
        }));

        populateCategoryDropdown(data);
        renderProducts(products);
    } catch (error) {
        console.error("Error loading products:", error);
        productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red; padding: 2rem;">Failed to load products. Check your internet connection.</p>`;
    }
}

// Dynamically build category dropdown options from API categories
function populateCategoryDropdown(rawProducts) {
    if (!categoryFilter) return;

    const categories = ["all", ...new Set(rawProducts.map(item => item.category))];

    categoryFilter.innerHTML = categories.map(cat => {
        const displayName = cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1);
        return `<option value="${cat}">${displayName}</option>`;
    }).join('');
}

// 2. Render Products
function renderProducts(items) {
    productsGrid.innerHTML = "";
    
    if (items.length === 0) {
        productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No products found matching your search.</p>`;
        return;
    }

    items.forEach(product => {
        const isWishlisted = wishlist.includes(product.id);
        const card = document.createElement("div");
        card.classList.add("product-card");
        
        card.innerHTML = `
            <button class="wishlist-btn" onclick="toggleWishlist(${product.id})">
                <i class="${isWishlisted ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: ${isWishlisted ? '#ef4444' : '#64748b'};"></i>
            </button>
            <div class="product-img-wrapper">
                <img src="${product.image}" alt="${product.title}" class="product-img">
            </div>
            <div class="product-info">
                <h3 class="product-title" title="${product.title}">${product.title}</h3>
                <p style="color: #f59e0b; font-size: 0.85rem; margin-bottom: 0.4rem;">★ ${product.rating} / 5</p>
                <p class="product-price">₹${product.price}</p>
            </div>
            <div class="card-actions">
                <button class="btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                <button class="btn-secondary" onclick="openQuickView(${product.id})">Quick View</button>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

// 3. Add to Cart
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartBadge();
    showToast(`${product.title.substring(0, 20)}... added to cart!`);
};

// 4. Toggle Wishlist
window.toggleWishlist = function(productId) {
    if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
        showToast("Removed from Wishlist");
    } else {
        wishlist.push(productId);
        showToast("Saved to Wishlist ❤");
    }
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    renderProducts(getFilteredProducts());
};

// 5. Update Cart Badge
function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) cartCount.textContent = totalItems;
}

// 6. Filter & Search Logic
function getFilteredProducts() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedCategory = categoryFilter ? categoryFilter.value : "all";
    const sort = sortFilter ? sortFilter.value : "default";

    let filtered = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(searchTerm) || 
                              product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (sort === "low-high") filtered.sort((a, b) => a.price - b.price);
    if (sort === "high-low") filtered.sort((a, b) => b.price - a.price);

    return filtered;
}

function applyFilters() {
    renderProducts(getFilteredProducts());
}

if (searchInput) searchInput.addEventListener("input", applyFilters);
if (categoryFilter) categoryFilter.addEventListener("change", applyFilters);
if (sortFilter) sortFilter.addEventListener("change", applyFilters);

// 7. Dark Mode Switcher
if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        const icon = themeToggleBtn.querySelector("i");
        if (icon) icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    });
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    if (themeToggleBtn && themeToggleBtn.querySelector("i")) {
        themeToggleBtn.querySelector("i").className = "fa-solid fa-sun";
    }
}

// 8. Toast Notification
function showToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.classList.add("toast");
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// 9. Quick View Modal Logic
const modal = document.getElementById("quick-view-modal");
const modalBody = document.getElementById("modal-body");
const closeBtn = document.querySelector(".close-btn");

window.openQuickView = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || !modal || !modalBody) return;

    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 1rem;">
            <img src="${product.image}" style="max-width: 140px; max-height: 140px; object-fit: contain;">
        </div>
        <h3>${product.title}</h3>
        <p style="margin: 8px 0; color: var(--primary-color); font-weight: bold; font-size: 1.2rem;">₹${product.price}</p>
        <p style="font-size: 0.85rem; line-height: 1.4; max-height: 150px; overflow-y: auto;">${product.description}</p>
        <button class="btn-primary" style="margin-top: 15px; width: 100%; padding: 0.6rem;" onclick="addToCart(${product.id})">Add to Cart</button>
    `;
    modal.style.display = "flex";
};

if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    updateCartBadge();
});