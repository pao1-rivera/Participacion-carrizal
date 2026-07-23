import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    // Usamos require para módulos CommonJS
    const pdfParse = require('pdf-parse');
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    const text = data.text;

    const vencimientoRegex = /FECHA\s+DE\s+VENCIMIENTO\s*:\s*(\d{2}\/\d{2}\/\d{4})/i;
    const actualizacionRegex = /FECHA\s+DE\s+ÚLTIMA\s+ACTUALIZACIÓN\s*:\s*(\d{2}\/\d{2}\/\d{4})/i;

    const fechaVencimiento = text.match(vencimientoRegex)?.[1] || null;
    const fechaActualizacion = text.match(actualizacionRegex)?.[1] || null;

    return NextResponse.json({
      success: true,
      fechaVencimiento,
      fechaActualizacion,
    });
  } catch (error) {
    console.error('Error procesando PDF:', error);
    return NextResponse.json({ error: 'Error al procesar el PDF' }, { status: 500 });
  }
}