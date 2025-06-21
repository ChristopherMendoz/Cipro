const express = require('express');
const router = express.Router();
const sql = require('mssql');

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_SERVER || 'pc',
    database: process.env.DB_DATABASE || 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};

// Middleware para proteger la ruta y asegurar que el paciente esté logueado
router.use((req, res, next) => {
    // Verificamos que exista el idPaciente en la sesión
    // y que el idRol sea el de paciente (opcional, pero buena práctica)
    if (!req.session || !req.session.idPaciente || req.session.idRol !== 1) { // Asumiendo idRol 1 para Pacientes
        console.warn('Acceso no autorizado a consultas de paciente. No hay idPaciente en la sesión o rol incorrecto.');
        return res.status(401).json({ ok: false, mensaje: 'No autorizado. Por favor, inicie sesión como paciente.' });
    }
    next(); // Si hay idPaciente, permite que la solicitud continúe
});

// Obtener todas las consultas para el paciente logueado
router.get('/', async (req, res) => {
    // Recupera el idPaciente de la sesión
    const idPacienteLogueado = req.session.idPaciente;
    console.log(`Obteniendo consultas para el Paciente ID: ${idPacienteLogueado}`);

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
            WHERE c.idPaciente = ${idPacienteLogueado} -- <--- FILTRADO CLAVE AQUÍ
            ORDER BY c.idConsulta DESC
        `;

        const consultas = result.recordset.map(c => {
            let hora = c.hora instanceof Date ? c.hora.toTimeString().substring(0, 5) : c.hora;
            return { ...c, hora };
        });

        res.json({ ok: true, consultas });

    } catch (error) {
        console.error('Error al obtener consultas para el paciente logueado:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener consultas para el paciente logueado' });
    }
});

module.exports = router;