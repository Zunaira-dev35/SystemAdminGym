import { createContext, useContext, ReactNode } from "react";

type HrmActions = {
  actions: ReactNode | null;  
};

const HrmActionsContext = createContext<HrmActions>({ actions: null });

export const HrmActionsProvider = ({
  children,
  actions,
}: {
  children: ReactNode;
  actions: ReactNode | null;
}) => {
  return (
    <HrmActionsContext.Provider value={{ actions }}>
      {children}
    </HrmActionsContext.Provider>
  );
};

export const useHrmActions = () => useContext(HrmActionsContext);