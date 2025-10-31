/**
 * Componente de input de fecha con manejo automático de zona horaria
 */

import React from 'react';
import { Input } from './input';
import { Button } from './button';
import { Calendar } from 'lucide-react';
import { useDateInput } from '@/hooks/use-date-input';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value?: string | null;
  onChange?: (isoValue: string | null) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  required = false,
  disabled = false,
  className,
  minDate,
  maxDate,
  error: externalError
}) => {
  const {
    displayValue,
    isoValue,
    error: internalError,
    isValid,
    handleChange,
    setToday,
    setFromISO
  } = useDateInput({
    initialValue: value,
    required,
    minDate,
    maxDate
  });

  // Sincronizar con el valor externo
  React.useEffect(() => {
    if (value !== isoValue) {
      setFromISO(value);
    }
  }, [value, isoValue, setFromISO]);

  // Notificar cambios al componente padre
  React.useEffect(() => {
    if (onChange && isoValue !== value) {
      onChange(isoValue);
    }
  }, [isoValue, onChange, value]);

  const error = externalError || internalError;

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          type="date"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            className,
            error && "border-red-500 focus:border-red-500"
          )}
          min={minDate}
          max={maxDate}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setToday}
            disabled={disabled}
            className="h-6 w-6 p-0"
            title="Fecha actual"
          >
            <Calendar className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

// Componente para fecha y hora
interface DateTimeInputProps extends DateInputProps {
  showTime?: boolean;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({
  showTime = true,
  ...props
}) => {
  // Para datetime-local input
  const inputType = showTime ? 'datetime-local' : 'date';
  
  return (
    <div className="space-y-1">
      <Input
        type={inputType}
        {...props}
        className={cn(
          props.className,
          props.error && "border-red-500 focus:border-red-500"
        )}
      />
      {props.error && (
        <p className="text-sm text-red-600">{props.error}</p>
      )}
    </div>
  );
};