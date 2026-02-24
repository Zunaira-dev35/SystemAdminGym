import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { fetchUserAsyncThunk } from "../redux/pagesSlices/authSlice";
import { backendBasePath } from "../constants";
import Loading from "../components/shared/loaders/Loading";
import { getBranchesListsAsyncThunk } from "@/redux/pagesSlices/planSlice";
import { getAllNotificationsAsyncThunk } from "@/redux/pagesSlices/generalSlice";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setIsAuthenticated: (value: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  error: null,
  setIsAuthenticated: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loggedBranch } = useSelector((state: any) => state.general);
  
  
  const { loadings, user } = useSelector((state: RootState) => state.auth);
// console.log("user in auth",user?.data?.user)
  // Load cached web_gif from localStorage on mount
  const cachedWebGif = localStorage.getItem("cachedWebGif");
  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    // Use window.location instead of navigate since we might not have router context
    window.location.href = "/login";
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      
      // If no token exists, just set loading to false
      // Let PrivateRoute handle the redirect
      if (!token) {
        setIsInitializing(false);
        return;
      }

      // If token exists, try to validate it
      try {
        await Promise.all([
          // provide an explicit argument to satisfy the thunk's expected parameters
          dispatch(fetchUserAsyncThunk(undefined)).unwrap(),
          dispatch(getBranchesListsAsyncThunk({disable_page_param: 1, gym_id: loggedBranch?.data?.gym_id})).unwrap(),
          dispatch(getAllNotificationsAsyncThunk({disable_page_param: 1})).unwrap(),
        ]);
        // If successful, user data will be set and useEffect below will handle authentication
      } catch (err: any) {
        console.error("Failed to fetch user or settings:", err);
        
        // Check if it's a 401 (unauthorized) or similar auth error
        if (err?.status === 401 || err?.response?.status === 401) {
          // Token is invalid/expired, remove it
          localStorage.removeItem("token");
          setError("Session expired. Please login again.");
        } else if (err?.status === 503) {
          //isRedirecting = true;
        // window.location.href = "/maintenance";
          //setTimeout(() => (isRedirecting = false), 1000);
      }else {
          // Other errors (network, server, etc.)
          setError("Failed to verify authentication");
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [dispatch]);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);




  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-fmv-carbon text-fmv-silk">
        <div className="text-center">
       
            <>
            <Loading />
              {/* <div className="w-16 h-16 border-4 border-fmv-orange/20 border-t-fmv-orange rounded-full animate-spin mb-4 mx-auto"></div>
              <p className="text-fmv-silk/80">Initializing...</p> */}
            </>
          
        </div>
      </div>
    );
  }

  const contextValue = {
    isAuthenticated,
    isLoading:
      loadings.login ||
      loadings.fetchUser ||
      false,
    error,
    setIsAuthenticated,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);