-- -------------------------------------------------------------
-- Migración de Estructura de Base de Datos para CrediNica
-- Versión: 2.0
-- Fecha: Noviembre 2025
-- Descripción: Script de migración que preserva datos existentes
-- IMPORTANTE: Este script NO elimina datos, solo actualiza estructura
-- -------------------------------------------------------------

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- -------------------------------------------------------------
-- Tabla: counters (Contadores Globales)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `counters` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `clientNumber` INT UNSIGNED NOT NULL DEFAULT 1,
  `creditNumber` INT UNSIGNED NOT NULL DEFAULT 1,
  `reciboNumber` INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insertar contador principal si no existe
INSERT IGNORE INTO `counters` (id, clientNumber, creditNumber, reciboNumber) 
VALUES ('main', 1, 1, 1);

-- -------------------------------------------------------------
-- Tabla: sucursales (Sucursales/Oficinas)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sucursales` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `managerId` VARCHAR(255) NULL,
  `managerName` VARCHAR(255) NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: users (Usuarios del Sistema)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `fullName` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `hashed_password` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `role` VARCHAR(50) NOT NULL,
  `sucursal_id` VARCHAR(255) NULL,
  `sucursal_name` VARCHAR(255) NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `mustChangePassword` TINYINT(1) NOT NULL DEFAULT 0,
  `supervisor_id` VARCHAR(255) NULL,
  `supervisor_name` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_role` (`role`),
  INDEX `idx_user_sucursal_id` (`sucursal_id`),
  CONSTRAINT `fk_user_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: clients (Clientes)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `clientNumber` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `firstName` VARCHAR(255) NOT NULL,
  `lastName` VARCHAR(255) NOT NULL,
  `cedula` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(20) NULL,
  `sex` VARCHAR(20) NULL,
  `civilStatus` VARCHAR(50) NULL,
  `employmentType` VARCHAR(50) NULL,
  `sucursal_id` VARCHAR(255) NULL,
  `sucursal_name` VARCHAR(255) NULL,
  `department` VARCHAR(100) NULL,
  `municipality` VARCHAR(100) NULL,
  `neighborhood` VARCHAR(255) NULL,
  `address` TEXT NULL,
  `tags` JSON NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_client_name` (`name`),
  INDEX `idx_client_sucursal_id` (`sucursal_id`),
  CONSTRAINT `fk_client_sucursal` FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: asalariado_info (Información de Empleados)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `asalariado_info` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clientId` VARCHAR(255) NOT NULL,
  `companyName` VARCHAR(255) NULL,
  `jobAntiquity` VARCHAR(255) NULL,
  `companyAddress` TEXT NULL,
  `companyPhone` VARCHAR(20) NULL,
  CONSTRAINT `fk_asalariado_client` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: comerciante_info (Información de Comerciantes)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `comerciante_info` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clientId` VARCHAR(255) NOT NULL,
  `businessAntiquity` VARCHAR(255) NULL,
  `businessAddress` TEXT NULL,
  `economicActivity` VARCHAR(255) NULL,
  CONSTRAINT `fk_comerciante_client` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: personal_references (Referencias Personales)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `personal_references` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `clientId` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `relationship` VARCHAR(100) NULL,
  CONSTRAINT `fk_reference_client` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: credits (Créditos)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `credits` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `creditNumber` VARCHAR(50) NOT NULL UNIQUE,
  `clientId` VARCHAR(255) NOT NULL,
  `clientName` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `applicationDate` DATETIME NOT NULL,
  `approvalDate` DATETIME NULL,
  `approvedBy` VARCHAR(255) NULL,
  `rejectionReason` TEXT NULL,
  `rejectedBy` VARCHAR(255) NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `principalAmount` DECIMAL(15, 2) NOT NULL,
  `netDisbursementAmount` DECIMAL(15, 2) NULL,
  `disbursedAmount` DECIMAL(15, 2) NULL,
  `interestRate` DECIMAL(5, 2) NOT NULL,
  `termMonths` DECIMAL(5, 1) NOT NULL,
  `paymentFrequency` VARCHAR(50) NOT NULL,
  `currencyType` VARCHAR(50) NOT NULL,
  `totalAmount` DECIMAL(15, 2) NOT NULL,
  `totalInterest` DECIMAL(15, 2) NOT NULL,
  `totalInstallmentAmount` DECIMAL(15, 2) NOT NULL,
  `firstPaymentDate` DATETIME NOT NULL,
  `deliveryDate` DATETIME NULL,
  `dueDate` DATETIME NOT NULL,
  `disbursedBy` VARCHAR(255) NULL,
  `collectionsManager` VARCHAR(255) NULL,
  `supervisor` VARCHAR(255) NULL,
  `createdBy` VARCHAR(255) NULL,
  `lastModifiedBy` VARCHAR(255) NULL,
  `branch` VARCHAR(255) NULL,
  `branchName` VARCHAR(255) NULL,
  `productType` VARCHAR(100) NULL,
  `subProduct` VARCHAR(100) NULL,
  `productDestination` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_credit_status` (`status`),
  INDEX `idx_credit_manager` (`collectionsManager`),
  INDEX `idx_credit_branch` (`branch`),
  CONSTRAINT `fk_credit_client` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: payment_plan (Plan de Pagos)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_plan` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `creditId` VARCHAR(255) NOT NULL,
  `paymentNumber` INT NOT NULL,
  `paymentDate` DATETIME NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `principal` DECIMAL(15, 2) NOT NULL,
  `interest` DECIMAL(15, 2) NOT NULL,
  `balance` DECIMAL(15, 2) NOT NULL,
  INDEX `idx_plan_creditId` (`creditId`),
  CONSTRAINT `fk_plan_credit` FOREIGN KEY (`creditId`) REFERENCES `credits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: payments_registered (Pagos Registrados)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments_registered` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `creditId` VARCHAR(255) NOT NULL,
  `paymentDate` DATETIME NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `managedBy` VARCHAR(255) NOT NULL,
  `transactionNumber` VARCHAR(100) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'VALIDO',
  `voidReason` TEXT NULL,
  `voidRequestedBy` VARCHAR(255) NULL,
  INDEX `idx_payment_creditId` (`creditId`),
  CONSTRAINT `fk_payment_credit` FOREIGN KEY (`creditId`) REFERENCES `credits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: guarantees (Garantías)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `guarantees` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `creditId` VARCHAR(255) NOT NULL,
  `article` VARCHAR(255) NOT NULL,
  `brand` VARCHAR(255) NULL,
  `color` VARCHAR(100) NULL,
  `model` VARCHAR(100) NULL,
  `series` VARCHAR(100) NULL,
  `estimatedValue` DECIMAL(15, 2) NOT NULL,
  CONSTRAINT `fk_guarantee_credit` FOREIGN KEY (`creditId`) REFERENCES `credits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: guarantors (Fiadores)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `guarantors` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `creditId` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `cedula` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `relationship` VARCHAR(100) NULL,
  CONSTRAINT `fk_guarantor_credit` FOREIGN KEY (`creditId`) REFERENCES `credits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: interactions (Interacciones con Clientes)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `interactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `clientId` VARCHAR(255) NOT NULL,
  `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `notes` TEXT NOT NULL,
  INDEX `idx_interaction_clientId` (`clientId`),
  CONSTRAINT `fk_interaction_client` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: holidays (Feriados)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `holidays` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `date` DATE NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: audit_logs (Auditoría)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `userId` VARCHAR(255) NOT NULL,
  `userName` VARCHAR(255) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT,
  `entityId` VARCHAR(255),
  `entityType` VARCHAR(50),
  `changes` JSON,
  INDEX `idx_audit_user` (`userId`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_entity` (`entityId`, `entityType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- Tabla: closures (Arqueos de Caja)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `closures` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(255) NOT NULL,
  `userName` VARCHAR(255) NOT NULL,
  `sucursalId` VARCHAR(255) NOT NULL,
  `closureDate` DATETIME NOT NULL,
  `systemBalance` DECIMAL(15, 2) NOT NULL,
  `physicalBalance` DECIMAL(15, 2) NOT NULL,
  `difference` DECIMAL(15, 2) NOT NULL,
  `notes` TEXT NULL,
  `denominationsNIO` JSON NULL,
  `denominationsUSD` JSON NULL,
  `exchangeRate` DECIMAL(10, 4) NULL,
  `clientDeposits` DECIMAL(15, 2) NULL,
  `manualTransfers` DECIMAL(15, 2) NULL,
  `closedByUserId` VARCHAR(255) NOT NULL,
  `closedByUserName` VARCHAR(255) NOT NULL,
  `reviewedAt` DATETIME NULL,
  INDEX `idx_closure_user` (`userId`),
  INDEX `idx_closure_sucursal` (`sucursalId`),
  CONSTRAINT `fk_closure_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_closure_sucursal` FOREIGN KEY (`sucursalId`) REFERENCES `sucursales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -------------------------------------------------------------
-- VERIFICACIÓN Y CORRECCIÓN DE ÍNDICES EXISTENTES
-- -------------------------------------------------------------

-- Verificar y agregar índices faltantes si no existen
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() 
     AND table_name = 'users' 
     AND index_name = 'idx_user_role') = 0,
    'ALTER TABLE users ADD INDEX idx_user_role (role)',
    'SELECT "Index idx_user_role already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = DATABASE() 
     AND table_name = 'users' 
     AND index_name = 'idx_user_sucursal_id') = 0,
    'ALTER TABLE users ADD INDEX idx_user_sucursal_id (sucursal_id)',
    'SELECT "Index idx_user_sucursal_id already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- -------------------------------------------------------------
