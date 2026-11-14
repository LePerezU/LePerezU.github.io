// ServicioCatalogo: simula la respuesta JSON del servicio (desc = % de descuento, stock 0 = agotado)
const productosDB = [
  { id:1, emoji:"💀", nombre:"Calaverita de chocolate", categoria:"Dulces", precio:45, desc:10, stock:20 },
  { id:2, emoji:"🍬", nombre:"Calaverita de azúcar", categoria:"Dulces", precio:35, desc:0, stock:3 },
  { id:3, emoji:"🫔", nombre:"Tamalito de rajas con queso", categoria:"Tamalitos", precio:30, desc:10, stock:15 },
  { id:4, emoji:"🫔", nombre:"Tamalito de mole", categoria:"Tamalitos", precio:32, desc:0, stock:12 },
  { id:5, emoji:"🫔", nombre:"Tamalito de dulce", categoria:"Tamalitos", precio:28, desc:0, stock:0 },
  { id:6, emoji:"🍞", nombre:"Pan de muerto", categoria:"Panadería", precio:40, desc:10, stock:25 },
  { id:7, emoji:"☕", nombre:"Champurradito", categoria:"Bebidas", precio:38, desc:0, stock:18 },
  { id:100, emoji:"🎁", nombre:"Paquete Calaverita", categoria:"Paquete", precio:180, desc:15, stock:8,
    incluye:"1 calaverita de chocolate, 1 de azúcar, 1 pan de muerto, 1 tamalito y 1 champurradito" }
];
let usuario = null, carrito = {}, filtro = "Todos", operaciones = 0, errores = 0;
const $ = id => document.getElementById(id);
const final = p => Math.round(p.precio * (1 - p.desc / 100));
const buscar = id => productosDB.find(p => p.id === id);

