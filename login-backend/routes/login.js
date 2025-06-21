const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt');

//const config = require('../config.js'); // Puedes volver a usar tu archivo config si quieres


// --- NO MÁS VARIABLES GLOBALES PARA INTENTOS FALLIDOS ---
// let intentosFallidos = 0;  // ELIMINADO
// let bloqueoHasta = null;   // ELIMINADO


const config = {
    user: 'sa',
    password: '123456',
    server: 'pc',
    database: 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false,
    }
};


router.post('/', async (req, res) => {
    const { Username, Contrasena } = req.body;
    const ahora = Date.now();

    // --- LÓGICA DE BLOQUEO POR SESIÓN ---
    // Cada usuario tiene su propio contador de intentos en su sesión
    req.session.intentosFallidos = req.session.intentosFallidos || 0;
    req.session.bloqueoHasta = req.session.bloqueoHasta || null;

    if (req.session.bloqueoHasta && ahora < req.session.bloqueoHasta) {
        const segundosRestantes = Math.ceil((req.session.bloqueoHasta - ahora) / 1000);
        return res.json({
            ok: false,
            mensaje: `Demasiados intentos fallidos. Intenta de nuevo en ${segundosRestantes} segundos.`
        });
    }
    // Si el bloqueo ya pasó, lo reseteamos
    if (req.session.bloqueoHasta && ahora >= req.session.bloqueoHasta) {
        req.session.intentosFallidos = 0;
        req.session.bloqueoHasta = null;
    }

    try {
        await sql.connect(config);

        const result = await sql.query`
            SELECT idUsuario, contraseña, idRol, Estado FROM UsuarioSistema WHERE nombreUsuario = ${Username}
        `;

        if (result.recordset.length === 0) {
            // Se registra el intento fallido EN LA SESIÓN
            registrarIntentoFallido(req);
            return res.json({ ok: false, mensaje: "Usuario no encontrado." });
        }

        const usuario = result.recordset[0];

        if (usuario.Estado === false) {
            return res.json({ ok: false, mensaje: "Su cuenta está inactiva. Contacte al administrador." });
        }

        const passwordCorrecta = await bcrypt.compare(Contrasena, usuario.contraseña);

        if (!passwordCorrecta) {
            // Se registra el intento fallido EN LA SESIÓN
            registrarIntentoFallido(req);
            return res.json({ ok: false, mensaje: "Contraseña incorrecta." });
        }

        // --- LOGIN EXITOSO ---
        // Se resetean los contadores en la sesión
        req.session.intentosFallidos = 0;
        req.session.bloqueoHasta = null;

        // Guardamos los datos del usuario en la sesión
        req.session.idUsuario = usuario.idUsuario;
        req.session.idRol = usuario.idRol;
        delete req.session.idMedico; // Limpia idMedico por si estaba en una sesión anterior
        delete req.session.idPaciente; // Limpia idPaciente por si estaba en una sesión anterior

        if (usuario.idRol === 2) { // Rol Médico
            const medicoResult = await sql.query`SELECT idMedico FROM Medico WHERE idUsuario = ${usuario.idUsuario}`;
            if (medicoResult.recordset.length > 0) {
                req.session.idMedico = medicoResult.recordset[0].idMedico;
            } else {
                return res.status(500).json({ ok: false, mensaje: "Error de configuración de Médico." });
            }
        } else if (usuario.idRol === 1) { // Rol Paciente
            const pacienteResult = await sql.query`SELECT idPaciente FROM Paciente WHERE idUsuario = ${usuario.idUsuario}`;
            if (pacienteResult.recordset.length > 0) {
                req.session.idPaciente = pacienteResult.recordset[0].idPaciente;
            } else {
                return res.status(500).json({ ok: false, mensaje: "Error de configuración de Paciente." });
            }
        }

        let redireccion = '/Clinica.html';
        switch (usuario.idRol) {
            case 1: redireccion = '/Paciente.html'; break;
            case 2: redireccion = '/Medico.html'; break;
            case 3: redireccion = '/Admin.html'; break;
        }

        // --- GUARDADO EXPLÍCITO DE LA SESIÓN ---
        // Guardamos la sesión y, una vez guardada, enviamos la respuesta.
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar la sesión:', err);
                return res.status(500).json({ ok: false, mensaje: "Error del servidor al guardar la sesión." });
            }

            console.log(`Login exitoso para Usuario ID: ${req.session.idUsuario}, Rol: ${req.session.idRol}. Redirigiendo a ${redireccion}`);
            
            res.json({
                ok: true,
                redireccion,
            });
        });

    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({
            ok: false,
            mensaje: "Error del servidor."
        });
    }
});

// La función ahora toma 'req' para poder modificar la sesión de ese usuario
function registrarIntentoFallido(req) {
    req.session.intentosFallidos++;
    if (req.session.intentosFallidos >= 5) {
        // Bloquea por 30 segundos
        req.session.bloqueoHasta = Date.now() + 30 * 1000; 
    }
}

module.exports = router;