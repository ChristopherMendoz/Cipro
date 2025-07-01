CREATE DATABASE Cipro
GO

USE Cipro;
GO


CREATE TABLE Roles (
    idRol INT IDENTITY(1,1) PRIMARY KEY,
    nombreRol VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Privilegios (
    idPrivilegio INT IDENTITY(1,1) PRIMARY KEY,
    descripcion VARCHAR(100) NOT NULL,
    idRol INT NOT NULL,
    FOREIGN KEY (idRol) REFERENCES Roles(idRol)
);


CREATE TABLE UsuarioSistema (
    idUsuario VARCHAR(10) PRIMARY KEY, -- e.g., PAC001, MED001
    nombreUsuario VARCHAR(50) NOT NULL UNIQUE,
    contrase�a VARCHAR(255) NOT NULL,
    correo VARCHAR(250) NOT NULL UNIQUE,
    idRol INT NOT NULL,
	Estado BIT DEFAULT 1,
    FOREIGN KEY (idRol) REFERENCES Roles(idRol)
);


CREATE TABLE Especializacion (
    idEspecializacion INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Sala (
    idSala INT IDENTITY(1,1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL
);

CREATE TABLE Paciente (
    idPaciente INT IDENTITY(1,1) PRIMARY KEY,
    primerNombre VARCHAR(50) NOT NULL,
    segundoNombre VARCHAR(50),
    primerApellido VARCHAR(50) NOT NULL,
    segundoApellido VARCHAR(50),
    fechaNacimiento DATE NOT NULL,
    sexo VARCHAR(20) NOT NULL,
    direccion VARCHAR(200) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    tipoSangre VARCHAR(10),
    idUsuario VARCHAR(10) NOT NULL UNIQUE,
	cedula VARCHAR(14) NULL,
	fechaRegistro DATETIME,
    FOREIGN KEY (idUsuario) REFERENCES UsuarioSistema(idUsuario)
);



CREATE TABLE Medico (
    idMedico INT IDENTITY(1,1) PRIMARY KEY,
    nombreCompleto VARCHAR(100) NOT NULL,
    cedulaProfesional VARCHAR(50) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    idEspecializacion INT NOT NULL,
    idUsuario VARCHAR(10) NOT NULL UNIQUE,
    FOREIGN KEY (idEspecializacion) REFERENCES Especializacion(idEspecializacion),
    FOREIGN KEY (idUsuario) REFERENCES UsuarioSistema(idUsuario)
);

CREATE TABLE Recepcionista (
    idRecepcionista INT IDENTITY(1,1) PRIMARY KEY,
    nombreCompleto VARCHAR(100) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    idUsuario VARCHAR(10) NOT NULL UNIQUE,
    FOREIGN KEY (idUsuario) REFERENCES UsuarioSistema(idUsuario)
);



CREATE TABLE Consulta (
    idConsulta INT IDENTITY(1,1) PRIMARY KEY,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('pendiente', 'realizada', 'cancelada')),
    tipoEstudio VARCHAR(50) NOT NULL,
    observaciones TEXT,
    idPaciente INT NOT NULL,
    idMedico INT,
    idSala INT NOT NULL,
    idRecepcionista INT NOT NULL,
    FOREIGN KEY (idPaciente) REFERENCES Paciente(idPaciente),
    FOREIGN KEY (idMedico) REFERENCES Medico(idMedico),
    FOREIGN KEY (idSala) REFERENCES Sala(idSala),
    FOREIGN KEY (idRecepcionista) REFERENCES Recepcionista(idRecepcionista)
);



CREATE TABLE Resultado (
    idResultado INT IDENTITY(1,1) PRIMARY KEY,
    fechaEntrega DATE NOT NULL,
    urlArchivo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    idConsulta INT NOT NULL,
    idRecepcionista INT NOT NULL,
    FOREIGN KEY (idConsulta) REFERENCES Consulta(idConsulta),
    FOREIGN KEY (idRecepcionista) REFERENCES Recepcionista(idRecepcionista)
);

CREATE TABLE AgendaMedico (
    idAgendaMedico INT IDENTITY(1,1) PRIMARY KEY,
    fecha DATE NOT NULL,
    horaInicio TIME NOT NULL,
    horaFin TIME NOT NULL,
    idMedico INT NOT NULL,
    idSala INT NOT NULL,
    idRecepcionista INT NOT NULL,
    FOREIGN KEY (idMedico) REFERENCES Medico(idMedico),
    FOREIGN KEY (idSala) REFERENCES Sala(idSala),
    FOREIGN KEY (idRecepcionista) REFERENCES Recepcionista(idRecepcionista)
);


--CAMBIOS 19/06/2025------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE Servicios (
    idServicio INT IDENTITY(1,1) PRIMARY KEY,
    nombreServicio VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    preparacionRequerida TEXT -- Ej: "Ayuno de 8 horas"
);
GO
CREATE TABLE ImagenesConsulta (
    idImagen INT IDENTITY(1,1) PRIMARY KEY,
    idConsulta INT NOT NULL,
    urlImagen VARCHAR(255) NOT NULL,
    descripcion VARCHAR(500),
    fechaSubida DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (idConsulta) REFERENCES Consulta(idConsulta)
);
GO
-- Primero, elimina la columna antigua
ALTER TABLE Consulta DROP COLUMN tipoEstudio;
GO

-- Luego, a�ade la nueva columna con la relaci�n
ALTER TABLE Consulta ADD idServicio INT NOT NULL;
GO

-- Finalmente, a�ade la llave for�nea
ALTER TABLE Consulta ADD CONSTRAINT FK_Consulta_Servicios FOREIGN KEY (idServicio) REFERENCES Servicios(idServicio);
GO

-- ========= ULTRASONIDOS =========
INSERT INTO Servicios (nombreServicio, descripcion, preparacionRequerida) VALUES 
('Ultrasonido Abdominal Completo', 'Evaluaci�n de �rganos abdominales como h�gado, ves�cula biliar, p�ncreas, bazo y ri�ones.', 'Ayuno de 6 a 8 horas antes del estudio.'),
('Ultrasonido P�lvico', 'Evaluaci�n de �tero, ovarios y vejiga en mujeres, o pr�stata y ves�culas seminales en hombres.', 'Tomar 1 litro de agua 1 hora antes del estudio y no orinar (vejiga llena).'),
('Ultrasonido Doppler Venoso de Miembros Inferiores', 'Estudio del flujo sangu�neo en las venas de las piernas para detectar trombosis u otras anomal�as.', 'No requiere preparaci�n espec�fica.');
GO

-- ========= TOMOGRAF�AS (TAC) =========
INSERT INTO Servicios (nombreServicio, descripcion, preparacionRequerida) VALUES 
('Tomograf�a Axial Computarizada (TAC) de Cr�neo Simple', 'Im�genes detalladas del cerebro y el cr�neo para detectar lesiones, hemorragias o fracturas.', 'Retirar objetos met�licos del �rea de la cabeza y cuello.'),
('Tomograf�a Axial Computarizada (TAC) de Abdomen con Contraste', 'Estudio detallado de los �rganos abdominales utilizando un medio de contraste para mejorar la visibilidad.', 'Ayuno de 6 horas. Se requiere an�lisis de creatinina reciente. Beber contraste oral si es indicado.');
GO

-- ========= RADIOGRAF�AS (RAYOS X) =========
INSERT INTO Servicios (nombreServicio, descripcion, preparacionRequerida) VALUES 
('Radiograf�a de T�rax (PA y Lateral)', 'Estudio de dos proyecciones para evaluar pulmones, coraz�n y huesos de la caja tor�cica.', 'Retirar objetos met�licos del torso.'),
('Radiograf�a de Columna Lumbar (AP y Lateral)', 'Im�genes de la parte baja de la espalda para evaluar v�rtebras, discos y detectar causas de dolor.', 'No requiere preparaci�n espec�fica.');
GO

-- ========= OTROS PROCEDIMIENTOS Y CONSULTAS =========
INSERT INTO Servicios (nombreServicio, descripcion, preparacionRequerida) VALUES 
('Densitometr�a �sea', 'Mide la densidad mineral de los huesos para diagnosticar osteoporosis.', 'No tomar suplementos de calcio 24 horas antes del estudio.'),
('Consulta de Valoraci�n con Especialista', 'Consulta con un m�dico radi�logo para la interpretaci�n de estudios externos o planificaci�n de procedimientos.', NULL),
('Mamograf�a Bilateral', 'Estudio de rayos X de las mamas para la detecci�n temprana de c�ncer de mama.', 'No usar desodorante, talco o loci�n debajo de los brazos o en las mamas el d�a del examen.');
GO
------------------------------------------------------------------------------------------------------------------------------------------------------------

----CAMBIOS 24/06/2025---------------------------------------------------------------------------------------------------------------------------------------
ALTER TABLE Paciente
ADD cedula VARCHAR(14) NULL;

--Y ELIMINACION DE AGENDAPACIENTE

ALTER TABLE Paciente ALTER COLUMN cedula VARCHAR(14) NOT NULL;
GO
ALTER TABLE Paciente ADD CONSTRAINT UQ_Paciente_Cedula UNIQUE (cedula);
GO
UPDATE Paciente
SET cedula = NULL
WHERE idPaciente = 1;

-----------------------------------------------------------------------------------------------------------------------------------------------------------
-------------CAMBIO 25/06/2025----------------------------------------------------------------------------------------------------------------------------------
ALTER TABLE Paciente 
ADD fechaRegistro DATETIME DEFAULT GETDATE();


-- Creamos un rol para las acciones que puede hacer un paciente desde la web
CREATE ROLE rol_paciente_web;
GO

-- Creamos un rol para las acciones que puede hacer un m�dico desde la web
CREATE ROLE rol_medico_web;
GO

-- Creamos un rol para las acciones que puede hacer un administrador desde la web
CREATE ROLE rol_admin_web;
GO

-- Otorgar permisos al rol de PACIENTE
-- Un paciente puede ver sus propias consultas y agendar nuevas.
GRANT SELECT ON dbo.Consulta TO rol_paciente_web;
GRANT SELECT ON dbo.Servicios TO rol_paciente_web;
GRANT SELECT ON dbo.Medico TO rol_paciente_web;
GRANT INSERT ON dbo.Consulta TO rol_paciente_web; -- Permiso para crear nuevas citas

-- Otorgar permisos al rol de M�DICO
-- Un m�dico puede ver pacientes, sus consultas y las im�genes.
GRANT SELECT ON dbo.Paciente TO rol_medico_web;
GRANT SELECT ON dbo.Consulta TO rol_medico_web;
GRANT SELECT ON dbo.ImagenesConsulta TO rol_medico_web;
GRANT UPDATE ON dbo.Consulta TO rol_medico_web; -- Permiso para actualizar el estado de una consulta
GRANT INSERT, DELETE ON dbo.ImagenesConsulta TO rol_medico_web; -- Para gestionar im�genes

-- Otorgar permisos al rol de ADMINISTRADOR
-- Un admin puede hacer casi todo (SELECT, INSERT, UPDATE, DELETE) en estas tablas.
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Paciente TO rol_admin_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Medico TO rol_admin_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Consulta TO rol_admin_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Sala TO rol_admin_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Servicios TO rol_admin_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.UsuarioSistema TO rol_admin_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.ImagenesConsulta TO rol_admin_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Especializacion TO rol_admin_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.AgendaMedico TO rol_admin_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Resultado TO rol_admin_web;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Recepcionista TO rol_admin_web;


-- 1. Creamos un Login a nivel de SQL Server
CREATE LOGIN cipro_app_user WITH PASSWORD = '123456789';
GO

-- 2. Creamos un Usuario en la base de datos Cipro a partir de ese Login
USE Cipro;
GO
CREATE USER cipro_app_user FOR LOGIN cipro_app_user;
GO

-- 3. Le damos a este usuario TODOS los roles que creamos
ALTER ROLE rol_paciente_web ADD MEMBER cipro_app_user;
ALTER ROLE rol_medico_web ADD MEMBER cipro_app_user;
ALTER ROLE rol_admin_web ADD MEMBER cipro_app_user;
GO

--Cuando un nuevo usuario se registra en la web, en mi tabla UsuarioSistema le asigno un idRol (por ejemplo, idRol = 1 para un Paciente).
--A partir de ese momento, mi c�digo de Node.js se encarga de validar que todas las acciones que intente hacer ese usuario correspondan a su idRol. 
--Por ejemplo, si un usuario con idRol = 1 intenta acceder a una ruta de m�dico, mi aplicaci�n lo bloquea antes de que llegue a ejecutar cualquier consulta en la base de datos.
--De esta forma, combino la seguridad a nivel de aplicaci�n (validando el idRol) con la seguridad a nivel de base de datos (usando un usuario con privilegios definidos y no el super-usuario sa)."

IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'cipro_app_user')
BEGIN
    CREATE LOGIN cipro_app_user WITH PASSWORD = 'UnaContrase�aMuyFuerte123!';
    PRINT 'Login cipro_app_user CREADO a nivel de servidor.';
END
ELSE
BEGIN
    PRINT 'Login cipro_app_user ya existe a nivel de servidor.';
END
GO

-- Parte 2: Reparar el usuario "hu�rfano" DENTRO de la base de datos.
USE Cipro; -- Nos aseguramos de estar en el contexto de tu base de datos correcta.
GO

-- Esta es la l�nea m�gica que vuelve a conectar el usuario de la base de datos
-- con el login del servidor que acabamos de asegurar que exista.
ALTER USER cipro_app_user WITH LOGIN = cipro_app_user;
GO

-----------------------------------------------------------------------------------------------------------------------------------------------------------
UPDATE Consulta
SET hora = CAST('19:30:00' AS TIME)
WHERE idConsulta = 3;


DELETE FROM Consulta 
WHERE idServicio = 8;

SELECT COUNT(*) FROM sys.dm_exec_connections;


INSERT INTO Roles (idRol, nombreRol)
VALUES (1, 'Cliente'), (2, 'Personal'), (3, 'Admin');
GO
SET IDENTITY_INSERT Especializacion On

INSERT INTO UsuarioSistema (idUsuario, nombreUsuario, contrase�a, correo, idRol) VALUES 
  ('CLI001', 'cliente01', '1234', 'cliente@cipro.com', 1),
  ('PER001', 'personal01', 'abcd', 'personal@cipro.com', 2),
  ('ADM001', 'admin01', 'admin123', 'admin@cipro.com', 3);

INSERT INTO Paciente (
  primerNombre, segundoNombre, primerApellido, segundoApellido,
  fechaNacimiento, sexo, direccion, telefono, tipoSangre, idUsuario
) VALUES (
  'Carlos', 'Enrique', 'Mart�nez', 'Rodr�guez', '1990-05-12', 'Masculino',
  'Avenida Central, Juigalpa', '8888-8888', 'A+', 'CLI001'
);

INSERT INTO Recepcionista (
  nombreCompleto, telefono, idUsuario
) VALUES (
  'Sof�a Rivera', '7777-6666', 'ADM001'
);

insert into Especializacion (nombre) values ('MedicoGeneral')

INSERT INTO Medico (
  nombreCompleto, cedulaProfesional, telefono, idEspecializacion, idUsuario
) VALUES (
  'Dr. Mario L�pez', 'MED-999888', '7878-9999', 1, 'PER001'
);



CREATE PROCEDURE SP_LoginUsuario
@Username NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT idUsuario, nombreUsuario, contrase�a, correo, idRol
    FROM UsuarioSistema
    WHERE nombreUsuario = @Username
      AND Estado = 1;
END;
GO
