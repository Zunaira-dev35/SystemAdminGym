import {
  setError,
  setErrorForReload,
} from "../redux/errors/handleErrorsAndPayloads";
import type {
  ThunkDispatch,
  AnyAction,
  AsyncThunkPayloadCreator,
} from "@reduxjs/toolkit";
import { toast } from '@/hooks/use-toast';

// === 1. detectError ===
export const detectError = (
  error: any,
  dispatch: ThunkDispatch<any, any, AnyAction>,
  rejectWithValue?: (value: unknown) => unknown
) => {
  if (
    (error.code === "ERR_NETWORK" || error.code === "ERR_BAD_REQUEST") &&
    error.response?.status === 0
  ) {
    dispatch(
      setErrorForReload({
        errorCode: 0,
        errorMessage: "Server is unavailable",
      })
    );
   toast({ title:"Server is unavailable", variant: 'destructive' });
    return rejectWithValue?.(error);
  }

  if (typeof error === "object" && "reason" in error) {
   toast({ title:error.reason, variant: 'destructive' });
    return rejectWithValue?.(error);
  }

  console.log("🚀 ~ detectError ~ error:", error);
// alert( error);
  if (error?.response) {
    if (error.response.status === 422 && error.response.data?.errors) {
      // Check if errors is a string
      if (typeof error.response.data.errors === "string") {
        const errorMessage = error.response.data.errors;
        console.log("errorMessage", errorMessage);
        dispatch(
          setError({
            errorCode: error.response.status ?? error.response.data?.status,
            errorMessage,
          })
        );
        toast({ title:errorMessage, variant: 'destructive' });
        // return rejectWithValue?.(errorMessage);
      } else if (typeof error.response.data.errors === "object") {
        // Handle object errors
        Object.entries(error.response.data.errors).forEach(([field, msg]) => {
          const errorMessage = Array.isArray(msg) ? msg.join(" ") : msg;
          dispatch(
            setError({
              errorCode: error.response.status ?? error.response.data?.status,
              errorMessage: `${field} : ${errorMessage}`,
            })
          );
          toast({ title:`${field} : ${errorMessage}`, variant: 'destructive' });
        });
      }
    } else {
      const errorMessage =
        error.response.data?.message || error.response.data?.status || "An error occurred";
      dispatch(
        setError({
          errorCode: error.response.status ?? error.response.data?.status,
          errorMessage,
        })
      );
      toast({ title:errorMessage, variant: 'destructive' });
    }
  }

  return rejectWithValue?.(error);
};

// === 2. spreadObjValuesNotNull ===
export const spreadObjValuesNotNull = <T extends Record<string, any>>(obj: T): T => {
  const result = {} as T;
  if (typeof obj === "object" && obj) {
    Object.keys(obj).forEach((key) => {
      result[key as keyof T] = obj[key] ?? "";
    });
    return result;
  }
  return obj;
};

// === 3. paramsToObject ===
export function paramsToObject(entries: IterableIterator<[string, string]>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of entries) {
    result[key] = value;
  }
  return result;
}

// === 4. mapAlterString ===
export const mapAlterString = <T extends Record<string, any>>(
  array: T[],
  key: keyof T
): any[] | keyof T => {
  if (Array.isArray(array) && array.length > 0) {
    return array.map((item) => item[key]);
  }
  return key;
};

// === 5. subStringNumber ===
export const subStringNumber = (str: string, length: number): string => {
  if (typeof str === "string" && str.length > length) {
    return str.substring(0, length) + "...";
  }
  return str;
};

// === 6. handleLoadingErrorParamsForAsycThunk ===
interface AsyncThunkMeta {
  arg?: any;
}

interface RejectedPayload {
  response?: {
    data?: {
      message?: string;
    };
    message?: string;
    status?: number;
  };
}

interface AsyncThunkAction {
  meta?: AsyncThunkMeta;
  payload?: RejectedPayload;
  type: string;
}

interface AsyncThunkState {
  paramsForThunk: Record<string, any>;
  errorMessages: Record<string, string>;
  errorCodes: Record<string, number>;
  errors: Record<string, boolean>;
  loadings: Record<string, boolean>;
}

export function handleLoadingErrorParamsForAsycThunk(
  state: AsyncThunkState,
  { meta, payload, type }: AsyncThunkAction
) {
  const action = type.split("/");

  if (meta?.arg && type.endsWith("/pending")) {
    state.paramsForThunk[action[1]] = meta.arg;
  }

  if (type.endsWith("/rejected") && payload?.response) {
    state.errorMessages[action[1]] =
      payload.response.data?.message ??
      payload.response.message ??
      "Something went wrong";

    state.errorCodes[action[1]] = payload.response.status ?? 500;
  }

  state.errors[action[1]] = type.endsWith("/rejected");
  state.loadings[action[1]] = type.endsWith("/pending");
}

// === 7. catchAsync ===
export const catchAsync =
  <ReturnType>(fn: AsyncThunkPayloadCreator<ReturnType, any>) =>
  (_: any, api: any) =>
    Promise.resolve(fn(_, api)).catch((error) => {
      return detectError(error, api.dispatch, api.rejectWithValue);
    });

// === 8. reduxToolKitCaseBuilder ===
export const reduxToolKitCaseBuilder = (cases: any[]) => {
  return cases.flatMap((thunk) => [
    thunk.pending,
    thunk.fulfilled,
    thunk.rejected,
  ]);
};