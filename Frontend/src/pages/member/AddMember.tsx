// AddMember.tsx
import MemberForm from "./MemberForm";

export default function AddMember() {
  return <MemberForm onSuccess={() => window.history.back()} />;
}