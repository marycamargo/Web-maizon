
/* =====================================
   MAIZON VERA S.A.S.
   TIENDA VIRTUAL DE DEMOSTRACIÓN
===================================== */

const WHATSAPP = "573204127214";

const CLAVES = {
    productos: "mv_final_productos",
    carrito: "mv_final_carrito",
    usuarios: "mv_final_usuarios",
    pedidos: "mv_final_pedidos",
    sesion: "mv_final_sesion"
};

/* CATÁLOGO */

const PRODUCTOS_INICIALES = [
    {
        id: 1,
        nombre: 'Montura Aviador Clásica "Titanium Gold"',
        descripcion: "Titanio ultraligero, acabado oro 18k.",
        precio: 339900,
        imagen: "imagenes/gafas1.jpg",
        categoria: "Monturas",
        stock: 15
    },
    {
        id: 2,
        nombre: 'Cordón Sujetador Elegante "Urban Chain"',
        descripcion: "Acero inoxidable, diseño moderno.",
        precio: 87900,
        imagen: "imagenes/gafas2.jpg",
        categoria: "Accesorios",
        stock: 12
    },
    {
        id: 3,
        nombre: 'Estuche Rígido "Executive Leather Guard"',
        descripcion: "Protección superior, cierre magnético.",
        precio: 119900,
        imagen: "imagenes/gafas3.jpg",
        categoria: "Accesorios",
        stock: 10
    }
];

/* ADMINISTRADOR DE PRUEBA */

const ADMIN = {
    nombre: "Administrador",
    email: "admin@maizonvera.com",
    password: "maizona123",
    rol: "admin"
};

/* ALMACENAMIENTO */

function leer(clave, inicial) {
    try {
        const dato = localStorage.getItem(clave);
        return dato ? JSON.parse(dato) : inicial;
    } catch (error) {
        return inicial;
    }
}

function guardar(clave, dato) {
    localStorage.setItem(clave, JSON.stringify(dato));
}

function dinero(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(valor);
}

function escapar(texto) {
    return String(texto ?? "").replace(/[&<>"']/g, letra => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[letra]);
}

/* DATOS */

let productos = leer(CLAVES.productos, null);
let carrito = leer(CLAVES.carrito, []);
let usuarios = leer(CLAVES.usuarios, []);
let pedidos = leer(CLAVES.pedidos, []);
let sesion = leer(CLAVES.sesion, null);

if (!Array.isArray(productos) || productos.length !== 3) {
    productos = PRODUCTOS_INICIALES.map(p => ({ ...p }));
    guardar(CLAVES.productos, productos);
}

if (!Array.isArray(carrito)) carrito = [];
if (!Array.isArray(usuarios)) usuarios = [];
if (!Array.isArray(pedidos)) pedidos = [];

/* VALIDAR SESIÓN */

function esAdmin() {
    return sesion?.rol === "admin";
}

function esCliente() {
    return sesion?.rol === "cliente";
}

function actualizarInterfaz() {
    document.querySelectorAll(".solo-invitado").forEach(el => {
        el.style.display = sesion ? "none" : "";
    });

    document.querySelectorAll(".solo-sesion").forEach(el => {
        el.style.display = sesion ? "" : "none";
    });

    document.querySelectorAll(".solo-cliente").forEach(el => {
        el.style.display = esCliente() ? "" : "none";
    });

    document.querySelectorAll(".solo-admin").forEach(el => {
        el.style.display = esAdmin() ? "" : "none";
    });

    actualizarContador();
}

/* PRODUCTOS: ACTUALIZA LAS TARJETAS DEL HTML */

function actualizarProductos() {
    productos.forEach(producto => {
        const tarjeta = document.querySelector(
            `[data-producto="${producto.id}"]`
        );

        if (!tarjeta) return;

        const precio = tarjeta.querySelector(".producto-precio");
        const stock = tarjeta.querySelector("[data-stock]");
        const boton = tarjeta.querySelector("[data-agregar]");

        if (precio) precio.textContent = dinero(producto.precio);

        if (stock) {
            stock.textContent = producto.stock > 0
                ? `${producto.stock} disponibles`
                : "Agotado";
        }

        if (boton) {
            boton.disabled = producto.stock <= 0;
            boton.textContent = producto.stock <= 0 ? "Agotado" : "+";
        }
    });

    buscarProductos();
}

/* BUSCADOR */

function buscarProductos() {
    const campo = document.getElementById("buscador");
    const texto = campo.value.toLowerCase().trim();
    let visibles = 0;

    productos.forEach(producto => {
        const tarjeta = document.querySelector(
            `[data-producto="${producto.id}"]`
        );

        if (!tarjeta) return;

        const coincide =
            producto.nombre.toLowerCase().includes(texto) ||
            producto.descripcion.toLowerCase().includes(texto) ||
            producto.categoria.toLowerCase().includes(texto);

        tarjeta.style.display = coincide ? "" : "none";

        if (coincide) visibles++;
    });

    document.getElementById("mensaje-busqueda").textContent =
        visibles === 0 ? "No encontramos productos con esa búsqueda." : "";
}

/* CARRITO */

function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);

    if (!producto || producto.stock <= 0) {
        alert("Este producto no está disponible.");
        return;
    }

    const existente = carrito.find(item => item.id === id);
    const cantidadActual = existente ? existente.cantidad : 0;

    if (cantidadActual >= producto.stock) {
        alert("No hay más unidades disponibles.");
        return;
    }

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ id, cantidad: 1 });
    }

    guardar(CLAVES.carrito, carrito);
    actualizarCarrito();
    abrirCarrito();
}

