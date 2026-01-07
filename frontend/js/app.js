/***********************
 * CONFIGURACIÓN API
 ***********************/
const DEFAULT_API_BASE = "http://localhost:3000";

const $ = (id) => document.getElementById(id);

function normalizeBase(url) {
  return (url || "").trim().replace(/\/$/, "");
}

function getApiBase() {
  localStorage.removeItem("apiBase");
  return normalizeBase(DEFAULT_API_BASE);
}

function apiUrl(path) {
  return `${getApiBase()}/api/v1/${path}`;
}

/***********************
 * MENSAJES
 ***********************/
function setMsg(text) {
  const el = $("msg");
  if (el) el.textContent = text || "";
}

/***********************
 * FETCH SEGURO JSON
 ***********************/
async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/***********************
 * USUARIO
 ***********************/
function showAuthModal(tipo = "login") {
  const modal = $("modalAuth");
  const title = $("authTitle");
  const grupoNombre = $("grupoNombre");

  modal.classList.remove("hidden");

  if (tipo === "login") {
    title.textContent = "Iniciar sesión";
    grupoNombre.style.display = "none";
  } else {
    title.textContent = "Registro";
    grupoNombre.style.display = "block";
  }

  document.getElementById("formAuth").reset();
}

function setUsuarioTopbar(usuario) {
  let menu = document.getElementById("usuarioMenu");
  if (!menu) {
    menu = document.createElement("div");
    menu.id = "usuarioMenu";
    menu.className = "usuario-menu";
    menu.innerHTML = `
      <button id="btnUsuario"></button>
      <div id="dropdownUsuario" class="dropdown hidden">
        <p id="correoUsuario"></p>
        <button id="btnCerrarSesion">Cerrar sesión</button>
      </div>
    `;
    document.querySelector(".topbar").appendChild(menu);
  }

  const btn = $("btnUsuario");
  const dropdown = $("dropdownUsuario");
  const correo = $("correoUsuario");

  menu.classList.remove("hidden");
  btn.textContent = usuario.nombre;
  correo.textContent = usuario.email;

  btn.onclick = () => dropdown.classList.toggle("hidden");

  $("btnCerrarSesion").onclick = () => {
    sessionStorage.removeItem("usuario");
    localStorage.removeItem("usuarioId");
    dropdown.classList.add("hidden");
    menu.classList.add("hidden");
    showAuthModal("login");
  };
}

/***********************
 * LOGIN / REGISTRO
 ***********************/
