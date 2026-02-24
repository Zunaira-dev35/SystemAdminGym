// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
// import { useAuth } from "./context/AuthContext";
import { usePermissions } from "./permissions/usePermissions";
// import { useLocation } from "wouter";
import React from "react";
import type { PermissionValue } from "./permissions/permissions";
import { useAuth } from "./contexts/AuthContext";
import Loading from "./components/shared/loaders/Loading";
import { Redirect, useLocation } from "wouter";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";
interface ProtectedRouteProps {
  element: React.ReactElement;
  permissions?: PermissionValue[];
  roles?: string[];
}

const ProtectedRoute = ({ element, permissions = [], roles = [] }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const user = useSelector((state: RootState) => state.auth.user);
  const { hasPermission } = usePermissions();
  const location = useLocation();

  // Show loading state if authentication is still loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-fmv-carbon text-fmv-silk">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-fmv-orange/20 border-t-fmv-orange rounded-full animate-spin mb-4 mx-auto"></div>
          {/* <p className="text-fmv-silk/80">Loading...</p> */}
        </div>
      </div>
      // <Loading fullScreen message="Loading..." />
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  const userRole = user?.type;
  if (roles.length > 0 && userRole && !roles.includes(userRole)) {
    return;
  }
  // If permissions are specified, check if user has any of the required permissions
  if (permissions.length > 0) {
    const hasAnyPermission = permissions.some((permission) =>
      hasPermission(permission)
    );
    if (!hasAnyPermission) {
      return <Redirect to="/dashboard" />;
    }
  }

  const isExpired = user?.subscription_status === "expired";

if (isExpired) {
  const currentPath = window.location.pathname;

  const allowedPaths = ["/subscriptions", "/package"];

  const isAllowed = allowedPaths.some(path => 
    currentPath === path || 
    currentPath.startsWith(path + "/") ||
    currentPath.startsWith(path + "?")
  );

  if (!isAllowed) {
    return <Navigate to="/package-expired" replace />;
  }
}

  // Render the element directly
  return element;
};

export default ProtectedRoute;
