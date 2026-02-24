// src/components/Layout.tsx
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import NotificationBell from "./NotificationBell";
import { loggedBranchAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function Layout({ children }: { children?: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
    "display": "block"
  } as React.CSSProperties;

  const dispatch = useDispatch();
  const [isAtBottom, setIsAtBottom] = useState(false);
  console.log("isAtBottom", isAtBottom);
  useEffect(() => {
    dispatch(loggedBranchAsyncThunk({}) as any);
  }, [dispatch]);

  const { loggedBranch, subscriptionDetails } = useSelector((state: any) => state.general);
  const navigate = useNavigate();
  const { user } = useSelector(
    (state: RootState) => state.auth
  );

  const isSystemAdmin = user?.type === "system_admin";
  const isDefault = user?.type === "default";

  // Detect when user reaches bottom of the page
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Consider "at bottom" if within 50px of the end (feels natural)
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setIsAtBottom(true);
      } else {
        setIsAtBottom(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <SidebarProvider style={style}>
      <div className="flex min-h-screen">
        {/* <div className="flex flex-1 overflow-hidden"> */}
        <AppSidebar />
        <div className="flex flex-1 flex-col h-screen max-w-full overflow-x-hidden ">
          <header className="flex items-center justify-between sticky top-0 z-50 px-4 py-3.5 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center">
              <SidebarTrigger />
              <div className="ml-4">
                <span className="font-semibold text-2xl text-primary flex items-center gap-1">
                  {isSystemAdmin ? (
                    <>Welcome</>
                  ) : (
                    <>
                      Welcome to {loggedBranch?.name || "Loading..."}
                      {loggedBranch?.reference_num && (
                        <Badge variant="secondary">
                          {loggedBranch.reference_num}
                        </Badge>
                      )}
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                {isDefault && (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center  gap-2">
                      <span className="text-sm text-muted-foreground">
                        Package Remaining Days:
                      </span>
                      <span className="text-lg font-semibold">
                        {user?.remaining_package_days}
                      </span>
                    </div>

                    <Button variant="default" onClick={() => navigate('/package')}>
                      Upgrade Package
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <NotificationBell />
              </div>
              <div className="pt-2">
                <ThemeToggle />
              </div>
            </div>
          </header>
          {/* flex-1 */}
          <main className="flex-1 text-foreground max-w-full overflow-x-hidden lg:pr-4 pb-4 ">
            <div className="lg:p-4">
              {children || <Outlet />}</div>
            <footer
              className={`pt-5 pb-1 mt-auto text-center text-sm text-muted-foreground transition-all duration-500 ease-in-out translate-y-0 opacity-100 backdrop-blur-xs`}
            >
              Powered by{" "}
              <a
                href="https://snowberrysys.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-foreground transition-colors"
              >
                snowberrysys.com
              </a>
            </footer>
          </main>

          {/* Footer that appears only at bottom */}
          {/* <footer
              className={` backdrop-blur py-3 text-center text-sm text-muted-foreground transition-all duration-500 ease-in-out ${
                isAtBottom
                  ? "translate-y-0 opacity-100 backdrop-blur-xs"
                  : 
                  "translate-y-full opacity-0"
              }`}
            >
              Powered by{" "}
              <a
                href="https://snowberrysys.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-foreground transition-colors"
              >
                snowberrysys.com
              </a>
            </footer> */}
        </div>
        {/* </div> */}
      </div>
    </SidebarProvider>
  );
}