function actualizarContador() {
    const contador = document.getElementById("contador-carrito");

    if (contador) {
        contador.textContent = carrito.reduce(
            (total, item) => total + item.cantidad, 0
        );
    }
}

function actualizarCarrito() {
    const contenedor = document.getElementById("carrito-items");
    const subtotal = document.getElementById("carrito-subtotal");

    if (!contenedor || !subtotal) return;

    let total = 0;

    carrito = carrito.filter(item =>
        productos.some(p => p.id === item.id)
    );

    if (carrito.length === 0) {
        contenedor.innerHTML = "<p>Tu bolsa está vacía.</p>";
    } else {
        contenedor.innerHTML = carrito.map(item => {
            const producto = productos.find(p => p.id === item.id);

            total += producto.precio * item.cantidad;

            return `
                <div class="carrito-item">
                    <img src="${escapar(producto.imagen)}"
                         alt="${escapar(producto.nombre)}">

                    <div>
                        <strong>${escapar(producto.nombre)}</strong>
                        <p>${dinero(producto.precio)}</p>

                        <div class="cantidad">
                            <button data-cambiar="${item.id}"
                                    data-valor="-1">−</button>
                            <span>${item.cantidad}</span>
                            <button data-cambiar="${item.id}"
                                    data-valor="1">+</button>
                        </div>

                        <button class="eliminar"
                                data-eliminar="${item.id}">
                            Eliminar
                        </button>
                    </div>
                </div>
            `;
        }).join("");
    }

    subtotal.textContent = dinero(total);
    actualizarContador();
    guardar(CLAVES.carrito, carrito);
}

function cambiarCantidad(id, cambio) {
    const item = carrito.find(p => p.id === id);
    const producto = productos.find(p => p.id === id);

    if (!item || !producto) return;

    const nuevaCantidad = item.cantidad + cambio;

    if (nuevaCantidad <= 0) {
        eliminarProductoCarrito(id);
        return;
    }

    if (nuevaCantidad > producto.stock) {
        alert("No hay suficiente inventario.");
        return;
    }

    item.cantidad = nuevaCantidad;
    actualizarCarrito();
}

function eliminarProductoCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    actualizarCarrito();
}

function vaciarCarrito() {
    carrito = [];
    actualizarCarrito();
}

function abrirCarrito() {
    document.getElementById("carrito-fondo").classList.add("activo");
}

function cerrarCarrito() {
    document.getElementById("carrito-fondo").classList.remove("activo");
}

/* MODALES */

function abrirModal(id) {
    document.getElementById(id).style.display = "flex";
}

function cerrarModal(id) {
    document.getElementById(id).style.display = "none";
}

/* REGISTRO */

function registrarUsuario(event) {
    event.preventDefault();

    const nombre = document.getElementById("registro-nombre").value.trim();
    const email = document.getElementById("registro-email").value.trim().toLowerCase();
    const password = document.getElementById("registro-password").value;

    if (password.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres.");
        return;
    }

    if (email === ADMIN.email || usuarios.some(u => u.email === email)) {
        alert("Este correo ya está registrado.");
        return;
    }

    usuarios.push({
        id: Date.now(),
        nombre,
        email,
        password,
        rol: "cliente"
    });

    guardar(CLAVES.usuarios, usuarios);

    document.getElementById("form-registro").reset();
    cerrarModal("modal-registro");

    alert("Cuenta creada correctamente. Ya puedes iniciar sesión.");
}

