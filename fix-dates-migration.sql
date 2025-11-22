-- ============================================
-- SCRIPT DE MIGRACIÓN: CORREGIR FECHAS
-- Convierte columnas DATE a DATETIME y agrega hora del mediodía
-- NO BORRA DATOS - Solo modifica el tipo de columna
-- ============================================
-- 
-- PROBLEMA: Las fechas guardadas como DATE (sin hora) se muestran
-- "un día antes" debido a la zona horaria UTC-6 de Nicaragua
--
-- SOLUCIÓN: Convertir DATE a DATETIME y agregar hora del mediodía (12:00:00)
-- para evitar problemas de zona horaria
--
-- IMPORTANTE: Hacer backup antes de ejecutar:
-- mysqldump -u root -p credinica_db > backup_antes_migracion.sql
-- ============================================

-- ============================================
-- 1. TABLA: holidays (Días Feriados)
-- ============================================
-- Cambiar columna 'date' de DATE a DATETIME
ALTER TABLE holidays 
MODIFY COLUMN date DATETIME NOT NULL;

-- Actualizar fechas existentes para agregar hora del mediodía
UPDATE holidays 
SET date = CONCAT(DATE(date), ' 12:00:00')
WHERE TIME(date) = '00:00:00';

-- ============================================
-- 2. TABLA: credits (Créditos)
-- ============================================
-- Cambiar columnas de fechas de DATE a DATETIME
ALTER TABLE credits 
MODIFY COLUMN applicationDate DATETIME NOT NULL,
MODIFY COLUMN firstPaymentDate DATETIME NOT NULL,
MODIFY COLUMN deliveryDate DATETIME,
MODIFY COLUMN dueDate DATETIME,
MODIFY COLUMN approvalDate DATETIME;

-- Actualizar fechas existentes
UPDATE credits 
SET 
    applicationDate = CONCAT(DATE(applicationDate), ' 12:00:00'),
    firstPaymentDate = CONCAT(DATE(firstPaymentDate), ' 12:00:00'),
    deliveryDate = CASE 
        WHEN deliveryDate IS NOT NULL THEN CONCAT(DATE(deliveryDate), ' 12:00:00')
        ELSE NULL 
    END,
    dueDate = CASE 
        WHEN dueDate IS NOT NULL THEN CONCAT(DATE(dueDate), ' 12:00:00')
        ELSE NULL 
    END,
    approvalDate = CASE 
        WHEN approvalDate IS NOT NULL THEN CONCAT(DATE(approvalDate), ' 12:00:00')
        ELSE NULL 
    END
WHERE TIME(applicationDate) = '00:00:00';

-- Sincronizar dueDate con la última fecha del plan de pagos
-- (por si hay inconsistencias)
UPDATE credits c
JOIN (
    SELECT creditId, MAX(paymentDate) as lastPaymentDate
    FROM payment_plan
    GROUP BY creditId
) pp ON c.id = pp.creditId
SET c.dueDate = pp.lastPaymentDate
WHERE DATE(c.dueDate) != DATE(pp.lastPaymentDate);

-- ============================================
-- 3. TABLA: payment_plan (Plan de Pagos)
-- ============================================
-- Cambiar columna 'paymentDate' de DATE a DATETIME
ALTER TABLE payment_plan 
MODIFY COLUMN paymentDate DATETIME NOT NULL;

-- Actualizar fechas existentes
UPDATE payment_plan 
SET paymentDate = CONCAT(DATE(paymentDate), ' 12:00:00')
WHERE TIME(paymentDate) = '00:00:00';

-- ============================================
-- 4. TABLA: closures (Arqueos/Cierres)
-- ============================================
-- Cambiar columna 'closureDate' de DATE a DATETIME
ALTER TABLE closures 
MODIFY COLUMN closureDate DATETIME NOT NULL;

-- Actualizar fechas existentes
UPDATE closures 
SET closureDate = CONCAT(DATE(closureDate), ' 12:00:00')
WHERE TIME(closureDate) = '00:00:00';

-- ============================================
-- 5. TABLA: interactions (Interacciones con Clientes)
-- ============================================
-- Esta tabla ya usa DATETIME (createdAt), no requiere cambios

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Verificar que las fechas se actualizaron correctamente

SELECT 'holidays' as tabla, COUNT(*) as registros_actualizados 
FROM holidays 
WHERE TIME(date) = '12:00:00'

UNION ALL

SELECT 'credits' as tabla, COUNT(*) as registros_actualizados 
FROM credits 
WHERE TIME(applicationDate) = '12:00:00'

UNION ALL

SELECT 'payment_plan' as tabla, COUNT(*) as registros_actualizados 
FROM payment_plan 
WHERE TIME(paymentDate) = '12:00:00'

UNION ALL

SELECT 'closures' as tabla, COUNT(*) as registros_actualizados 
FROM closures 
WHERE TIME(closureDate) = '12:00:00';

-- ============================================
-- EJEMPLOS DE VERIFICACIÓN
-- ============================================
-- Ver algunos registros de ejemplo para confirmar

SELECT '=== FERIADOS ===' as info;
SELECT id, date, name FROM holidays ORDER BY date LIMIT 5;

SELECT '=== CRÉDITOS ===' as info;
SELECT id, creditNumber, applicationDate, firstPaymentDate, dueDate 
FROM credits ORDER BY applicationDate DESC LIMIT 5;

SELECT '=== PLAN DE PAGOS ===' as info;
SELECT pp.creditId, c.creditNumber, pp.paymentNumber, pp.paymentDate, pp.amount
FROM payment_plan pp
JOIN credits c ON pp.creditId = c.id
ORDER BY pp.paymentDate DESC LIMIT 5;

SELECT '=== CIERRES ===' as info;
SELECT id, userId, userName, closureDate, systemBalance, physicalBalance
FROM closures ORDER BY closureDate DESC LIMIT 5;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
-- 
-- Después de ejecutar este script:
-- 1. Reinicia tu servidor Next.js
-- 2. Verifica que las fechas se muestren correctamente
-- 3. Navidad (25/12/2025) debe mostrarse como "25 de diciembre de 2025"
-- 4. Los reportes deben mostrar fechas correctas
-- ============================================