// Management: bitácora de operaciones y errores
function log(servicio, op, error = false) {
  operaciones++; if (error) errores++;
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} · ${servicio}.${op}${error ? " ✖ error" : " ✔"} (ops: ${operaciones}, errores: ${errores})`;
  $("bitacora").prepend(li);
}

// Anuncio emergente (toast)
function toast(titulo, html, error = false, irCarrito = false) {
  const t = document.createElement("div");
  t.className = "toast" + (error ? " error" : "");
  t.innerHTML = `<button class="x" onclick="this.parentNode.remove()">✕</button><b class="t">${titulo}</b><div>${html}</div>` +
    (irCarrito ? `<button onclick="abrirCarrito();this.parentNode.remove()">Ir al carrito de compras</button>` : "");
  $("toasts").appendChild(t);
  setTimeout(() => t.remove(), 4500);
}

// ServicioUsuarios
function registrarUsuario() {
  const nombre = $("nombre").value.trim(), correo = $("correo").value.trim();
  if (!nombre || !correo.includes("@")) {
    $("mensajeUsuario").textContent = "Completa nombre y un correo válido.";
    return log("ServicioUsuarios", "registrarUsuario", true);
  }
  usuario = { nombre, correo };
  $("btnUsuario").textContent = "👤 " + nombre;
  $("dlgRegistro").close(); $("mensajeUsuario").textContent = "";
  toast("Bienvenid@ 🌼", `Sesión iniciada como <b>${nombre}</b>.`);
  log("ServicioUsuarios", "registrarUsuario");
}

// ServicioCatalogo
function listarProductos() { log("ServicioCatalogo", "listarProductos"); return productosDB; }

function tarjeta(p) {
  const ago = p.stock <= 0;
  return `<div class="card ${p.categoria === "Paquete" ? "paquete" : ""}">
    <div class="img">${p.emoji}${p.desc ? `<span class="badge">-${p.desc}% OFF</span>` : ""}${ago ? `<span class="badge ago">Agotado</span>` : ""}</div>
    <div class="info"><h3>${p.nombre}</h3><span class="cat">${p.categoria}</span>
      ${p.incluye ? `<span class="cat">Incluye: ${p.incluye}</span>` : ""}
      <span class="stock ${p.stock <= 5 ? "bajo" : ""}">${ago ? "Sin existencias" : (p.stock <= 5 ? "¡Stock bajo! " : "Stock: ") + p.stock}</span>
      <div class="precio">$${final(p)} MXN${p.desc ? `<s>$${p.precio} MXN</s>` : ""}</div>
      ${ago ? `<button class="outline" onclick="verDetalles(${p.id})">Ver detalles</button>` : `<button onclick="agregarAlCarrito(${p.id})">🛒 Agregar al carro</button>`}
    </div></div>`;
}

function mostrarCatalogo() {
  const lista = listarProductos().filter(p => filtro === "Todos" || p.categoria === filtro);
  $("catalogo").innerHTML = lista.filter(p => p.categoria !== "Paquete").map(tarjeta).join("") || "<p>Sin productos.</p>";
  $("paquete").innerHTML = lista.filter(p => p.categoria === "Paquete").map(tarjeta).join("") || "<p>Sin paquetes.</p>";
}

function filtrar(cat) {
  filtro = cat; mostrarCatalogo(); pintarFiltros();
  $("menuCategorias").parentNode.classList.remove("open");
}

function pintarFiltros() {
  const cats = ["Todos", ...new Set(productosDB.map(p => p.categoria))];
  $("chips").innerHTML = cats.map(c => `<button class="chip ${c === filtro ? "on" : ""}" onclick="filtrar('${c}')">${c}</button>`).join("");
  $("menuCategorias").innerHTML = cats.map(c => `<a onclick="filtrar('${c}')">${c}</a>`).join("");
}

function verDetalles(id) {
  const p = buscar(id);
  toast(p.nombre, `Producto agotado por ahora. Categoría: ${p.categoria}. ¡Pronto volverá a la ofrenda!`, true);
}

// ServicioCarrito
function agregarAlCarrito(id) {
  const p = buscar(id);
  if (!usuario) {
    toast("Identifícate primero", "Registra al cliente antes de comprar.", true);
    $("dlgRegistro").showModal();
    return log("ServicioCarrito", "agregarProducto", true);
  }
  if ((carrito[id] || 0) >= p.stock) {
    toast("Sin stock suficiente", `No hay más unidades de <b>${p.nombre}</b>.`, true);
    return log("ServicioCarrito", "agregarProducto", true);
  }
  carrito[id] = (carrito[id] || 0) + 1;
  actualizarCarrito(); log("ServicioCarrito", "agregarProducto");
  toast("Éxito al añadir al carrito", `1 unidad de <b>${p.nombre}</b> ha sido agregada.`, false, true);
}

function quitar(id) { carrito[id]--; if (!carrito[id]) delete carrito[id]; actualizarCarrito(); log("ServicioCarrito", "quitarProducto"); }

function calcularTotal() { return Object.entries(carrito).reduce((a, [id, c]) => a + final(buscar(+id)) * c, 0); }

function actualizarCarrito() {
  $("listaCarrito").innerHTML = Object.entries(carrito).map(([id, c]) => {
    const p = buscar(+id);
    return `<li>${p.emoji} ${p.nombre} x${c} - $${final(p) * c}<button class="mini" onclick="quitar(${id})">−</button></li>`;
  }).join("") || "<li>Aún no hay productos.</li>";
  $("total").textContent = calcularTotal();
  $("contador").textContent = Object.values(carrito).reduce((a, c) => a + c, 0);
}

function abrirCarrito() { $("carrito").classList.add("abierto"); }
function vaciarCarrito() { carrito = {}; actualizarCarrito(); log("ServicioCarrito", "limpiarCarrito"); }

function confirmarPedido() {
  if (!usuario || !Object.keys(carrito).length) {
    $("mensajePedido").textContent = "Registra usuario y agrega productos.";
    toast("No se pudo confirmar", "Registra usuario y agrega productos.", true);
    return log("ServicioCarrito", "confirmarPedido", true);
  }
  Object.entries(carrito).forEach(([id, c]) => buscar(+id).stock -= c);
  const folio = "DD-" + Math.floor(Math.random() * 9000 + 1000);
  $("mensajePedido").textContent = `Pedido confirmado 🎉 Folio: ${folio}`;
  toast("Pedido confirmado 🎉", `Tu folio es <b>${folio}</b>.`);
  log("ServicioCarrito", "confirmarPedido");
  carrito = {}; actualizarCarrito(); mostrarCatalogo();
}

pintarFiltros(); mostrarCatalogo(); actualizarCarrito();

// Asistente de preguntas frecuentes: basado en reglas (no usa IA) y toma los datos de productosDB
(() => {
  // Sustituye los datos pendientes por la información real de la tienda.
  const CFG = {
    whatsapp: "525639629894", // código de país (52) + número, solo dígitos
    horarios: "Horario pendiente de configurar. Escríbenos por WhatsApp.",
    envios: "Las zonas y costos de envío están pendientes de configurar. Escríbenos por WhatsApp.",
    pagos: "Los métodos de pago están pendientes de configurar. Escríbenos por WhatsApp."
  };
  const norm = t => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const wa = "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent("Hola, quiero información de Deli Deliverita.");
  $("wa").href = wa; $("chat-wa").href = wa;

  // [botón, regex que lo activa, respuesta]; gana la primera regla que coincida
  const FAQ = [
    ["Paquete Calaverita", /\b(paquete|paquetes|combo|incluye)\b/, () => {
      const p = buscar(100);
      return `${p.emoji} ${p.nombre}: $${final(p)} MXN${p.desc ? ` (antes $${p.precio}, -${p.desc}%)` : ""}.\nIncluye: ${p.incluye}.`;
    }],
    ["Productos", /\b(productos|catalogo|venden|menu|tamal|tamales|tamalitos|pan|calaveritas?|champurradito)\b/, () => {
      const ok = productosDB.filter(p => p.categoria !== "Paquete" && p.stock > 0).map(p => `${p.emoji} ${p.nombre}: $${final(p)}`).join("\n");
      const ago = productosDB.filter(p => p.stock <= 0).map(p => p.nombre).join(", ");
      return "Esto tenemos:\n" + ok + (ago ? `\n\nAgotado por ahora: ${ago}.` : "");
    }],
    ["Promociones", /\b(promociones|descuentos?|ofertas?|barato)\b/, () => {
      const d = productosDB.filter(p => p.desc && p.stock > 0).map(p => `${p.emoji} ${p.nombre}: -${p.desc}%`).join("\n");
      return "Promociones activas:\n" + d;
    }],
    ["¿Cómo compro?", /\b(comprar|compro|pedido|pedidos|carrito|carro|registro|registrar)\b/, () =>
      "1) Regístrate con tu nombre y correo.\n2) Agrega productos con \"Agregar al carro\".\n3) Abre el carro y pulsa \"Confirmar pedido\" para recibir tu folio."],
    ["Envíos", /\b(envio|envios|entrega|entregan|domicilio)\b/, () => CFG.envios],
    ["Pagos", /\b(pago|pagos|pagar|tarjeta|efectivo|transferencia)\b/, () => CFG.pagos],
    ["Horarios", /\b(horario|horarios|abren|cierran|atienden)\b/, () => CFG.horarios],
    ["Contacto", /\b(contacto|whatsapp|telefono|persona|ayuda|humano)\b/, () => "Puedes escribirnos por WhatsApp con el botón verde de abajo y te atendemos."]
  ];

  const panel = $("chat"), launch = $("chat-launch"), input = $("chat-input"), reg = $("chat-log");
  function msg(texto, usuario = false) {
    const p = document.createElement("p");
    p.className = "chat-msg" + (usuario ? " user" : "");
    p.textContent = texto; // texto plano: lo que escribe el visitante nunca se interpreta como HTML
    reg.append(p);
    while (reg.children.length > 60) reg.firstElementChild.remove();
    reg.scrollTop = reg.scrollHeight;
  }
  function responder(texto) {
    const t = norm(texto), r = FAQ.find(f => f[1].test(t));
    if (r) return r[2]();
    if (/\b(hola|buenas|buenos)\b/.test(t)) return "¡Hola! 💀🌼 Elige una pregunta frecuente o escribe la tuya.";
    return "No tengo una respuesta para eso. Prueba con una pregunta frecuente o escríbenos por WhatsApp.";
  }
  function enviar(texto) {
    texto = texto.trim().slice(0, 300);
    if (!texto) return;
    msg(texto, true); msg(responder(texto));
    log("Asistente", "responder");
  }
  function abrir(si) {
    panel.hidden = !si;
    document.body.classList.toggle("chat-abierto", si);
    launch.setAttribute("aria-expanded", String(si));
    launch.textContent = si ? "✕ Cerrar" : "💬 Asistente";
    (si ? input : launch).focus();
  }
  $("chat-faq").innerHTML = FAQ.map(f => `<button type="button">${f[0]}</button>`).join("");
  $("chat-faq").querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => enviar(FAQ[i][0])));
  launch.addEventListener("click", () => abrir(panel.hidden));
  $("chat-close").addEventListener("click", () => abrir(false));
  panel.addEventListener("keydown", e => { if (e.key === "Escape") abrir(false); });
  $("chat-form").addEventListener("submit", e => { e.preventDefault(); enviar(input.value); input.value = ""; input.focus(); });
  msg("¡Bienvenid@ a Deli Deliverita! 💀🌼 Soy el asistente automatizado. ¿En qué te ayudo?");
})();
