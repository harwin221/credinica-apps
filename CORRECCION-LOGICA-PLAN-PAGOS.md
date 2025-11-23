# 🔧 Correcciones Necesarias: Lógica del Plan de Pagos

## 📋 Problemas Identificados vs Lógica Requerida

### ❌ **PROBLEMA 1: Créditos Diarios**
**Lógica Actual:**
- Si cae viernes feriado → pasa a lunes (salta sábado y domingo)

**Lógica Requerida:**
- Si cae viernes feriado → pasa a **lunes** (día hábil más cercano) ✅ CORRECTO

### ❌ **PROBLEMA 2: Créditos Semanales**
**Lógica Actual:**
- Si cae viernes feriado → pasa a lunes (salta sábado)
- No permite sábados

**Lógica Requerida:**
- Si cae viernes feriado → pasa a **sábado**
- Si sábado también es feriado → pasa a **lunes**
- **Los semanales SÍ pueden caer en sábado**

### ❌ **PROBLEMA 3: Créditos Catorcenales**
**Lógica Actual:**
- Si cae sábado → pasa a lunes
- No valida que solo sean de lunes a viernes

**Lógica Requerida:**
- **NO pueden caer en sábado** (solo lunes a viernes)
- Si cae viernes feriado → pasa a **sábado**
- Si sábado también es feriado → pasa a **lunes**

### ✅ **PROBLEMA 4: Créditos Quincenales**
**Lógica Actual:**
- Permite sábados ✅

**Lógica Requerida:**
- Si cae viernes feriado → pasa a **sábado** ✅
- Si sábado es feriado → pasa a **lunes** ✅
- **CORRECTO**

### ❌ **PROBLEMA 5: Día 31 en Quincenales**
**Lógica Actual:**
- No valida el día 31

**Lógica Requerida:**
- Si primera cuota es día 2 → siguiente es día 17
- Si primera cuota es día 17 → siguiente es día 2 del siguiente mes
- **Nunca debe caer en día 31**
- Si cae 17 domingo → pasa a lunes
- Si lunes es feriado → pasa a martes
- **Solo esa cuota se ajusta, las demás vuelven a su día pactado (2 o 17)**

## 🎯 Resumen de Reglas por Tipo de Crédito

| Tipo | Permite Sábado | Lógica Feriado | Lógica Domingo | Especial |
|------|----------------|----------------|----------------|----------|
| **Diario** | ❌ NO | Pasa a lunes | Pasa a lunes | - |
| **Semanal** | ✅ SÍ | Pasa a sábado, si sábado feriado → lunes | Pasa a lunes | - |
| **Catorcenal** | ❌ NO (solo L-V) | Pasa a sábado, si sábado feriado → lunes | Pasa a lunes | Solo L-V |
| **Quincenal** | ✅ SÍ | Pasa a sábado, si sábado feriado → lunes | Pasa a lunes | Días 2 y 17, nunca 31 |

## 📝 Correcciones a Implementar

### 1. Función `adjustToNextBusinessDay` - Necesita Reescritura

