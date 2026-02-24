import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getGymAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import Loading from "@/components/shared/loaders/Loading";
import Pagination from "@/components/shared/Pagination";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Usage() {
  const dispatch = useDispatch<AppDispatch>();
  const { gym, loadings } = useSelector((state: RootState) => state.general);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const isLoading = loadings.getGym;
  const gyms = gym?.data || [];
  const totalRecords = gym?.total || 0;

  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: recordsPerPage,
    };
    if (search.trim()) {
      params.search = search.trim();
    }
    dispatch(getGymAsyncThunk(params));
  }, [dispatch, currentPage, recordsPerPage, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usage Overview</h1>
          <p className="text-muted-foreground">View gym resource utilization</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Gym Usage</CardTitle>

            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Filter by client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {search.trim() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center">
              <Loading />
            </div>
          ) : gyms.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No gyms found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CLIENT</TableHead>
                  <TableHead className="text-center">BRANCHES</TableHead>
                  <TableHead className="text-center">EMPLOYEES</TableHead>
                  <TableHead className="text-center">USERS</TableHead>
                  <TableHead className="text-center">MEMBERS</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {gyms.map((gym: any) => {
                  const branchUsed = gym.used_branch_limit || 0;
                  const branchTotal = gym.branch_limit || 0;
                  const employeeUsed = gym.used_employee_limit || 0;
                  const employeeTotal = gym.employee_limit || 0;
                  const userUsed = gym.used_user_limit || 0;
                  const userTotal = gym.user_limit || 0;
                  const memberUsed = gym.used_member_limit || 0;
                  const memberTotal = gym.member_limit || 0;

                  const branchPercent = branchTotal > 0 ? (branchUsed / branchTotal) * 100 : 0;
                  const employeePercent = employeeTotal > 0 ? (employeeUsed / employeeTotal) * 100 : 0;
                  const userPercent = userTotal > 0 ? (userUsed / userTotal) * 100 : 0;
                  const memberPercent = memberTotal > 0 ? (memberUsed / memberTotal) * 100 : 0;

                  return (
                    <TableRow key={gym.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{gym.company_name || "—"}</span>
                            <span className="text-muted-foreground">{gym.reference_num || "—"}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2 max-w-[180px]">
                          <div className="flex justify-center text-sm font-medium">
                            <span>{branchUsed}/{branchTotal}</span>
                          </div>
                          <Progress value={branchPercent} className="h-2" />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2 max-w-[180px]">
                          <div className="flex justify-center text-sm font-medium">
                            <span>{employeeUsed}/{employeeTotal}</span>
                          </div>
                          <Progress value={employeePercent} className="h-2" />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2 max-w-[180px]">
                          <div className="flex justify-center text-sm font-medium">
                            <span>{userUsed}/{userTotal}</span>
                          </div>
                          <Progress value={userPercent} className="h-2" />
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-2 max-w-[180px]">
                          <div className="flex justify-center text-sm font-medium">
                            <span>{memberUsed}/{memberTotal}</span>
                          </div>
                          <Progress value={memberPercent} className="h-2" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalRecords={totalRecords}
              recordsPerPage={recordsPerPage}
              setRecordsPerPage={setRecordsPerPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}