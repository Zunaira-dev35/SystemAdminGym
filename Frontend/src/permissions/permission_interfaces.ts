export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
}

export interface PermissionState {
  userPermissions: string[];
  loading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

export interface CrudPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}