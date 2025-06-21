const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Configuración de conexión (usaremos variables de entorno si las tienes configuradas)
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_SERVER || 'pc',
    database: process.env.DB_DATABASE || 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false,
    }
};

// Middleware para verificar que haya un usuario logueado en la sesión
router.use((req, res, next) => {
    if (!req.session || !req.session.idUsuario) {
        console.warn('Acceso no autorizado a /nombre-usuario-p. No hay idUsuario en la sesión.');
        return res.status(401).json({ ok: false, mensaje: 'No autorizado. Por favor, inicie sesión.' });
    }
    next(); // Continúa si hay un idUsuario en la sesión
});

// Ruta: /nombre-usuario-p (ya no lleva :id en la URL)
router.get('/', async (req, res) => {
    // Obtener el idUsuario directamente de la sesión
    const idUsuario = req.session.idUsuario;
    console.log(`Buscando nombre del paciente para idUsuario desde sesión: ${idUsuario}`);

    try {
        await sql.connect(config);

        // Primero, intentar buscar en la tabla Paciente
        const resultPaciente = await sql.query`
            SELECT primerNombre + ' ' + primerApellido AS nombreCompleto FROM Paciente WHERE idUsuario =${idUsuario}
        `;

        if (resultPaciente.recordset.length > 0) {
            const { nombreCompleto } = resultPaciente.recordset[0];
            return res.json({ ok: true, nombreUsuario: nombreCompleto });
        }

        // Si no se encontró en Paciente (podría ser otro rol como Médico o Recepcionista),
        // buscar en UsuarioSistema por nombreUsuario como fallback
        const resultUsuarioSistema = await sql.query`
            SELECT nombreUsuario FROM UsuarioSistema WHERE idUsuario = ${idUsuario}
        `;
        if (resultUsuarioSistema.recordset.length > 0) {
            const { nombreUsuario } = resultUsuarioSistema.recordset[0];
            // Si es un usuario del sistema pero no un Paciente, devolvemos el nombre de usuario del sistema
            return res.json({ ok: true, nombreUsuario: nombreUsuario });
        }

        // Si no se encontró en ninguna tabla (debería ser raro si idUsuario está en sesión)
        return res.json({ ok: false, mensaje: "Paciente o usuario no encontrado en la base de datos." });

    } catch (error) {
        console.error('Error al obtener el nombre del paciente/usuario:', error);
        res.status(500).json({ ok: false, mensaje: "Error en el servidor al obtener el nombre del paciente." });
    }
});

module.exports = router;