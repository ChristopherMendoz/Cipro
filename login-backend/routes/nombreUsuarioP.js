const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Configuración de conexión
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

router.get('/:id', async (req, res) => {
    const idUsuario = req.params.id;

    try {
        await sql.connect(config);

        const result = await sql.query`
        SELECT primerNombre + ' ' + primerApellido AS nombreCompleto FROM Paciente WHERE idUsuario = ${idUsuario}
    `;

        if (result.recordset.length === 0) {
            return res.json({ ok: false, mensaje: "Paciente no encontrado." });
        }

        const { nombreCompleto } = result.recordset[0];

        res.json({ ok: true, nombreUsuario: nombreCompleto });

    } catch (error) {
        console.error('Error al obtener el nombre del paciente:', error);
        res.status(500).json({ ok: false, mensaje: "Error en el servidor." });
    }
});

module.exports = router;