/* INICIO DE SESIÓN */

function iniciarSesion(event) {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value;

    if (email === ADMIN.email && password === ADMIN.password) {
        sesion = {
            nombre: ADMIN.nombre,
            email: ADMIN.email,
            rol: "admin"
        };

        guardar(CLAVES.sesion, sesion);
        cerrarModal("modal-login");
        document.getElementById("form-login").reset();

        actualizarInterfaz();
        actualizarPanelAdmin();

        document.getElementById("administracion").scrollIntoView({
            behavior: "smooth"
        });

        alert("Bienvenido al panel administrativo.");
        return;
    }

    const usuario = usuarios.find(u =>
        u.email === email && u.password === password
    );

    if (!usuario) {
        alert("Correo o contraseña incorrectos.");
        return;
    }

    sesion = {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: "cliente"
    };

    guardar(CLAVES.sesion, sesion);
    cerrarModal("modal-login");
    document.getElementById("form-login").reset();

    actualizarInterfaz();
    mostrarPerfil();

    document.getElementById("perfil").scrollIntoView({
        behavior: "smooth"
    });

    alert(`Bienvenido/a, ${usuario.nombre}.`);
}

/* CERRAR SESIÓN */

function cerrarSesion() {
    sesion = null;
    localStorage.removeItem(CLAVES.sesion);

    actualizarInterfaz();

    alert("Has cerrado sesión.");
    document.getElementById("inicio").scrollIntoView({
        behavior: "smooth"
    });
}

/* PERFIL */

function mostrarPerfil() {
    if (!esCliente()) return;

    document.getElementById("perfil-nombre").value = sesion.nombre;
    document.getElementById("perfil-email").value = sesion.email;

    mostrarHistorial();
}

function actualizarPerfil(event) {
    event.preventDefault();

    if (!esCliente()) return;

    const nombre = document.getElementById("perfil-nombre").value.trim();

    if (!nombre) return;

    const usuario = usuarios.find(u => u.id === sesion.id);

    if (usuario) usuario.nombre = nombre;

    sesion.nombre = nombre;

    guardar(CLAVES.usuarios, usuarios);
    guardar(CLAVES.sesion, sesion);

    alert("Perfil actualizado correctamente.");
}

/* HISTORIAL DE PEDIDOS */

function mostrarHistorial() {
    const contenedor = document.getElementById("historial-pedidos");

    if (!contenedor || !esCliente()) return;

    const misPedidos = pedidos.filter(p => p.email === sesion.email);

    if (!misPedidos.length) {
        contenedor.innerHTML = "<p>Aún no tienes pedidos registrados.</p>";
        return;
    }

    contenedor.innerHTML = misPedidos.map(p => `
        <div class="panel">
            <h4>Pedido #${p.id}</h4>
            <p>Fecha: ${escapar(p.fecha)}</p>
            <p>Total: ${dinero(p.total)}</p>
            <p>Estado: ${escapar(p.estado)}</p>
        </div>
    `).join("");
}

/* CONFIRMAR PEDIDO */

function finalizarCompra() {
    if (!esCliente()) {
        alert("Inicia sesión como cliente para confirmar tu pedido.");
        cerrarCarrito();
        abrirModal("modal-login");
        return;
    }

    if (carrito.length === 0) {
        alert("Tu bolsa está vacía.");
        return;
    }

    for (const item of carrito) {
        const producto = productos.find(p => p.id === item.id);

        if (!producto || producto.stock < item.cantidad) {
            alert("No hay suficiente inventario para completar el pedido.");
            return;
        }
    }

    const total = carrito.reduce((suma, item) => {
        const producto = productos.find(p => p.id === item.id);
        return suma + producto.precio * item.cantidad;
    }, 0);

    const pedido = {
        id: Date.now(),
        cliente: sesion.nombre,
        email: sesion.email,
        productos: carrito.map(item => {
            const p = productos.find(producto => producto.id === item.id);

            return {
                nombre: p.nombre,
                precio: p.precio,
                cantidad: item.cantidad
            };
        }),
        total,
        fecha: new Date().toLocaleString("es-CO"),
        estado: "Pendiente"
    };

    carrito.forEach(item => {
        const producto = productos.find(p => p.id === item.id);
        producto.stock -= item.cantidad;
    });

    pedidos.push(pedido);
    carrito = [];

    guardar(CLAVES.productos, productos);
    guardar(CLAVES.pedidos, pedidos);
    guardar(CLAVES.carrito, carrito);

    actualizarCarrito();
    actualizarProductos();
    mostrarHistorial();
    actualizarPanelAdmin();
    cerrarCarrito();

    alert(
        "¡Pedido registrado correctamente!\n\n" +
        "Número: " + pedido.id + "\n" +
        "Total: " + dinero(total) +
        "\n\nEsta es una compra simulada. No se realizó ningún pago."
    );
}

