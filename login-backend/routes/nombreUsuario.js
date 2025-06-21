const express = require('express');
const router = express.Router();
const sql = require('mssql');

const config = {
    user: 'sa',
    password: '123456',
    server: 'pc',
    database: 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false,
    }
};

// Middleware para verificar que haya un usuario logueado en la sesión
router.use((req, res, next) => {
    if (!req.session || !req.session.idUsuario) {
        console.warn('Acceso no autorizado a /nombre-usuario. No hay idUsuario en la sesión.');
        return res.status(401).json({ ok: false, mensaje: 'No autorizado. Por favor, inicie sesión.' });
    }
    next(); // Continúa si hay un idUsuario en la sesión
});

// Ruta: /nombre-usuario (ya no lleva :id en la URL)
router.get('/', async (req, res) => {
    // Obtener el idUsuario directamente de la sesión
    const idUsuario = req.session.idUsuario;
    console.log(`Buscando nombre para idUsuario desde sesión: ${idUsuario}`);

    try {
        await sql.connect(config);

        const result = await sql.query`
            SELECT nombreCompleto FROM Medico WHERE idUsuario = ${idUsuario}
        `;

        // Si es un médico, devolver su nombre completo
        if (result.recordset.length > 0) {
            const { nombreCompleto } = result.recordset[0];
            return res.json({ ok: true, nombreUsuario: nombreCompleto });
        }

        // Si no se encontró en Medico (podría ser otro rol), buscar en UsuarioSistema por nombreUsuario
        const usuarioSistemaResult = await sql.query`
            SELECT nombreUsuario FROM UsuarioSistema WHERE idUsuario = ${idUsuario}
        `;
        if (usuarioSistemaResult.recordset.length > 0) {
            const { nombreUsuario } = usuarioSistemaResult.recordset[0];
            return res.json({ ok: true, nombreUsuario: nombreUsuario }); // Podría ser el nombre de usuario del sistema
        }

        // Si no se encontró en ninguno de los dos (poco probable si idUsuario está en sesión)
        return res.json({ ok: false, mensaje: "Usuario no encontrado en la base de datos." });

    } catch (error) {
        console.error('Error al obtener el nombre del usuario:', error);
        res.status(500).json({ ok: false, mensaje: "Error en el servidor al obtener el nombre de usuario." });
    }
});

module.exports = router;