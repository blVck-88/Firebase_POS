console.log('admin.js loaded');

// State variables
let salesData = []; // To cache sales data
let productsData = []; // To cache products data
let editingProductId = null; // To track which product is being edited

// DOM Elements
let productForm, productFormTitle, productSubmitBtn, productList, imagePreview, imageInput;
let salesList, filterDateStart, filterDateEnd, applySalesFilterBtn, resetSalesFilterBtn;
let saleDetailsModal, modalCloseBtn, modalSaleTitle, modalSaleBody;

// This function will be called by app.js after the page is loaded.
document.addEventListener('adminPageReady', initAdminPage);

function initAdminPage() {
    console.log('Initializing Admin Page...');

    // --- Product Management Elements ---
    productForm = document.getElementById('product-form');
    productFormTitle = document.getElementById('product-form-title');
    productSubmitBtn = document.getElementById('product-submit-btn');
    productList = document.getElementById('product-list');
    imagePreview = document.getElementById('image-preview');
    imageInput = document.getElementById('product-image');

    // --- Sales History Elements ---
    salesList = document.getElementById('sales-list-body');
    filterDateStart = document.getElementById('filter-date-start');
    filterDateEnd = document.getElementById('filter-date-end');
    applySalesFilterBtn = document.getElementById('apply-sales-filter-btn');
    resetSalesFilterBtn = document.getElementById('reset-sales-filter-btn');

    // --- Modal Elements ---
    saleDetailsModal = document.getElementById('sale-details-modal');
    modalCloseBtn = saleDetailsModal.querySelector('.close-btn');
    modalSaleTitle = document.getElementById('modal-sale-title');
    modalSaleBody = document.getElementById('modal-sale-body');

    // --- Event Listeners ---
    productForm.addEventListener('submit', handleProductSubmit);
    imageInput.addEventListener('change', handleImagePreview);
    productList.addEventListener('click', handleProductListClick);
    applySalesFilterBtn.addEventListener('click', () => loadSales(true));
    resetSalesFilterBtn.addEventListener('click', () => {
        filterDateStart.value = '';
        filterDateEnd.value = '';
        loadSales();
    });
    salesList.addEventListener('click', handleSalesListClick);

    // Modal close events
    modalCloseBtn.onclick = () => { saleDetailsModal.style.display = 'none'; };
    window.onclick = (event) => {
        if (event.target == saleDetailsModal) {
            saleDetailsModal.style.display = 'none';
        }
    };

    // Initial data load
    loadProducts();
    loadSales();
}

// --- Product Functions ---
function handleImagePreview(e) {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target.result;
            imagePreview.style.display = 'block';
        }
        reader.readAsDataURL(e.target.files[0]);
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const productName = e.target.elements['product-name'].value;
    const productPrice = parseFloat(e.target.elements['product-price'].value);
    const productStock = parseInt(e.target.elements['product-stock'].value, 10);
    const productCategory = e.target.elements['product-category'].value;
    const imageFile = e.target.elements['product-image'].files[0];

    productSubmitBtn.disabled = true;
    productSubmitBtn.textContent = 'Saving...';

    try {
        if (editingProductId) {
            // Update existing product
            const productRef = window.fb_db.collection('products').doc(editingProductId);
            let imageUrl = productsData.find(p => p.id === editingProductId).imageUrl;

            if (imageFile) {
                // Delete old image if it exists
                if (imageUrl) {
                    try {
                        const oldImageRef = window.fb_storage.refFromURL(imageUrl);
                        await oldImageRef.delete();
                    } catch (error) {
                        console.warn('Old image not found or could not be deleted:', error.message);
                    }
                }
                // Upload new image
                const newImageRef = window.fb_storage.ref(`product_images/${Date.now()}_${imageFile.name}`);
                const uploadTask = await newImageRef.put(imageFile);
                imageUrl = await uploadTask.ref.getDownloadURL();
            }

            await productRef.update({
                name: productName,
                price: productPrice,
                stock: productStock,
                category: productCategory,
                imageUrl: imageUrl
            });
            alert('Product updated successfully!');
        } else {
            // Add new product
            let imageUrl = '';
            if (imageFile) {
                const imageRef = window.fb_storage.ref(`product_images/${Date.now()}_${imageFile.name}`);
                const uploadTask = await imageRef.put(imageFile);
                imageUrl = await uploadTask.ref.getDownloadURL();
            }

            await window.fb_db.collection('products').add({
                name: productName,
                price: productPrice,
                stock: productStock,
                category: productCategory,
                imageUrl: imageUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Product added successfully!');
        }
        resetProductForm();
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        alert(`Error: ${error.message}`);
    } finally {
        productSubmitBtn.disabled = false;
    }
}

function handleProductListClick(e) {
    if (e.target.classList.contains('edit-btn')) {
        const productId = e.target.dataset.id;
        editProduct(productId);
    } else if (e.target.classList.contains('delete-btn')) {
        const productId = e.target.dataset.id;
        deleteProduct(productId);
    }
}

async function loadProducts() {
    try {
        const snapshot = await window.fb_db.collection('products').orderBy('createdAt', 'desc').get();
        productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProducts() {
    productList.innerHTML = ''; // Clear existing list
    productsData.forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-item';
        productDiv.innerHTML = `
            <img src="${product.imageUrl || 'https://via.placeholder.com/100'}" alt="${product.name}">
            <div class="product-details">
                <strong>${product.name}</strong>
                <span>Price: $${product.price.toFixed(2)}</span>
                <span>Stock: ${product.stock}</span>
                <span>Category: ${product.category}</span>
            </div>
            <div class="product-actions">
                <button class="edit-btn" data-id="${product.id}">Edit</button>
                <button class="delete-btn" data-id="${product.id}">Delete</button>
            </div>
        `;
        productList.appendChild(productDiv);
    });
}

function editProduct(id) {
    const product = productsData.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    productForm.elements['product-name'].value = product.name;
    productForm.elements['product-price'].value = product.price;
    productForm.elements['product-stock'].value = product.stock;
    productForm.elements['product-category'].value = product.category;
    imagePreview.src = product.imageUrl || '';
    imagePreview.style.display = product.imageUrl ? 'block' : 'none';

    productFormTitle.textContent = 'Edit Product';
    productSubmitBtn.textContent = 'Update Product';
    window.scrollTo(0, 0); // Scroll to top to see the form
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        // If deleting the product currently being edited, reset the form
        if (id === editingProductId) {
            resetProductForm();
        }
        await window.fb_db.collection('products').doc(id).delete();
        alert('Product deleted successfully!');
        loadProducts(); // Refresh the list
    } catch (error) {
        console.error('Error deleting product:', error);
        alert(`Error: ${error.message}`);
    }
}

