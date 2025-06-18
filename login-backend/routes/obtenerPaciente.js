const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bcrypt = require('bcrypt'); // Agrega esto arriba

const config = {
    user: 'sa',
    password: '123456',
    server: 'DESKTOP-GMBSO0H',
    database: 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};

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

// Editar paciente
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        primerNombre, segundoNombre, primerApellido, segundoApellido,
        fechaNacimiento, sexo, direccion, telefono, tipoSangre
    } = req.body;

    try {
        await sql.connect(config);
        await sql.query`
            UPDATE Paciente SET
                primerNombre = ${primerNombre},
                segundoNombre = ${segundoNombre},
                primerApellido = ${primerApellido},
                segundoApellido = ${segundoApellido},
                fechaNacimiento = ${fechaNacimiento},
                sexo = ${sexo},
                direccion = ${direccion},
                telefono = ${telefono},
                tipoSangre = ${tipoSangre}
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
    const { nombre, Snombre, apellido, Sapellido, fechan, genero, direccion, telefono, tipoSangre, correo, nombreUsuarioNuevo, contrasenaNuevo } = req.body;
    try {
        await sql.connect(config);

        // 1. Buscar si el correo ya existe en UsuarioSistema
        let usuario = await sql.query`SELECT idUsuario FROM UsuarioSistema WHERE correo = ${correo}`;
        let idUsuario;
        if (usuario.recordset.length > 0) {
            idUsuario = usuario.recordset[0].idUsuario;
        } else {
            // Validar que los campos requeridos no sean nulos ni vacíos
            if (!nombreUsuarioNuevo || !contrasenaNuevo) {
                return res.status(400).json({ ok: false, mensaje: "Faltan datos para crear el usuario (nombre de usuario y/o contraseña)." });
            }
            idUsuario = await generarIdUsuarioPaciente(); // Generar un nuevo idUsuario
            // ENCRIPTAR LA CONTRASEÑA
            const hash = await bcrypt.hash(contrasenaNuevo, 10);

            // 2. Insertar el nuevo usuario en UsuarioSistema
            await sql.query`
                INSERT INTO UsuarioSistema (idUsuario, correo, nombreUsuario, contrasena, idRol)
                VALUES (${idUsuario}, ${correo}, ${nombreUsuarioNuevo}, ${hash}, 1)
            `;
        }

        // 3. Crear el paciente con el idUsuario
        await sql.query`
            INSERT INTO Paciente (primerNombre, segundoNombre, primerApellido, segundoApellido, fechaNacimiento, sexo, direccion, telefono, tipoSangre, idUsuario)
            VALUES (${nombre}, ${Snombre}, ${apellido}, ${Sapellido}, ${fechan}, ${genero}, ${direccion}, ${telefono}, ${tipoSangre}, ${idUsuario})
        `;

        res.json({ ok: true });
    } catch (err) {
        console.error("❌ Error al agregar paciente:", err);
        res.status(500).json({ ok: false, mensaje: "Error al agregar paciente" });
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
