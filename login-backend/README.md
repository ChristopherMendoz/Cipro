Sistema de Gestión de Clínica - CIPRO

¡Bienvenido al Sistema de Gestión de Clínica CIPRO! Esta aplicación web está diseñada para optimizar la administración de pacientes, médicos, consultas y demás operaciones dentro de una clínica, ofreciendo una experiencia de usuario mejorada y una gestión de datos más eficiente.

🚀 Novedades y Mejoras Recientes

Hemos trabajado arduamente para mejorar la estabilidad, seguridad y experiencia de usuario de CIPRO. Aquí un resumen de los cambios más significativos en esta versión:

🛠️ Mejoras Técnicas y Estructura

Estructura del Código Optimizada: Hemos realizado una reestructuración significativa para eliminar código basura y repetido. Gran parte de la lógica de frontend ahora se centraliza en archivos HTML únicos que se mandan a llamar, facilitando el mantenimiento y mejorando la consistencia.

Gestión de Sesiones (Médicos):
Implementación de express-session: Hemos integrado la librería express-session para un manejo robusto de las sesiones de usuario. Esto permite que los médicos que inician sesión vean únicamente las consultas asociadas a su perfil, garantizando la privacidad y relevancia de la información.

Uso de Variables de Entorno con dotenv: Para una mayor seguridad y flexibilidad, hemos adoptado dotenv. Ahora, configuraciones sensibles como el secreto de la sesión se gestionan a través de variables de entorno, lo que previene que credenciales importantes queden expuestas en el código fuente del repositorio.

Funcionalidades del Perfil Médico Mejoradas:

Filtrado de Consultas por Médico Logueado: Ahora, al iniciar sesión como médico, el sistema muestra automáticamente solo las consultas asignadas a ese médico específico, mejorando la eficiencia y relevancia de la información.

Añadir Nueva Consulta: Se ha implementado la funcionalidad para que los médicos puedan registrar nuevas consultas directamente desde su sesión.

Visualización de Datos Personales del Médico: Los médicos ahora pueden acceder y ver sus propios datos personales directamente en su sesión, ofreciendo una experiencia más completa y personalizada.

Nombre de Usuario en Sesión: El sistema ahora muestra el nombre del usuario logueado en la interfaz, mejorando la personalización.

Funcionalidades del Perfil Paciente Mejoradas:

Ahora el paciente puede observar su historial de consultas y sus datos personales 

✨ Experiencia de Usuario y Contenido

Inicio de Sesión y Registro Mejorados: La interfaz y la funcionalidad de los módulos de inicio de sesión y registro han sido completamente renovadas para ofrecer un proceso más intuitivo y seguro.

Navegación y Diseño Modernos:
Navbar y Footer Optimizados: Hemos añadido y mejorado los componentes de navegación superior (Navbar) y pie de página (Footer), proporcionando una experiencia de navegación consistente y estéticamente agradable en toda la aplicación.

Secciones Nuevas: Se han incorporado las secciones nosotros.html y servicios.html, ofreciendo más información relevante a los usuarios.

Estilos y Animaciones:
Animación en Hub: Se ha añadido una animación interactiva en el 'hub' para una experiencia más dinámica.
Estilo de Admin Mejorado: La interfaz del panel de administración ha recibido una actualización de estilo para una mejor usabilidad y presentación.

Limpieza de Archivos: Se han eliminado los archivos registroo.html y registroStyle.css, simplificando la estructura del proyecto y consolidando estilos.

🚀 Cómo Empezar
Para poner en marcha el Sistema de Gestión de Clínica en tu entorno local, sigue estos pasos:

1. Clona el repositorio:

en la terminal de visual code 
git clone <URL_DEL_REPOSITORIO>
cd nombre-del-repositorio

2.Instala las dependencias:

(SI LO CLONASTE O DESCARGASTE DEL REPOSITORIO TE RECOMIENDO ELIMINAR LA CARPETA node_modules YA QUE INSTALE UNAS LIBRERIAS Y NO ESTAN EN LA PRIMERA VERSION CUANDO LA SUBI POR PRIMERA VEZ ASI QUE ELIMINALA  Y HAZ LO SIGUIENTE)

en la terminal de visual code 

npm install

3.Configura tus variables de entorno:

Crea un archivo .env en la raíz de tu proyecto.

Copia el contenido de .env.example (que está en el repositorio) a tu nuevo archivo .env.
Completa los valores necesarios, especialmente el SESSION_SECRET (solicita este valor al administrador del repositorio si eres colaborador) y las credenciales de tu base de datos SQL Server.

Configuración de la Base de Datos (Microsoft SQL Server):

4.Asegúrate de que tu instancia de SQL Server esté corriendo y accesible.

Verifica que el puerto 1433 esté desbloqueado en tu Configuration Manager y TCP/IP esté habilitado.
Añade una regla de entrada en tu Firewall de Windows para liberar el puerto 1433.
Puedes verificar la conectividad con tu BD haciendo un ping desde cmd (aunque el ping no es una prueba directa de conectividad SQL, es un paso básico de red).

5.Inicia el servidor:

en la terminal de visual code 

node app.js

6.Accede a la aplicación:

Abre tu navegador y visita http://localhost:5500 (o el puerto que hayas configurado). La ruta raíz te redirigirá a Clinica.html.

notas de version 🤓☝️
-inicio mejorado
-añadido de footer y navbar mejorados
-seccion contactanos añadido
-animacion en hub añadida
-estilo en admin mejorado
-Medico y Paciente adaptado a la nueva BD
-FALTA NADA MAS LA AGENDA Y VIZUALIZAR RESULTADOS EN PACIENTE
-Y AGENDA Y SUBIR RESULTADO EN MEDICO(NO SE QUE PENSAS SOBRE QUE EL ADMIN PUEDA SUBIR LOS RESULTADOS, ESTA UN PCO DIFICIL PERO NO SE VOS)