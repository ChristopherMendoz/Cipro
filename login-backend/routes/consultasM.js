const express = require('express');
const router = express.Router();
const sql = require('mssql');
//const config = require('../config.js');

const config = {
    user: 'sa',
    password: '123456',
    server: 'pc',
    database: 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};




// Middleware para proteger la ruta y verificar si el médico está logueado
router.use((req, res, next) => {
    // Verifica si hay un idMedico en la sesión
    if (!req.session || !req.session.idMedico) {
        console.warn('Acceso no autorizado a /consultasM. No hay idMedico en la sesión.');
        return res.status(401).json({ ok: false, mensaje: 'No autorizado. Por favor, inicie sesión como médico.' });
    }
    next(); // Si hay idMedico, permite que la solicitud continúe a la ruta GET
});

// Obtener todas las consultas para el médico logueado
router.get('/', async (req, res) => {
    // Recupera el idMedico de la sesión
    const idMedicoLogueado = req.session.idMedico;
    console.log(`Obteniendo consultas para el Médico ID: ${idMedicoLogueado}`);

    try {
        await sql.connect(config);

        const result = await sql.query`
            SELECT 
                c.idConsulta,
                CONVERT(varchar(10), c.fecha, 23) AS fecha,
                CONVERT(varchar(5), c.hora, 108) AS hora,
                c.estado,
                c.observaciones,
                p.primerNombre +' '+ p.primerApellido AS nombrePaciente,
                m.nombreCompleto AS nombreMedico,
                s.nombre AS nombreSala,
                serv.nombreServicio AS nombreServicio,
                r.nombreCompleto AS nombreRecepcionista
            FROM Consulta c
            INNER JOIN Paciente p ON c.idPaciente = p.idPaciente
            INNER JOIN Medico m ON c.idMedico = m.idMedico
            INNER JOIN Sala s ON c.idSala = s.idSala
            INNER JOIN Recepcionista r ON c.idRecepcionista = r.idRecepcionista
            INNER JOIN Servicios serv ON c.idServicio = serv.idServicio
            WHERE c.idMedico = ${idMedicoLogueado}
            ORDER BY c.idConsulta DESC
        `;

        const consultas = result.recordset.map(c => {
            let hora = c.hora instanceof Date ? c.hora.toTimeString().substring(0, 5) : c.hora;
            return { ...c, hora };
        });

        res.json({ ok: true, consultas });

    } catch (error) {
        console.error('Error al obtener consultas para el médico logueado:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener consultas para el médico logueado' });
    }
});

module.exports = router;