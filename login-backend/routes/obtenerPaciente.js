const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt'); // Agrega esto arriba
const config = require('../config.js');

// Obtener todos los pacientes activos
// Esta ruta obtiene todos los pacientes cuyo usuario asociado está activo (estado = 1)
router.get('/', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT 
                P.*, 
                U.correo
            FROM Paciente P
            JOIN UsuarioSistema U ON P.idUsuario = U.idUsuario
            WHERE U.estado = 1`;
        res.json(result.recordset);
    } catch (err) {
        console.error('❌ Error al obtener pacientes:', err);
        res.status(500).json({ error: 'Error al obtener pacientes' });
    }
});

// Dar de baja paciente
// Esta ruta actualiza el estado del usuario asociado al paciente a 0 (baja)
router.put('/:id/baja', async (req, res) => {
  const { id } = req.params;

  try {
    await sql.connect(config);
    await sql.query`
      UPDATE UsuarioSistema
      SET estado = 0
      WHERE idUsuario = (
        SELECT idUsuario FROM Paciente WHERE idPaciente = ${id}
      )
    `;
    res.json({ ok: true, mensaje: "Paciente dado de baja." });
  } catch (error) {
    console.error("❌ Error al dar de baja al paciente:", error);
    res.status(500).json({ ok: false, mensaje: "Error del servidor." });
  }
});

// Editar paciente (Añadimos la cédula)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        primerNombre, segundoNombre, primerApellido, segundoApellido,
        fechaNacimiento, sexo, direccion, telefono, tipoSangre, cedula // <-- Recibimos la cédula
    } = req.body;
    
    // Limpiamos la cédula de guiones antes de guardarla
    const cedulaLimpia = cedula ? cedula.replace(/-/g, '') : null;

    try {
        await sql.connect(config);
        await sql.query`
            UPDATE Paciente SET
                primerNombre = ${primerNombre}, segundoNombre = ${segundoNombre},
                primerApellido = ${primerApellido}, segundoApellido = ${segundoApellido},
                fechaNacimiento = ${fechaNacimiento}, sexo = ${sexo},
                direccion = ${direccion}, telefono = ${telefono},
                tipoSangre = ${tipoSangre}, cedula = ${cedulaLimpia} -- <-- Actualizamos la cédula
            WHERE idPaciente = ${id}
        `;
        res.json({ ok: true });
    } catch (err) {
        console.error("❌ Error al editar paciente:", err);
        res.status(500).json({ ok: false, error: 'Error al editar paciente' });
    }
});

// Obtener paciente por ID
// Esta ruta obtiene un paciente específico por su ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await sql.connect(config);
        const result = await sql.query`
            SELECT * FROM Paciente WHERE idPaciente = ${id}
        `;
        if (result.recordset.length === 0) {
            return res.status(404).json({ ok: false, mensaje: "Paciente no encontrado" });
        }
        res.json(result.recordset[0]);
    } catch (error) {
        console.error("❌ Error al obtener paciente:", error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor" });
    }
});

// Reactivar paciente 
router.put('/:id/reactivar', async (req, res) => {
  const { id } = req.params;
  try {
    await sql.connect(config);
    await sql.query`
      UPDATE UsuarioSistema
      SET estado = 1
      WHERE idUsuario = (
        SELECT idUsuario FROM Paciente WHERE idPaciente = ${id}
      )
    `;
    res.json({ ok: true, mensaje: "Paciente reactivado." });
  } catch (error) {
    console.error("❌ Error al reactivar paciente:", error);
    res.status(500).json({ ok: false, mensaje: "Error del servidor al reactivar." });
  }
});

// agregar paciente nuevo
router.post('/', async (req, res) => {
    const { nombre, Snombre, apellido, Sapellido, fechan, genero, direccion, telefono, tipoSangre, correo, nombreUsuarioNuevo, contrasenaNuevo, cedula } = req.body;
    const cedulaLimpia = cedula ? cedula.replace(/-/g, '') : null;

    try {
        await sql.connect(config);

        let idUsuario;
        const usuarioExistente = await sql.query`SELECT idUsuario FROM UsuarioSistema WHERE correo = ${correo}`;

        if (usuarioExistente.recordset.length > 0) {
            const idUsuarioExistente = usuarioExistente.recordset[0].idUsuario;
            const pacienteExistente = await sql.query`SELECT idPaciente FROM Paciente WHERE idUsuario = ${idUsuarioExistente}`;
            if (pacienteExistente.recordset.length > 0) {
                return res.status(409).json({ ok: false, mensaje: 'El correo electrónico ya está registrado para otro paciente.' });
            }
            idUsuario = idUsuarioExistente;
        } else {
            if (!nombreUsuarioNuevo || !contrasenaNuevo) {
                return res.status(400).json({ ok: false, mensaje: "Faltan datos para crear el usuario (nombre de usuario y/o contraseña)." });
            }

            // ----> ¡NUEVA VALIDACIÓN AQUÍ! <----
            // Verificamos si el nombre de usuario ya está en uso antes de intentar insertar.
            const nombreUsuarioExistente = await sql.query`SELECT idUsuario FROM UsuarioSistema WHERE nombreUsuario = ${nombreUsuarioNuevo}`;
            if (nombreUsuarioExistente.recordset.length > 0) {
                // Si ya existe, enviamos un error específico.
                return res.status(409).json({ ok: false, mensaje: 'Ese nombre de usuario ya está en uso. Por favor, elija otro.' });
            }
            // ----> FIN DE LA NUEVA VALIDACIÓN <----

            idUsuario = await generarIdUsuarioPaciente();
            const hash = await bcrypt.hash(contrasenaNuevo, 10);

            await sql.query`
                INSERT INTO UsuarioSistema (idUsuario, correo, nombreUsuario, contraseña, idRol, estado)
                VALUES (${idUsuario}, ${correo}, ${nombreUsuarioNuevo}, ${hash}, 1, 1)
            `;
        }

        await sql.query`
            INSERT INTO Paciente (primerNombre, segundoNombre, primerApellido, segundoApellido, fechaNacimiento, sexo, direccion, telefono, tipoSangre, idUsuario, cedula)
            VALUES (${nombre}, ${Snombre}, ${apellido}, ${Sapellido}, ${fechan}, ${genero}, ${direccion}, ${telefono}, ${tipoSangre}, ${idUsuario}, ${cedulaLimpia}) 
        `;

        res.status(201).json({ ok: true, mensaje: "Paciente agregado correctamente." });

    } catch (err) {
        console.error("❌ Error al agregar paciente:", err);
        res.status(500).json({ ok: false, mensaje: "Error interno del servidor al agregar el paciente." });
    }
});


// Función para generar un nuevo idUsuario para pacientes
// Este idUsuario tendrá el formato 'CLI001', 'CLI002', etc.
async function generarIdUsuarioPaciente() {
    const result = await sql.query`
        SELECT idUsuario FROM UsuarioSistema WHERE idUsuario LIKE 'CLI%'`;// Obtiene todos los idUsuario que comienzan con 'CLI'
    let max = 0;
    result.recordset.forEach(row => {
        const num = parseInt(row.idUsuario.replace('CLI', ''));
        if (!isNaN(num) && num > max) max = num;
    });
    return 'CLI' + String(max + 1).padStart(3, '0');// Genera el nuevo idUsuario
}

module.exports = router;
