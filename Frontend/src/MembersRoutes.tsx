// src/MembersRoutes.tsx
import { Route, Switch } from "wouter";
import Members from "@/pages/member/Members";
import AddMember from "@/pages/member/AddMember";
import ProtectedRoute from "./ProtectedRoute";
import { PERMISSIONS } from "@/permissions/permissions";
import NotFound from "@/pages/not-found";

export default function MembersRoutes() {
  return (
    <Switch>
      {/* Members List */}
      <Route path="/members">
        <ProtectedRoute
          element={<Members />}
          permissions={[PERMISSIONS.MEMBER_VIEW]}
        />
      </Route>

      {/* Add Member */}
      <Route path="/members/add">
        <ProtectedRoute
          element={<AddMember />}
          permissions={[PERMISSIONS.MEMBER_CREATE]}
        />
      </Route>

      {/* Edit Member */}
      <Route path="/members/edit/:id">
        {(params) => (
          <ProtectedRoute
            element={<AddMember editId={params.id} />}
            permissions={[PERMISSIONS.MEMBER_EDIT]}
          />
        )}
      </Route>

      {/* Member Detail View (optional) */}
      <Route path="/members/:id">
        {(params) => (
          <ProtectedRoute
            element={<div>Member Detail: {params.id}</div>}
            permissions={[PERMISSIONS.MEMBER_VIEW]}
          />
        )}
      </Route>

      {/* Fallback inside /members */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}
