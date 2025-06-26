const express = require('express');
const router = express.Router();
const sql = require('mssql');
const config = require('../../config');

router.post('/', async (req, res) => {
    let {
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

    // 1. Limpieza de datos (esto ya lo teníamos)
    idMedico = (idMedico === "" || idMedico === undefined) ? null : idMedico;
    idPaciente = (idPaciente === "" || idPaciente === undefined) ? null : idPaciente;

    // 2. Validaciones del servidor (esto ya lo teníamos)
    if (!idPaciente) {
        return res.status(400).json({ ok: false, mensaje: "Falta el ID del paciente. La sesión puede haber expirado." });
    }
    const fechaCita = new Date(fecha + 'T' + hora);
    if (fechaCita <= new Date()) {
        return res.status(400).json({ ok: false, mensaje: "No puedes agendar citas en fechas pasadas." });
    }
    // ... (otras validaciones de horario si las tienes) ...

    // 3. Lógica de Base de Datos
    try {
        await sql.connect(config);

        // --- VALIDACIÓN NUEVA: VERIFICAR SI YA EXISTE UNA CITA ACTIVA ---
        const checkActiveAppointment = await sql.query`
            SELECT COUNT(*) AS totalActivas 
            FROM Consulta 
            WHERE idPaciente = ${idPaciente} AND estado = 'pendiente'
        `;

        if (checkActiveAppointment.recordset[0].totalActivas > 0) {
            // Si el contador es mayor a 0, significa que el paciente ya tiene una cita pendiente.
            return res.status(409).json({ // 409 Conflict es un buen código de estado para esto
                ok: false, 
                mensaje: "Ya tienes una cita activa. No puedes agendar otra hasta que la actual se complete o cancele." 
            });
        }
        // --- FIN DE LA VALIDACIÓN NUEVA ---


        // Validación de disponibilidad del médico (anti-doble reserva, esto ya lo teníamos)
        if (idMedico) {
            const checkAvailability = await sql.query`
                SELECT COUNT(*) AS total 
                FROM Consulta 
                WHERE fecha = ${fecha} AND hora = ${hora} AND idMedico = ${idMedico} AND estado != 'cancelada'
            `;
            if (checkAvailability.recordset[0].total > 0) {
                return res.status(409).json({ ok: false, mensaje: "El horario seleccionado con ese médico ya no está disponible." });
            }
        }

        // Preparar y ejecutar la inserción (esto ya lo teníamos)
        const request = new sql.Request();
        request.input('fecha', sql.Date, fecha);
        request.input('hora', sql.NVarChar, hora);
        request.input('estado', sql.VarChar(20), estado);
        request.input('idServicio', sql.Int, idServicio);
        request.input('observaciones', sql.Text, observaciones);
        request.input('idPaciente', sql.Int, idPaciente);
        request.input('idMedico', sql.Int, idMedico);
        request.input('idSala', sql.Int, idSala);
        request.input('idRecepcionista', sql.Int, idRecepcionista);

        await request.query`
            INSERT INTO Consulta (fecha, hora, estado, idServicio, observaciones, idPaciente, idMedico, idSala, idRecepcionista)
            VALUES (@fecha, @hora, @estado, @idServicio, @observaciones, @idPaciente, @idMedico, @idSala, @idRecepcionista);
        `;
        
        res.json({ ok: true, mensaje: "Cita agendada con éxito." });

    } catch (error) {
        console.error('Error al agendar cita:', error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor al agendar la cita." });
    }
});

module.exports = router;


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