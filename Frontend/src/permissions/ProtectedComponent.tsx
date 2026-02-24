import React from 'react';
import type { ReactNode } from 'react';
import { usePermissions } from './usePermissions';
import type { PermissionValue } from './permissions';

interface ProtectedComponentProps {
  children: ReactNode;
  permission?: PermissionValue;
  permissions?: PermissionValue[];
  requireAll?: boolean;
  fallback?: ReactNode;
}

const ProtectedComponent: React.FC<ProtectedComponentProps> = ({ 
  children, 
  permission, 
  permissions = [], 
  requireAll = true,
  fallback = <div className="access-denied">Access Denied</div> 
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, loading } = usePermissions();

  if (loading) {
    return <div className="loading">Loading permissions...</div>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  } else {
    hasAccess = true; // No permission required
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default ProtectedComponent;
