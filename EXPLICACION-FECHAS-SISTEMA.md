# 📅 Explicación: Manejo de Fechas en el Sistema

## 🎯 Dos Tipos de Fechas

### 1. **Fechas con Hora Exacta** (Timestamps)
Representan un **momento específico** en el tiempo.

| Campo | Descripción | Ejemplo | Razón |
|-------|-------------|---------|-------|
| `applicationDate` | Momento de solicitud | `2025-11-21 18:48:57` | Necesitamos saber la hora exacta |
| `approvalDate` | Momento de aprobación | `2025-11-21 19:24:09` | Auditoría requiere hora exacta |
| `createdAt` | Timestamp de creación | `2025-11-21 15:58:03` | Generado automáticamente por BD |
| `updatedAt` | Timestamp de actualización | `2025-11-21 23:11:44` | Generado automáticamente por BD |
| `paymentDate` (en `payments_registered`) | Momento del pago | `2025-11-21 14:30:15` | Hora exacta del cobro |

**Función usada:** `isoToMySQLDateTime()` - Preserva la hora exacta

---

### 2. **Fechas de "Día Completo"** (Usan 12:00:00)
Representan un **día completo**, sin importar la hora.

| Campo | Descripción | Ejemplo | Razón |
|-------|-------------|---------|-------|
| `firstPaymentDate` | Fecha de primera cuota | `2025-11-18 12:00:00` | Solo importa el día |
| `deliveryDate` | Fecha de entrega | `2025-11-02 12:00:00` | Solo importa el día |
| `dueDate` | Fecha de vencimiento | `2026-02-02 12:00:00` | Solo importa el día |
| `paymentDate` (en `payment_plan`) | Fecha de cuota | `2025-11-25 12:00:00` | Solo importa el día |
| `date` (en `holidays`) | Fecha de feriado | `2025-12-25 12:00:00` | Solo importa el día |
| `closureDate` (en `closures`) | Fecha de cierre | `2025-11-21 12:00:00` | Solo importa el día |

**Función usada:** `isoToMySQLDateTimeNoon()` - Siempre usa 12:00:00

---

## ❓ ¿Por Qué 12:00:00 (Mediodía)?

### Problema con 00:00:00 (Medianoche):
```
Fecha guardada: 2025-11-21 00:00:00 (UTC)
En Nicaragua (UTC-6): 2025-11-20 18:00:00 ❌
Resultado: Se muestra un día antes
```

### Solución con 12:00:00 (Mediodía):
```
Fecha guardada: 2025-11-21 12:00:00 (UTC)
En Nicaragua (UTC-6): 2025-11-21 06:00:00 ✅
Resultado: Se muestra el día correcto
```

**Mediodía es el "punto seguro"** que garantiza que la fecha se muestre correctamente en cualquier zona horaria entre UTC-12 y UTC+12.

---

## 🐛 Problemas Encontrados y Corregidos

### Antes (Incorrecto):
```typescript
// ❌ Usaba hora exacta para fechas de "día completo"
firstPaymentDate: isoToMySQLDateTime(firstPaymentDate)
// Resultado: 2025-11-18 06:00:00 (hora variable)

deliveryDate: isoToMySQLDateTime(deliveryDate)
// Resultado: 2025-11-02 18:48:57 (hora variable)
```

### Después (Correcto):
```typescript
// ✅ Usa mediodía para fechas de "día completo"
firstPaymentDate: isoToMySQLDateTimeNoon(firstPaymentDate)
// Resultado: 2025-11-18 12:00:00 (siempre mediodía)

deliveryDate: isoToMySQLDateTimeNoon(deliveryDate)
// Resultado: 2025-11-02 12:00:00 (siempre mediodía)
```

---

## 🔧 Funciones Creadas

### `isoToMySQLDateTime(isoString)`
**Uso:** Fechas con hora exacta (timestamps)
```typescript
applicationDate: isoToMySQLDateTime(applicationDate)
// Input: "2025-11-21T18:48:57.000Z"
// Output: "2025-11-21 18:48:57"
```

### `isoToMySQLDateTimeNoon(isoString)`
**Uso:** Fechas de "día completo"
```typescript
firstPaymentDate: isoToMySQLDateTimeNoon(firstPaymentDate)
// Input: "2025-11-18" o "2025-11-18T06:00:00.000Z"
// Output: "2025-11-18 12:00:00"
```

---

## 📋 Archivos Modificados

1. **`src/lib/date-utils.ts`**
   - Agregada función `isoToMySQLDateTimeNoon()`

2. **`src/services/credit-service-server.ts`**
   - Actualizado para usar `isoToMySQLDateTimeNoon()` en:
     - `firstPaymentDate`
     - `deliveryDate`
     - `dueDate`

3. **`fix-existing-dates-noon.sql`**
   - Script para corregir fechas existentes en la BD

---

## 🚀 Cómo Aplicar las Correcciones

### 1. Deploy del Código
```bash
git add src/lib/date-utils.ts
git add src/services/credit-service-server.ts
git commit -m "Corregir manejo de fechas: usar 12:00:00 para fechas de día completo"
git push
```

### 2. Corregir Fechas Existentes en BD
```bash
mysql -u root -p credinica_db < fix-existing-dates-noon.sql
```

### 3. Verificar
- Crear un crédito nuevo
- Verificar que `firstPaymentDate` tenga `12:00:00`
- Verificar que `deliveryDate` tenga `12:00:00`
- Verificar que `applicationDate` tenga hora exacta

---

## ✅ Resultado Esperado

### Tabla `credits`:
```sql
SELECT 
    creditNumber,
    applicationDate,      -- Hora exacta: 2025-11-21 18:48:57
    approvalDate,         -- Hora exacta: 2025-11-21 19:24:09
    firstPaymentDate,     -- Mediodía: 2025-11-18 12:00:00 ✅
    deliveryDate,         -- Mediodía: 2025-11-02 12:00:00 ✅
    dueDate,              -- Mediodía: 2026-02-02 12:00:00 ✅
    createdAt,            -- Hora exacta: 2025-11-21 15:58:03
    updatedAt             -- Hora exacta: 2025-11-21 23:11:44
FROM credits;
```

### Tabla `payment_plan`:
```sql
SELECT 
    creditId,
    paymentNumber,
    paymentDate,          -- Mediodía: 2025-11-25 12:00:00 ✅
    amount
FROM payment_plan;
```

### Tabla `payments_registered`:
```sql
SELECT 
    creditId,
    paymentDate,          -- Hora exacta: 2025-11-21 14:30:15 ✅
    amount,
    managedBy
FROM payments_registered;
```

---

## 📊 Resumen

| Tipo de Fecha | Hora Usada | Función | Ejemplos |
|---------------|------------|---------|----------|
| **Timestamps** | Hora exacta | `isoToMySQLDateTime()` | applicationDate, approvalDate, createdAt, updatedAt, pagos |
| **Días Completos** | 12:00:00 | `isoToMySQLDateTimeNoon()` | firstPaymentDate, deliveryDate, dueDate, plan de pagos, feriados |

---

**Fecha de documentación:** 22 de noviembre de 2025
**Estado:** ✅ Implementado y documentado
