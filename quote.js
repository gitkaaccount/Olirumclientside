// ==========================================
// 1. CART MANAGEMENT (Add, Remove, Display)
// ==========================================

// Initialize cart from LocalStorage
let quoteList = JSON.parse(localStorage.getItem('quoteItems')) || [];

// Function to add item to quote
function addToQuote(event) {
    const btn = event.target;
    const name = btn.getAttribute('data-name');
    const price = parseFloat(btn.getAttribute('data-price'));
    const category = btn.getAttribute('data-category');
    
    // Find qty input (either on product page or passed directly)
    const qtyInputId = btn.getAttribute('data-qty-id');
    let qty = 1;
    if (qtyInputId && document.getElementById(qtyInputId)) {
        qty = parseInt(document.getElementById(qtyInputId).value);
    }

    // Check if item already in cart
    const existingItem = quoteList.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += qty;
    } else {
        quoteList.push({ name, price, category, quantity: qty });
    }

    localStorage.setItem('quoteItems', JSON.stringify(quoteList));
    alert(`${qty}x ${name} added to your quote!`);
}

// Function to display the cart on quote.html
function displayCart() {
    const cartContainer = document.getElementById('quote-cart-container');
    if (!cartContainer) return; // Exit if not on quote.html

    const mainContainer = document.getElementById('quote-container');
    const checkoutForm = document.getElementById('checkout-form-container');
    const pageTitle = document.querySelector('.category-title');

    // --- 1. EMPTY CART LOGIC (Centered) ---
    if (quoteList.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart-msg" style="text-align: center; padding: 60px 20px; font-size: 1.2rem;">
                Your quote cart is currently empty.<br>
                <a href="all-products.html" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #1a365d; color: #fff; text-decoration: none; border-radius: 4px;">Browse Products</a>
            </div>`;
        
        if (checkoutForm) checkoutForm.style.display = 'none';
        
        // Turn off flexbox to center everything
        if (mainContainer) {
            mainContainer.style.display = 'block'; 
            mainContainer.style.textAlign = 'center';
        }
        if (pageTitle) {
            pageTitle.style.textAlign = 'center';
            pageTitle.style.borderBottom = 'none';
        }
        return;
    }

    // --- 2. POPULATED CART LOGIC (Side-by-Side) ---
    if (mainContainer) {
        mainContainer.style.display = 'flex';
        mainContainer.style.textAlign = 'left';
    }
    if (pageTitle) {
        pageTitle.style.textAlign = 'left';
        pageTitle.style.borderBottom = '2px solid #e2e8f0';
    }
    if (checkoutForm) checkoutForm.style.display = 'block';

    let tableHTML = `
        <table class="quote-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalEstimate = 0;

    quoteList.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        totalEstimate += subtotal;

        tableHTML += `
            <tr>
                <td>${item.name}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
                <td>₹${subtotal.toFixed(2)}</td>
                <td>
                    <button class="remove-btn" onclick="removeFromQuote(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
        <div style="text-align: right; margin-top: 20px; font-size: 1.2rem; font-weight: bold; color: #1a365d;">
            Estimated Total: ₹${totalEstimate.toFixed(2)}
        </div>
    `;

    cartContainer.innerHTML = tableHTML;
}

// Function to remove item
window.removeFromQuote = function(index) {
    quoteList.splice(index, 1);
    localStorage.setItem('quoteItems', JSON.stringify(quoteList));
    displayCart();
};

// ==========================================
// 2. DYNAMIC PRODUCT PAGE LOADER
// ==========================================
async function loadProductData() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) return;

    try {
        const response = await fetch('products.json');
        const products = await response.json();
        const product = products.find(p => p.id === productId);

        if (product) {
            const titleEl = document.getElementById('dynamic-title');
            if (titleEl) titleEl.innerText = product.name;

            const priceEl = document.getElementById('dynamic-price');
            if (priceEl) priceEl.innerText = `₹${product.price.toFixed(2)}`;

            const imgEl = document.getElementById('dynamic-image');
            if (imgEl) imgEl.src = product.image || 'Assets/Placeholder.png';

            const descEl = document.getElementById('dynamic-description');
            if (descEl) descEl.innerHTML = product.description || 'No description available.';

            const quoteBtn = document.getElementById('dynamic-btn-quote');
            if (quoteBtn) {
                quoteBtn.setAttribute('data-name', product.name);
                quoteBtn.setAttribute('data-price', product.price);
                quoteBtn.setAttribute('data-category', product.category);
                quoteBtn.style.display = "block"; 
                quoteBtn.addEventListener('click', addToQuote);
            }
            
            document.title = `${product.name} - Olirum Scientific`;
        }
    } catch (error) {
        console.error("Error loading product data:", error);
    }
}

