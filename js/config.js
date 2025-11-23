// Configuración de la API
const API_CONFIG = {
    // Detectar automáticamente si estamos en desarrollo o producción
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8000'  // Desarrollo local
        : 'https://back-indicadores-1.onrender.com',  // Producción en Render
};

// Función helper para hacer peticiones autenticadas
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem("token");

    const config = {
        ...options,
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, config);
        return response;
    } catch (error) {
        console.error('Error en fetchAPI:', error);
        throw error;
    }
}

// Exportar para uso global
window.API_CONFIG = API_CONFIG;
window.fetchAPI = fetchAPI;