-- INSERCIÓN DE DATOS INICIALES (Solo si no existen)
-- -------------------------------------------------------------

-- Insertar sucursal principal si no existe
INSERT IGNORE INTO `sucursales` (`id`, `name`) 
VALUES ('suc_main', 'SUCURSAL PRINCIPAL');

-- Insertar usuario administrador si no existe
INSERT IGNORE INTO `users` (
    `id`, `fullName`, `email`, `hashed_password`, `role`, `active`, `sucursal_id`, `sucursal_name`
) VALUES (
    'user_admin_01', 
    'ADMINISTRADOR DEL SISTEMA', 
    'admin@credinica.com', 
    '$2a$10$fWz.80.M4i36.g.RBk23v.Kj2u8b3J4/hJ.8iX9fX.Vz0eB4a.5aO', 
    'ADMINISTRADOR', 
    TRUE, 
    'suc_main', 
    'SUCURSAL PRINCIPAL'
);

-- -------------------------------------------------------------
-- VERIFICACIÓN FINAL
-- -------------------------------------------------------------

-- Mostrar resumen de tablas creadas/verificadas
SELECT 
    'MIGRACIÓN COMPLETADA' as STATUS,
    COUNT(*) as TOTAL_TABLES
FROM INFORMATION_SCHEMA.TABLES 
WHERE table_schema = DATABASE() 
AND table_name IN (
    'counters', 'sucursales', 'users', 'clients', 'asalariado_info', 
    'comerciante_info', 'personal_references', 'credits', 'payment_plan', 
    'payments_registered', 'guarantees', 'guarantors', 'interactions', 
    'holidays', 'audit_logs', 'closures'
);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- -------------------------------------------------------------
-- FIN DEL SCRIPT DE MIGRACIÓN
-- -------------------------------------------------------------