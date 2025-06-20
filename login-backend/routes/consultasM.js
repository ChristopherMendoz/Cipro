const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

// Obtener todas las consultas con info relacionada
router.get('/', async (req, res) => {
    try {
        await sql.connect(config);

        const result = await sql.query(`
            SELECT 
                c.idConsulta,
                CONVERT(varchar(10), c.fecha, 23) AS fecha,
                CONVERT(varchar(5), c.hora, 108) AS hora,
                c.estado,
                c.tipoEstudio,
                c.observaciones,
                p.primerNombre +' '+segundoNombre +' '+ primerApellido +' '+ segundoApellido AS nombrePaciente,
                m.nombreCompleto AS nombreMedico,
                s.nombre AS nombreSala,
                r.nombreCompleto AS nombreRecepcionista
            FROM Consulta c
            INNER JOIN Paciente p ON c.idPaciente = p.idPaciente
            INNER JOIN Medico m ON c.idMedico = m.idMedico
            INNER JOIN Sala s ON c.idSala = s.idSala
            INNER JOIN Recepcionista r ON c.idRecepcionista = r.idRecepcionista
            ORDER BY c.idConsulta DESC
        `);

        // Convertir hora a solo HH:mm
        const consultas = result.recordset.map(c => {
    let hora = c.hora instanceof Date ? c.hora.toTimeString().substring(0, 5) : c.hora;
    return { ...c, hora };
});


        res.json({ ok: true, consultas });

    } catch (error) {
        console.error('Error al obtener consultas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener consultas' });
    }
});

module.exports = router;
