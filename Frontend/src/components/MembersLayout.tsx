// src/pages/members/MembersLayout.tsx
import { Outlet } from "react-router-dom";

export default function MembersLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />  {/* This renders Members, AddMember, EditMember */}
    </div>
  );
}