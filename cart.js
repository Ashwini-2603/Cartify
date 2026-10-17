let cart = JSON.parse(localStorage.getItem("cart")) || [];
let discountApplied = false;

const cartItemsList = document.getElementById("cart-items-list");
const subtotalVal = document.getElementById("subtotal-val");
const taxVal = document.getElementById("tax-val");
const deliveryVal = document.getElementById("delivery-val");
const discountRow = document.getElementById("discount-row");
const discountVal = document.getElementById("discount-val");
const totalVal = document.getElementById("total-val");
const couponInput = document.getElementById("coupon-input");
const couponMsg = document.getElementById("coupon-msg");

document.addEventListener("DOMContentLoaded", () => {
    // Sync dark mode theme from main page
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
    renderCart();
});

function renderCart() {
    cartItemsList.innerHTML = "";

    if (cart.length === 0) {
        cartItemsList.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: var(--card-bg); border-radius: 8px;">
                <i class="fa-solid fa-cart-flatbed" style="font-size: 3rem; color: var(--border-color); margin-bottom: 1rem;"></i>
                <h2>Your Cart is Empty</h2>
                <p style="margin: 1rem 0;">Looks like you haven't added anything to your cart yet.</p>
                <a href="index.html" class="btn-primary" style="text-decoration: none; display: inline-block; padding: 0.5rem 1.5rem;">Start Shopping</a>
            </div>
        `;
        updateSummary(0);
        return;
    }

    cart.forEach(item => {
        const itemElement = document.createElement("div");
        itemElement.classList.add("cart-item");
        itemElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <img src="${item.image}" alt="${item.title}">
                <div>
                    <h4 style="margin-bottom: 0.3rem;">${item.title}</h4>
                    <p style="color: var(--primary-color); font-weight: bold;">₹${item.price}</p>
                </div>
            </div>

            <div class="qty-controls">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>

            <p style="font-weight: bold;">₹${item.price * item.quantity}</p>

            <button class="remove-btn" onclick="removeItem(${item.id})" title="Remove item">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        cartItemsList.appendChild(itemElement);
    });

    calculateTotals();
}

function updateQuantity(id, change) {
    const item = cart.find(p => p.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(p => p.id !== id);
        }
        saveAndRefresh();
    }
}

function removeItem(id) {
    cart = cart.filter(p => p.id !== id);
    saveAndRefresh();
}

function saveAndRefresh() {
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
}

function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.18);
    const delivery = subtotal > 0 ? 50 : 0;
    
    let discount = 0;
    if (discountApplied) {
        discount = Math.round(subtotal * 0.10);
        discountRow.style.display = "flex";
        discountVal.textContent = `-₹${discount}`;
    } else {
        discountRow.style.display = "none";
    }

    const total = subtotal + tax + delivery - discount;

    subtotalVal.textContent = `₹${subtotal}`;
    taxVal.textContent = `₹${tax}`;
    deliveryVal.textContent = `₹${delivery}`;
    totalVal.textContent = `₹${total}`;
}

function applyCoupon() {
    const code = couponInput.value.trim().toUpperCase();
    if (code === "CARTIFY10") {
        if (cart.length === 0) {
            couponMsg.style.color = "#ef4444";
            couponMsg.textContent = "Add items to cart first!";
            return;
        }
        discountApplied = true;
        couponMsg.style.color = "#10b981";
        couponMsg.textContent = "Coupon applied successfully! (10% OFF)";
        calculateTotals();
    } else {
        couponMsg.style.color = "#ef4444";
        couponMsg.textContent = "Invalid Coupon Code. Try 'CARTIFY10'";
    }
}

function checkout() {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    document.getElementById("checkout-modal").style.display = "flex";
    document.getElementById("checkout-step-1").style.display = "block";
    document.getElementById("checkout-step-2").style.display = "none";
}

function closeCheckoutModal() {
    document.getElementById("checkout-modal").style.display = "none";
}

function processOrder(e) {
    e.preventDefault();
    const name = document.getElementById("cust-name").value;
    const email = document.getElementById("cust-email").value;
    const address = document.getElementById("cust-address").value;
    const payMode = document.getElementById("payment-mode").value;
    
    const orderId = "CRT-" + Math.floor(100000 + Math.random() * 900000);
    const date = new Date().toLocaleDateString();

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + tax + 50 - (discountApplied ? Math.round(subtotal * 0.10) : 0);

    const invoiceHTML = `
        <p><strong>Customer:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Payment Mode:</strong> ${payMode}</p>
        <hr style="margin: 0.5rem 0; border-color: var(--border-color);">
        <p><strong>Items Ordered:</strong> ${cart.length}</p>
        <p><strong>Total Paid:</strong> ₹${total}</p>
        <p><strong>Est. Delivery:</strong> 3-5 Working Days</p>
    `;

    document.getElementById("inv-order-id").textContent = `#${orderId}`;
    document.getElementById("invoice-details").innerHTML = invoiceHTML;
    
    document.getElementById("checkout-step-1").style.display = "none";
    document.getElementById("checkout-step-2").style.display = "block";

    // Clear cart
    cart = [];
    localStorage.removeItem("cart");
    renderCart();
}