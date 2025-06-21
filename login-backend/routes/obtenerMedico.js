const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');


// Middleware para verificar que el usuario sea un médico logueado
router.use((req, res, next) => {
    // Para esta ruta, específicamente necesitamos el idMedico para asegurar que es un médico quien consulta sus datos
    if (!req.session || !req.session.idMedico || !req.session.idUsuario) {
        console.warn('Acceso no autorizado a /obtener-medico. No hay idMedico o idUsuario en la sesión.');
        return res.status(401).json({ ok: false, mensaje: 'No autorizado. Por favor, inicie sesión como médico.' });
    }
    next(); // Continúa si hay un idMedico en la sesión
});



// Ruta: /obtener-medico (ya no lleva :idUsuario en la URL)
router.get('/', async (req, res) => {
    // Obtener el idUsuario directamente de la sesión
    const idUsuario = req.session.idUsuario;
    console.log(`Obteniendo datos del médico para idUsuario desde sesión: ${idUsuario}`);

    try {
        const pool = await sql.connect(config);
        const ps = new sql.PreparedStatement(pool);

        ps.input('idUsuario', sql.VarChar); // Define el tipo de input

        await ps.prepare(`
            SELECT
                M.nombreCompleto,
                M.cedulaProfesional,
                M.telefono,
                E.nombre AS nombreEspecializacion,
                U.nombreUsuario
            FROM Medico M
            INNER JOIN Especializacion E ON M.idEspecializacion = E.idEspecializacion
            INNER JOIN UsuarioSistema U ON M.idUsuario = U.idUsuario
            WHERE U.idUsuario = @idUsuario
        `);

        const result = await ps.execute({ idUsuario });

        await ps.unprepare(); // Liberar recursos del prepared statement

        if (result.recordset.length === 0) {
            return res.json({ ok: false, mensaje: 'No se encontraron datos del médico para el usuario logueado.' });
        }

        const datos = result.recordset[0];
        res.json({ ok: true, datos });

    } catch (err) {
        console.error('Error al obtener datos del médico desde la sesión:', err);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor al obtener datos del médico.' });
    }
});

module.exports = router;