/* PANEL ADMINISTRATIVO */

function actualizarPanelAdmin() {
    if (!esAdmin()) return;

    const ventas = pedidos.reduce((suma, p) => suma + p.total, 0);

    document.getElementById("admin-total-productos").textContent = productos.length;
    document.getElementById("admin-total-pedidos").textContent = pedidos.length;
    document.getElementById("admin-total-clientes").textContent = usuarios.length;
    document.getElementById("admin-total-ventas").textContent = dinero(ventas);

    mostrarInventario();
    mostrarPedidosAdmin();
    mostrarClientesAdmin();
}

/* INVENTARIO */

function mostrarInventario() {
    const tabla = document.getElementById("tabla-inventario");

    tabla.innerHTML = productos.map(p => `
        <tr>
            <td>${escapar(p.nombre)}</td>
            <td>${dinero(p.precio)}</td>
            <td>
                <input type="number" min="0" step="1"
                       value="${p.stock}" id="stock-${p.id}">
            </td>
            <td>
                <button class="btn" data-guardar-stock="${p.id}">
                    Guardar
                </button>
            </td>
        </tr>
    `).join("");
}

function actualizarStock(id) {
    if (!esAdmin()) return;

    const campo = document.getElementById(`stock-${id}`);
    const cantidad = Number(campo.value);

    if (!Number.isInteger(cantidad) || cantidad < 0) {
        alert("Ingresa una cantidad válida.");
        return;
    }

    const producto = productos.find(p => p.id === id);

    if (!producto) return;

    producto.stock = cantidad;

    guardar(CLAVES.productos, productos);
    actualizarProductos();
    mostrarInventario();

    alert("Inventario actualizado.");
}

/* PEDIDOS ADMINISTRADOR */

