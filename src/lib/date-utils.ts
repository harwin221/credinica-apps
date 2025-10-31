/**
 * Utilidades para manejo consistente de fechas en formato ISO
 * con conversión automática a hora local de Managua, Nicaragua
 */

import { format, parseISO, isValid } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';

export const NICARAGUA_TIMEZONE = 'America/Managua';

/**
 * Convierte cualquier entrada de fecha a un string ISO válido
 * Maneja Date objects, strings, números y valores nulos/undefined
 */
export const toISOString = (dateInput: any): string | null => {
    if (!dateInput) return null;

    try {
        let date: Date;

        if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'number') {
            date = new Date(dateInput);
        } else if (typeof dateInput === 'string') {
            // Si es solo fecha (YYYY-MM-DD), agregar hora para evitar problemas de zona horaria
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
                date = new Date(`${dateInput}T00:00:00`);
            } else {
                date = parseISO(dateInput);
            }
        } else {
            return null;
        }

        if (!isValid(date)) return null;

        return date.toISOString();
    } catch (error) {
        console.error('Error converting to ISO string:', error);
        return null;
    }
};

/**
 * Obtiene la fecha/hora actual en Nicaragua como ISO string
 */
export const nowInNicaragua = (): string => {
    const now = new Date();
    const nicaraguaTime = toZonedTime(now, NICARAGUA_TIMEZONE);
    return nicaraguaTime.toISOString();
};

/**
 * Convierte una fecha UTC a hora local de Nicaragua
 */
export const toNicaraguaTime = (utcDate: string | Date): Date => {
    const date = typeof utcDate === 'string' ? parseISO(utcDate) : utcDate;
    return toZonedTime(date, NICARAGUA_TIMEZONE);
};

/**
 * Convierte una fecha local de Nicaragua a UTC
 */
export const fromNicaraguaTime = (localDate: Date): Date => {
    return fromZonedTime(localDate, NICARAGUA_TIMEZONE);
};

/**
 * Formatea una fecha para mostrar al usuario en hora local de Nicaragua
 */
export const formatDateForUser = (
    dateInput: string | Date | null | undefined,
    formatString: string = 'dd/MM/yyyy'
): string => {
    if (!dateInput) return 'N/A';

    try {
        const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
        if (!isValid(date)) return 'Fecha Inválida';

        return formatInTimeZone(date, NICARAGUA_TIMEZONE, formatString, { locale: es });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Fecha Inválida';
    }
};

/**
 * Formatea fecha y hora para mostrar al usuario
 */
export const formatDateTimeForUser = (
    dateInput: string | Date | null | undefined
): string => {
    return formatDateForUser(dateInput, 'dd/MM/yyyy HH:mm:ss');
};

/**
 * Convierte una fecha de input del usuario (asumida como hora local de Nicaragua) a ISO string
 */
export const userInputToISO = (dateInput: string): string | null => {
    if (!dateInput) return null;

    try {
        // Si es solo fecha, agregar hora local
        let dateString = dateInput;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
            dateString = `${dateInput}T00:00:00`;
        }

        const localDate = new Date(dateString);
        if (!isValid(localDate)) return null;

        // Convertir de hora local de Nicaragua a UTC
        const utcDate = fromZonedTime(localDate, NICARAGUA_TIMEZONE);
        return utcDate.toISOString();
    } catch (error) {
        console.error('Error converting user input to ISO:', error);
        return null;
    }
};

/**
 * Obtiene la fecha actual en Nicaragua en formato YYYY-MM-DD
 */
export const todayInNicaragua = (): string => {
    return formatInTimeZone(new Date(), NICARAGUA_TIMEZONE, 'yyyy-MM-dd');
};

/**
 * Obtiene la fecha y hora actual en Nicaragua en formato YYYY-MM-DD HH:mm:ss
 */
export const nowInNicaraguaFormatted = (): string => {
    return formatInTimeZone(new Date(), NICARAGUA_TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
};

/**
 * Valida si una fecha está en formato ISO válido
 */
export const isValidISODate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = parseISO(dateString);
    return isValid(date);
};

/**
 * Para uso en bases de datos MySQL - convierte ISO string a formato DATETIME
 */
export const isoToMySQLDateTime = (isoString: string): string => {
    if (!isoString) return '';
    const date = parseISO(isoString);
    if (!isValid(date)) return '';
    return format(date, 'yyyy-MM-dd HH:mm:ss');
};

/**
 * Para uso en bases de datos MySQL - convierte ISO string a formato DATE
 */
export const isoToMySQLDate = (isoString: string): string => {
    if (!isoString) return '';
    const date = parseISO(isoString);
    if (!isValid(date)) return '';
    return format(date, 'yyyy-MM-dd');
};