function resetProductForm() {
    productForm.reset();
    editingProductId = null;
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    productFormTitle.textContent = 'Add a New Product';
    productSubmitBtn.textContent = 'Add Product';
    productSubmitBtn.disabled = false;
}

// --- Sales Functions ---
async function loadSales(isFiltering = false) {
    try {
        let query = window.fb_db.collection('sales').orderBy('createdAt', 'desc');

        if (isFiltering) {
            const startDate = filterDateStart.value ? new Date(filterDateStart.value) : null;
            const endDate = filterDateEnd.value ? new Date(filterDateEnd.value) : null;

            if (startDate) {
                query = query.where('createdAt', '>=', startDate);
            }
            if (endDate) {
                // To include the whole end day, set time to 23:59:59
                endDate.setHours(23, 59, 59, 999);
                query = query.where('createdAt', '<=', endDate);
            }
        }

        const snapshot = await query.get();
        salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderSales();
    } catch (error) {
        console.error('Error loading sales:', error);
    }
}

function renderSales() {
    salesList.innerHTML = ''; // Clear existing list
    if (salesData.length === 0) {
        salesList.innerHTML = '<tr><td colspan="7">No sales found.</td></tr>';
        return;
    }

    salesData.forEach(sale => {
        const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.id.substring(0, 8)}...</td>
            <td>${new Date(sale.createdAt.seconds * 1000).toLocaleDateString()}</td>
            <td>${sale.cashierEmail}</td>
            <td>${totalItems} (x${sale.items.length} types)</td>
            <td>$${sale.subtotal.toFixed(2)}</td>
            <td>$${sale.tax.toFixed(2)}</td>
            <td>$${sale.total.toFixed(2)}</td>
            <td><button class="view-details-btn" data-id="${sale.id}">View</button></td>
        `;
        salesList.appendChild(row);
    });
}

function handleSalesListClick(e) {
    if (e.target.classList.contains('view-details-btn')) {
        const saleId = e.target.dataset.id;
        showSaleDetails(saleId);
    }
}

function showSaleDetails(saleId) {
    const sale = salesData.find(s => s.id === saleId);
    if (!sale) return;

    modalSaleTitle.textContent = `Sale Details: ${sale.id.substring(0, 8)}...`;

    let bodyHtml = `
        <p><strong>Date:</strong> ${new Date(sale.createdAt.seconds * 1000).toLocaleString()}</p>
        <p><strong>Cashier:</strong> ${sale.cashierEmail}</p>
        <hr>
        <h4>Items Sold</h4>
        <ul>
    `;

    sale.items.forEach(item => {
        bodyHtml += `<li><span>${item.name} (x${item.quantity})</span> <span>$${(item.price * item.quantity).toFixed(2)}</span></li>`;
    });

    bodyHtml += `
        </ul>
        <div class="summary">
            <div class="summary-line"><span>Subtotal:</span> <span>$${sale.subtotal.toFixed(2)}</span></div>
            <div class="summary-line"><span>Tax (5%):</span> <span>$${sale.tax.toFixed(2)}</span></div>
            <div class="summary-line total"><span>Total:</span> <span>$${sale.total.toFixed(2)}</span></div>
        </div>
    `;

    modalSaleBody.innerHTML = bodyHtml;
    saleDetailsModal.style.display = 'block';
}

// This custom event dispatch allows app.js to signal when the admin page is ready.
// This is a robust way to handle initialization for dynamically loaded content.
const adminPageReadyEvent = new Event('adminPageReady');
document.dispatchEvent(adminPageReadyEvent);

