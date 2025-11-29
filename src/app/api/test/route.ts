import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Ejemplo de fecha que vendría de tu base de datos
  const feriado = new Date('2025-12-25T00:00:00Z');

  // Convertimos explícitamente a la zona horaria deseada
  const feriadoLocal = feriado.toLocaleString('es-NI', {
    timeZone: 'America/Managua',
  });

  return NextResponse.json({
    serverDate: new Date(), // fecha actual del servidor
    feriadoUTC: feriado,    // fecha original en UTC
    feriadoLocal: feriadoLocal, // fecha convertida a tu zona
  });
}
