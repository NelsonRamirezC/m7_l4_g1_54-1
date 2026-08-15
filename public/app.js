const API_BASE = "/api";
const CART_KEY = "pasticeria-cart";

function formatCurrency(value) {
    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function getCart() {
    try {
        const items = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        return Array.isArray(items) ? items : [];
    } catch (error) {
        return [];
    }
}

function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    renderCartBadge();
}

function renderCartBadge() {
    const cart = getCart();
    const badge = document.querySelector("#cartBadge");
    if (!badge) return;
    badge.textContent = cart.reduce(
        (sum, item) => sum + Number(item.cantidad || 0),
        0,
    );
}

function addToCart(producto, cantidad = 1) {
    const cart = getCart();
    const found = cart.find(
        (item) => Number(item.producto_id) === Number(producto.id),
    );

    if (found) {
        found.cantidad += Number(cantidad);
    } else {
        cart.push({
            producto_id: Number(producto.id),
            nombre: producto.nombre,
            precio: Number(producto.precio),
            descripcion: producto.descripcion,
            cantidad: Number(cantidad),
        });
    }

    saveCart(cart);
    alert(`${producto.nombre} agregado al carrito.`);
}

function removeFromCart(productoId) {
    const cart = getCart().filter(
        (item) => Number(item.producto_id) !== Number(productoId),
    );
    saveCart(cart);
    if (typeof renderCartPage === "function") {
        renderCartPage();
    }
}

function updateCartItem(productoId, incremento) {
    const cart = getCart();
    const item = cart.find(
        (entry) => Number(entry.producto_id) === Number(productoId),
    );
    if (!item) return;

    item.cantidad += incremento;
    if (item.cantidad <= 0) {
        removeFromCart(productoId);
        return;
    }

    saveCart(cart);
    if (typeof renderCartPage === "function") {
        renderCartPage();
    }
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Error al cargar los datos");
    }
    return response.json();
}

function activeNav() {
    const current = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a[data-page]").forEach((link) => {
        const page = link.dataset.page;
        link.classList.toggle(
            "active",
            current === page || (current === "" && page === "index.html"),
        );
    });
}

async function loadDashboard() {
    const container = document.querySelector("#dashboardMetrics");
    if (!container) return;

    try {
        const [productosRes, usuariosRes, ventasRes] = await Promise.all([
            fetchJson(`${API_BASE}/productos`),
            fetchJson(`${API_BASE}/usuarios`),
            fetchJson(`${API_BASE}/ventas`),
        ]);

        const productos = productosRes.productos || [];
        const usuarios = usuariosRes.usuarios || [];
        const ventas = ventasRes.ventas || [];
        const totalVentas = ventas.reduce(
            (sum, item) => sum + Number(item.total || 0),
            0,
        );

        container.innerHTML = `
      <div class="metric">
        <span class="label">Productos</span>
        <span class="value">${productos.length}</span>
      </div>
      <div class="metric">
        <span class="label">Usuarios</span>
        <span class="value">${usuarios.length}</span>
      </div>
      <div class="metric">
        <span class="label">Ventas</span>
        <span class="value">${ventas.length}</span>
      </div>
      <div class="metric">
        <span class="label">Ingresos</span>
        <span class="value">${formatCurrency(totalVentas)}</span>
      </div>
    `;
    } catch (error) {
        container.innerHTML =
            '<div class="empty-state">No se pudieron cargar las métricas.</div>';
    }
}

async function loadProductos() {
    const grid = document.querySelector("#productosGrid");
    const search = document.querySelector("#searchInput");
    if (!grid) return;

    try {
        const { productos } = await fetchJson(`${API_BASE}/productos`);
        const items = productos || [];

        const render = (list) => {
            if (!list.length) {
                grid.innerHTML =
                    '<div class="empty-state">No hay productos que coincidan con la búsqueda.</div>';
                return;
            }

            grid.innerHTML = list
                .map(
                    (producto) => `
        <article class="card product-card">
          <span class="product-badge">Postre</span>
          <h3>${producto.nombre}</h3>
          <div class="price">${formatCurrency(producto.precio)}</div>
          <div class="meta">
            <span>Stock: ${producto.stock}</span>
            <span>SKU #${producto.id}</span>
          </div>
          <p>${producto.descripcion || "Postre artesanal preparado en casa."}</p>
          <div class="card-actions">
            <button class="btn btn-primary" data-add-cart='${JSON.stringify(producto).replace(/'/g, "&apos;")}' >Agregar</button>
            <span class="chip">${producto.stock > 0 ? "Disponible" : "Sin stock"}</span>
          </div>
        </article>
      `,
                )
                .join("");

            document.querySelectorAll("[data-add-cart]").forEach((button) => {
                button.addEventListener("click", () => {
                    const product = JSON.parse(
                        button.dataset.addCart.replace(/&apos;/g, "'"),
                    );
                    addToCart(product);
                });
            });
        };

        render(items);

        search?.addEventListener("input", (event) => {
            const texto = event.target.value.toLowerCase();
            render(
                items.filter(
                    (producto) =>
                        producto.nombre.toLowerCase().includes(texto) ||
                        (producto.descripcion || "")
                            .toLowerCase()
                            .includes(texto),
                ),
            );
        });
    } catch (error) {
        grid.innerHTML =
            '<div class="empty-state">No se pudieron cargar los productos.</div>';
    }
}

