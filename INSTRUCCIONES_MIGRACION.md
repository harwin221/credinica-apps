# 📋 INSTRUCCIONES PARA EJECUTAR MIGRACIÓN DE FECHAS

## 🚨 IMPORTANTE - HACER BACKUP PRIMERO

**ANTES de ejecutar la migración, DEBES hacer un backup completo de tu base de datos.**

### Paso 1: Hacer Backup en Freehostia

1. **Accede a tu panel de Freehostia**
2. **Ve a "Bases de Datos" → "phpMyAdmin"**
3. **Selecciona la base de datos `harrue9_credinica`**
4. **Haz clic en "Exportar"**
5. **Selecciona "Método rápido" y formato "SQL"**
6. **Haz clic en "Continuar"**
7. **Guarda el archivo** como `backup_credinica_antes_migracion.sql`

## 🔧 Paso 2: Ejecutar la Migración

### Opción A: Usando phpMyAdmin (RECOMENDADO)

1. **Abre phpMyAdmin** en tu panel de Freehostia
2. **Selecciona la base de datos `harrue9_credinica`**
3. **Haz clic en la pestaña "SQL"**
4. **Copia y pega el contenido completo del archivo `EJECUTAR_MIGRACION_FECHAS.sql`**
5. **Haz clic en "Continuar"**
6. **Verifica que no haya errores**

### Opción B: Usando un cliente MySQL

Si tienes un cliente MySQL instalado (como MySQL Workbench):

```bash
mysql -h mysql.freehostia.com -u harrue9_credinica -p harrue9_credinica < EJECUTAR_MIGRACION_FECHAS.sql
```

## ✅ Paso 3: Verificar la Migración

Después de ejecutar la migración, verifica que funcionó:

### En phpMyAdmin:

1. **Ve a la tabla `credits`**
2. **Haz clic en "Estructura"**
3. **Verifica que los campos de fecha muestren tipo `DATETIME`** (no `TIMESTAMP`)

### Campos que deben ser DATETIME:
- `credits.applicationDate` ✅
- `credits.approvalDate` ✅
- `payments_registered.paymentDate` ✅
- `users.createdAt` ✅
- `users.updatedAt` ✅

## 🧪 Paso 4: Probar el Sistema

1. **Accede a tu aplicación CrediNica**
2. **Crea un crédito de prueba**
3. **Selecciona la fecha de hoy**
4. **Verifica que se guarde correctamente**
5. **Verifica que se muestre la fecha correcta (sin correrse un día)**

## 🚨 Si Algo Sale Mal

Si encuentras algún error durante la migración:

1. **NO ENTRES EN PÁNICO**
2. **Restaura el backup** que hiciste en el Paso 1
3. **Revisa el error específico**
4. **Contacta si necesitas ayuda**

## 📞 Datos de Conexión (para referencia)

```
Host: mysql.freehostia.com
Puerto: 3306
Base de datos: harrue9_credinica
Usuario: harrue9_credinica
Contraseña: Hmrh.020790
```

## ✅ Resultado Esperado

Después de la migración exitosa:

- ✅ **No más fechas corridas** - Las fechas se guardarán y mostrarán correctamente
- ✅ **Zona horaria Nicaragua** - Todas las fechas en hora local de Nicaragua
- ✅ **Consistencia total** - Mismo formato en toda la aplicación

## 🎯 ¿Necesitas Ayuda?

Si tienes algún problema durante la migración, puedes:

1. **Revisar los mensajes de error** en phpMyAdmin
2. **Verificar que el backup se hizo correctamente**
3. **Contactar para asistencia técnica**

**¡Una vez completada la migración, tu problema de fechas estará 100% resuelto!** 🚀