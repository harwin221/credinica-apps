-- =====================================================
-- MIGRACIÓN: Convertir campos DATE a DATETIME
-- Problema: firstPaymentDate, deliveryDate, dueDate están como DATE
-- Solución: Convertir a DATETIME para evitar problemas de zona horaria
-- =====================================================

-- IMPORTANTE: Hacer backup antes de ejecutar esta migración
-- mysqldump -u usuario -p credinica > backup_antes_migracion_datetime.sql

-- 1. Agregar nuevas columnas DATETIME temporales
ALTER TABLE `credits` 
ADD COLUMN `firstPaymentDate_new` DATETIME NULL AFTER `firstPaymentDate`,
ADD COLUMN `deliveryDate_new` DATETIME NULL AFTER `deliveryDate`,
ADD COLUMN `dueDate_new` DATETIME NULL AFTER `dueDate`;

-- 2. Migrar datos existentes (convertir DATE a DATETIME con hora 00:00:00)
UPDATE `credits` 
SET 
    `firstPaymentDate_new` = CASE 
        WHEN `firstPaymentDate` IS NOT NULL 
        THEN CONCAT(`firstPaymentDate`, ' 00:00:00') 
        ELSE NULL 
    END,
    `deliveryDate_new` = CASE 
        WHEN `deliveryDate` IS NOT NULL 
        THEN CONCAT(`deliveryDate`, ' 00:00:00') 
        ELSE NULL 
    END,
    `dueDate_new` = CASE 
        WHEN `dueDate` IS NOT NULL 
        THEN CONCAT(`dueDate`, ' 00:00:00') 
        ELSE NULL 
    END;

-- 3. Verificar que los datos se migraron correctamente
-- SELECT 
--     firstPaymentDate, firstPaymentDate_new,
--     deliveryDate, deliveryDate_new,
--     dueDate, dueDate_new
-- FROM credits 
-- LIMIT 10;

-- 4. Eliminar columnas originales
ALTER TABLE `credits` 
DROP COLUMN `firstPaymentDate`,
DROP COLUMN `deliveryDate`,
DROP COLUMN `dueDate`;

-- 5. Renombrar columnas nuevas
ALTER TABLE `credits` 
CHANGE COLUMN `firstPaymentDate_new` `firstPaymentDate` DATETIME NOT NULL,
CHANGE COLUMN `deliveryDate_new` `deliveryDate` DATETIME NULL,
CHANGE COLUMN `dueDate_new` `dueDate` DATETIME NOT NULL;

-- 6. También migrar la tabla payment_plan
ALTER TABLE `payment_plan` 
ADD COLUMN `paymentDate_new` DATETIME NULL AFTER `paymentDate`;

UPDATE `payment_plan` 
SET `paymentDate_new` = CONCAT(`paymentDate`, ' 00:00:00');

ALTER TABLE `payment_plan` 
DROP COLUMN `paymentDate`;

ALTER TABLE `payment_plan` 
CHANGE COLUMN `paymentDate_new` `paymentDate` DATETIME NOT NULL;

-- 7. Verificación final
SELECT 'Migración completada. Verificar que todos los campos son DATETIME:' as mensaje;

DESCRIBE credits;
DESCRIBE payment_plan;

-- =====================================================
-- RESULTADO ESPERADO:
-- - firstPaymentDate: DATETIME NOT NULL
-- - deliveryDate: DATETIME NULL  
-- - dueDate: DATETIME NOT NULL
-- - payment_plan.paymentDate: DATETIME NOT NULL
-- =====================================================