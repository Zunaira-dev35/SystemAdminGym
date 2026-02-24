// src/pages/employees/EditEmployee.tsx
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useEffect } from "react";
import { getAllEmployeesAsyncThunk } from "@/redux/pagesSlices/peopleSlice";
import EmployeeForm from "./EmployeeForm";
import Loading from "@/components/shared/loaders/Loading";

export default function EditEmployee() {
  const { id } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllEmployeesAsyncThunk({ disable_page_param: 1 }));
  }, [dispatch]);

  const { employees, loadings } = useSelector((state: RootState) => state.people);
  const employeeList = employees?.data?.data || employees?.data || [];
  const employee = employeeList.find((e: any) => e.id === parseInt(id!));

  if (loadings.getEmployees) return <Loading />;
  if (!employee) return <div className="text-center py-10">Employee not found</div>;

  return <EmployeeForm employee={employee} onSuccess={() => window.history.back()} />;
}