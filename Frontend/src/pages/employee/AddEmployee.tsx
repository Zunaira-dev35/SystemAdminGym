// src/pages/employees/AddEmployee.tsx
import EmployeeForm from "./EmployeeForm";

export default function AddEmployee() {
  return <EmployeeForm onSuccess={() => window.history.back()} />;
}