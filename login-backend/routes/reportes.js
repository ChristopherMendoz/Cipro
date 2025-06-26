// En routes/reportes.js
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js');

// --- RUTAS PARA CATÁLOGOS (LLENAR LOS SELECTS) ---

router.get('/catalogo-medicos', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT idMedico, nombreCompleto FROM Medico WHERE idUsuario IN (SELECT idUsuario FROM UsuarioSistema WHERE Estado = 1) ORDER BY nombreCompleto`;
        res.json(result.recordset);
    } catch (e) { res.status(500).json([]); }
});

router.get('/catalogo-pacientes', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT idPaciente, primerNombre, primerApellido FROM Paciente WHERE idUsuario IN (SELECT idUsuario FROM UsuarioSistema WHERE Estado = 1) ORDER BY primerApellido`;
        res.json(result.recordset);
    } catch (e) { res.status(500).json([]); }
});

// --- RUTAS PARA GENERAR REPORTES (CON FILTROS) ---

router.post('/por-medico', async (req, res) => {
    const { medicoId, fechaDesde, fechaHasta } = req.body;
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT CONVERT(varchar, C.fecha, 103) as Fecha, P.primerNombre + ' ' + P.primerApellido as Paciente, S.nombreServicio as Servicio, C.estado as Estado
            FROM Consulta C
            JOIN Paciente P ON C.idPaciente = P.idPaciente
            JOIN Servicios S ON C.idServicio = S.idServicio
            WHERE C.idMedico = ${medicoId}
            AND C.fecha BETWEEN ${fechaDesde} AND ${fechaHasta}
            ORDER BY C.fecha, C.hora
        `;
        res.json({ ok: true, data: result.recordset });
    } catch (error) { res.status(500).json({ ok: false, mensaje: "Error al generar reporte." }); }
});

router.post('/por-paciente', async (req, res) => {
    const { pacienteId, fechaDesde, fechaHasta } = req.body;
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT CONVERT(varchar, C.fecha, 103) as Fecha, M.nombreCompleto as Medico, S.nombreServicio as Servicio, C.estado as Estado
            FROM Consulta C
            LEFT JOIN Medico M ON C.idMedico = M.idMedico
            JOIN Servicios S ON C.idServicio = S.idServicio
            WHERE C.idPaciente = ${pacienteId}
            AND C.fecha BETWEEN ${fechaDesde} AND ${fechaHasta}
            ORDER BY C.fecha, C.hora
        `;
        res.json({ ok: true, data: result.recordset });
    } catch (error) { res.status(500).json({ ok: false, mensaje: "Error al generar reporte." }); }
});


module.exports = router;