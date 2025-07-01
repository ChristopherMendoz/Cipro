//usar node app.js para iniciar.. 
//revisar el configuration manager y desbloquear el puerto 1433 y el TCP/IP
//revisar en el firewall y liberar el puerto 1433 agregando una accion mas
//revisar si la bd esta dando ping con un ping en cmd 
require('dotenv').config();
const sql = require('mssql');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const obtenerPacienteByIdUsuarioRouter = require('./routes/Contacto/obtenerPacienteByIdUsuario');
const obtenerMedicosRouter = require('./routes/Contacto/obtenerMedicos');
const obtenerRecepcionistasRouter = require('./routes/Contacto/obtenerRecepcionistas');
const agendarCitaRouter = require('./routes/Contacto/agendarCita');
const session = require('express-session');
const imagenesRouter = require('./routes/Images/imagenes'); 
const uploadRouter = require('./routes/Images/upload');
const dashboardRoutes = require('./routes/dashboard');
const agendaRoutes = require('./routes/agenda');
const reportesRoutes = require('./routes/reportes');
const serviciosARouter = require('./routes/serviciosA');
const salasRoutes = require('./routes/salas');
const passwordResetRoutes = require('./routes/password-reset');



const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/register');
const registrarPersonal = require('./routes/registrarPersonal');
//const agregarPacienteRoutes = require('./routes/agregarPaciente');
const especializacionesRoutes = require('./routes/especializaciones');
const obtenerPacienteRoutes = require('./routes/obtenerPaciente');
const obtenerPersonal = require('./routes/obtenerPersonal');
const medicosInactivos = require('./routes/medicosInactivos');
const pacientesInactivos = require('./routes/pacientesInactivos');
const buscarCorreo = require('./routes/buscarCorreo');
const nombreUsuario = require('./routes/nombreUsuario');
const obtenerMedico = require('./routes/obtenerMedico');
const agregarConsultaRoutes = require('./routes/agregarConsultaM');
const consultasRoutes = require('./routes/consultasM');
const catalogosRoutes = require('./routes/catalogos');
const nombreUsuarioP = require('./routes/nombreUsuarioP');
const serviciosRouter = require('./routes/servicios');
const consultasPacientesRoutes = require('./routes/consultasP');
const obtenerDatosMedRoutes = require('./routes/obtenerDpaciente')






const app = express();
const PORT = 5500;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// --- Configuración de express-session ---
// ¡ES CRUCIAL QUE ESTO ESTÉ ANTES DE DEFINIR TUS RUTAS!
app.use(session({
    secret: process.env.SESSION_SECRET || 'mi_secreto_super_seguro', // <-- ¡AHORA USA LA VARIABLE DE ENTORNO!
    resave: false, // No guarda la sesión si no ha cambiado
    saveUninitialized: false, // No crea sesión para usuarios no autenticados
    cookie: {
        secure: false, // Pon 'true' si usas HTTPS en producción (muy recomendado)
        maxAge: 1000 * 60 * 60 * 24 // 1 día de duración de la cookie de sesión
    }
}));

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '123456',
    server: process.env.DB_SERVER || 'ACER_Core_i7',
    database: process.env.DB_DATABASE || 'Cipro',
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};

// Función para iniciar la conexión global

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/Inicio'))); 


app.use('/', passwordResetRoutes);
app.use('/api/salas', salasRoutes);
app.use('/api/serviciosA', serviciosARouter);
app.use('/api/reportes', reportesRoutes);
app.use('/api/agenda', agendaRoutes); 
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', uploadRouter);
app.use('/api', imagenesRouter);
app.use('/api/servicios', serviciosRouter);
app.use('/api/pacientes/by-idusuario', obtenerPacienteByIdUsuarioRouter);
app.use('/api/medicos', obtenerMedicosRouter);
app.use('/api/recepcionistas', obtenerRecepcionistasRouter);
app.use('/api/agendar-cita', agendarCitaRouter);

app.use('/login', loginRoutes);
app.use('/register', registerRoutes);
app.use('/registrar-personal', registrarPersonal);
//app.use('/agregarPaciente', agregarPacienteRoutes);
app.use('/especializaciones', especializacionesRoutes);
app.use('/pacientes', obtenerPacienteRoutes);
app.use('/medicos', obtenerPersonal);
app.use('/medicos-inactivos', medicosInactivos);
app.use('/pacientes-inactivos', pacientesInactivos);
app.use('/buscar-correo', buscarCorreo);
app.use('/nombre-usuario', nombreUsuario);
app.use('/obtener-medico', obtenerMedico);
app.use('/agregar-consulta', agregarConsultaRoutes);
app.use('/consultas', consultasRoutes);
app.use('/catalogos', catalogosRoutes);
app.use('/nombre-usuario-p', nombreUsuarioP);
app.use('/consultas-pacientes', consultasPacientesRoutes);
app.use('/obtener-paciente', obtenerDatosMedRoutes);



// Ruta raíz que redirige a index.html
app.get('/', (req, res) => {
  res.redirect('/Clinica.html');
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

