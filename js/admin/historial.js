// historial.js - Gestión de archivos del administrador

document.addEventListener("DOMContentLoaded", function () {
    // Solo verificar token, no rol estricto
    const token = localStorage.getItem('token');

    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'No autenticado',
            text: 'Debe iniciar sesión para acceder',
            confirmButtonText: 'Ir a login'
        }).then(() => {
            window.location.href = '../index.html';
        });
        return;
    }

    // Cargar archivos
    cargarArchivos();
});

/**
 * Verifica que el usuario sea administrador
 */
function verificarRolAdmin() {
    const token = localStorage.getItem('token');

    // Solo verificar si hay token
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Acceso denegado',
            text: 'Debe iniciar sesión para acceder',
            confirmButtonText: 'Ir a login'
        }).then(() => {
            window.location.href = '../index.html';
        });
        return false;
    }

    // Intentar verificar el rol si existe user_data
    const userData = localStorage.getItem('user_data');
    if (userData) {
        try {
            const user = JSON.parse(userData);

            if (user.role && user.role !== 'admin') {
                Swal.fire({
                    icon: 'error',
                    title: 'Acceso denegado',
                    text: 'Solo los administradores pueden acceder a esta página',
                    confirmButtonText: 'Volver'
                }).then(() => {
                    window.location.href = '../index.html';
                });
                return false;
            }
        } catch (e) {
            console.error('Error al verificar rol:', e);
        }
    }

    return true;
}

/**
 * Carga la lista de archivos desde el backend
 */
function cargarArchivos() {
    const tablaCuerpo = document.querySelector(".archivos");
    const token = localStorage.getItem("token");

    if (!token) {
        console.error("Token no encontrado. El usuario no está autenticado.");
        tablaCuerpo.innerHTML = "<tr><td colspan='3'>Debes iniciar sesión para ver los archivos.</td></tr>";
        return;
    }

    // Mostrar loading
    tablaCuerpo.innerHTML = "<tr><td colspan='3' style='text-align: center;'>Cargando archivos...</td></tr>";

    fetch("https://back-indicadores-1.onrender.com/api/archivos/archivos/", {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Respuesta recibida:", data);

        // Manejar tanto paginación como lista directa
        const archivos = data.results || data;

        if (!Array.isArray(archivos)) {
            console.error("No es una lista válida de archivos:", data);
            tablaCuerpo.innerHTML = "<tr><td colspan='3'>No se pudieron cargar los archivos.</td></tr>";
            return;
        }

        mostrarArchivos(archivos);
    })
    .catch(error => {
        console.error("Error al cargar archivos:", error);
        tablaCuerpo.innerHTML = "<tr><td colspan='3'>Ocurrió un error al obtener los archivos.</td></tr>";

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los archivos'
        });
    });
}

/**
 * Muestra los archivos en la tabla
 */
function mostrarArchivos(archivos) {
    const tablaCuerpo = document.querySelector(".archivos");
    tablaCuerpo.innerHTML = "";

    if (!archivos || archivos.length === 0) {
        tablaCuerpo.innerHTML = "<tr><td colspan='3' style='text-align: center; padding: 20px;'>No hay archivos subidos.</td></tr>";
        return;
    }

    archivos.forEach(archivo => {
        const fila = document.createElement("tr");
        fila.classList.add("fila-archivo");
        fila.dataset.archivoId = archivo.id;

        // Columna: Nombre del archivo
        const nombreTd = document.createElement("td");
        nombreTd.textContent = archivo.nombre_archivo;
        nombreTd.style.cursor = "pointer";
        nombreTd.addEventListener("click", () => {
            window.location.href = `reporte.html?archivo=${archivo.id}`;
        });

        // Columna: Fecha
        const fechaTd = document.createElement("td");
        fechaTd.textContent = formatearFecha(archivo.fecha_subida);
        fechaTd.style.cursor = "pointer";
        fechaTd.addEventListener("click", () => {
            window.location.href = `reporte.html?archivo=${archivo.id}`;
        });

        // Columna: Acciones (botón eliminar)
        const accionesTd = document.createElement("td");
        accionesTd.classList.add("acciones-columna");
        accionesTd.style.textAlign = "center";

        const btnEliminar = document.createElement("button");
        btnEliminar.classList.add("btn-eliminar");
        btnEliminar.innerHTML = "Eliminar";
        btnEliminar.title = "Eliminar archivo";
        btnEliminar.style.borderRadius = "6px";
        btnEliminar.style.height = "auto";

        btnEliminar.addEventListener("click", (e) => {
            e.stopPropagation(); // Evitar que se active el click de la fila
            confirmarEliminacion(archivo.id, archivo.nombre_archivo);
        });

        accionesTd.appendChild(btnEliminar);

        // Agregar todas las columnas a la fila
        fila.appendChild(nombreTd);
        fila.appendChild(fechaTd);
        fila.appendChild(accionesTd);

        tablaCuerpo.appendChild(fila);
    });
}

/**
 * Formatea una fecha en formato legible
 */
function formatearFecha(fecha) {
    if (!fecha) return 'N/A';

    try {
        const date = new Date(fecha);
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const anio = date.getFullYear();
        const hora = String(date.getHours()).padStart(2, '0');
        const minutos = String(date.getMinutes()).padStart(2, '0');

        return `${dia}/${mes}/${anio} ${hora}:${minutos}`;
    } catch (e) {
        return new Date(fecha).toLocaleString();
    }
}

/**
 * Confirma la eliminación de un archivo
 */
async function confirmarEliminacion(archivoId, nombreArchivo) {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        html: `
            <p>Estás a punto de eliminar el archivo:</p>
            <strong>${nombreArchivo}</strong>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        await eliminarArchivo(archivoId);
    }
}

/**
 * Elimina un archivo del sistema
 */
async function eliminarArchivo(archivoId) {
    const token = localStorage.getItem("token");

    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontró el token de autenticación'
        });
        return;
    }

    // Mostrar loading
    Swal.fire({
        title: 'Eliminando...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await fetch(`https://back-indicadores-1.onrender.com/api/archivos/archivos/${archivoId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('No tienes permisos para eliminar este archivo');
            }
            if (response.status === 404) {
                throw new Error('El archivo no existe');
            }
            throw new Error(`Error al eliminar: ${response.status}`);
        }

        // Éxito
        await Swal.fire({
            icon: 'success',
            title: '¡Eliminado!',
            text: 'El archivo ha sido eliminado correctamente',
            timer: 2000,
            showConfirmButton: false
        });

        // Recargar la lista de archivos
        cargarArchivos();

    } catch (error) {
        console.error('Error al eliminar:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo eliminar el archivo'
        });
    }
}