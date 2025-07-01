const express = require('express');
const router = express.Router();
const sql = require('mssql');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const config = require('../config');
const bcrypt = require('bcrypt'); // Asegúrate de que bcrypt esté importado

// --- Configuración de Nodemailer ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'ciproclinicanicaragua@gmail.com',
        pass: process.env.EMAIL_PASS || 'fqir anpw qwqa yrjh' // Tu contraseña de aplicación
    }
});

// --- Ruta para solicitar el reseteo (esta parte no necesita cambios) ---
router.post('/forgot-password', async (req, res) => {
    const { correo } = req.body;

    try {
        await sql.connect(config);
        const userResult = await sql.query`SELECT idUsuario, correo FROM UsuarioSistema WHERE correo = ${correo}`;
        
        if (userResult.recordset.length === 0) {
            // Por seguridad, enviamos una respuesta genérica incluso si el correo no existe
            return res.status(200).json({ ok: true, mensaje: 'Si este correo está registrado, recibirás un enlace de recuperación.' });
        }
        const user = userResult.recordset[0];

        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hora de validez

        await sql.query`UPDATE UsuarioSistema SET resetToken = ${token}, resetTokenExpires = ${expires} WHERE idUsuario = ${user.idUsuario}`;

        const resetLink = `http://localhost:5500/reset-password.html?token=${token}`;

        await transporter.sendMail({
            to: user.correo,
            from: 'Clínica Cipro <no-reply@cipro.com>',
            subject: 'Restablecimiento de Contraseña - Clínica Cipro',
            html: `
                <p>Has solicitado restablecer tu contraseña.</p>
                <p>Haz clic en el siguiente enlace para continuar. Si no lo solicitaste, ignora este correo.</p>
                <a href="${resetLink}" style="padding: 10px 15px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">Restablecer mi contraseña</a>
                <p>El enlace es válido por 1 hora.</p>
            `
        });

        res.json({ ok: true, mensaje: 'Se ha enviado un enlace de recuperación a tu correo.' });

    } catch (error) {
        console.error("Error en /forgot-password:", error);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
});


// --- Ruta para actualizar la contraseña (AQUÍ ESTÁ LA CORRECCIÓN) ---
router.post('/reset-password', async (req, res) => {
    const { token, nuevaContrasena } = req.body;

    // Puedes añadir una validación más robusta aquí si quieres
    if (!nuevaContrasena || nuevaContrasena.length < 5) {
        return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener al menos 5 caracteres.' });
    }

    try {
        await sql.connect(config);

        // 1. Buscar el usuario por el token y verificar que no haya expirado
        const userResult = await sql.query`
            SELECT idUsuario FROM UsuarioSistema 
            WHERE resetToken = ${token} AND resetTokenExpires > GETDATE()
        `;

        if (userResult.recordset.length === 0) {
            return res.status(400).json({ ok: false, mensaje: 'El enlace para restablecer es inválido o ha expirado.' });
        }
        const user = userResult.recordset[0];

        // ======================= CAMBIO CLAVE =======================
        // 2. Hashear la nueva contraseña antes de guardarla
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(nuevaContrasena, saltRounds);
        // ==========================================================

        // 3. Actualizar la contraseña con el HASH y limpiar el token
        await sql.query`
            UPDATE UsuarioSistema 
            SET contraseña = ${hashedPassword}, resetToken = NULL, resetTokenExpires = NULL 
            WHERE idUsuario = ${user.idUsuario}
        `;

        res.json({ ok: true, mensaje: '¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.' });

    } catch (error) {
        console.error("Error en /reset-password:", error);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
    }
});


module.exports = router;