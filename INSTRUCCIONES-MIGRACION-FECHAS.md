# 📅 Instrucciones: Migración de Fechas en Base de Datos

## 🎯 Objetivo
Corregir el problema de "fechas un día antes" modificando las columnas DATE a DATETIME en la base de datos.

## ⚠️ IMPORTANTE: Hacer Backup Primero

Antes de ejecutar el script, **SIEMPRE** haz un backup de tu base de datos:

```bash
# Backup completo (Windows CMD)
mysqldump -u root -p credinica_db > backup_antes_migracion.sql

# O si usas otro usuario
mysqldump -u tu_usuario -p credinica_db > backup_antes_migracion.sql
```

## 📋 Pasos para Ejecutar la Migración

### Opción 1: Desde MySQL Workbench (Recomendado para Windows)

1. Abre MySQL Workbench
2. Conecta a tu base de datos
3. Abre el archivo `fix-dates-migration.sql`
4. Revisa el script completo
5. Ejecuta el script completo (⚡ botón de rayo o Ctrl+Shift+Enter)
6. Revisa los resultados de verificación al final

### Opción 2: Desde línea de comandos

```bash
# Ejecutar el script
mysql -u root -p credinica_db < fix-dates-migration.sql

# O si usas otro usuario
mysql -u tu_usuario -p credinica_db < fix-dates-migration.sql
```

### Opción 3: Desde phpMyAdmin

1. Accede a phpMyAdmin
2. Selecciona la base de datos `credinica_db`
3. Ve a la pestaña "SQL"
4. Copia y pega el contenido de `fix-dates-migration.sql`
5. Haz clic en "Continuar"

## ✅ Verificación Post-Migración

Después de ejecutar el script, verifica que todo funcionó correctamente:

### 1. Verifica la estructura de las tablas

```sql
-- Ver estructura de holidays
DESCRIBE holidays;
-- La columna 'date' debe ser DATETIME

-- Ver estructura de credits
DESCRIBE credits;
-- Las columnas de fechas deben ser DATETIME

-- Ver estructura de payment_plan
DESCRIBE payment_plan;
-- La columna 'paymentDate' debe ser DATETIME

-- Ver estructura de closures
DESCRIBE closures;
-- La columna 'closureDate' debe ser DATETIME
```

### 2. Verifica algunos datos de ejemplo

```sql
-- Ver feriados
SELECT id, date, name FROM holidays LIMIT 5;
-- Las fechas deben mostrar '2025-12-25 12:00:00'

-- Ver créditos
SELECT id, creditNumber, applicationDate, firstPaymentDate 
FROM credits LIMIT 5;
-- Las fechas deben mostrar hora '12:00:00'
```

### 3. Prueba en la aplicación

1. Reinicia tu servidor Next.js
2. Ve a Configuración → Días Feriados
3. Verifica que Navidad (25/12/2025) se muestre como "25 de diciembre de 2025"
4. Revisa los reportes y el plan de pagos

## 🔄 Si algo sale mal

Si encuentras algún problema, puedes restaurar el backup:

```bash
# Restaurar desde backup
mysql -u root -p credinica_db < backup_antes_migracion_YYYYMMDD_HHMMSS.sql
```

## 📊 Tablas Afectadas (Nombres Reales de tu BD)

| Tabla | Columnas Modificadas |
|-------|---------------------|
| `holidays` | `date` |
| `credits` | `applicationDate`, `firstPaymentDate`, `deliveryDate`, `dueDate`, `approvalDate` |
| `payment_plan` | `paymentDate` |
| `closures` | `closureDate` |

**Nota:** La tabla `interactions` ya usa DATETIME, no requiere cambios.

## ⏱️ Tiempo Estimado

- Base de datos pequeña (< 1000 registros): 1-2 minutos
- Base de datos mediana (1000-10000 registros): 2-5 minutos
- Base de datos grande (> 10000 registros): 5-15 minutos

## 🆘 Soporte

Si tienes problemas durante la migración:

1. NO entres en pánico
2. NO ejecutes comandos adicionales
3. Restaura el backup
4. Revisa los mensajes de error
5. Contacta al equipo de desarrollo

## ✨ Después de la Migración

Una vez completada exitosamente:

1. ✅ Las fechas se mostrarán correctamente en toda la app
2. ✅ No más "un día antes"
3. ✅ Los cálculos de fechas serán precisos
4. ✅ Los reportes mostrarán fechas correctas

---

**Fecha de creación:** $(date)
**Versión:** 1.0