```typescript
export const adjustToNextBusinessDay = (
  date: Date, 
  frequency: PaymentFrequency, 
  holidays: string[] = [],
  isQuincenalAdjustment: boolean = false // Para manejar el caso especial del día 17
): Date => {
  let newDate = new Date(date.getTime());

  const isHoliday = (d: Date) => {
    const dateString = format(d, 'yyyy-MM-dd');
    return holidays.includes(dateString);
  };

  let adjusted = true;
  let iterations = 0;
  const MAX_ITERATIONS = 30;
  
  while(adjusted && iterations < MAX_ITERATIONS) {
    adjusted = false;
    iterations++;
    const dayOfWeek = newDate.getDay(); // 0 = Domingo, 6 = Sábado

    // PASO 1: Verificar Domingo (aplica a TODOS)
    if (dayOfWeek === 0) {
      newDate = addDays(newDate, 1); // Mover a lunes
      adjusted = true;
      continue;
    }

    // PASO 2: Verificar Sábado (reglas específicas)
    if (dayOfWeek === 6) {
      if (frequency === 'Diario') {
        // Diarios: NO permiten sábado, saltar a lunes
        newDate = addDays(newDate, 2);
        adjusted = true;
        continue;
      } else if (frequency === 'Catorcenal') {
        // Catorcenales: NO permiten sábado (solo L-V)
        // Si llegó a sábado, retroceder a viernes o avanzar a lunes
        // Mejor avanzar a lunes para no alterar el plan
        newDate = addDays(newDate, 2);
        adjusted = true;
        continue;
      }
      // Semanal y Quincenal: SÍ permiten sábado, continuar
    }

    // PASO 3: Verificar si es feriado
    if (isHoliday(newDate)) {
      const currentDayOfWeek = newDate.getDay();
      
      if (frequency === 'Diario') {
        // Diarios: Feriado → siguiente día hábil (lunes si es viernes)
        newDate = addDays(newDate, 1);
        adjusted = true;
        continue;
      } else if (frequency === 'Semanal') {
        // Semanales: Feriado → sábado, si sábado feriado → lunes
        if (currentDayOfWeek === 5) { // Viernes feriado
          newDate = addDays(newDate, 1); // Ir a sábado
        } else if (currentDayOfWeek === 6) { // Sábado feriado
          newDate = addDays(newDate, 2); // Ir a lunes
        } else {
          newDate = addDays(newDate, 1); // Siguiente día
        }
        adjusted = true;
        continue;
      } else if (frequency === 'Catorcenal') {
        // Catorcenales: Feriado → sábado, si sábado feriado → lunes
        if (currentDayOfWeek === 5) { // Viernes feriado
          newDate = addDays(newDate, 1); // Ir a sábado
        } else if (currentDayOfWeek === 6) { // Sábado feriado
          newDate = addDays(newDate, 2); // Ir a lunes
        } else {
          newDate = addDays(newDate, 1); // Siguiente día
        }
        adjusted = true;
        continue;
      } else if (frequency === 'Quincenal') {
        // Quincenales: Feriado → sábado, si sábado feriado → lunes
        if (currentDayOfWeek === 5) { // Viernes feriado
          newDate = addDays(newDate, 1); // Ir a sábado
        } else if (currentDayOfWeek === 6) { // Sábado feriado
          newDate = addDays(newDate, 2); // Ir a lunes
        } else {
          newDate = addDays(newDate, 1); // Siguiente día
        }
        adjusted = true;
        continue;
      }
    }
  }
  
  return newDate;
};
```

### 2. Función `generatePaymentSchedule` - Lógica Quincenal

Necesita agregar lógica especial para quincenales:

```typescript
// Para quincenales, determinar si es día 2 o 17
let quincenalDay: 2 | 17 | null = null;
if (paymentFrequency === 'Quincenal') {
  const startDay = initialDate.getDate();
  if (startDay <= 9) {
    quincenalDay = 2;
  } else {
    quincenalDay = 17;
  }
}

// En el loop de generación de cuotas:
if (paymentFrequency === 'Quincenal' && quincenalDay) {
  // Calcular la fecha teórica basada en día 2 o 17
  const targetMonth = addMonths(initialDate, Math.floor((i - 1) / 2));
  const targetDay = (i % 2 === 1) ? quincenalDay : (quincenalDay === 2 ? 17 : 2);
  
  // Asegurar que no caiga en día 31
  const daysInMonth = getDaysInMonth(targetMonth);
  const safeDay = Math.min(targetDay, daysInMonth);
  
  theoreticalDate = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), safeDay);
  
  // Ajustar si cae en domingo o feriado
  adjustedDate = adjustToNextBusinessDay(theoreticalDate, paymentFrequency, holidays);
}
```

## 🚀 Plan de Implementación

1. ✅ Reescribir `adjustToNextBusinessDay` con las reglas correctas
2. ✅ Agregar lógica especial para quincenales (días 2 y 17)
3. ✅ Validar que catorcenales solo caigan de lunes a viernes
4. ✅ Permitir sábados para semanales y quincenales
5. ✅ Probar con diferentes escenarios de feriados

## 🧪 Casos de Prueba Necesarios

1. **Diario:** Viernes feriado → debe pasar a lunes
2. **Semanal:** Viernes feriado → debe pasar a sábado
3. **Semanal:** Sábado feriado → debe pasar a lunes
4. **Catorcenal:** Debe caer solo L-V, nunca sábado
5. **Catorcenal:** Viernes feriado → debe pasar a sábado
6. **Quincenal:** Primera cuota día 2 → siguiente día 17
7. **Quincenal:** Primera cuota día 17 → siguiente día 2 del siguiente mes
8. **Quincenal:** Nunca debe caer en día 31
9. **Quincenal:** Día 17 domingo → pasa a lunes, siguiente cuota vuelve a día 2

---

**¿Quieres que implemente estas correcciones ahora?**
