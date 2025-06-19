const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../../config'); // Asume que tienes un archivo config.js con la configuración de la BD

router.post('/', async (req, res) => {
    const {
        fecha,
        hora,
        estado,
        idServicio, 
        observaciones,
        idPaciente,
        idMedico, 
        idSala,
        idRecepcionista
    } = req.body;

    // --- Validaciones Backend (CRUCIAL) ---
    const fechaCita = new Date(fecha + 'T' + hora + ':00'); // Combina fecha y hora para una fecha/hora completa
    const ahora = new Date();
    const horaCierreClinica = new Date(fechaCita); // Usa la fecha de la cita para el cálculo
    horaCierreClinica.setHours(17, 0, 0, 0); // 5 PM (17:00)
    const horaLimiteCita = new Date(fechaCita);
    horaLimiteCita.setHours(16, 0, 0, 0); // 4 PM (16:00), 1 hora antes de cerrar

    // 1. Fecha no pasada
    if (fechaCita <= ahora) {
        return res.status(400).json({ ok: false, mensaje: "No puedes agendar citas en el pasado." });
    }

    // 2. Hora dentro del horario de la clínica (8 AM - 5 PM)
    const horaNumerica = parseInt(hora.split(':')[0]);
    if (horaNumerica < 8 || horaNumerica >= 17) { // Citas hasta las 4:30 PM (para que no pasen de las 5 PM)
        return res.status(400).json({ ok: false, mensaje: "La hora de la cita debe ser entre 8:00 a.m. y 5:00 p.m." });
    }
    // 3. Hora no más de 1 hora antes de cerrar (Ej. última cita a las 4 PM)
    if (fechaCita >= horaLimiteCita && fechaCita < horaCierreClinica) {
        // Si la cita es a las 4 PM, está bien. Si es a las 4:30 PM, no.
        if (horaNumerica === 16 && parseInt(hora.split(':')[1]) > 0) { // Si es 4:01 PM o más
             return res.status(400).json({ ok: false, mensaje: "La última cita se puede agendar hasta las 4:00 p.m." });
        }
    }


    // 4. (FALTA) Validar disponibilidad del médico y sala
    // Esto es lo más complejo y requeriría consultar tu tabla AgendaMedico.
    // Por ahora, lo dejamos pendiente, pero es CRÍTICO para un sistema real.
    // Ejemplo de lógica (conceptual):
    /*
    const pool = new sql.ConnectionPool(config);
    const conn = await pool.connect();
    const checkAvailability = await conn.request()
        .input('fecha', sql.Date, fecha)
        .input('hora', sql.Time, hora)
        .input('idMedico', sql.Int, idMedico)
        .input('idSala', sql.Int, idSala)
        .query(`SELECT COUNT(*) AS total FROM Consulta WHERE fecha = @fecha AND hora = @hora AND (idMedico = @idMedico OR idSala = @idSala) AND estado != 'cancelada';`);
    if (checkAvailability.recordset[0].total > 0) {
        await conn.close();
        return res.status(400).json({ ok: false, mensaje: "Esa hora no está disponible para el médico o sala seleccionada." });
    }
    await conn.close();
    */

    try {
        await sql.connect(config);

        // Si idMedico es null o vacío, convertirlo a DB NULL
        const medicoIdValue = idMedico === null || idMedico === "" ? null : sql.Int;

        const request = new sql.Request();
        request.input('fecha', sql.Date, fecha);
        request.input('hora', sql.Time, hora);
        request.input('estado', sql.VarChar(20), estado);
        request.input('idServicio', sql.Int, idServicio);
        request.input('observaciones', sql.Text, observaciones);
        request.input('idPaciente', sql.Int, idPaciente);
        request.input('idMedico', medicoIdValue, idMedico); // Usar el tipo de dato adecuado para NULL
        request.input('idSala', sql.Int, idSala);
        request.input('idRecepcionista', sql.Int, idRecepcionista);

         await request.query(`
            INSERT INTO Consulta (fecha, hora, estado, idServicio, observaciones, idPaciente, idMedico, idSala, idRecepcionista)
            VALUES (@fecha, @hora, @estado, @idServicio, @observaciones, @idPaciente, @idMedico, @idSala, @idRecepcionista);
        `);

        // --- Envío de correo de confirmación (Paso 4) ---
        // Esto es complejo y requiere un servicio de envío de correos (ej. Nodemailer con Gmail, SendGrid, Mailgun)
        // No puedo proporcionar el código completo aquí, pero te explico cómo sería:
        /*
        const nodemailer = require('nodemailer');
        let transporter = nodemailer.createTransport({
            service: 'gmail', // O 'smtp', 'SendGrid', etc.
            auth: {
                user: 'tu_correo@gmail.com', // Tu correo
                pass: 'tu_contraseña_app' // Contraseña de aplicación si usas Gmail
            }
        });
        let mailOptions = {
            from: 'tu_correo@gmail.com',
            to: 'correo_paciente@ejemplo.com', // Obtener el correo del paciente desde la BD
            subject: 'Confirmación de Cita Clínica Cipro',
            html: `<p>Hola ${primerNombre},</p>
                   <p>Tu cita para ${tipoEstudio} ha sido agendada para el ${fecha} a las ${hora}.</p>
                   <p>¡Te esperamos!</p>`
        };
        await transporter.sendMail(mailOptions);
        */

        res.json({ ok: true, mensaje: "Cita agendada con éxito." });

    } catch (error) {
        console.error('Error al agendar cita:', error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor al agendar la cita." });
    } finally {
        sql.close();
    }
});

module.exports = router;