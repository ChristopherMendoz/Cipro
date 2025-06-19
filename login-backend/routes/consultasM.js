const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

// Obtener todas las consultas con info relacionada
router.get('/', async (req, res) => {
    try {
        await sql.connect(config);

        //  CAMBIO PRINCIPAL AQUÍ 
        const result = await sql.query(`
            SELECT 
                c.idConsulta,
                CONVERT(varchar(10), c.fecha, 23) AS fecha,
                CONVERT(varchar(5), c.hora, 108) AS hora,
                c.estado,
                serv.nombreServicio, 
                c.observaciones,
                p.primerNombre +' '+p.segundoNombre +' '+ p.primerApellido +' '+ p.segundoApellido AS nombrePaciente,
                m.nombreCompleto AS nombreMedico,
                s.nombre AS nombreSala,
                r.nombreCompleto AS nombreRecepcionista
            FROM Consulta c
            INNER JOIN Paciente p ON c.idPaciente = p.idPaciente
            INNER JOIN Medico m ON c.idMedico = m.idMedico
            INNER JOIN Sala s ON c.idSala = s.idSala
            INNER JOIN Recepcionista r ON c.idRecepcionista = r.idRecepcionista
            LEFT JOIN Servicios serv ON c.idServicio = serv.idServicio -- AÑADIR ESTE JOIN (LEFT JOIN por si alguna consulta vieja no tiene servicio)
            ORDER BY c.idConsulta DESC
        `);

        // ... (resto del código sin cambios)
        res.json({ ok: true, consultas: result.recordset }); // El resto del código funciona igual

    } catch (error) {
        console.error('Error al obtener consultas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener consultas' });
    }
});

module.exports = router;