async function loadUsuarios() {
    const list = document.querySelector("#usuariosList");
    if (!list) return;

    try {
        const { usuarios } = await fetchJson(`${API_BASE}/usuarios`);
        list.innerHTML = (usuarios || [])
            .map(
                (usuario) => `
      <article class="card user-card">
        <span class="chip">ID ${usuario.id}</span>
        <h3>${usuario.nombre} ${usuario.apellido}</h3>
        <p><strong>RUT:</strong> ${usuario.rut}</p>
        <p><strong>Correo:</strong> ${usuario.correo}</p>
      </article>
    `,
            )
            .join("");
    } catch (error) {
        list.innerHTML =
            '<div class="empty-state">No se pudieron cargar los usuarios.</div>';
    }
}

async function loadVentas() {
    const table = document.querySelector("#ventasTable");
    if (!table) return;

    try {
        const { ventas } = await fetchJson(`${API_BASE}/ventas`);
        const rows = ventas || [];
        table.innerHTML = rows.length
            ? rows
                  .map(
                      (venta) => `
      <tr>
        <td>${venta.id_venta}</td>
        <td>${venta.nombre_usuario}</td>
        <td>${venta.rut}</td>
        <td>${venta.fecha_venta}</td>
        <td>${formatCurrency(venta.total)}</td>
        <td><a class="link-btn" href="/ventas-detalle.html?id=${venta.id_venta}">Ver detalle</a></td>
      </tr>
    `,
                  )
                  .join("")
            : '<tr><td colspan="6"><div class="empty-state">No hay ventas registradas.</div></td></tr>';
    } catch (error) {
        table.innerHTML =
            '<tr><td colspan="6"><div class="empty-state">No se pudieron cargar las ventas.</div></td></tr>';
    }
}

async function loadHistoria() {
    const list = document.querySelector("#historialList");
    if (!list) return;

    try {
        const { ventas } = await fetchJson(`${API_BASE}/ventas`);
        const rows = ventas || [];
        if (!rows.length) {
            list.innerHTML =
                '<div class="empty-state">Todavía no hay historial de compras.</div>';
            return;
        }

        list.innerHTML = rows
            .map(
                (venta) => `
      <article class="card venta-card">
        <span class="chip">Venta #${venta.id_venta}</span>
        <h3>${venta.nombre_usuario}</h3>
        <p><strong>Fecha:</strong> ${venta.fecha_venta}</p>
        <p><strong>RUT:</strong> ${venta.rut}</p>
        <p><strong>Total:</strong> ${formatCurrency(venta.total)}</p>
        <div class="card-actions">
          <a class="link-btn" href="/ventas-detalle.html?id=${venta.id_venta}">Detalle</a>
        </div>
      </article>
    `,
            )
            .join("");
    } catch (error) {
        list.innerHTML =
            '<div class="empty-state">No se pudo cargar el historial.</div>';
    }
}

async function loadDetalleVenta() {
    const detalleRoot = document.querySelector("#detalleVenta");
    if (!detalleRoot) return;

    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("id");

    if (!id) {
        detalleRoot.innerHTML =
            '<div class="empty-state">Debes indicar una venta para ver el detalle.</div>';
        return;
    }

    try {
        const { venta } = await fetchJson(`${API_BASE}/ventas/${id}`);
        if (!venta) {
            detalleRoot.innerHTML =
                '<div class="empty-state">No se encontró la venta.</div>';
            return;
        }

        detalleRoot.innerHTML = `
      <div class="detail-shell">
        <div class="detail-panel">
          <span class="chip">Venta #${venta.id}</span>
          <h2>Detalle de la venta</h2>
          <ul class="detail-list">
            <li><span>Fecha</span><strong>${venta.fecha_venta}</strong></li>
            <li><span>Cliente</span><strong>${venta.usuario.nombre}</strong></li>
            <li><span>RUT</span><strong>${venta.usuario.rut}</strong></li>
            <li><span>Total</span><strong>${formatCurrency(venta.total)}</strong></li>
          </ul>
        </div>
        <div class="detail-panel">
          <h3>Productos</h3>
          <ul class="detail-list">
            ${
                venta.detalle.length
                    ? venta.detalle
                          .map(
                              (item) => `
              <li>
                <span>${item.producto} × ${item.cantidad}</span>
                <strong>${formatCurrency(item.subtotal)}</strong>
              </li>
            `,
                          )
                          .join("")
                    : "<li><span>Sin productos</span></li>"
            }
          </ul>
        </div>
      </div>
    `;
    } catch (error) {
        detalleRoot.innerHTML =
            '<div class="empty-state">No se pudo cargar el detalle de la venta.</div>';
    }
}

