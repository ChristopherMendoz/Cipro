const express = require('express');
const router = express.Router();
const sql = require('mssql');

// La configuración de tu base de datos se mantiene igual
const config = {
    user: 'sa',
    password: '123456',
    server: 'ACER_Core_i7',
    database: 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false,
    }
};

// El middleware para verificar la sesión se mantiene igual
router.use((req, res, next) => {
    if (!req.session || !req.session.idUsuario) {
        console.warn('Acceso no autorizado a /nombre-usuario. No hay idUsuario en la sesión.');
        return res.status(401).json({ ok: false, mensaje: 'No autorizado. Por favor, inicie sesión.' });
    }
    next();
});


router.get('/', async (req, res) => {
    const idUsuario = req.session.idUsuario;
    console.log(`Buscando nombre para idUsuario desde sesión: ${idUsuario}`);

    try {
        await sql.connect(config);

        // ===== CAMBIO 1: Se añade "idMedico" a la consulta SQL =====
        const result = await sql.query`
            SELECT idMedico, nombreCompleto FROM Medico WHERE idUsuario = ${idUsuario}
        `;

        // Si es un médico, devolver su nombre completo y su ID
        if (result.recordset.length > 0) {
            // ===== CAMBIO 2: Se extrae "idMedico" y se añade a la respuesta JSON =====
            const { idMedico, nombreCompleto } = result.recordset[0];
            return res.json({ ok: true, nombreUsuario: nombreCompleto, idMedico: idMedico });
        }

        // La lógica de respaldo para otros tipos de usuario se mantiene igual
        const usuarioSistemaResult = await sql.query`
            SELECT nombreUsuario FROM UsuarioSistema WHERE idUsuario = ${idUsuario}
        `;
        if (usuarioSistemaResult.recordset.length > 0) {
            const { nombreUsuario } = usuarioSistemaResult.recordset[0];
            return res.json({ ok: true, nombreUsuario: nombreUsuario });
        }

        return res.json({ ok: false, mensaje: "Usuario no encontrado en la base de datos." });

    } catch (error) {
        console.error('Error al obtener el nombre del usuario:', error);
        res.status(500).json({ ok: false, mensaje: "Error en el servidor al obtener el nombre de usuario." });
    }
});

module.exports = router;