import { useSelector } from 'react-redux';
import { useMemo } from 'react';
// import { RootState } from '../types/store.types';
import type{ CrudPermissions } from './permission_interfaces';
import { PERMISSIONS } from './permissions';
import type{ ModuleName, PermissionValue } from './permissions';
export const usePermissions = () => {
  const { permissionList: userPermissions, loading, error } = useSelector((state: any) => state.auth);

  // Check single permission
  const hasPermission = (permission: PermissionValue): boolean => {
    return userPermissions.includes(permission);
  };

  // Check multiple permissions (ALL required)
  const hasAllPermissions = (permissions: PermissionValue[]): boolean => {
    return permissions.every(permission => userPermissions.includes(permission));
  };

  // Check multiple permissions (ANY required)
  const hasAnyPermission = (permissions: PermissionValue[]): boolean => {
    return permissions.some(permission => userPermissions.includes(permission));
  };

  // Check CRUD permissions for a module
  const getCrudPermissions = (module: ModuleName): CrudPermissions => {
    const moduleUpper = module.toUpperCase() as Uppercase<ModuleName>;
    
    return useMemo(() => ({
      canCreate: hasPermission(PERMISSIONS[`${moduleUpper}_CREATE` as keyof typeof PERMISSIONS]),
      canRead: hasPermission(PERMISSIONS[`${moduleUpper}_READ` as keyof typeof PERMISSIONS]),
      canUpdate: hasPermission(PERMISSIONS[`${moduleUpper}_UPDATE` as keyof typeof PERMISSIONS]),
      canDelete: hasPermission(PERMISSIONS[`${moduleUpper}_DELETE` as keyof typeof PERMISSIONS]),
    }), [moduleUpper, userPermissions]);
  };

  return {
    userPermissions,
    loading,
    error,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    getCrudPermissions,
  };
};