# 🐛 Corrección: Fecha de Vencimiento "Un Día Antes"

## Problema Identificado

**Síntoma:** 
- Plan de pagos muestra última cuota: **13/02/2026** ✅
- Vista de créditos muestra vencimiento: **12/02/2026** ❌
- Reportes muestran vencimiento: **12/02/2026** ❌

**Causa Raíz:**
El campo `dueDate` en la tabla `credits` se guardaba sin hora (solo fecha), mientras que el `payment_plan` sí tenía hora del mediodía (`12:00:00`). Esto causaba que al parsear la fecha en JavaScript con zona horaria UTC-6 (Nicaragua), retrocediera un día.

## 🔧 Correcciones Aplicadas

### 1. Código - Creación de Créditos
**Archivo:** `src/services/credit-service-server.ts` (línea ~73)

**Antes:**
```typescript
scheduleData.schedule[scheduleData.schedule.length - 1].paymentDate,
```

**Después:**
```typescript
`${scheduleData.schedule[scheduleData.schedule.length - 1].paymentDate} 12:00:00`,
```

### 2. Código - Recálculo de Plan de Pagos
**Archivo:** `src/services/credit-service-server.ts` (línea ~526)

**Antes:**
```typescript
const newDueDate = scheduleData.schedule[scheduleData.schedule.length - 1].paymentDate;
await query('UPDATE credits SET dueDate = ? WHERE id = ?', [newDueDate, credit.id]);
```

**Después:**
```typescript
const newDueDate = scheduleData.schedule[scheduleData.schedule.length - 1].paymentDate;
// Agregar hora del mediodía para evitar problemas de zona horaria
await query('UPDATE credits SET dueDate = ? WHERE id = ?', [`${newDueDate} 12:00:00`, credit.id]);
```

### 3. Base de Datos - Script de Migración
**Archivo:** `fix-dates-migration.sql`

Se agregó sincronización automática del `dueDate` con el plan de pagos:

```sql
-- Sincronizar dueDate con la última fecha del plan de pagos
UPDATE credits c
JOIN (
    SELECT creditId, MAX(paymentDate) as lastPaymentDate
    FROM payment_plan
    GROUP BY creditId
) pp ON c.id = pp.creditId
SET c.dueDate = pp.lastPaymentDate
WHERE DATE(c.dueDate) != DATE(pp.lastPaymentDate);
```

## ✅ Resultado

Después de aplicar las correcciones:

1. **Nuevos créditos:** El `dueDate` se guardará con hora del mediodía
2. **Créditos existentes:** El script SQL sincronizará el `dueDate` con el plan de pagos
3. **Recálculos:** Al recalcular plan de pagos, el `dueDate` se actualizará correctamente

### Ejemplo:
- **Plan de pagos - última cuota:** `2026-02-13 12:00:00`
- **dueDate del crédito:** `2026-02-13 12:00:00`
- **Mostrado en la app:** `13/02/2026` ✅

## 📋 Pasos para Aplicar la Corrección

### 1. Ejecutar el Script SQL
```bash
mysql -u root -p credinica_db < fix-dates-migration.sql
```

Este script:
- Convierte columnas `DATE` a `DATETIME`
- Agrega hora del mediodía a todas las fechas
- **Sincroniza `dueDate` con el plan de pagos**

### 2. Reiniciar el Servidor
```bash
# Detener el servidor actual
# Luego iniciar de nuevo
npm run dev
```

### 3. Verificar
1. Abre un crédito existente
2. Revisa el plan de pagos (última cuota)
3. Verifica que la fecha de vencimiento coincida
4. Revisa los reportes de vencimiento

## 🎯 Campos Afectados

### Tabla `credits`:
- ✅ `applicationDate` - Fecha de solicitud
- ✅ `firstPaymentDate` - Fecha de primera cuota
- ✅ `deliveryDate` - Fecha de entrega
- ✅ **`dueDate`** - **Fecha de vencimiento (CORREGIDO)**
- ✅ `approvalDate` - Fecha de aprobación

### Tabla `payment_plan`:
- ✅ `paymentDate` - Fecha de cada cuota

### Tabla `closures`:
- ✅ `closureDate` - Fecha de cierre

### Tabla `holidays`:
- ✅ `date` - Fecha del feriado

## 📝 Notas Importantes

1. **Hora del mediodía (12:00:00):**
   - Se usa para evitar problemas de zona horaria
   - Nicaragua está en UTC-6
   - Con mediodía, la fecha se mantiene correcta al parsear

2. **Sincronización automática:**
   - El script SQL sincroniza `dueDate` con el plan de pagos
   - Corrige inconsistencias existentes
   - Solo afecta créditos donde las fechas no coinciden

3. **Créditos futuros:**
   - El código corregido asegura que nuevos créditos se guarden correctamente
   - Los recálculos también usarán la hora correcta

## 🔍 Verificación Post-Corrección

### SQL para verificar:
```sql
-- Ver créditos con dueDate y última cuota del plan
SELECT 
    c.id,
    c.creditNumber,
    c.clientName,
    c.dueDate as fecha_vencimiento_credito,
    pp.lastPayment as ultima_cuota_plan,
    CASE 
        WHEN DATE(c.dueDate) = DATE(pp.lastPayment) THEN '✅ CORRECTO'
        ELSE '❌ DIFERENTE'
    END as estado
FROM credits c
LEFT JOIN (
    SELECT creditId, MAX(paymentDate) as lastPayment
    FROM payment_plan
    GROUP BY creditId
) pp ON c.id = pp.creditId
WHERE c.status IN ('Active', 'Approved')
ORDER BY c.dueDate DESC
LIMIT 10;
```

### Resultado esperado:
Todos los créditos deben mostrar `✅ CORRECTO`

---

**Fecha de corrección:** Noviembre 2025
**Archivos modificados:** 
- `src/services/credit-service-server.ts`
- `fix-dates-migration.sql`