// ==========================================
// 3. INITIALIZATION & EMAILJS SUBMISSION
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Run initial display functions
    displayCart();
    loadProductData();

    // Attach listeners to any static buttons
    const staticQuoteBtns = document.querySelectorAll('.add-to-quote-static');
    staticQuoteBtns.forEach(btn => btn.addEventListener('click', addToQuote));

    // --- EMAILJS CONFIGURATION ---
    if (typeof emailjs !== 'undefined') {
        // REPLACE WITH YOUR PUBLIC KEY
        emailjs.init("CXP3r5IinhevalOUK"); 
    }

    const quoteForm = document.getElementById('quote-form');
    if (quoteForm) {
        quoteForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            
            const btn = document.getElementById('submit-quote-btn');
            btn.innerText = "Sending...";
            btn.disabled = true;

            const showPricesToBuyer = true; 
            let totalEstimate = 0;
            
            // Generate HTML for Seller
            let sellerCartHTML = `
                <table style="width:100%; border-collapse: collapse; font-family: sans-serif;">
                    <tr style="background-color: #f4f4f4;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Qty</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal</th>
                    </tr>
            `;

            // Generate HTML for Buyer
            let buyerCartHTML = `
                <table style="width:100%; border-collapse: collapse; font-family: sans-serif;">
                    <tr style="background-color: #f4f4f4;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Qty</th>
                        ${showPricesToBuyer ? '<th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Subtotal</th>' : ''}
                    </tr>
            `;

            // Grab the freshest data directly from storage
            const currentCart = JSON.parse(localStorage.getItem('quoteItems')) || [];

            currentCart.forEach(item => {
                const subtotal = item.quantity * item.price;
                totalEstimate += subtotal;
                
                sellerCartHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${subtotal.toFixed(2)}</td>
                    </tr>
                `;

                buyerCartHTML += `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                        ${showPricesToBuyer ? `<td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₹${subtotal.toFixed(2)}</td>` : ''}
                    </tr>
                `;
            });

            sellerCartHTML += `
                <tr>
                    <td colspan="2" style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">ESTIMATED TOTAL:</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${totalEstimate.toFixed(2)}</td>
                </tr>
                </table>
            `;

            if (showPricesToBuyer) {
                buyerCartHTML += `
                    <tr>
                        <td colspan="2" style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">ESTIMATED TOTAL:</td>
                        <td style="padding: 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">₹${totalEstimate.toFixed(2)}</td>
                    </tr>
                `;
            }
            buyerCartHTML += `</table>`;

            // Map variables exactly as written in EmailJS
            const templateParams = {
                user_name: document.getElementById('user_name').value,
                user_email: document.getElementById('user_email').value,
                cart_html_seller: sellerCartHTML,
                cart_html_buyer: buyerCartHTML
            };

            // REPLACE WITH YOUR SERVICE ID AND TEMPLATE ID
            emailjs.send('service_x00vgxa', 'template_w58swuh', templateParams)
                .then(function(response) {
                   alert("Success! Your quote request has been sent.");
                   localStorage.removeItem('quoteItems'); 
                   window.location.reload(); 
                }, function(error) {
                   console.error("EmailJS Error:", error);
                   alert("Failed to send request. Please try again.");
                   btn.innerText = "Send Request";
                   btn.disabled = false;
                });
        });
    }
});


// 'service_x00vgxa', 'template_w58swuh'
// "CXP3r5IinhevalOUK"