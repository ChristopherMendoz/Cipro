
const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../config.js'); // Asegúrate que la ruta a tu config sea correcta

// Endpoint para las tarjetas de estadísticas (KPIs)
router.get('/stats', async (req, res) => {
    try {
        await sql.connect(config);
        const pool = new sql.Request();

        // Ejecutamos todas las consultas de conteo en paralelo para más eficiencia
        const [
            pacientesResult,
            medicosResult,
            citasHoyResult,
            citasTotalesResult,
            citasPendientesResult,
            citasRealizadasResult,
            citasCanceladasResult
        ] = await Promise.all([
            pool.query`SELECT COUNT(*) as total FROM Paciente P JOIN UsuarioSistema U ON P.idUsuario = U.idUsuario WHERE U.Estado = 1`,
            pool.query`SELECT COUNT(*) as total FROM Medico M JOIN UsuarioSistema U ON M.idUsuario = U.idUsuario WHERE U.Estado = 1`,
            pool.query`SELECT COUNT(*) as total FROM Consulta WHERE estado = 'pendiente' AND CAST(fecha AS DATE) = CAST(GETDATE() AS DATE)`,
            pool.query`SELECT COUNT(*) as total FROM Consulta`,
            pool.query`SELECT COUNT(*) as total FROM Consulta WHERE estado = 'pendiente'`,
            pool.query`SELECT COUNT(*) as total FROM Consulta WHERE estado = 'realizada'`,
            pool.query`SELECT COUNT(*) as total FROM Consulta WHERE estado = 'cancelada'`
        ]);

        res.json({
            ok: true,
            totalPacientes: pacientesResult.recordset[0].total,
            totalMedicos: medicosResult.recordset[0].total,
            citasHoy: citasHoyResult.recordset[0].total,
            totalCitas: citasTotalesResult.recordset[0].total,
            citasPendientes: citasPendientesResult.recordset[0].total,
            citasRealizadas: citasRealizadasResult.recordset[0].total,
            citasCanceladas: citasCanceladasResult.recordset[0].total,
            ingresosMes: 'N/D'
        });

    } catch (error) {
        console.error("Error al obtener estadísticas del dashboard:", error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor." });
    }
});


router.get('/servicios-distribucion', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT TOP 7 S.nombreServicio, COUNT(C.idConsulta) as total
            FROM Consulta C
            JOIN Servicios S ON C.idServicio = S.idServicio
            GROUP BY S.nombreServicio
            ORDER BY total DESC
        `;
        res.json({ ok: true, data: result.recordset });
    } catch (error) {
        console.error("Error al obtener distribución de servicios:", error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor." });
    }
});

// Endpoint para la actividad reciente (mostraremos los últimos pacientes agregados)
router.get('/actividad-reciente', async (req, res) => {
    try {
        await sql.connect(config);

        // NUEVA CONSULTA: Usamos DATEDIFF para calcular la diferencia en segundos
        const result = await sql.query`
            SELECT TOP 10
                P.primerNombre,
                P.primerApellido,
                DATEDIFF(second, P.fechaRegistro, GETDATE()) as segundosTranscurridos
            FROM Paciente P
            WHERE P.fechaRegistro IS NOT NULL
            ORDER BY P.fechaRegistro DESC`;

        // Enviamos los datos directamente. Cada item tendrá la propiedad "segundosTranscurridos".
        res.json({ ok: true, data: result.recordset });

    } catch (error) {
        console.error("Error al obtener actividad reciente:", error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor." });
    }
});

router.get('/citas-semana', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SET LANGUAGE Spanish;
            SELECT 
                DATENAME(weekday, fecha) as dia,
                COUNT(idConsulta) as total
            FROM Consulta
            WHERE fecha >= DATEADD(day, -6, GETDATE()) AND fecha <= GETDATE()
            GROUP BY DATENAME(weekday, fecha), CAST(fecha AS DATE)
            ORDER BY CAST(fecha AS DATE) ASC;
        `;
        res.json({ ok: true, data: result.recordset });
    } catch (error) {
        console.error("Error al obtener datos para el gráfico de citas:", error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor." });
    }
});


router.get('/proximas-citas', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT TOP 5
                C.idConsulta, -- ¡LÍNEA CLAVE AÑADIDA!
                CONVERT(varchar(5), C.hora, 108) as hora,
                P.primerNombre + ' ' + P.primerApellido as nombrePaciente,
                ISNULL(M.nombreCompleto, 'Sin asignar') as nombreMedico
            FROM Consulta C
            JOIN Paciente P ON C.idPaciente = P.idPaciente
            LEFT JOIN Medico M ON C.idMedico = M.idMedico
            WHERE
                C.estado = 'pendiente' AND
                CAST(C.fecha AS DATE) = CAST(GETDATE() AS DATE)
            ORDER BY C.hora ASC;
        `;
        res.json({ ok: true, data: result.recordset });
    } catch (error) {
        console.error("Error al obtener las próximas citas:", error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor." });
    }
});

router.get('/eventos-calendario', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT 
                C.idConsulta,
                S.nombreServicio as title,
                -- ¡CAMBIO CLAVE! Convertimos la fecha a un formato de texto simple YYYY-MM-DD
                CONVERT(varchar, C.fecha, 23) as start,
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


module.exports = router;