function mostrarPedidosAdmin() {
    const tabla = document.getElementById("tabla-pedidos");

    if (!pedidos.length) {
        tabla.innerHTML = "<tr><td colspan='5'>No hay pedidos registrados.</td></tr>";
        return;
    }

    tabla.innerHTML = pedidos.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${escapar(p.cliente)}</td>
            <td>${dinero(p.total)}</td>
            <td>${escapar(p.estado)}</td>
            <td>
                <select data-estado-pedido="${p.id}">
                    ${["Pendiente", "En preparación", "Enviado", "Entregado", "Cancelado"]
                        .map(estado => `
                            <option value="${estado}"
                                ${p.estado === estado ? "selected" : ""}>
                                ${estado}
                            </option>
                        `).join("")}
                </select>
            </td>
        </tr>
    `).join("");
}

function cambiarEstadoPedido(id, estado) {
    if (!esAdmin()) return;

    const pedido = pedidos.find(p => p.id === id);

    if (!pedido) return;

    pedido.estado = estado;

    guardar(CLAVES.pedidos, pedidos);
    mostrarPedidosAdmin();

    alert("Estado del pedido actualizado.");
}

/* CLIENTES ADMINISTRADOR */

function mostrarClientesAdmin() {
    const tabla = document.getElementById("tabla-clientes");

    if (!usuarios.length) {
        tabla.innerHTML = "<tr><td colspan='3'>No hay clientes registrados.</td></tr>";
        return;
    }

    tabla.innerHTML = usuarios.map(u => `
        <tr>
            <td>${escapar(u.nombre)}</td>
            <td>${escapar(u.email)}</td>
            <td>Cliente</td>
        </tr>
    `).join("");
}

/* CONTACTO WHATSAPP */

function enviarWhatsApp(event) {
    event.preventDefault();

    const nombre = document.getElementById("contacto-nombre").value.trim();
    const email = document.getElementById("contacto-email").value.trim();
    const mensaje = document.getElementById("contacto-mensaje").value.trim();

    const texto = `Hola, soy ${nombre}.\nCorreo: ${email || "No indicado"}.\n\n${mensaje}`;

    window.open(
        `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`,
        "_blank"
    );
}

/* MENÚ Y BOTÓN SUBIR */

function alternarMenu() {
    document.getElementById("menu").classList.toggle("abierto");
}

/* INICIO */

document.addEventListener("DOMContentLoaded", () => {

    // Mostrar los datos guardados sin reconstruir las tarjetas.
    actualizarProductos();
    actualizarCarrito();
    actualizarInterfaz();

    if (esCliente()) mostrarPerfil();
    if (esAdmin()) actualizarPanelAdmin();

    // Buscador.
    document.getElementById("buscador")
        .addEventListener("input", buscarProductos);

    // Botones principales.
    document.getElementById("btn-login")
        .addEventListener("click", () => abrirModal("modal-login"));

    document.getElementById("btn-registro")
        .addEventListener("click", () => abrirModal("modal-registro"));

    document.getElementById("btn-salir")
        .addEventListener("click", cerrarSesion);

    document.getElementById("btn-carrito")
        .addEventListener("click", abrirCarrito);

    document.getElementById("cerrar-carrito")
        .addEventListener("click", cerrarCarrito);

    document.getElementById("vaciar-carrito")
        .addEventListener("click", vaciarCarrito);

    document.getElementById("finalizar-compra")
        .addEventListener("click", finalizarCompra);

    document.getElementById("menu-btn")
        .addEventListener("click", alternarMenu);

    document.getElementById("btn-subir")
        .addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

    // Formularios.
    document.getElementById("form-login")
        .addEventListener("submit", iniciarSesion);

    document.getElementById("form-registro")
        .addEventListener("submit", registrarUsuario);

    document.getElementById("form-perfil")
        .addEventListener("submit", actualizarPerfil);

    document.getElementById("form-contacto")
        .addEventListener("submit", enviarWhatsApp);

    // Cerrar modales.
    document.querySelectorAll("[data-cerrar]").forEach(boton => {
        boton.addEventListener("click", () => {
            cerrarModal(boton.dataset.cerrar);
        });
    });

    document.querySelectorAll(".modal").forEach(modal => {
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    });

    // Agregar productos.
    document.getElementById("contenedor-productos")
        .addEventListener("click", event => {
            const boton = event.target.closest("[data-agregar]");

            if (boton) {
                agregarAlCarrito(Number(boton.dataset.agregar));
            }
        });

    // Cambiar cantidades y eliminar del carrito.
    document.getElementById("carrito-items")
        .addEventListener("click", event => {
            const cambiar = event.target.closest("[data-cambiar]");
            const eliminar = event.target.closest("[data-eliminar]");

            if (cambiar) {
                cambiarCantidad(
                    Number(cambiar.dataset.cambiar),
                    Number(cambiar.dataset.valor)
                );
            }

            if (eliminar) {
                eliminarProductoCarrito(Number(eliminar.dataset.eliminar));
            }
        });

    // Guardar inventario.
    document.getElementById("tabla-inventario")
        .addEventListener("click", event => {
            const boton = event.target.closest("[data-guardar-stock]");

            if (boton) {
                actualizarStock(Number(boton.dataset.guardarStock));
            }
        });

    // Cambiar estado de pedidos.
    document.getElementById("tabla-pedidos")
        .addEventListener("change", event => {
            const selector = event.target.closest("[data-estado-pedido]");

            if (selector) {
                cambiarEstadoPedido(
                    Number(selector.dataset.estadoPedido),
                    selector.value
                );
            }
        });

    // Cerrar menú al seleccionar una sección.
    document.getElementById("menu").addEventListener("click", event => {
        if (event.target.closest("a")) {
            document.getElementById("menu").classList.remove("abierto");
        }
    });

    // Cerrar carrito al hacer clic fuera del panel.
    document.getElementById("carrito-fondo")
        .addEventListener("click", event => {
            if (event.target.id === "carrito-fondo") {
                cerrarCarrito();
            }
        });

    console.log("MAIZON VERA: página cargada correctamente.");
});
