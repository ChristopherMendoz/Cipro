const express = require('express');
const router = express.Router();
const sql = require('mssql');
// Asegúrate de que la ruta a tu config sea correcta
const config = require('../config.js'); 

router.post('/', async (req, res) => {
    const { fecha, hora, estado, idServicio, observaciones, idPaciente, idMedico, idSala, idRecepcionista } = req.body;

    // --- VALIDACIÓN DE FECHA EN EL SERVIDOR ---
    const fechaDeConsulta = new Date(`${fecha}T${hora}`);
    if (fechaDeConsulta < new Date()) {
        return res.status(400).json({ 
            ok: false, 
            mensaje: 'Error de validación: No se pueden crear consultas en fechas pasadas.' 
        });
    }
    // --- FIN DE LA VALIDACIÓN ---

    try {
        await sql.connect(config);

        const result = await sql.query`
            INSERT INTO Consulta 
            (fecha, hora, estado, idServicio, observaciones, idPaciente, idMedico, idSala, idRecepcionista)
            VALUES
            (${fecha}, ${hora}, ${estado}, ${idServicio}, ${observaciones}, ${idPaciente}, ${idMedico}, ${idSala}, ${idRecepcionista})
        `;

        res.json({ ok: true, mensaje: 'Consulta agregada correctamente' });
    } catch (error) {
        console.error('Error al agregar consulta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error del servidor al agregar la consulta' });
    }
});

module.exports = router;