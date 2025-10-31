-- =====================================================
-- MIGRACIÓN DE FECHAS PARA CREDINICA - FREEHOSTIA
-- Base de datos: harrue9_credinica
-- =====================================================

-- IMPORTANTE: 
-- 1. Hacer BACKUP de la base de datos antes de ejecutar
-- 2. Ejecutar este script en phpMyAdmin de Freehostia
-- 3. Verificar que todos los cambios se aplicaron correctamente

-- =====================================================
-- PASO 1: VERIFICAR ESTRUCTURA ACTUAL
-- =====================================================

-- Verificar estructura actual de las tablas principales
SHOW CREATE TABLE users;
SHOW CREATE TABLE clients;
SHOW CREATE TABLE credits;
SHOW CREATE TABLE payments_registered;
SHOW CREATE TABLE interactions;
SHOW CREATE TABLE audit_logs;
SHOW CREATE TABLE closures;

-- =====================================================
-- PASO 2: APLICAR MIGRACIONES
-- =====================================================

-- 1. Actualizar tabla users
ALTER TABLE `users` 
MODIFY COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 2. Actualizar tabla clients
ALTER TABLE `clients` 
MODIFY COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 3. Actualizar tabla credits (MUY IMPORTANTE)
ALTER TABLE `credits` 
MODIFY COLUMN `applicationDate` DATETIME NOT NULL,
MODIFY COLUMN `approvalDate` DATETIME NULL,
MODIFY COLUMN `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
MODIFY COLUMN `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 4. Actualizar tabla payments_registered (CRÍTICO PARA FECHAS DE PAGOS)
ALTER TABLE `payments_registered` 
MODIFY COLUMN `paymentDate` DATETIME NOT NULL;

-- 5. Actualizar tabla interactions
ALTER TABLE `interactions` 
MODIFY COLUMN `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 6. Actualizar tabla audit_logs
ALTER TABLE `audit_logs` 
MODIFY COLUMN `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 7. Actualizar tabla closures
ALTER TABLE `closures` 
MODIFY COLUMN `closureDate` DATETIME NOT NULL,
MODIFY COLUMN `reviewedAt` DATETIME NULL;

-- =====================================================
-- PASO 3: VERIFICAR QUE LOS CAMBIOS SE APLICARON
-- =====================================================

-- Verificar que todos los campos ahora son DATETIME
SHOW CREATE TABLE users;
SHOW CREATE TABLE clients;
SHOW CREATE TABLE credits;
SHOW CREATE TABLE payments_registered;
SHOW CREATE TABLE interactions;
SHOW CREATE TABLE audit_logs;
SHOW CREATE TABLE closures;

-- =====================================================
-- PASO 4: VERIFICAR DATOS EXISTENTES
-- =====================================================

-- Verificar algunos registros para asegurar que las fechas se mantuvieron
SELECT id, applicationDate, approvalDate, createdAt FROM credits LIMIT 5;
SELECT id, paymentDate FROM payments_registered LIMIT 5;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Todos los campos de fecha deben mostrar tipo DATETIME
-- en lugar de TIMESTAMP en la estructura de las tablas.
-- Esto evitará las conversiones automáticas de zona horaria
-- que causaban que las fechas se corrieran un día.
-- =====================================================