
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

// GET /api/agenda/cita/:id  (Obtiene los detalles de una sola cita)
router.get('/cita/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT
                C.idConsulta,
                CONVERT(varchar, C.fecha, 23) as fecha, -- Formato YYYY-MM-DD para el input date
                CONVERT(varchar(5), C.hora, 108) as hora,
                C.estado,
                C.observaciones,
                P.primerNombre + ' ' + P.primerApellido as nombrePaciente,
                ISNULL(M.nombreCompleto, 'Sin Asignar') as nombreMedico,
                S.nombreServicio,
                SA.nombre as nombreSala,
                C.idServicio,
                C.idMedico,
                C.idSala
            FROM Consulta C
            JOIN Paciente P ON C.idPaciente = P.idPaciente
            LEFT JOIN Medico M ON C.idMedico = M.idMedico
            JOIN Servicios S ON C.idServicio = S.idServicio
            JOIN Sala SA ON C.idSala = SA.idSala
            WHERE C.idConsulta = ${id}
        `;
        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada.' });
        }
        res.json({ ok: true, data: result.recordset[0] });
    } catch (error) {
        console.error(`Error al obtener detalles de la cita ${id}:`, error);
        res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
    }
});

router.get('/eventos-calendario', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT
                C.idConsulta as id, -- Es importante que el ID se llame 'id'
                S.nombreServicio as title,
                CONVERT(varchar, C.fecha, 23) as start, -- Formato YYYY-MM-DD
                CASE
                    WHEN C.estado = 'pendiente' THEN '#f6993f'
                    WHEN C.estado = 'realizada' THEN '#38a169'
                    WHEN C.estado = 'cancelada' THEN '#e53e3e'
                    ELSE '#808080'
                END as color
            FROM Consulta C
            JOIN Servicios S ON C.idServicio = S.idServicio
        `;
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener eventos para el calendario:", error);
        res.status(500).json([]);
    }
});

// GET /api/agenda/todas (Obtiene todas las citas para la tabla principal)
router.get('/todas', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT
                C.idConsulta,
                CONVERT(varchar, C.fecha, 103) as fecha,
                CONVERT(varchar(5), C.hora, 108) as hora,
                P.primerNombre + ' ' + P.primerApellido as nombrePaciente,
                ISNULL(M.nombreCompleto, 'Sin Asignar') as nombreMedico,
                S.nombreServicio,
                C.estado
            FROM Consulta C
            JOIN Paciente P ON C.idPaciente = P.idPaciente
            LEFT JOIN Medico M ON C.idMedico = M.idMedico
            JOIN Servicios S ON C.idServicio = S.idServicio
            ORDER BY C.fecha DESC, C.hora DESC
        `;
        res.json({ ok: true, data: result.recordset });
    } catch (error) {
        console.error("Error al obtener todas las citas:", error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor." });
    }
});

// PUT /api/agenda/citas/:id/estado (Actualiza el estado de una cita)
router.put('/citas/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body; // Recibimos el nuevo estado: 'realizada' o 'cancelada'

    // Validamos que el estado sea uno de los permitidos
    if (!['realizada', 'cancelada'].includes(estado)) {
        return res.status(400).json({ ok: false, mensaje: 'Estado no válido.' });
    }

    try {
        await sql.connect(config);
        await sql.query`
            UPDATE Consulta 
            SET estado = ${estado} 
            WHERE idConsulta = ${id}
        `;
        res.json({ ok: true, mensaje: `Cita actualizada a '${estado}' correctamente.` });
    } catch (error) {
        console.error(`Error al actualizar estado de la cita ${id}:`, error);
        res.status(500).json({ ok: false, mensaje: 'Error del servidor.' });
    }
});

// GET /api/agenda/catalogos/medicos
router.get('/catalogos/medicos', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT idMedico, nombreCompleto FROM Medico ORDER BY nombreCompleto ASC`;
        res.json(result.recordset);
    } catch (e) { res.status(500).json([]); }
});

// GET /api/agenda/catalogos/servicios
router.get('/catalogos/servicios', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT idServicio, nombreServicio FROM Servicios ORDER BY nombreServicio ASC`;
        res.json(result.recordset);
    } catch (e) { res.status(500).json([]); }
});

// GET /api/agenda/catalogos/salas
router.get('/catalogos/salas', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT idSala, nombre FROM Sala ORDER BY nombre ASC`;
        res.json(result.recordset);
    } catch (e) { res.status(500).json([]); }
});


// --- RUTA PARA ACTUALIZAR LA CITA ---

// PUT /api/agenda/cita/:id (Actualiza una cita existente)
router.put('/cita/:id', async (req, res) => {
    const { id } = req.params;
    const { fecha, hora, idMedico, idServicio, idSala, estado, observaciones } = req.body;
    try {
        await sql.connect(config);
        await sql.query`
            UPDATE Consulta SET
                fecha = ${fecha},
                hora = ${hora},
                idMedico = ${idMedico || null},
                idServicio = ${idServicio},
                idSala = ${idSala},
                estado = ${estado},
                observaciones = ${observaciones}
            WHERE idConsulta = ${id}
        `;
        res.json({ ok: true, mensaje: 'Cita actualizada correctamente.' });
    } catch (error) {
        console.error(`Error al actualizar la cita ${id}:`, error);
        res.status(500).json({ ok: false, mensaje: 'Error del servidor al actualizar.' });
    }
});

module.exports = router;