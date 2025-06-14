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
        encrypt: false
    }
};

// Ruta: /obtener-medico/:idUsuario
router.get('/:idUsuario', async (req, res) => {
    const { idUsuario } = req.params;

    try {
        const pool = await sql.connect(config);
        const ps = new sql.PreparedStatement(pool);

        ps.input('idUsuario', sql.VarChar);

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

        await ps.unprepare();

        if (result.recordset.length === 0) {
            return res.json({ ok: false, mensaje: 'No se encontraron datos del médico.' });
        }

        const datos = result.recordset[0];
        res.json({ ok: true, datos });

    } catch (err) {
        console.error('Error al obtener datos del médico:', err);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
});

module.exports = router;
