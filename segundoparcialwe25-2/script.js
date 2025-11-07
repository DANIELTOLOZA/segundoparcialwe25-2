const API_BASE_URL = 'http://localhost:3000/api';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

async function initializeApp() {
    await loadPersonas();
    await loadSolicitudes();
    await loadValidaciones();
    updateStatistics();
}

function setupEventListeners() {
    // Navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // Botones de acción
    document.getElementById('nuevaSolicitudBtn').addEventListener('click', () => openSolicitudModal());
    document.getElementById('nuevaPersonaBtn').addEventListener('click', () => openPersonaModal());
    document.getElementById('nuevaValidacionBtn').addEventListener('click', () => openValidacionModal());

    // Filtros
    document.getElementById('aplicarFiltros').addEventListener('click', aplicarFiltros);

    // Modales
    document.querySelectorAll('.close, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // Forms
    document.getElementById('formSolicitud').addEventListener('submit', handleSolicitudSubmit);
    document.getElementById('formPersona').addEventListener('submit', handlePersonaSubmit);
    document.getElementById('formValidacion').addEventListener('submit', handleValidacionSubmit);

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModals();
        }
    });
}

// Funciones API
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en la petición');
        }

        return data;
    } catch (error) {
        console.error('Error en API call:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

async function loadSolicitudes() {
    try {
        const data = await apiCall('/solicitudes');
        window.solicitudes = data.data;
        renderSolicitudesTable();
    } catch (error) {
        showNotification('Error al cargar las solicitudes', 'error');
    }
}

async function loadPersonas() {
    try {
        const data = await apiCall('/personas');
        window.personas = data.data;
        renderPersonasTable();
    } catch (error) {
        showNotification('Error al cargar las personas', 'error');
    }
}

async function loadValidaciones() {
    try {
        const data = await apiCall('/validaciones');
        window.validaciones = data.data;
        renderValidacionesTable();
    } catch (error) {
        showNotification('Error al cargar las validaciones', 'error');
    }
}

// Funciones para Validaciones
function openValidacionModal() {
    const modal = document.getElementById('modalValidacion');
    const form = document.getElementById('formValidacion');
    
    form.reset();
    modal.style.display = 'block';
}

async function handleValidacionSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = {
        email: document.getElementById('validacionEmail').value,
        documento: document.getElementById('validacionDocumento').value
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading"></div>';
    submitBtn.disabled = true;

    try {
        const result = await apiCall('/validaciones', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showNotification('Solicitud de validación creada exitosamente', 'success');
        
        // Mostrar token y código generados
        document.getElementById('tokenResult').textContent = result.data.token;
        document.getElementById('codigoResult').textContent = result.data.codigo;
        document.getElementById('resultadosValidacion').style.display = 'block';
        
        await loadValidaciones();
        
    } catch (error) {
        // El error ya se muestra en apiCall
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Funciones para Personas
async function handlePersonaSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = {
        documento: document.getElementById('documento').value,
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        fecha_nacimiento: document.getElementById('fechaNacimiento').value
    };

    try {
        await apiCall('/personas', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showNotification('Persona creada exitosamente', 'success');
        closeModals();
        await loadPersonas();
        
    } catch (error) {
        // El error ya se muestra en apiCall
    }
}

// Funciones para Solicitudes
async function handleSolicitudSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = {
        solicitante_id: document.getElementById('solicitante').value,
        codeudor_id: document.getElementById('codeudor').value,
        valor: document.getElementById('valor').value,
        observacion: document.getElementById('observacion').value
    };

    try {
        await apiCall('/solicitudes', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        showNotification('Solicitud creada exitosamente', 'success');
        closeModals();
        await loadSolicitudes();
        updateStatistics();
        
    } catch (error) {
        // El error ya se muestra en apiCall
    }
}

// Renderizado de tablas
function renderSolicitudesTable() {
    const tbody = document.getElementById('solicitudesBody');
    
    if (!window.solicitudes || window.solicitudes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-file-alt"></i>
                    <p>No hay solicitudes registradas</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = window.solicitudes.map(solicitud => `
        <tr>
            <td>${solicitud.codigo_radicado}</td>
            <td>${solicitud.fecha}</td>
            <td>${solicitud.solicitante}</td>
            <td>${solicitud.codeudor}</td>
            <td>$${solicitud.valor.toLocaleString()}</td>
            <td><span class="status-badge status-${solicitud.estado}">${solicitud.estado}</span></td>
            <td>
                <button class="action-btn view-btn" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderPersonasTable() {
    const tbody = document.getElementById('personasBody');
    
    if (!window.personas || window.personas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No hay personas registradas</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = window.personas.map(persona => `
        <tr>
            <td>${persona.documento}</td>
            <td>${persona.nombre}</td>
            <td>${persona.email}</td>
            <td>${persona.telefono || 'N/A'}</td>
            <td>${persona.fecha_nacimiento || 'N/A'}</td>
            <td>
                <button class="action-btn edit-btn" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderValidacionesTable() {
    const tbody = document.getElementById('validacionesBody');
    
    if (!window.validaciones || window.validaciones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-envelope"></i>
                    <p>No hay validaciones pendientes</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = window.validaciones.map(validacion => `
        <tr>
            <td>${validacion.email}</td>
            <td>${validacion.documento}</td>
            <td>${validacion.fecha}</td>
            <td><span class="status-badge status-${validacion.estado}">${validacion.estado}</span></td>
            <td><code>${validacion.token}</code></td>
            <td>${validacion.codigo}</td>
            <td>
                ${validacion.estado === 'pendiente' ? `
                    <button class="action-btn edit-btn" onclick="validarEmail(${validacion.id})" title="Validar email">
                        <i class="fas fa-check"></i>
                    </button>
                ` : ''}
                <button class="action-btn view-btn" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Funciones auxiliares
function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'estadisticas') {
        updateStatistics();
    }
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    document.getElementById('resultadosValidacion').style.display = 'none';
}

function showNotification(message, type = 'info') {
    // Implementar notificaciones toast
    alert(`${type.toUpperCase()}: ${message}`);
}

function updateStatistics() {
    if (!window.solicitudes) return;
    
    const total = window.solicitudes.length;
    const aprobadas = window.solicitudes.filter(s => s.estado === 'aprobada').length;
    const rechazadas = window.solicitudes.filter(s => s.estado === 'rechazada').length;
    const totalValor = window.solicitudes.reduce((sum, s) => sum + s.valor, 0);

    document.getElementById('totalSolicitudes').textContent = total;
    document.getElementById('solicitudesAprobadas').textContent = aprobadas;
    document.getElementById('solicitudesRechazadas').textContent = rechazadas;
    document.getElementById('totalValor').textContent = `$${totalValor.toLocaleString()}`;
}

async function validarEmail(validacionId) {
    try {
        await apiCall(`/validaciones/${validacionId}`, {
            method: 'PUT',
            body: JSON.stringify({ estado: 'validada' })
        });

        showNotification('Email validado exitosamente', 'success');
        await loadValidaciones();
        
    } catch (error) {
        // El error ya se muestra en apiCall
    }
}

// Inicializar datos
async function loadInitialData() {
    await Promise.all([
        loadPersonas(),
        loadSolicitudes(),
        loadValidaciones()
    ]);
}