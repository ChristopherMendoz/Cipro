const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Configuración de conexión usando variables de entorno (¡Asegúrate de que tu .env esté configurado!)
const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_SERVER || 'ACER_Core_i7',
    database: process.env.DB_DATABASE || 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};

// Middleware para verificar que el usuario logueado sea un paciente
router.use((req, res, next) => {
    // Para esta ruta, necesitamos el idPaciente en la sesión y que el rol sea de paciente.
    // Asumimos que idRol 1 es para Pacientes.
    if (!req.session || !req.session.idPaciente || req.session.idRol !== 1) {
        console.warn('Acceso no autorizado a /obtener-paciente. No hay idPaciente en la sesión o el rol es incorrecto.');
        return res.status(401).json({ ok: false, mensaje: 'No autorizado. Por favor, inicie sesión como paciente.' });
    }
    next(); // Continúa si el idPaciente y el rol están en la sesión
});


router.get('/', async (req, res) => {
    // Obtener el idPaciente y el idUsuario directamente de la sesión
    const idPacienteLogueado = req.session.idPaciente;
    const idUsuarioLogueado = req.session.idUsuario; // Podría ser útil para obtener datos de UsuarioSistema

    console.log(`Obteniendo datos del paciente para Paciente ID: ${idPacienteLogueado} (Usuario ID: ${idUsuarioLogueado}) desde sesión.`);

    try {
        const pool = await sql.connect(config);
        const ps = new sql.PreparedStatement(pool);

        // Usamos idPaciente para la consulta principal
        ps.input('idPaciente', sql.Int); // idPaciente es INT

        await ps.prepare(`
            SELECT
                P.idPaciente,
                P.primerNombre,
                P.segundoNombre,
                P.primerApellido,
                P.segundoApellido,
                P.cedula,
                CONVERT(varchar(10), P.fechaNacimiento, 23) AS fechaNacimiento, -- Formateamos la fecha
                P.sexo,
                P.direccion,
                P.telefono,
                P.tipoSangre,
                U.correo,     
                U.nombreUsuario
            FROM Paciente P
            INNER JOIN UsuarioSistema U ON P.idUsuario = U.idUsuario
            WHERE P.idPaciente = @idPaciente
        `);

        const result = await ps.execute({ idPaciente: idPacienteLogueado });

        await ps.unprepare(); // Liberar recursos del prepared statement

        if (result.recordset.length === 0) {
            return res.json({ ok: false, mensaje: 'No se encontraron datos del paciente para el usuario logueado.' });
        }

        const datos = result.recordset[0];
        res.json({ ok: true, datos });

    } catch (err) {
        console.error('Error al obtener datos del paciente desde la sesión:', err);
        res.status(500).json({ ok: false, mensaje: 'Error interno del servidor al obtener datos del paciente.' });
    }
});


// La ruta completa será: PUT /obtener-paciente/actualizar-cedula

// --- RUTA PUT (La nueva, para actualizar la cédula) ---
router.put('/actualizar-cedula', async (req, res) => {
    // Obtenemos la cédula tal como la envía el usuario (con guiones)
    const { cedula: cedulaConGuiones } = req.body;
    const idPaciente = req.session.idPaciente;

    if (!cedulaConGuiones || cedulaConGuiones.trim() === '') {
        return res.status(400).json({ ok: false, mensaje: 'La cédula es requerida.' });
    }

    // --- LA LÍNEA CLAVE DE LA SOLUCIÓN ---
    // Creamos una nueva variable con la cédula sin guiones
    const cedulaLimpia = cedulaConGuiones.replace(/-/g, '');
    // ------------------------------------
    // Verificación opcional del formato (14 caracteres)
    if (cedulaLimpia.length !== 14) {
         return res.status(400).json({ ok: false, mensaje: 'El formato de la cédula no es válido.' });
    }
    try {
        await sql.connect(config);
        
        // Verificamos si la cédula ya está en uso por OTRO paciente
        const checkCedula = await sql.query`
            SELECT idPaciente FROM Paciente WHERE cedula = ${cedulaLimpia}
        `;
        if (checkCedula.recordset.length > 0 && checkCedula.recordset[0].idPaciente !== idPaciente) {
            return res.status(409).json({ ok: false, mensaje: 'Este número de cédula ya está registrado por otro usuario.' });
        }

        // Usamos la variable 'cedulaLimpia' para guardar en la base de datos
        await sql.query`
            UPDATE Paciente 
            SET cedula = ${cedulaLimpia} -- <-- Usamos la variable limpia
            WHERE idPaciente = ${idPaciente}
        `;
        res.json({ ok: true, mensaje: 'Cédula actualizada correctamente.' });

    } catch (error) {
        console.error("Error al actualizar la cédula:", error);
        res.status(500).json({ ok: false, mensaje: 'Error del servidor al actualizar la cédula.' });
    }
});





module.exports = router;
