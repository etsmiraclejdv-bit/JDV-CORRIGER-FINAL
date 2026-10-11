import type { DesignConfig, FormField } from './types';

export const DEFAULT_DESIGN_CONFIG: DesignConfig = {
  brandName: 'JDV CRM',
  primaryColor: '#D4AF37',
  secondaryColor: '#0B1B3D',
  accentColor: '#2563EB',
  mode: 'light',
  density: 'comfortable',
  radius: 'large',
  fontScale: 'normal',
};

export const FIELD_TYPES: { value: FormField['type']; label: string }[] = [
  { value: 'text', label: 'Texte court' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'number', label: 'Nombre' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Liste déroulante' },
  { value: 'checkbox', label: 'Case à cocher' },
];
