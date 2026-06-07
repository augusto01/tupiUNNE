-- 1. Tabla de Facultades / Unidades Académicas
CREATE TABLE IF NOT EXISTS facultades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(10) NOT NULL UNIQUE, -- Ej: 'FACENA', 'FIUNNE', 'RECTORADO'
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Roles / Tipos de Usuario
CREATE TABLE IF NOT EXISTS tipos_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'Superusuario', 'Administrador', 'Operador'
    descripcion VARCHAR(255)
);

-- 3. Tabla Principal de Usuarios (Datos Core)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    celular VARCHAR(30),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla Intermedia: Vincula Usuario + Facultad + Rol (Permisos Dinámicos)
CREATE TABLE IF NOT EXISTS usuario_facultad_rol (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    facultad_id INT NOT NULL,
    tipo_usuario_id INT NOT NULL,
    asignado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Claves foráneas para mantener la integridad de los datos
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (facultad_id) REFERENCES facultades(id) ON DELETE CASCADE,
    FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuario(id) ON DELETE CASCADE,
    
    -- Evita que se repita exactamente la misma combinación de usuario-facultad-rol
    UNIQUE KEY u_fac_rol (usuario_id, facultad_id, tipo_usuario_id)
);


--lote de datos 
-- Insertar Facultades de ejemplo
INSERT INTO facultades (nombre, codigo) VALUES 
('Rectorado UNNE', 'RECTORADO'),
('Facultad de Ciencias Exactas y Naturales y Agrimensura', 'FACENA'),
('Facultad de Ingeniería', 'FIUNNE');

-- Insertar Roles del sistema
INSERT INTO tipos_usuario (nombre, descripcion) VALUES 
('Superusuario', 'Acceso total global a todo el ecosistema de TUPI'),
('Administrador', 'Gestión total de planes de compra dentro de su unidad académica'),
('Operador', 'Carga de correlatos y solicitudes básicas');

-- Insertar Usuario (Contraseña encriptada: 'admin123')
INSERT INTO usuarios (username, email, password, nombre, dni, celular) 
VALUES ('augusto', 'augusto@unne.edu.ar', '$2b$10$X7mEghLgZ2nB9XmS7D8W8O6f7Yv2v.5k8vGzH4pM9QeR3tK9A2y1a', 'Augusto Almiron', '12345678', '3794000000');

-- ASIGNAR PERMISOS MÚLTIPLES A AUGUSTO (Aquí está la magia de la consulta):
-- Augusto (ID 1) es Superusuario (ID 1) en Rectorado (ID 1)
-- Augusto (ID 1) es Administrador (ID 2) en FACENA (ID 2)
INSERT INTO usuario_facultad_rol (usuario_id, facultad_id, tipo_usuario_id) VALUES 
(1, 1, 1), -- Superusuario en Rectorado
(1, 2, 2); -- Administrador en FACENA