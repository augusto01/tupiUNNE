-- 1. Tabla de Dependencias / Unidades Académicas de la UNNE
CREATE TABLE IF NOT EXISTS dependencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    direccion VARCHAR(255),
    cel VARCHAR(50),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Roles / Tipos de Usuario
CREATE TABLE IF NOT EXISTS tipos_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- 3. Tabla de Permisos Atómicos
CREATE TABLE IF NOT EXISTS permisos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
);

-- 4. Tabla de Perfiles (Une Roles con Permisos)
CREATE TABLE IF NOT EXISTS tipo_usuario_permiso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_usuario_id INT NOT NULL,
    permiso_id INT NOT NULL,
    
    FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE,
    UNIQUE KEY u_rol_permiso (tipo_usuario_id, permiso_id)
);

-- 5. Tabla Principal de Usuarios (Con FK a tipo_usuario y la NUEVA FK a dependencia al final)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    celular VARCHAR(30),
    tipo_usuario_id INT NOT NULL, 
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) DEFAULT 1,
    dependencia_id INT NOT NULL, -- <-- NUEVA FK: Una dependencia tiene muchos usuarios
    
    FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuario(id),
    FOREIGN KEY (dependencia_id) REFERENCES dependencias(id)
);

--- ==========================================================================
--- LOTE DE DATOS COMPLETO DE LA UNNE (DEPENDENCIAS)
--- ==========================================================================

INSERT INTO dependencias (nombre, descripcion, direccion, cel) VALUES 
('Rectorado UNNE', 'Sede central administrativa de la Universidad', '25 de Mayo 868, Corrientes', '3794424455'),
('Facultad de Ciencias Exactas y Naturales y Agrimensura (FACENA)', 'Unidad Académica de Ciencias Exactas', 'Av. Libertad 5460, Corrientes', '3794473931'),
('Facultad de Ingeniería (FIUNNE)', 'Unidad Académica de Ingeniería', 'Av. Las Heras 727, Resistencia', '3624420076'),
('Facultad de Medicina', 'Unidad Académica de Ciencias de la Salud', 'Moreno 1240, Corrientes', '3794423155'),
('Facultad de Derecho y Ciencias Políticas y Sociales', 'Unidad Académica de Ciencias Jurídicas', 'Av. Libertad 5470, Corrientes', '3794473940'),
('Facultad de Ciencias Económicas', 'Unidad Académica de Ciencias Económicas', 'Av. Las Heras 727, Resistencia', '3624426691'),
('Facultad de Humanidades', 'Unidad Académica de Ciencias Humanas', 'Av. Las Heras 727, Resistencia', '3624446958'),
('Facultad de Arquitectura y Urbanismo (FAU)', 'Unidad Académica de Diseño y Arquitectura', 'Av. Las Heras 727, Resistencia', '3624420081'),
('Facultad de Ciencias Agrarias (FCA)', 'Unidad Académica de Ciencias Agronómicas', 'Sgto. Cabral 2131, Corrientes', '3794427589'),
('Facultad de Ciencias Veterinarias (FCV)', 'Unidad Académica de Ciencias Veterinarias', 'Sgto. Cabral 2130, Corrientes', '3794425753'),
('Facultad de Odontología', 'Unidad Académica de Odontología', 'Av. Libertad 5450, Corrientes', '3794457950'),
('Facultad de Artes, Diseño y Ciencias de la Cultura (FADYCC)', 'Unidad Académica de Cultura y Artes', 'Sgto. Cabral 2001, Resistencia', '3624452822'),
('Instituto de Ciencias Criminalísticas y Criminología', 'Instituto de formación en Criminalística', 'Catamarca 375, Corrientes', '3794422490');

--- ==========================================================================
--- CONFIGURACIÓN INICIAL DE ROLES Y PERMISOS
--- ==========================================================================

INSERT INTO tipos_usuario (nombre, descripcion) VALUES 
('Superusuario', 'Acceso total global a todo el ecosistema de TUPI'),
('Administrador', 'Gestión total de planes de compra dentro de su unidad académica'),
('Operador', 'Carga de correlatos y solicitudes básicas');

INSERT INTO permisos (nombre, slug, descripcion) VALUES 
('Panel Principal', 'panel', 'Visualización de métricas generales'),
('Gestión de Usuarios', 'usuarios', 'Creación y modificación de personal'),
('Planes de Compras', 'compras', 'Gestión de solicitudes de adquisición'),
('Gestión de Correlatos', 'correlatos', 'Vinculación de ítems y matrices');

-- Permisos iniciales
INSERT INTO tipo_usuario_permiso (tipo_usuario_id, permiso_id) VALUES 
(1, 1), (1, 2), (1, 3), (1, 4), -- Super
(2, 1), (2, 3), (2, 4),         -- Admin
(3, 1), (3, 4);                 -- Operador

-- Crear tu usuario (Augusto Almirón) vinculado a la dependencia ID 1 (Rectorado UNNE)
INSERT INTO usuarios (username, email, password, nombre, apellido, dni, celular, tipo_usuario_id, dependencia_id) 
VALUES ('augusto', 'augusto@unne.edu.ar', '$2b$10$X7mEghLgZ2nB9XmS7D8W8O6f7Yv2v.5k8vGzH4pM9QeR3tK9A2y1a', 'Augusto', 'Almiron', '12345678', '3794000000', 1, 1);