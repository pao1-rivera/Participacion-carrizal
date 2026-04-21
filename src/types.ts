export type Role =
  | 'admin'
  | 'alcaldesa'
  | 'secretario'
  | 'director'
  | 'sala_autogobierno'
  | 'comuna'
  | 'consejo_comunal';

export type DirectorType =
  | 'planificacion_formacion'
  | 'comunas_consejos_comunales'
  | 'adultas_adulto_mayor'
  | 'digitalizacion_tramites';

export interface UserBase {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  cedula: string;
  phone: string;
  createdAt: string;
}

export interface ConsejoComunalData extends UserBase {
  nombreConsejo: string;
  rif: string;
  codigoSitur?: string;
  comunaPertenece: string;
  cuentaBancaria: string;
  firmantes: string;
}

export interface ComunaData extends UserBase {
  nombreComuna: string;
  rif: string;
  banco: string;
  vocerosFirmantes: string;
}

export interface SalaAutogobiernoData extends UserBase {
  nombreSala: string;
  ubicacion: string;
  vinculoAdministrativo: string; // Comuna or Circuito
  estatus: 'consolidada' | 'fortalecimiento' | 'zona_silencio';
}

export interface DirectorData extends UserBase {
  directorType: DirectorType;
}

export type UserProfile =
  | UserBase
  | ConsejoComunalData
  | ComunaData
  | SalaAutogobiernoData
  | DirectorData;
