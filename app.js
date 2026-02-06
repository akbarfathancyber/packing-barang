/**
 * File: app.js
 * Deskripsi: Mengelola semua logika untuk Sistem Packing Barang.
 * Ini termasuk login, manajemen pesanan, dan pelacakan.
 */

// Menjalankan skrip setelah DOM sepenuhnya dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Menggunakan path URL untuk menentukan halaman mana yang aktif
    const path = window.location.pathname.split("/").pop();

    if (path === 'login.html' || path === '') {
        initLoginPage();
    } else if (path === 'admin.html') {
        initAdminPage();
    } else if (path === 'order.html') {
        initOrderPage();
    } else if (path === 'tracking.html') {
        initTrackingPage();
    }
});

/**
 * Inisialisasi fungsionalitas untuk halaman login.
 */
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;
        const errorMessage = document.getElementById('error-message');

        // Kredensial sederhana
        if (username === 'admin' && password === 'admin123') {
            // Simpan sesi login di LocalStorage
            localStorage.setItem('isLoggedIn', 'true');
            // Arahkan ke halaman admin
            window.location.href = 'admin.html';
        } else {
            errorMessage.textContent = 'Username atau password salah.';
        }
    });
}

/**
 * Inisialisasi fungsionalitas untuk halaman admin.
 * Melindungi halaman dan memuat data pesanan.
 */
function initAdminPage() {
    // Perlindungan halaman: hanya bisa diakses jika sudah login
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        // Jika belum login, tendang kembali ke halaman login
        window.location.href = 'login.html';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Hapus sesi dari LocalStorage
            localStorage.removeItem('isLoggedIn');
            // Arahkan kembali ke halaman login
            window.location.href = 'login.html';
        });
    }

    renderOrdersTable();
}

/**
 * Inisialisasi fungsionalitas untuk halaman pembuatan pesanan.
 */
function initOrderPage() {
    const orderForm = document.getElementById('order-form');
    if (!orderForm) return;

    orderForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Generate nomor resi unik: PKG + timestamp
        const resi = 'PKG' + Date.now();

        // Kumpulkan data dari form
        const newOrder = {
            resi: resi,
            senderName: document.getElementById('sender-name').value,
            itemName: document.getElementById('item-name').value,
            packingType: document.getElementById('packing-type').value,
            itemWeight: document.getElementById('item-weight').value,
            notes: document.getElementById('notes').value,
            status: 'Menunggu' // Status awal
        };

        // Ambil data pesanan yang ada dari LocalStorage, atau buat array baru jika belum ada
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        // Tambahkan pesanan baru
        orders.push(newOrder);
        // Simpan kembali ke LocalStorage
        localStorage.setItem('orders', JSON.stringify(orders));

        // Beri tahu pengguna dan bersihkan formulir
        alert(`Pesanan berhasil dibuat!
Nomor Resi Anda: ${resi}`);
        orderForm.reset();
    });
}

/**
 * Inisialisasi fungsionalitas untuk halaman pelacakan pesanan.
 */
function initTrackingPage() {
    const trackingForm = document.getElementById('tracking-form');
    if (!trackingForm) return;

    trackingForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const trackingNumber = document.getElementById('tracking-number').value.trim();
        const resultDiv = document.getElementById('tracking-result');

        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const foundOrder = orders.find(order => order.resi === trackingNumber);

        if (foundOrder) {
            resultDiv.innerHTML = `
                <p><strong>Nomor Resi:</strong> ${foundOrder.resi}</p>
                <p><strong>Nama Pengirim:</strong> ${foundOrder.senderName}</p>
                <p><strong>Nama Barang:</strong> ${foundOrder.itemName}</p>
                <p><strong>Jenis Packing:</strong> ${foundOrder.packingType}</p>
                <p><strong>Berat:</strong> ${foundOrder.itemWeight} kg</p>
                <p><strong>Status Pesanan:</strong> <span style="font-weight: bold; color: var(--success-color);">${foundOrder.status}</span></p>
            `;
        } else {
            resultDiv.innerHTML = `<p style="color: var(--danger-color);">Nomor resi tidak ditemukan.</p>`;
        }
    });
}

/**
 * Merender tabel pesanan di halaman admin.
 */
function renderOrdersTable() {
    const ordersTbody = document.getElementById('orders-tbody');
    if (!ordersTbody) return;

    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    ordersTbody.innerHTML = ''; // Kosongkan tabel sebelum mengisi

    if (orders.length === 0) {
        ordersTbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Belum ada pesanan.</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.resi}</td>
            <td>${order.senderName}</td>
            <td>${order.itemName}</td>
            <td>${order.packingType}</td>
            <td>${order.itemWeight} kg</td>
            <td>${order.status}</td>
            <td>
                <select class="status-select" data-resi="${order.resi}">
                    <option value="Menunggu" ${order.status === 'Menunggu' ? 'selected' : ''}>Menunggu</option>
                    <option value="Dipacking" ${order.status === 'Dipacking' ? 'selected' : ''}>Dipacking</option>
                    <option value="Selesai" ${order.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                    <option value="Dikirim" ${order.status === 'Dikirim' ? 'selected' : ''}>Dikirim</option>
                </select>
            </td>
        `;
        ordersTbody.appendChild(row);
    });

    // Tambahkan event listener untuk semua dropdown status
    addEventListenersToStatusSelects();
}

/**
 * Menambahkan event listener ke dropdown status di tabel admin.
 */
function addEventListenersToStatusSelects() {
    const statusSelects = document.querySelectorAll('.status-select');
    statusSelects.forEach(select => {
        select.addEventListener('change', (event) => {
            const resi = event.target.dataset.resi;
            const newStatus = event.target.value;
            updateOrderStatus(resi, newStatus);
        });
    });
}

/**
 * Memperbarui status pesanan di LocalStorage.
 * @param {string} resi - Nomor resi pesanan yang akan diperbarui.
 * @param {string} newStatus - Status baru untuk pesanan.
 */
function updateOrderStatus(resi, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const orderIndex = orders.findIndex(order => order.resi === resi);

    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        // Render ulang tabel untuk menampilkan status yang diperbarui
        renderOrdersTable();
    }
}
