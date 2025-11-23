-- ============================================
-- SCRIPT: Corregir Fechas Existentes a Mediodía (12:00:00)
-- ============================================
-- 
-- Este script corrige las fechas que deben usar 12:00:00
-- pero actualmente tienen horas variadas
--
-- IMPORTANTE: Hacer backup antes de ejecutar
-- ============================================

-- Corregir firstPaymentDate (cambiar de 06:00:00 o cualquier hora a 12:00:00)
UPDATE credits
SET firstPaymentDate = CONCAT(DATE(firstPaymentDate), ' 12:00:00')
WHERE TIME(firstPaymentDate) != '12:00:00';

-- Corregir deliveryDate (cambiar de cualquier hora a 12:00:00)
UPDATE credits
SET deliveryDate = CONCAT(DATE(deliveryDate), ' 12:00:00')
WHERE deliveryDate IS NOT NULL 
AND TIME(deliveryDate) != '12:00:00';

-- Corregir dueDate (cambiar de cualquier hora a 12:00:00)
UPDATE credits
SET dueDate = CONCAT(DATE(dueDate), ' 12:00:00')
WHERE dueDate IS NOT NULL 
AND TIME(dueDate) != '12:00:00';

-- Verificar resultados
SELECT 'Verificación de Fechas Corregidas' as info;

SELECT 
    'firstPaymentDate' as campo,
    COUNT(*) as total_registros,
    SUM(CASE WHEN TIME(firstPaymentDate) = '12:00:00' THEN 1 ELSE 0 END) as con_mediodia,
    SUM(CASE WHEN TIME(firstPaymentDate) != '12:00:00' THEN 1 ELSE 0 END) as sin_mediodia
FROM credits

UNION ALL

SELECT 
    'deliveryDate' as campo,
    COUNT(*) as total_registros,
    SUM(CASE WHEN TIME(deliveryDate) = '12:00:00' THEN 1 ELSE 0 END) as con_mediodia,
    SUM(CASE WHEN TIME(deliveryDate) != '12:00:00' THEN 1 ELSE 0 END) as sin_mediodia
FROM credits
WHERE deliveryDate IS NOT NULL

UNION ALL

SELECT 
    'dueDate' as campo,
    COUNT(*) as total_registros,
    SUM(CASE WHEN TIME(dueDate) = '12:00:00' THEN 1 ELSE 0 END) as con_mediodia,
    SUM(CASE WHEN TIME(dueDate) != '12:00:00' THEN 1 ELSE 0 END) as sin_mediodia
FROM credits
WHERE dueDate IS NOT NULL;

-- Mostrar algunos ejemplos
SELECT 'Ejemplos de Fechas Corregidas' as info;
SELECT 
    id,
    creditNumber,
    firstPaymentDate,
    deliveryDate,
    dueDate
FROM credits
ORDER BY createdAt DESC
LIMIT 5;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
