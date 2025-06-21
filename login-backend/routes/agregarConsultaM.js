const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

router.post('/', async (req, res) => {
    const { fecha, hora, estado, observaciones, idPaciente, idMedico, idSala, idRecepcionista, idServicio } = req.body;

    try {
        await sql.connect(config);

        const result = await sql.query`
            INSERT INTO Consulta 
            (fecha, hora, estado, observaciones, idPaciente, idMedico, idSala, idRecepcionista, idServicio)
            VALUES
            (${fecha}, ${hora}, ${estado}, ${observaciones}, ${idPaciente}, ${idMedico}, ${idSala}, ${idRecepcionista},  ${idServicio})
        `;

        res.json({ ok: true, mensaje: 'Consulta agregada correctamente' });
    } catch (error) {
        console.error('Error al agregar consulta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al agregar consulta' });
    }
});

module.exports = router;
