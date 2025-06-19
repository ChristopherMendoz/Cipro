const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

router.get('/:id', async (req, res) => {
    const idUsuario = req.params.id;

    try {
        await sql.connect(config);

        const result = await sql.query`
        SELECT nombreCompleto FROM Medico WHERE idUsuario = ${idUsuario}
    `;

        if (result.recordset.length === 0) {
            return res.json({ ok: false, mensaje: "Médico no encontrado." });
        }

        const { nombreCompleto } = result.recordset[0];

        res.json({ ok: true, nombreUsuario: nombreCompleto });

    } catch (error) {
        console.error('Error al obtener el nombre del médico:', error);
        res.status(500).json({ ok: false, mensaje: "Error en el servidor." });
    }
});

module.exports = router;
