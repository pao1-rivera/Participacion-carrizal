// src/types.ts

// Roles del sistema según la tabla rol_usuario
export type Role =
  | 'admin'
  | 'alcaldesa'
  | 'secretario'
  | 'director'
  | 'sala_autogobierno'
  | 'comuna'
  | 'consejo_comunal';

// Tipos de director según la tabla datos_director
export type DirectorType =
  | 'planificacion_formacion'
  | 'comunas_consejos_comunales'
  | 'adultas_adulto_mayor'
  | 'digitalizacion_tramites';

// Estatus para Sala de Autogobierno
export type EstatusSala = 'consolidada' | 'fortalecimiento' | 'zona_silencio';

// Perfil base de usuario (coincide con perfil_usuario + join con rol_usuario)
export interface UserBase {
  id: string;               // id_usuario (UUID)
  email: string;            // email
  role: Role;               // mapeado desde rol_usuario.nombre_rol
  firstName: string;        // nombre
  lastName: string;         // apellido
  cedula: string;           // cedula (formato V-12345678)
  phone: string;            // telefono
  createdAt: string;        // created_at
  updatedAt?: string;       // updated_at (opcional)
  activo?: boolean;         // activo (opcional, por defecto true)
}

// Datos específicos de Consejo Comunal
export interface ConsejoComunalData extends UserBase {
  nombreConsejo: string;
  rif: string;
  codigoSitur?: string;
  comunaPertenece: string;
  cuentaBancaria: string;
  firmantes: string;
}

// Datos específicos de Comuna
export interface ComunaData extends UserBase {
  nombreComuna: string;
  rif: string;
  banco: string;
  vocerosFirmantes: string;
}

// Datos específicos de Sala de Autogobierno
export interface SalaAutogobiernoData extends UserBase {
  nombreSala: string;
  ubicacion: string;
  vinculoAdministrativo: string;  // Comuna o Circuito
  estatus: EstatusSala;
}

// Datos específicos de Director (con tipo de dirección)
export interface DirectorData extends UserBase {
  directorType: DirectorType;      // viene de tabla datos_director
}

// Unión de todos los tipos de perfil posibles
export type UserProfile =
  | UserBase
  | ConsejoComunalData
  | ComunaData
  | SalaAutogobiernoData
  | DirectorData;

// Mapeo entre nombre_rol en BD y Role en frontend
export const roleMapping: Record<string, Role> = {
  admin: 'admin',
  alcaldesa: 'alcaldesa',
  secretario: 'secretario',
  director_formacion_planif: 'director',
  director_comunas_circuitos: 'director',
  director_adulto_mayor: 'director',
  director_digitalizacion: 'director',
  encargado_sala_autogob: 'sala_autogobierno',
  vocero_comuna: 'comuna',
  consejo_comunal: 'consejo_comunal',
};
