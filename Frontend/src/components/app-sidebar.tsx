// src/components/app-sidebar.tsx
import {
  LogOut,
  Home,
  Users,
  Package,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import sidebarMenu from "@/config/sidebarMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useSelector } from "react-redux";
import { PERMISSIONS } from "@/permissions/permissions";
import type { RootState } from "@/redux/store";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTheme } from "@/contexts/ThemeContext";

// REACT ROUTER IMPORTS ONLY
import { NavLink, useLocation, useNavigate } from "react-router-dom"; // ← ONLY THIS
import { useEffect, useMemo, useState } from "react";
import { backendBasePath } from "@/constants";

export function AppSidebar() {
  const { logout } = useAuth();
  const location = useLocation(); // ← React Router's location
  const [activePath, setActivePath] = useState(location.pathname);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location.pathname]);


  const navigate = (url: string) => {
    window.history.pushState({}, "", url);
    const navEvent = new PopStateEvent("popstate");
    window.dispatchEvent(navEvent);
  };

  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>(() => {
    const activeParent = sidebarMenu.find(
      (item) =>
        item.children &&
        item.children.some((child) => location.pathname.startsWith(child.url))
    );

    return activeParent ? [activeParent.title] : [];
  });

  const { permissionList: userPermissions, user } = useSelector(
    (state: RootState) => state.auth
  );
  const userRole = user?.user_type || user?.roles?.[0]?.name || "member";
  const isSystemAdmin = userRole === "system_admin";
  const isMember = userRole.toLowerCase() === "member";
  const isDefault = user?.type === "default";

  // console.log("userrrr", user)

  const hasPermission = (
    required: string | string[] | null | undefined
  ): boolean => {
    // If no permission required → always allow
    if (!required) return true;

    // If user has no permissions at all → deny
    if (!userPermissions || !Array.isArray(userPermissions)) return false;

    // Handle array of permissions → allow if ANY match exists
    if (Array.isArray(required)) {
      if (required.length === 0) return true; // empty array = no restriction
      return required.some((perm) => userPermissions.includes(perm));
    }

    // Handle single permission string
    return userPermissions.includes(required);
  };
  const visibleMenuItems = useMemo(() => {
    return sidebarMenu
      .filter((item) => {
        // Hide full Members list for actual members
        if (isMember && item.hideForMember) return false;

        // Show My Profile only to members
        if (item.showOnlyForMember && !isMember) return false;
        if (item.showOnlyForMember && isMember) return true;

        if (isSystemAdmin && item.hideForSystemAdmin) return false;
        if (item.showOnlyForAdmin) {
          return isSystemAdmin;
        }
        if (item.showOnlyForDefault && !isDefault) return false;
        if (item.showOnlyForDefault && isDefault) return true;


        // Permission check
        if (!item.permission) return true;

        if (Array.isArray(item.permission)) {
          return item.permission.some((p) => userPermissions?.includes(p));
        }

        return userPermissions?.includes(item.permission);
      })
      .map((item) => ({
        ...item,
        children: item.children
          ? item.children.filter((child) => {
            if (!child.permission) return true;
            if (Array.isArray(child.permission)) {
              return child.permission.some((p) =>
                userPermissions?.includes(p)
              );
            }
            return userPermissions?.includes(child.permission);
          })
          : undefined,
      }));
  }, [userPermissions, isMember]);

  const handleLogout = () => {
    logout();
    // No need to navigate — your PrivateRoute will redirect to /login
  };
  const { theme } = useTheme();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md flex items-center justify-center justify-center">
            {/*<span className="text-primary-foreground font-bold text-lg">
              GE
            </span>*/}
            {/* {theme === "light" ? (
              <img
                src="/images/logo_dark.png"
                alt="Logo"
                className="h-12 w-16 rounded-md"
              />
            ) : (
              <img
                src="/images/logo_light.png"
                alt="Logo"
                className="h-12 w-16 rounded-md"
              />
            )} */}
            <Avatar className="h-9 w-9">
              <AvatarImage
                src={
                  user
                    ? `${backendBasePath}${user?.system_company_logo}`
                    : undefined
                }
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user?.system_company_name
                  ? user.system_company_name.trim().charAt(0).toUpperCase()
                  : user?.mobile?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h2 className="font-semibold text-base">{user?.system_company_name}</h2>
            {/* <p className="text-xs text-muted-foreground">Management System</p> */}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Menu</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isOpen = openCollapsibles.includes(item.title);
                const isChildActive = item.children?.some((c: any) =>
                  location.pathname.startsWith(c.url)
                );

                if (hasChildren) {
                  return (
                    <Collapsible
                      key={item.title}
                      open={isOpen}
                      onOpenChange={() =>
                        setOpenCollapsibles((prev) =>
                          prev.includes(item.title)
                            ? prev.filter((t) => t !== item.title)
                            : [...prev, item.title]
                        )
                      }
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => navigate("/finance/expense")}
                            className={`w-full justify-between ${isChildActive
                                ? "bg-accent text-accent-foreground"
                                : ""
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              {Icon && <Icon className="h-4 w-4" />}
                              <span>{item.title}</span>
                            </div>
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      </SidebarMenuItem>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children
                            .filter((child: any) =>
                              hasPermission(child.permission)
                            )
                            .map((child: any) => {
                              const ChildIcon = child.icon;
                              return (
                                <SidebarMenuSubItem key={child.title}>
                                  <SidebarMenuSubButton asChild>
                                    <NavLink
                                      to={child.url}
                                      className={({ isActive }) =>
                                        isActive ? "bg-accent/50" : ""
                                      }
                                    >
                                      {ChildIcon && (
                                        <ChildIcon className="h-4 w-4" />
                                      )}
                                      <span>{child.title}</span>
                                    </NavLink>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }

                // Regular item (no children)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url!}
                        end
                        className={`${activePath === item.url
                            ? "bg-accent text-accent-foreground"
                            : ""
                          }`}
                      >

                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="mb-3 flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={
                user?.profile_image
                  ? `${backendBasePath}${user?.profile_image}`
                  : undefined
              }
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.name
                ? user.name.trim().charAt(0).toUpperCase()
                : user?.mobile?.slice(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.name || user?.uid || "User"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user?.roles[0]?.name || ""}
              {/* {user?.roles[0]?.name || "member"} */}
            </p>
          </div>
        </div>

        <SidebarMenuButton
          onClick={handleLogout}
          className="w-full justify-start"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
    // <Sidebar>
    //   <SidebarHeader className="p-4 border-b border-sidebar-border">
    //     <div className="flex items-center gap-3">
    //       <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center justify-center">
    //         <span className="text-primary-foreground font-bold text-lg">
    //           GE
    //         </span>
    //       </div>
    //       <div>
    //         <h2 className="font-semibold text-base">GymERP</h2>
    //         <p className="text-xs text-muted-foreground">Management System</p>
    //       </div>
    //     </div>
    //   </SidebarHeader>

    //   <SidebarContent>
    //     <SidebarGroup>
    //       <SidebarGroupLabel>Menu</SidebarGroupLabel>
    //       <SidebarGroupContent>
    //         <SidebarMenu>
    //           {visibleMenuItems.map((item) => {
    //             const Icon = item.icon;

    //             return (
    //               <SidebarMenuItem key={item.title}>
    //                 <SidebarMenuButton asChild>
    //                   <NavLink
    //                     to={item.url}
    //                     end // ← important for exact match on /
    //                     className={({ isActive }) =>
    //                       isActive ? "bg-accent text-accent-foreground" : ""
    //                     }
    //                   >
    //                     <Icon className="h-4 w-4" />
    //                     <span>{item.title}</span>
    //                   </NavLink>
    //                 </SidebarMenuButton>
    //               </SidebarMenuItem>
    //             );
    //           })}
    //         </SidebarMenu>
    //       </SidebarGroupContent>
    //     </SidebarGroup>
    //   </SidebarContent>

    //   <SidebarFooter className="p-4 border-t border-sidebar-border">
    //     <div className="mb-3 flex items-center gap-3">
    //       <Avatar className="h-9 w-9">
    //         <AvatarFallback className="bg-primary text-primary-foreground text-sm">
    //           {user?.name
    //             ? user.name.trim().charAt(0).toUpperCase()
    //             : user?.mobile?.slice(0, 2).toUpperCase() || "U"}
    //         </AvatarFallback>
    //       </Avatar>
    //       <div className="flex-1 min-w-0">
    //         <p className="text-sm font-medium truncate">
    //           {user?.name || user?.uid || "User"}
    //         </p>
    //         <p className="text-xs text-muted-foreground capitalize">
    //           {user?.role || "member"}
    //         </p>
    //       </div>
    //     </div>

    //     <SidebarMenuButton
    //       onClick={handleLogout}
    //       className="w-full justify-start"
    //     >
    //       <LogOut className="h-4 w-4" />
    //       <span>Logout</span>
    //     </SidebarMenuButton>
    //   </SidebarFooter>
    // </Sidebar>
  );
}
