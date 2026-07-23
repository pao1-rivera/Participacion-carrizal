// src/app/components/dashboard/planificacion/secciones-sidebar/CertificadoPDF.tsx
'use client';

import { StyleSheet, Document, Page, Text, View, Image } from '@react-pdf/renderer';

// Interfaz de la plantilla (debe coincidir con la del componente principal)
export interface PlantillaCertificado {
  id: number;
  nombre: string;
  descripcion: string;
  fondo?: string;
  activa: boolean;
}

// Estilos del PDF (se mantienen estáticos para evitar problemas con SSR)
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  title: {
    fontSize: 52,
    color: '#004d40',
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#004d40',
    fontStyle: 'italic',
    marginBottom: 50,
    textAlign: 'center',
  },
  studentName: {
    fontSize: 28,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 5,
    width: '70%',
  },
  lineaNombre: {
    borderBottomWidth: 1,
    borderBottomColor: '#004d40',
    width: '70%',
    marginBottom: 90,
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    position: 'absolute',
    bottom: 100,
  },
  signatureBox: {
    width: '35%',
    alignItems: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    width: '100%',
    marginBottom: 8,
  },
  signatureText: {
    fontSize: 14,
    color: '#1a1a1a',
  }
});

// Componente PDF que recibe los datos y la plantilla
export const CertificadoPreviewPDF = ({ 
  nombreAlumno, 
  plantilla 
}: { 
  nombreAlumno: string; 
  plantilla: PlantillaCertificado;
}) => {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        {plantilla.fondo && (
          <Image src={plantilla.fondo} style={pdfStyles.backgroundImage} />
        )}
        <View style={pdfStyles.contentContainer}>
          <Text style={pdfStyles.title}>CERTIFICADO</Text>
          <Text style={pdfStyles.subtitle}>Reconocimiento para:</Text>
          <Text style={pdfStyles.studentName}>{nombreAlumno}</Text>
          <View style={pdfStyles.lineaNombre} />
          <View style={pdfStyles.signaturesContainer}>
            <View style={pdfStyles.signatureBox}>
              <View style={pdfStyles.signatureLine} />
              <Text style={pdfStyles.signatureText}>Firma Facilitador</Text>
            </View>
            <View style={pdfStyles.signatureBox}>
              <View style={pdfStyles.signatureLine} />
              <Text style={pdfStyles.signatureText}>Firma Alcalde</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};