$("formAuth").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = $("nombre").value.trim();
  const email = $("email").value.trim();
  const password = $("password").value.trim();
  const tipo = $("grupoNombre").style.display === "none" ? "login" : "registro";

  try {
    let res, data;
    if (tipo === "login") {
      res = await fetch(apiUrl("auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      data = await safeJson(res);
      if (!res.ok) {
        alert(data.message || "Error al iniciar sesión");
        return;
      }
    } else {
      res = await fetch(apiUrl("auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password })
      });
      data = await safeJson(res);
      if (!res.ok) {
        alert(data.message || "Error al registrar usuario");
        return;
      }
      res = await fetch(apiUrl("auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      data = await safeJson(res);
    }

    const usuario = data.usuario;
    sessionStorage.setItem("usuario", JSON.stringify(usuario));
    localStorage.setItem("usuarioId", usuario.id);

    $("modalAuth").classList.add("hidden");
    setUsuarioTopbar(usuario);
    loadCitas();

  } catch (err) {
    console.error(err);
    alert("Error de conexión al autenticar");
  }
});

$("toggleAuth").addEventListener("click", (e) => {
  e.preventDefault();
  if ($("grupoNombre").style.display === "none") {
    showAuthModal("registro");
  } else {
    showAuthModal("login");
  }
});

$("btnCerrarAuth").addEventListener("click", () => {
  $("modalAuth").classList.add("hidden");
});

/***********************
 * CARGAR CITAS
 ***********************/
let filtroActual = "todas";

async function loadCitas() {
  const usuario = JSON.parse(sessionStorage.getItem("usuario"));
  if (!usuario) return;

  try {
    setMsg("Cargando citas...");

    const res = await fetch(apiUrl(`citas?usuarioId=${usuario.id}`));
    const data = await safeJson(res);

    if (!res.ok) {
      setMsg(`Error HTTP ${res.status}`);
      return;
    }

    const container = document.querySelector(".citas-container");
    container.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<div class="no-citas">No hay citas registradas</div>`;
      setMsg("Sin registros");
      return;
    }

    const citasFiltradas = data.filter(cita => {
      if (filtroActual === "todas") return true;
      return cita.estado.toLowerCase() === filtroActual;
    });

    if (citasFiltradas.length === 0) {
      container.innerHTML = `<div class="no-citas">No hay citas con el estado seleccionado</div>`;
      setMsg("Sin registros para este filtro");
      return;
    }

    container.innerHTML = citasFiltradas.map(cita => `
      <div class="cita-card">
        <h3>${cita.cliente}</h3>
        <p><strong>Fecha:</strong> ${cita.fecha}</p>
        <p><strong>Hora:</strong> ${cita.hora}</p>
        <p><strong>Descripción:</strong> ${cita.descripcion || "-"}</p>
        <span class="estado ${cita.estado.toLowerCase()}">${capitalizar(cita.estado)}</span>
        <div class="actions">
          <button class="btn-edit" onclick="editarCita(${cita.id})">Editar</button>
          <button class="btn-delete" onclick="eliminarCita(${cita.id})">Eliminar</button>
        </div>
      </div>
    `).join("");

    setMsg(`Citas cargadas: ${citasFiltradas.length}`);
  } catch (err) {
    setMsg("Error de conexión con el servidor");
    console.error(err);
  }
}

/***********************
 * UTILIDADES
 ***********************/
function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/***********************
 * EDITAR CITA
 ***********************/
async function editarCita(id) {
  try {
    const res = await fetch(apiUrl(`citas/${id}`));
    const cita = await safeJson(res);

    if (!res.ok) {
      alert("Error al cargar la cita");
      return;
    }

    const modal = $("modalCita");
    const modalTitle = modal.querySelector("h2");
    const clienteInput = $("cliente");

    // Cambiar título
    modalTitle.textContent = "Editar cita";

    // Llenar formulario
    clienteInput.value = cita.cliente;
    clienteInput.disabled = true; // ✅ DESHABILITAR CAMPO DE CLIENTE
    clienteInput.style.backgroundColor = "#e9ecef";
    clienteInput.style.cursor = "not-allowed";

    $("fecha").value = cita.fecha;
    $("hora").value = cita.hora;
    $("descripcion").value = cita.descripcion || "";
    $("estado").value = cita.estado;

    // Guardar ID de cita en campo oculto
    let citaIdInput = $("citaIdEdit");
    if (!citaIdInput) {
      citaIdInput = document.createElement("input");
      citaIdInput.type = "hidden";
      citaIdInput.id = "citaIdEdit";
      $("formCita").appendChild(citaIdInput);
    }
    citaIdInput.value = id;

    modal.classList.remove("hidden");

  } catch (err) {
    alert("Error de conexión al cargar la cita");
    console.error(err);
  }
}

/***********************
 * ELIMINAR CITA
 ***********************/
async function eliminarCita(id) {
  if (!confirm("¿Eliminar esta cita?")) return;

  try {
    const res = await fetch(apiUrl(`citas/${id}`), { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      alert("Error eliminando la cita");
      return;
    }
    await loadCitas();
  } catch (err) {
    alert("Error de red al eliminar");
  }
}

/***********************
 * INICIALIZACIÓN UI
 ***********************/
function initUI() {
  const modal = $("modalCita");
  const btnAgregar = $("btnAgregar");
  const btnCerrar = $("btnCerrarModal");
  const formCita = $("formCita");

  // Abrir modal para NUEVA cita
  if (btnAgregar && modal) {
    btnAgregar.addEventListener("click", () => {
      const modalTitle = modal.querySelector("h2");
      const clienteInput = $("cliente");

      // Cambiar título
      modalTitle.textContent = "Nueva cita";

      // Habilitar campo de cliente
      clienteInput.disabled = false;
      clienteInput.style.backgroundColor = "";
      clienteInput.style.cursor = "";

      // Limpiar formulario
      formCita.reset();
      if ($("citaIdEdit")) $("citaIdEdit").value = "";

      modal.classList.remove("hidden");
    });
  }

  // Cerrar modal
  if (btnCerrar && modal) {
    btnCerrar.addEventListener("click", () => {
      modal.classList.add("hidden");
      // Re-habilitar campo cliente al cerrar
      const clienteInput = $("cliente");
      clienteInput.disabled = false;
      clienteInput.style.backgroundColor = "";
      clienteInput.style.cursor = "";
    });
  }

  // Cerrar al hacer click fuera
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
      // Re-habilitar campo cliente
      const clienteInput = $("cliente");
      clienteInput.disabled = false;
      clienteInput.style.backgroundColor = "";
      clienteInput.style.cursor = "";
    }
  });

  // Enviar formulario - crear o editar cita
  if (formCita) {
    formCita.addEventListener("submit", async (e) => {
      e.preventDefault();

      const citaIdEdit = $("citaIdEdit") ? $("citaIdEdit").value : null;
      const usuarioId = Number(localStorage.getItem("usuarioId"));

      if (!usuarioId) {
        alert("Debes iniciar sesión para crear citas");
        return;
      }

      const citaData = {
        cliente: $("cliente").value.trim(),
        fecha: $("fecha").value,
        hora: $("hora").value,
        descripcion: $("descripcion").value.trim(),
        estado: $("estado").value,
        usuarioId
      };

      try {
        let res;

        if (citaIdEdit) {
          // EDITAR (PUT) - solo enviar campos editables
          const editData = {
            fecha: citaData.fecha,
            hora: citaData.hora,
            descripcion: citaData.descripcion,
            estado: citaData.estado,
            usuarioId: citaData.usuarioId
          };

          res = await fetch(apiUrl(`citas/${citaIdEdit}`), {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editData)
          });
        } else {
          // CREAR (POST)
          res = await fetch(apiUrl("citas"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(citaData)
          });
        }

        if (!res.ok) {
          const errData = await res.json();
          alert("Error: " + (errData.message || res.statusText));
          return;
        }

        // Re-habilitar campo cliente
        const clienteInput = $("cliente");
        clienteInput.disabled = false;
        clienteInput.style.backgroundColor = "";
        clienteInput.style.cursor = "";

        formCita.reset();
        if ($("citaIdEdit")) $("citaIdEdit").value = "";
        modal.classList.add("hidden");
        await loadCitas();

      } catch (err) {
        alert("Error de conexión al guardar la cita");
        console.error(err);
      }
    });
  }

  // Filtrado por estado
  const filtros = document.querySelectorAll(".filter-btn");
  filtros.forEach(btn => {
    btn.addEventListener("click", () => {
      filtros.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filtroActual = btn.dataset.estado.toLowerCase();
      loadCitas();
    });
  });

  // Mostrar login si no hay usuario
  const usuario = sessionStorage.getItem("usuario");
  if (!usuario) showAuthModal("login");

  // Cargar citas si hay usuario
  if (usuario) {
    setUsuarioTopbar(JSON.parse(usuario));
    loadCitas();
  }
}

// Cordova
document.addEventListener("deviceready", initUI, false);

// Web
window.addEventListener("DOMContentLoaded", () => {
  if (!window.cordova) initUI();
});

// Exponer funciones globales
window.editarCita = editarCita;
window.eliminarCita = eliminarCita;