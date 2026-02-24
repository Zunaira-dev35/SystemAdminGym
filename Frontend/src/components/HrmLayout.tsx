// src/layouts/HrmLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import Hrm from "@/pages/Hrm";
import { HrmActionsProvider } from "@/contexts/HrmActionsContext";
import { useState } from "react";

export default function HrmLayout() {
  const location = useLocation();
  const [currentActions, setCurrentActions] = useState<React.ReactNode>(null);

  return (
    <HrmActionsProvider actions={currentActions}>
      <div className="flex flex-col h-full py-6">
        <Hrm />
        <div className="flex-1 overflow-auto">
          <Outlet key={location.pathname} context={{ setActions: setCurrentActions }} />
        </div>
      </div>
    </HrmActionsProvider>
  );
}