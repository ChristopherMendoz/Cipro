const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

router.post('/', async (req, res) => {
    // CAMBIO 1: Cambiar tipoEstudio por idServicio
    const { fecha, hora, estado, idServicio, observaciones, idPaciente, idMedico, idSala, idRecepcionista } = req.body;

    try {
        await sql.connect(config);

        // CAMBIO 2: Actualizar la consulta INSERT
        const result = await sql.query`
            INSERT INTO Consulta 
            (fecha, hora, estado, idServicio, observaciones, idPaciente, idMedico, idSala, idRecepcionista)
            VALUES
            (${fecha}, ${hora}, ${estado}, ${idServicio}, ${observaciones}, ${idPaciente}, ${idMedico}, ${idSala}, ${idRecepcionista})
        `;

        res.json({ ok: true, mensaje: 'Consulta agregada correctamente' });
    } catch (error) {
        console.error('Error al agregar consulta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al agregar consulta' });
    }
});

module.exports = router;