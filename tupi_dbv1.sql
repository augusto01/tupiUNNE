-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3307
-- Tiempo de generación: 20-10-2026 a las 02:48:35
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `tupi_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bienes`
--

CREATE TABLE `bienes` (
  `id` int(11) NOT NULL,
  `descripcion` text NOT NULL,
  `rubro` varchar(150) NOT NULL,
  `inciso` varchar(150) NOT NULL,
  `partida_principal` varchar(150) NOT NULL,
  `precio_unitario` decimal(12,2) DEFAULT 0.00,
  `observacion` text DEFAULT NULL,
  `partida_parcial` varchar(150) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `bienes`
--

INSERT INTO `bienes` (`id`, `descripcion`, `rubro`, `inciso`, `partida_principal`, `precio_unitario`, `observacion`, `partida_parcial`, `fecha_creacion`) VALUES
(1, 'Alambre 17/15 Fortin x Rollo', 'AGRIC,GANADERIA,CAZA,SILVICULT', '2 - BIENES DE CONSUMO', '2.7 - PRODUCTOS METALICOS', 2403.03, 'Bien de alta demanda - Verificar disponibilidad con depósito central', '2.7.1 - PRODUCTOS FERROSOS', '2026-10-19 03:41:42'),
(2, 'Alambre N12 Grampa Galv. kg', 'AGRIC,GANADERIA,CAZA,SILVICULT', '2 - BIENES DE CONSUMO', '2.7 - PRODUCTOS METALICOS', 14408.39, 'Sujeto a ajuste de catálogo según normativa de compras vigentes', '2.7.1 - PRODUCTOS FERROSOS', '2026-10-19 03:41:42'),
(3, 'Bastidor 2x3x1.00 mts', 'AGRIC,GANADERIA,CAZA,SILVICULT', '2 - BIENES DE CONSUMO', '2.9 - OTROS BIENES DE CONSUMO', 14832.83, 'Especificación estándar UNNE - Requiere certificación de calidad', '2.9.3 - UTILES Y MATERIALES ELECTRICOS', '2026-10-19 03:41:42'),
(4, 'Poste IT Lonjeado A/B 2.20 m', 'AGRIC,GANADERIA,CAZA,SILVICULT', '2 - BIENES DE CONSUMO', '2.1 - PRODUCTOS ALIMENTICIOS AGROP. Y FOREST.', 29939.00, 'Bien de alta demanda - Verificar disponibilidad con depósito central', '2.1.5 - MADERA CORCHO Y SUS MANUFACTURAS', '2026-10-19 03:41:42'),
(5, 'Tranquera Reforzada Urunday 1.2mts 1x5 1,5mt', 'AGRIC,GANADERIA,CAZA,SILVICULT', '2 - BIENES DE CONSUMO', '2.1 - PRODUCTOS ALIMENTICIOS AGROP. Y FOREST.', 6196.51, 'Sujeto a ajuste de catálogo según normativa de compras vigentes', '2.1.5 - MADERA CORCHO Y SUS MANUFACTURAS', '2026-10-19 03:41:42'),
(6, '24 KILOS DE CAFE MOLIDO TORRADO (PRESENTACIÓN POR 500 GRAMOS)', 'ALIMENTOS', '2 - BIENES DE CONSUMO', '2.1 - PRODUCTOS ALIMENTICIOS AGROP. Y FOREST.', 38165.55, 'Especificación estándar UNNE - Requiere certificación de calidad', '2.1.1 - ALIMENTOS PARA PERSONAS', '2026-10-19 03:41:42'),
(7, '250 KILOS DE AVENA INSTANTANEA', 'ALIMENTOS', '2 - BIENES DE CONSUMO', '2.1 - PRODUCTOS ALIMENTICIOS AGROP. Y FOREST.', 24238.22, 'Bien de alta demanda - Verificar disponibilidad con depósito central', '2.1.1 - ALIMENTOS PARA PERSONAS', '2026-10-19 03:41:42'),
(8, '2,900 KILOS DE FIDEOS TIRABUZÓN (PRESENTACIÓN POR 500 G.)', 'ALIMENTOS', '2 - BIENES DE CONSUMO', '2.1 - PRODUCTOS ALIMENTICIOS AGROP. Y FOREST.', 5694.45, 'Sujeto a ajuste de catálogo según normativa de compras vigentes', '2.1.1 - ALIMENTOS PARA PERSONAS', '2026-10-19 03:41:42'),
(9, '3200 KILOS DE ARROZ (PRESENTACIÓN POR 1 KILO)', 'ALIMENTOS', '2 - BIENES DE CONSUMO', '2.1 - PRODUCTOS ALIMENTICIOS AGROP. Y FOREST.', 3757.60, 'Especificación estándar UNNE - Requiere certificación de calidad', '2.1.1 - ALIMENTOS PARA PERSONAS', '2026-10-19 03:41:42'),
(10, 'ACEITE DE GIRASOL. ENVASE POR 900 CC.', 'ALIMENTOS', '2 - BIENES DE CONSUMO', '2.1 - PRODUCTOS ALIMENTICIOS AGROP. Y FOREST.', 49704.66, 'Bien de alta demanda - Verificar disponibilidad con depósito central', '2.1.1 - ALIMENTOS PARA PERSONAS', '2026-10-19 03:41:42'),
(11, 'BATIDOR ALAMBRE. ACERO INOXIDABLE, MANGO DE METAL 50 CMS. DE LARGO', 'BAZAR Y MENAJE', '2 - BIENES DE CONSUMO', '2.9 - OTROS BIENES DE CONSUMO', 40250.51, 'Sujeto a ajuste de catálogo según normativa de compras vigentes', '2.9.4 - UTENSILLOS DE COCINA Y COMEDOR', '2026-10-19 03:41:42'),
(12, 'OLLA GASTRONÓMICA DE ALUMINIO. 100 LITROS.', 'BAZAR Y MENAJE', '2 - BIENES DE CONSUMO', '2.9 - OTROS BIENES DE CONSUMO', 2138.55, 'Especificación estándar UNNE - Requiere certificación de calidad', '2.9.4 - UTENSILLOS DE COCINA Y COMEDOR', '2026-10-19 03:41:42'),
(13, 'Camara Digital Mirrorless Full Frame ILCE-7M3 A7III (Solo body)', 'CINE/TELVIS./RADIO/FOTOGRAFIA', '4 - BIENES DE USO', '4.3 - MAQUINARIA Y EQUIPO', 35941.21, 'Bien de alta demanda - Verificar disponibilidad con depósito central', '4.3.5 - EQUIPO EDUCACIONAL Y RECREATIVO', '2026-10-19 03:41:42'),
(14, 'GoPro HERO13 Black', 'CINE/TELVIS./RADIO/FOTOGRAFIA', '4 - BIENES DE USO', '4.3 - MAQUINARIA Y EQUIPO', 25290.43, 'Sujeto a ajuste de catálogo según normativa de compras vigentes', '4.3.6 - EQUIPO PARA COMPUTACION', '2026-10-19 03:41:42'),
(15, 'CEMENTO PORTLAND X 25 KG TIPO HOLCIM', 'CONSTRUCCION', '2 - BIENES DE CONSUMO', '2.6 - PRODUCTOS DE MINERALES NO METALICOS', 17628.52, 'Especificación estándar UNNE - Requiere certificación de calidad', '2.6.5 - CEMENTO CAL Y YESO', '2026-10-19 03:41:42'),
(16, 'Interruptor termomagnético 4x20A', 'ELECTRICIDAD Y TELEFONIA', '2 - BIENES DE CONSUMO', '2.9 - OTROS BIENES DE CONSUMO', 11271.29, 'Bien de alta demanda - Verificar disponibilidad con depósito central', '2.9.3 - UTILES Y MATERIALES ELECTRICOS', '2026-10-19 03:41:42'),
(17, 'Panel de 60x60 40W blanco frío, aluminio', 'ELECTRICIDAD Y TELEFONIA', '2 - BIENES DE CONSUMO', '2.9 - OTROS BIENES DE CONSUMO', 2470.92, 'Sujeto a ajuste de catálogo según normativa de compras vigentes', '2.9.3 - UTILES Y MATERIALES ELECTRICOS', '2026-10-19 03:41:42'),
(18, 'DESINFECTANTE EN AEROSOL 360 CC AROMA ORIGINAL TIPO LYSOFORM', 'ELEMENTOS DE LIMPIEZA', '2 - BIENES DE CONSUMO', '2.5 - PRODUCTOS QUIMICOS COMBUSTIBLES Y LUBRI.', 26540.72, 'Especificación estándar UNNE - Requiere certificación de calidad', '2.5.4 - INSECTICIDAS FUMIGANTES Y OTROS', '2026-10-19 03:41:42'),
(19, 'DETERGENTE TIPO (AL)5L 15% MA', 'ELEMENTOS DE LIMPIEZA', '2 - BIENES DE CONSUMO', '2.5 - PRODUCTOS QUIMICOS COMBUSTIBLES Y LUBRI.', 26290.82, 'Bien de alta demanda - Verificar disponibilidad con depósito central', '2.5.4 - INSECTICIDAS FUMIGANTES Y OTROS', '2026-10-19 03:41:42'),
(20, 'SILLAS DE ESCRITORIO ERGONOMICAS COLOR NEGRO', 'EQUIPO DE OFICINA Y MUEBLES', '4 - BIENES DE USO', '4.3 - MAQUINARIA Y EQUIPO', 1831.97, 'Sujeto a ajuste de catálogo según normativa de compras vigentes', '4.3.7 - EQUIPO DE OFICINA Y MUEBLES', '2026-10-19 03:41:42'),
(21, 'Notebook', 'EQUIPO DE OFICINA Y MUEBLES', '4 - BIENES DE USO', '4.3 - MAQUINARIA Y EQUIPO', 27287.38, 'Especificación estándar UNNE - Requiere certificación de calidad', '4.3.6 - EQUIPO PARA COMPUTACION', '2026-10-19 03:41:42'),
(22, 'Computadora de escritorio tipo oficina (CPU)', 'EQUIPOS', '4 - BIENES DE USO', '4.3 - MAQUINARIA Y EQUIPO', 31940.99, 'Bien de alta demanda - Verificar disponibilidad con depósito central', '4.3.6 - EQUIPO PARA COMPUTACION', '2026-10-19 03:41:42'),
(23, 'CPU AMD RYZEN 7 8700F AM5 65W 32MB + Teclado y Mouse', 'INFORMATICA', '4 - BIENES DE USO', '4.3 - MAQUINARIA Y EQUIPO', 27842.81, 'Sujeto a ajuste de catálogo según normativa de compras vigentes', '4.3.6 - EQUIPO PARA COMPUTACION', '2026-10-19 03:41:42'),
(24, 'Laptop HP ProBook 465 G11-AMD Ryzen 5 7535U', 'INFORMATICA', '4 - BIENES DE USO', '4.3 - MAQUINARIA Y EQUIPO', 42391.10, 'Especificación estándar UNNE - Requiere certificación de calidad', '4.3.6 - EQUIPO PARA COMPUTACION', '2026-10-19 03:41:42'),
(25, 'Resma A4 80 grs (Autor)', 'LIBRERIA, PAP. Y UTILES OFICINA', '2 - BIENES DE CONSUMO', '2.3 - PRODUCTOS DE PAPEL CARTON E IMPRESOS', 29427.07, 'Bien de alta demanda - Verificar disponibilidad con depósito central', '2.3.1 - PAPEL DE ESCRITORIO Y CARTON', '2026-10-19 03:41:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_plan_compras`
--

CREATE TABLE `configuracion_plan_compras` (
  `id` int(11) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `actualizado_por` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `habilitado` tinyint(1) DEFAULT 1,
  `mensaje` varchar(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `configuracion_plan_compras`
--

INSERT INTO `configuracion_plan_compras` (`id`, `activo`, `fecha_inicio`, `fecha_fin`, `actualizado_por`, `updated_at`, `habilitado`, `mensaje`) VALUES
(1, 1, '2026-10-01 00:00:00', '2026-11-30 23:59:59', NULL, '2026-10-19 04:31:51', 1, ''),
(2, 0, NULL, NULL, NULL, '2026-10-19 06:18:57', 1, 'Período de carga activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `dependencias`
--

CREATE TABLE `dependencias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `cel` varchar(50) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `dependencias`
--

INSERT INTO `dependencias` (`id`, `nombre`, `descripcion`, `direccion`, `cel`, `creado_en`) VALUES
(1, 'Rectorado UNNE', 'Sede central administrativa de la Universidad', '25 de Mayo 868, Corrientes', '3794424455', '2026-06-08 02:55:44'),
(2, 'Facultad de Ciencias Exactas y Naturales y Agrimensura (FACENA)', 'Unidad Académica de Ciencias Exactas', 'Av. Libertad 5460, Corrientes', '3794473931', '2026-06-08 02:55:44'),
(3, 'Facultad de Ingeniería (FIUNNE)', 'Unidad Académica de Ingeniería', 'Av. Las Heras 727, Resistencia', '3624420076', '2026-06-08 02:55:44'),
(4, 'Facultad de Medicina', 'Unidad Académica de Ciencias de la Salud', 'Moreno 1240, Corrientes', '3794423155', '2026-06-08 02:55:44'),
(5, 'Facultad de Derecho y Ciencias Políticas y Sociales', 'Unidad Académica de Ciencias Jurídicas', 'Av. Libertad 5470, Corrientes', '3794473940', '2026-06-08 02:55:44'),
(6, 'Facultad de Ciencias Económicas', 'Unidad Académica de Ciencias Económicas', 'Av. Las Heras 727, Resistencia', '3624426691', '2026-06-08 02:55:44'),
(7, 'Facultad de Humanidades', 'Unidad Académica de Ciencias Humanas', 'Av. Las Heras 727, Resistencia', '3624446958', '2026-06-08 02:55:44'),
(8, 'Facultad de Arquitectura y Urbanismo (FAU)', 'Unidad Académica de Diseño y Arquitectura', 'Av. Las Heras 727, Resistencia', '3624420081', '2026-06-08 02:55:44'),
(9, 'Facultad de Ciencias Agrarias (FCA)', 'Unidad Académica de Ciencias Agronómicas', 'Sgto. Cabral 2131, Corrientes', '3794427589', '2026-06-08 02:55:44'),
(10, 'Facultad de Ciencias Veterinarias (FCV)', 'Unidad Académica de Ciencias Veterinarias', 'Sgto. Cabral 2130, Corrientes', '3794425753', '2026-06-08 02:55:44'),
(11, 'Facultad de Odontología', 'Unidad Académica de Odontología', 'Av. Libertad 5450, Corrientes', '3794457950', '2026-06-08 02:55:44'),
(12, 'Facultad de Artes, Diseño y Ciencias de la Cultura (FADYCC)', 'Unidad Académica de Cultura y Artes', 'Sgto. Cabral 2001, Resistencia', '3624452822', '2026-06-08 02:55:44'),
(13, 'Instituto de Ciencias Criminalísticas y Criminología', 'Instituto de formación en Criminalística', 'Catamarca 375, Corrientes', '3794422490', '2026-06-08 02:55:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisos`
--

CREATE TABLE `permisos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `permisos`
--

INSERT INTO `permisos` (`id`, `nombre`, `slug`, `descripcion`) VALUES
(1, 'Panel Principal', 'panel', 'Visualización de métricas generales'),
(2, 'Gestión de Usuarios', 'usuarios', 'Creación y modificación de personal'),
(3, 'Planes de Compras', 'compras', 'Gestión de solicitudes de adquisición'),
(4, 'Gestión de Correlatos', 'correlatos', 'Vinculación de ítems y matrices'),
(5, 'Gestión de Expedientes', 'expedientes', 'permisos para operar expedientes');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitudes`
--

CREATE TABLE `solicitudes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL DEFAULT 1,
  `nro_convocatoria` varchar(50) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `modelo_centralizado` varchar(100) DEFAULT 'Sin Número',
  `estado` enum('BORRADOR','PENDIENTE','APROBADA','RECHAZADA','EN_PROCESO') DEFAULT 'PENDIENTE',
  `fecha_solicitud` date DEFAULT curdate(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitudes`
--

INSERT INTO `solicitudes` (`id`, `usuario_id`, `nro_convocatoria`, `fecha_creacion`, `modelo_centralizado`, `estado`, `fecha_solicitud`, `created_at`) VALUES
(1, 1, 'CDC:254/2026', '2026-10-19 15:40:31', 'Sin Número', 'APROBADA', '2026-10-19', '2026-10-19 03:41:42'),
(2, 1, 'CDC:16/2026', '2026-10-19 15:40:31', 'Sin Número', 'APROBADA', '2026-10-19', '2026-10-19 03:41:42'),
(3, 1, 'CDI:386/2026', '2026-10-19 15:40:31', 'Sin Número', 'EN_PROCESO', '2026-10-19', '2026-10-19 03:41:42'),
(4, 1, 'CDC:98/2026', '2026-10-19 15:40:31', 'Sin Número', 'APROBADA', '2026-10-19', '2026-10-19 03:41:42'),
(5, 1, 'CDI:472/2026', '2026-10-19 15:40:31', 'Sin Número', 'PENDIENTE', '2026-10-19', '2026-10-19 03:41:42'),
(6, 1, 'CDC:232/2026', '2026-10-19 15:40:31', 'Sin Número', 'APROBADA', '2026-10-19', '2026-10-19 03:41:42'),
(7, 1, 'CDC:512/2026', '2026-10-19 15:40:31', 'Sin Número', 'EN_PROCESO', '2026-10-19', '2026-10-19 03:41:42'),
(8, 1, 'CDC:398/2026', '2026-10-19 15:40:31', '1', 'APROBADA', '2026-10-19', '2026-10-19 03:41:42'),
(9, 1, 'CDC:356/2026', '2026-10-19 15:40:31', 'Sin Número', 'APROBADA', '2026-10-19', '2026-10-19 03:41:42'),
(10, 1, 'CDC:243/2026', '2026-10-19 15:40:31', 'Sin Número', 'APROBADA', '2026-10-19', '2026-10-19 03:41:42'),
(11, 1, 'CDC:245/2026', '2026-10-19 15:40:31', 'Sin Número', 'PENDIENTE', '2026-10-19', '2026-10-19 03:41:42'),
(12, 1, 'CDI:375/2026', '2026-10-19 15:40:31', 'Sin Número', 'EN_PROCESO', '2026-10-19', '2026-10-19 03:41:42'),
(13, 1, 'CDC:2026/01', '2026-10-19 15:40:31', 'Sin Número', 'PENDIENTE', '2026-10-19', '2026-10-19 05:13:28'),
(17, 1, 'CDC:2026/01', '2026-10-19 15:44:27', 'Sin Número', 'PENDIENTE', '2026-10-19', '2026-10-19 18:44:27'),
(18, 1, 'CDC:2026/01', '2026-10-19 15:48:10', 'Sin Número', 'PENDIENTE', '2026-10-19', '2026-10-19 18:48:10'),
(19, 1, 'CDC:2026/01', '2026-10-19 15:49:44', 'Sin Número', 'PENDIENTE', '2026-10-19', '2026-10-19 18:49:44'),
(21, 1, 'CDC:2026/01', '2026-10-19 15:53:45', 'Sin Número', 'PENDIENTE', '2026-10-19', '2026-10-19 18:53:45'),
(22, 1, 'CDC:2026/01', '2026-10-19 15:57:30', 'Sin Número', 'PENDIENTE', '2026-10-19', '2026-10-19 18:57:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_renglones`
--

CREATE TABLE `solicitud_renglones` (
  `id` int(11) NOT NULL,
  `solicitud_id` int(11) NOT NULL,
  `bien_id` int(11) NOT NULL,
  `sbs_solicitudes` int(11) DEFAULT 1,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `precio_unitario` decimal(14,2) NOT NULL DEFAULT 0.00,
  `ordenes_compra` int(11) DEFAULT 0,
  `cantidad_comprada` decimal(12,2) DEFAULT 0.00,
  `observacion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitud_renglones`
--

INSERT INTO `solicitud_renglones` (`id`, `solicitud_id`, `bien_id`, `sbs_solicitudes`, `cantidad`, `precio_unitario`, `ordenes_compra`, `cantidad_comprada`, `observacion`) VALUES
(1, 1, 1, 1, 9, 175728.30, 1, 9.00, NULL),
(2, 1, 2, 1, 120, 4862.39, 1, 120.00, NULL),
(3, 1, 3, 1, 40, 9212.94, 0, 0.00, NULL),
(4, 1, 4, 1, 190, 20843.46, 1, 190.00, NULL),
(5, 1, 5, 1, 3, 254646.82, 1, 3.00, NULL),
(6, 2, 6, 1, 48, 15961.16, 1, 48.00, NULL),
(7, 2, 7, 1, 250, 2996.62, 1, 250.00, NULL),
(8, 2, 8, 1, 5800, 2188.71, 0, 5800.00, NULL),
(9, 2, 9, 1, 3200, 2456.16, 1, 3200.00, NULL),
(10, 3, 10, 1, 2833, 5218.00, 1, 2833.00, NULL),
(11, 4, 11, 1, 6, 77052.00, 1, 6.00, NULL),
(12, 4, 12, 1, 3, 321750.00, 1, 3.00, NULL),
(13, 5, 13, 1, 1, 2374761.55, 1, 1.00, NULL),
(14, 6, 15, 1, 800, 7555.56, 1, 800.00, NULL),
(15, 7, 16, 1, 1, 32000.00, 1, 1.00, NULL),
(16, 7, 17, 1, 10, 60000.00, 1, 10.00, NULL),
(17, 8, 18, 1, 46, 4300.00, 1, 46.00, NULL),
(18, 8, 19, 1, 40, 12286.84, 1, 40.00, NULL),
(19, 9, 20, 1, 2, 556900.00, 1, 2.00, NULL),
(20, 10, 22, 1, 13, 478000.00, 1, 13.00, NULL),
(21, 11, 23, 1, 1, 7500000.00, 1, 1.00, NULL),
(22, 11, 24, 1, 1, 2500000.00, 1, 1.00, NULL),
(23, 12, 25, 1, 200, 5655.16, 1, 200.00, NULL),
(24, 13, 1, 1, 1000, 0.00, 0, 0.00, NULL),
(25, 17, 4, 1, 12, 29939.00, 0, 0.00, ''),
(26, 17, 5, 1, 12, 6196.51, 0, 0.00, ''),
(27, 18, 1, 1, 1, 2403.03, 0, 0.00, ''),
(28, 18, 2, 1, 1, 14408.39, 0, 0.00, ''),
(29, 18, 3, 1, 1, 14832.83, 0, 0.00, ''),
(30, 19, 2, 1, 3, 14408.39, 0, 0.00, ''),
(31, 19, 3, 1, 2, 14832.83, 0, 0.00, ''),
(32, 19, 4, 1, 1, 29939.00, 0, 0.00, ''),
(36, 21, 4, 1, 1, 29939.00, 0, 0.00, ''),
(37, 21, 5, 1, 1, 6196.51, 0, 0.00, ''),
(38, 22, 1, 1, 1, 2403.03, 0, 0.00, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_usuario`
--

CREATE TABLE `tipos_usuario` (
  `id` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tipos_usuario`
--

INSERT INTO `tipos_usuario` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Superusuario', 'Acceso total global a todo el ecosistema de TUPI'),
(2, 'Administrador', 'Gestión total de planes de compra dentro de su unidad académica'),
(3, 'Operador', 'Carga de correlatos y solicitudes básicas');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_usuario_permiso`
--

CREATE TABLE `tipo_usuario_permiso` (
  `id` int(11) NOT NULL,
  `tipo_usuario_id` int(11) NOT NULL,
  `permiso_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tipo_usuario_permiso`
--

INSERT INTO `tipo_usuario_permiso` (`id`, `tipo_usuario_id`, `permiso_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 1, 4),
(12, 1, 5),
(5, 2, 1),
(6, 2, 3),
(7, 2, 4),
(8, 3, 1),
(9, 3, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `dni` varchar(20) NOT NULL,
  `celular` varchar(30) DEFAULT NULL,
  `tipo_usuario_id` int(11) NOT NULL,
  `dependencia_id` int(11) NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `email`, `password`, `nombre`, `apellido`, `dni`, `celular`, `tipo_usuario_id`, `dependencia_id`, `activo`, `creado_en`) VALUES
(1, 'augusto', 'augusto@unne.edu.ar', '$2a$12$HOoyzS1s1XrvFcDd3gNyfeS7HwB4mmUcKy1Gnr.MqKZAk/O8BrvN.', 'Augusto', 'Almiron', '42791957', '3794000000', 1, 1, 1, '2026-06-08 02:55:44'),
(5, 'alguien', 'dasdsto404@unne.edu.ar', '$2b$10$aCGz5xXWWOaF3lWo9PL1pOwGQNyMKBR8hlP6Eg7G16sZFueqL6mRa', 'Augusto', 'Almiron', '123123', '123123', 2, 7, 1, '2026-06-08 03:21:49'),
(6, 'ashkjd', 'adshk@unne.edu.ar', '$2b$10$DPa9siqfYap7D9J6v2cAL.2aEk3Aa5N0jcvDI67jMUNArNBr9vXzi', 'jose', 'asjdlaj', '12312', '131', 2, 1, 1, '2026-06-08 03:59:22'),
(7, 'rott', 'mrott@unne.edu.ar', '$2b$10$r1iA5k6A6HBBK/Vu7MLtOuHUXFNbp6anEiNjVK4YMwBhcid3hR7rW', 'matias', 'rott', '00', '10293', 1, 1, 1, '2026-06-08 04:01:07');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_permiso`
--

CREATE TABLE `usuario_permiso` (
  `usuario_id` int(11) NOT NULL,
  `permiso_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario_permiso`
--

INSERT INTO `usuario_permiso` (`usuario_id`, `permiso_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `bienes`
--
ALTER TABLE `bienes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `configuracion_plan_compras`
--
ALTER TABLE `configuracion_plan_compras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `actualizado_por` (`actualizado_por`);

--
-- Indices de la tabla `dependencias`
--
ALTER TABLE `dependencias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indices de la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_solicitudes_usuarios` (`usuario_id`);

--
-- Indices de la tabla `solicitud_renglones`
--
ALTER TABLE `solicitud_renglones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `solicitud_id` (`solicitud_id`),
  ADD KEY `bien_id` (`bien_id`);

--
-- Indices de la tabla `tipos_usuario`
--
ALTER TABLE `tipos_usuario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `tipo_usuario_permiso`
--
ALTER TABLE `tipo_usuario_permiso`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_rol_permiso` (`tipo_usuario_id`,`permiso_id`),
  ADD KEY `permiso_id` (`permiso_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `dni` (`dni`),
  ADD KEY `tipo_usuario_id` (`tipo_usuario_id`),
  ADD KEY `dependencia_id` (`dependencia_id`);

--
-- Indices de la tabla `usuario_permiso`
--
ALTER TABLE `usuario_permiso`
  ADD PRIMARY KEY (`usuario_id`,`permiso_id`),
  ADD KEY `permiso_id` (`permiso_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `bienes`
--
ALTER TABLE `bienes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `configuracion_plan_compras`
--
ALTER TABLE `configuracion_plan_compras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `dependencias`
--
ALTER TABLE `dependencias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `permisos`
--
ALTER TABLE `permisos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `solicitud_renglones`
--
ALTER TABLE `solicitud_renglones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT de la tabla `tipos_usuario`
--
ALTER TABLE `tipos_usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `tipo_usuario_permiso`
--
ALTER TABLE `tipo_usuario_permiso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `configuracion_plan_compras`
--
ALTER TABLE `configuracion_plan_compras`
  ADD CONSTRAINT `configuracion_plan_compras_ibfk_1` FOREIGN KEY (`actualizado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  ADD CONSTRAINT `fk_solicitudes_usuarios` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `solicitud_renglones`
--
ALTER TABLE `solicitud_renglones`
  ADD CONSTRAINT `solicitud_renglones_ibfk_1` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitudes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `solicitud_renglones_ibfk_2` FOREIGN KEY (`bien_id`) REFERENCES `bienes` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `tipo_usuario_permiso`
--
ALTER TABLE `tipo_usuario_permiso`
  ADD CONSTRAINT `tipo_usuario_permiso_ibfk_1` FOREIGN KEY (`tipo_usuario_id`) REFERENCES `tipos_usuario` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tipo_usuario_permiso_ibfk_2` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`tipo_usuario_id`) REFERENCES `tipos_usuario` (`id`),
  ADD CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`dependencia_id`) REFERENCES `dependencias` (`id`);

--
-- Filtros para la tabla `usuario_permiso`
--
ALTER TABLE `usuario_permiso`
  ADD CONSTRAINT `usuario_permiso_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `usuario_permiso_ibfk_2` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
