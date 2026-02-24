import { useCallback } from 'react';
import { usePermissions } from './usePermissions';
import type{ ModuleName } from './permissions';

type ApiAction<T = any, R = any> = (data: T) => Promise<R>;
type DeleteApiAction<R = any> = (id: string | number) => Promise<R>;

export const usePermissionedActions = (module: ModuleName) => {
  const { getCrudPermissions } = usePermissions();
  const crudPermissions = getCrudPermissions(module);

  const createAction = useCallback(<T, R>(
    apiAction: ApiAction<T, R>,
    data: T
  ): Promise<R> => {
    if (crudPermissions.canCreate) {
      return apiAction(data);
    } else {
      return Promise.reject(new Error('Insufficient permissions to create'));
    }
  }, [crudPermissions.canCreate]);

  const updateAction = useCallback(<T, R>(
    apiAction: ApiAction<T, R>,
    data: T
  ): Promise<R> => {
    if (crudPermissions.canUpdate) {
      return apiAction(data);
    } else {
      return Promise.reject(new Error('Insufficient permissions to update'));
    }
  }, [crudPermissions.canUpdate]);

  const deleteAction = useCallback(<R>(
    apiAction: DeleteApiAction<R>,
    id: string | number
  ): Promise<R> => {
    if (crudPermissions.canDelete) {
      return apiAction(id);
    } else {
      return Promise.reject(new Error('Insufficient permissions to delete'));
    }
  }, [crudPermissions.canDelete]);

  return {
    ...crudPermissions,
    createAction,
    updateAction,
    deleteAction,
  };
};