function renderCartPage() {
    const cartList = document.querySelector("#cartList");
    const subtotalBox = document.querySelector("#subtotalBox");
    if (!cartList || !subtotalBox) return;

    const cart = getCart();
    if (!cart.length) {
        cartList.innerHTML =
            '<div class="empty-state">Tu carrito está vacío.</div>';
        subtotalBox.innerHTML = `
      <div class="summary-row"><span>Subtotal</span><strong>${formatCurrency(0)}</strong></div>
      <div class="summary-row total"><span>Total</span><strong>${formatCurrency(0)}</strong></div>
    `;
        return;
    }

    const total = cart.reduce(
        (sum, item) =>
            sum + Number(item.precio || 0) * Number(item.cantidad || 0),
        0,
    );

    cartList.innerHTML = cart
        .map(
            (item) => `
    <li class="cart-item">
      <div>
        <h4>${item.nombre}</h4>
        <div class="qty-controls">
          <button type="button" data-qty="minus" data-id="${item.producto_id}">−</button>
          <span>${item.cantidad}</span>
          <button type="button" data-qty="plus" data-id="${item.producto_id}">+</button>
        </div>
      </div>
      <div>
        <strong>${formatCurrency((Number(item.precio) || 0) * Number(item.cantidad || 0))}</strong>
        <div class="inline-actions">
          <button class="btn btn-secondary" data-remove="${item.producto_id}">Quitar</button>
        </div>
      </div>
    </li>
  `,
        )
        .join("");

    subtotalBox.innerHTML = `
    <div class="summary-row"><span>Subtotal</span><strong>${formatCurrency(total)}</strong></div>
    <div class="summary-row total"><span>Total</span><strong>${formatCurrency(total)}</strong></div>
  `;

    document.querySelectorAll("[data-qty]").forEach((button) => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const action = button.dataset.qty;
            updateCartItem(id, action === "plus" ? 1 : -1);
        });
    });

    document.querySelectorAll("[data-remove]").forEach((button) => {
        button.addEventListener("click", () => {
            removeFromCart(Number(button.dataset.remove));
        });
    });
}

async function loadUsuariosSelect() {
    const select = document.querySelector("#usuarioSelect");
    if (!select) return;

    try {
        const { usuarios } = await fetchJson(`${API_BASE}/usuarios`);
        select.innerHTML =
            '<option value="">Selecciona cliente</option>' +
            (usuarios || [])
                .map(
                    (usuario) => `
      <option value="${usuario.id}">${usuario.nombre} ${usuario.apellido} - ${usuario.rut}</option>
    `,
                )
                .join("");
    } catch (error) {
        select.innerHTML = '<option value="">No hay clientes</option>';
    }
}

async function finalizarCompra() {
    const form = document.querySelector("#checkoutForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const usuarioId = Number(
            document.querySelector("#usuarioSelect").value,
        );
        const carrito = getCart().map((item) => ({
            producto_id: Number(item.producto_id),
            cantidad: Number(item.cantidad),
        }));

        if (!usuarioId || !carrito.length) {
            alert(
                "Debes seleccionar un usuario y agregar productos al carrito.",
            );
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/ventas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ usuario_id: usuarioId, carrito }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(
                    result.message || "No se pudo registrar la venta.",
                );
            }

            localStorage.removeItem(CART_KEY);
            renderCartBadge();
            renderCartPage();
            alert(`Venta registrada con éxito. ID: ${result.data.venta_id}`);
            window.location.href = "/historial.html";
        } catch (error) {
            alert(error.message || "Ocurrió un error al registrar la compra.");
        }
    });
}

function initHome() {
    loadDashboard();
}

function initProductos() {
    loadProductos();
}

function initUsuarios() {
    loadUsuarios();
}

function initHistorial() {
    loadHistoria();
}

function initVentas() {
    loadVentas();
}

function initDetalleVenta() {
    loadDetalleVenta();
}

function initCarrito() {
    renderCartPage();
    loadUsuariosSelect();
    finalizarCompra();
}

document.addEventListener("DOMContentLoaded", () => {
    activeNav();
    renderCartBadge();

    const page = location.pathname.split("/").pop() || "index.html";
    if (page === "index.html" || page === "") initHome();
    if (page === "productos.html") initProductos();
    if (page === "usuarios.html") initUsuarios();
    if (page === "historial.html") initHistorial();
    if (page === "ventas.html") initVentas();
    if (page === "ventas-detalle.html") initDetalleVenta();
    if (page === "carrito.html") initCarrito();
});
