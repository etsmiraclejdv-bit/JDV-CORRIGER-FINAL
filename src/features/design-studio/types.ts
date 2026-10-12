export type DesignScope = 'platform' | 'organization';
export type DesignStatus = 'draft' | 'published' | 'archived';
export type DesignMode = 'light' | 'dark' | 'system';
export type DesignDensity = 'comfortable' | 'compact';

export interface DesignElementStyle {
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  borderRadius?: number;
  shadow?: string;
  padding?: number;
}

export interface DesignConfig {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  mode: DesignMode;
  density: DesignDensity;
  radius: 'small' | 'medium' | 'large';
  fontScale: 'small' | 'normal' | 'large';
  elementStyles?: Record<string, DesignElementStyle>;
  /** Optional platform-wide background uploaded by the concepteur. */
  backgroundMediaUrl?: string;
  backgroundAnimation?: 'none' | 'slow-pan' | 'float' | 'gradient';
  backgroundOpacity?: number;
  /** Homepage update card managed from the design studio. */
  updateTitle?: string;
  updateBody?: string;
  updateMediaUrl?: string;
  updateMediaType?: 'image' | 'video';
  updatePublished?: boolean;
}

export interface DesignVersion {
  id: string;
  scope: DesignScope;
  organization_id: string | null;
  version_no: number;
  status: DesignStatus;
  config: DesignConfig;
  created_at: string;
  published_at: string | null;
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
}

export interface CustomFormSchema {
  fields: FormField[];
}

export interface CustomFormDefinition {
  id: string;
  organization_id: string;
  form_key: string;
  name: string;
  description: string | null;
  status: DesignStatus;
  updated_at: string;
}
