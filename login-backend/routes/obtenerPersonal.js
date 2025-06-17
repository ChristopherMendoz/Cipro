const express = require('express');
const router = express.Router();
const sql = require('mssql');

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



//obtener medicos
router.get('/', async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query(`
         SELECT M.idMedico, M.nombreCompleto, M.cedulaProfesional, M.telefono, E.nombre AS especializacion
         FROM Medico M
         JOIN UsuarioSistema U ON M.idUsuario = U.idUsuario
         JOIN Especializacion E ON M.idEspecializacion = E.idEspecializacion
         WHERE U.estado = 1;
    `);

        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error al obtener médicos:", error);
        res.status(500).json({ ok: false, mensaje: "Error al obtener médicos." });
    }
});

// Eliminar médico (dar de baja)
router.delete('/:idMedico', async (req, res) => {
    const { idMedico } = req.params;

    try {
        await sql.connect(config);

        // Cambiar el estado en UsuarioSistema a 0 (baja lógica)
        await sql.query`
      UPDATE UsuarioSistema
      SET estado = 0
      WHERE idUsuario = (
        SELECT idUsuario FROM Medico WHERE idMedico = ${idMedico}
      )
    `;

        res.json({ ok: true, mensaje: "Médico dado de baja." });

    } catch (error) {
        console.error("❌ Error al dar de baja al médico:", error);
        res.status(500).json({ ok: false, mensaje: "Error del servidor al dar de baja." });
    }
});


// Editar médico
router.put('/editar/:idMedico', async (req, res) => {
  const { idMedico } = req.params;
  const { nombreCompleto, cedulaProfesional, telefono, idEspecializacion } = req.body;

  console.log("➡️ ID del médico a editar:", idMedico);
  console.log("📦 Datos recibidos:", req.body);

  try {
    await sql.connect(config);
    const result = await sql.query`
      UPDATE Medico
      SET nombreCompleto = ${nombreCompleto},
          cedulaProfesional = ${cedulaProfesional},
          telefono = ${telefono},
          idEspecializacion = ${idEspecializacion}
      WHERE idMedico = ${idMedico}
    `;

    console.log("✅ Filas modificadas:", result.rowsAffected); // <--- esto te dirá si hizo efecto

    res.json({ ok: true, mensaje: "Médico actualizado correctamente." });
  } catch (error) {
    console.error("❌ Error al actualizar médico:", error);
    res.status(500).json({ ok: false, mensaje: "Error al actualizar médico." });
  }
});


// Este GET sirve para obtener los datos del médico antes de editar
router.get('/editar/:idMedico', async (req, res) => {
  const { idMedico } = req.params;

  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT M.idMedico, M.nombreCompleto, M.cedulaProfesional, M.telefono, M.idEspecializacion
      FROM Medico M
      WHERE M.idMedico = ${idMedico}
    `;

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: "Médico no encontrado." });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("❌ Error al obtener médico:", error);
    res.status(500).json({ mensaje: "Error del servidor al obtener médico." });
  }
});


//reactivar medico

router.put('/:idMedico/reactivar', async (req, res) => {
  const { idMedico } = req.params;
  try {
    await sql.connect(config);
    await sql.query`
      UPDATE UsuarioSistema
      SET estado = 1
      WHERE idUsuario = (
        SELECT idUsuario FROM Medico WHERE idMedico = ${idMedico}
      )
    `;
    res.json({ ok: true, mensaje: "Médico reactivado correctamente." });
  } catch (error) {
    console.error("❌ Error al reactivar al médico:", error);
    res.status(500).json({ ok: false, mensaje: "Error del servidor al reactivar." });
  }
});

module.exports = router;
