import { DirectorType } from '../../../types';

export const getRolIdForDirector = (directorType: DirectorType): number => {
  switch (directorType) {
    case 'planificacion_formacion': return 5;   // director_formacion_planif
    case 'comunas_consejos_comunales': return 7; // director_comunas_circuitos
    case 'adultas_adulto_mayor': return 4;       // director_adulto_mayor
    case 'digitalizacion_tramites': return 6;    // director_digitalizacion
    default: throw new Error('Tipo de director inválido');
  }
};

export const getRolId = (role: string): number => {
  switch (role) {
    case 'sala_autogobierno': return 8;     // encargado_sala_autogob
    case 'comuna': return 9;                // vocero_comuna
    case 'consejo_comunal': return 11;       // consejo_comunal
    case 'director':
      throw new Error('Usar getRolIdForDirector para el rol director');
    default:
      throw new Error(`Rol no soportado para registro público: ${role}`);
  }
};