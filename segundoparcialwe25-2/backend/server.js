const express = require('express');
const cors = require('cors');
const { Database } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Base de datos
const db = new Database();

// Servicio 1: Listar solicitudes
app.get('/api/solicitudes', (req, res) => {
    try {
        const solicitudes = db.obtenerSolicitudes();
        res.json({
            success: true,
            data: solicitudes,
            count: solicitudes.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las solicitudes',
            error: error.message
        });
    }
});

// Servicio 2: Crear solicitud de validación de email
app.post('/api/validaciones', (req, res) => {
    try {
        const { email, documento } = req.body;

        // Validaciones
        if (!email || !documento) {
            return res.status(400).json({
                success: false,
                message: 'Email y documento son requeridos'
            });
        }

        if (email.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'El email no puede exceder 50 caracteres'
            });
        }

        if (documento.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'El documento no puede exceder 10 caracteres'
            });
        }

        // Crear validación
        const validacion = db.crearValidacion({ email, documento });

        res.status(201).json({
            success: true,
            message: 'Solicitud de validación creada exitosamente',
            data: {
                id: validacion.id,
                email: validacion.email,
                documento: validacion.documento,
                fecha: validacion.fecha,
                estado: validacion.estado,
                token: validacion.token,
                codigo: validacion.codigo
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear la validación',
            error: error.message
        });
    }
});

// Servicios adicionales para el frontend

// Obtener todas las personas
app.get('/api/personas', (req, res) => {
    try {
        const personas = db.obtenerPersonas();
        res.json({
            success: true,
            data: personas,
            count: personas.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las personas',
            error: error.message
        });
    }
});

// Crear nueva persona
app.post('/api/personas', (req, res) => {
    try {
        const { documento, nombre, email, telefono, fecha_nacimiento } = req.body;

        // Validaciones
        if (!documento || !nombre || !email) {
            return res.status(400).json({
                success: false,
                message: 'Documento, nombre y email son requeridos'
            });
        }

        if (documento.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'El documento no puede exceder 10 caracteres'
            });
        }

        if (nombre.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'El nombre no puede exceder 100 caracteres'
            });
        }

        if (email.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'El email no puede exceder 50 caracteres'
            });
        }

        if (telefono && telefono.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'El teléfono no puede exceder 10 caracteres'
            });
        }

        // Verificar si ya existe una persona con el mismo documento
        const personaExistente = db.obtenerPersonaPorDocumento(documento);
        if (personaExistente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una persona con este documento'
            });
        }

        const persona = db.crearPersona({
            documento,
            nombre,
            email,
            telefono,
            fecha_nacimiento
        });

        res.status(201).json({
            success: true,
            message: 'Persona creada exitosamente',
            data: persona
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear la persona',
            error: error.message
        });
    }
});

// Crear nueva solicitud de crédito
app.post('/api/solicitudes', (req, res) => {
    try {
        const { solicitante_id, codeudor_id, valor, observacion } = req.body;

        // Validaciones
        if (!solicitante_id || !codeudor_id || !valor) {
            return res.status(400).json({
                success: false,
                message: 'Solicitante, codeudor y valor son requeridos'
            });
        }

        if (solicitante_id === codeudor_id) {
            return res.status(400).json({
                success: false,
                message: 'El solicitante y codeudor no pueden ser la misma persona'
            });
        }

        const solicitante = db.obtenerPersonaPorId(parseInt(solicitante_id));
        const codeudor = db.obtenerPersonaPorId(parseInt(codeudor_id));

        if (!solicitante || !codeudor) {
            return res.status(400).json({
                success: false,
                message: 'Solicitante o codeudor no encontrados'
            });
        }

        const solicitud = db.crearSolicitud({
            solicitante_id: parseInt(solicitante_id),
            codeudor_id: parseInt(codeudor_id),
            valor: parseInt(valor),
            observacion: observacion || ''
        });

        res.status(201).json({
            success: true,
            message: 'Solicitud creada exitosamente',
            data: solicitud
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear la solicitud',
            error: error.message
        });
    }
});

// Obtener validaciones
app.get('/api/validaciones', (req, res) => {
    try {
        const validaciones = db.obtenerValidaciones();
        res.json({
            success: true,
            data: validaciones,
            count: validaciones.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener las validaciones',
            error: error.message
        });
    }
});

// Actualizar estado de validación
app.put('/api/validaciones/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!estado || !['pendiente', 'validada'].includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado debe ser "pendiente" o "validada"'
            });
        }

        const success = db.actualizarEstadoValidacion(parseInt(id), estado);
        
        if (success) {
            res.json({
                success: true,
                message: 'Estado de validación actualizado'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Validación no encontrada'
            });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la validación',
            error: error.message
        });
    }
});

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({
        message: 'API de Gestión de Créditos Financieros - UFPS',
        version: '1.0.0',
        endpoints: {
            'GET /api/solicitudes': 'Listar todas las solicitudes',
            'POST /api/validaciones': 'Crear solicitud de validación de email',
            'GET /api/personas': 'Listar todas las personas',
            'POST /api/personas': 'Crear nueva persona',
            'POST /api/solicitudes': 'Crear nueva solicitud de crédito',
            'GET /api/validaciones': 'Listar todas las validaciones'
        }
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log('Endpoints disponibles:');
    console.log('GET  /api/solicitudes - Listar solicitudes');
    console.log('POST /api/validaciones - Crear validación de email');
    console.log('GET  /api/personas - Listar personas');
    console.log('POST /api/personas - Crear persona');
    console.log('POST /api/solicitudes - Crear solicitud de crédito');
});