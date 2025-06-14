//usar node app.js para iniciar.. 
//revisar el configuration manager y desbloquear el puerto 1433 y el TCP/IP
//revisar en el firewall y liberar el puerto 1433 agregando una accion mas
//revisar si la bd esta dando ping con un ping en cmd 

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
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






const app = express();
const PORT = 5500;


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use(express.static(path.join(__dirname, 'public')));


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


// Ruta raíz que redirige a index.html
app.get('/', (req, res) => {
  res.redirect('/Clinica.html');
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

