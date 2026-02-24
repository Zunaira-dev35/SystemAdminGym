// src/pages/plan-transfer/PlanTransferDetail.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// import { fetchPlanTransferByIdAsyncThunk } from "@/redux/pagesSlices/planTransferSlice";
import { RootState, AppDispatch } from "@/redux/store";
import { format } from "date-fns";
import { ArrowLeft, User, Calendar, DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/shared/loaders/Loading";
import { backendBasePath } from "@/constants";
import { getPlanTransfersAsyncThunk } from "@/redux/pagesSlices/planSlice";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";

export default function PlanTransferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { planTransfer, loadings } = useSelector(
    (state: RootState) => state.plan
  );

  useEffect(() => {
    dispatch(
      getPlanTransfersAsyncThunk({
        disable_page_param: 1,
      })
    );
  }, [dispatch]);
  console.log("planTransfer", planTransfer);
  const singleTransfer =
    planTransfer?.data?.length > 0 &&
    planTransfer?.data?.find((m: any) => m.id === parseInt(id!));

  if (loadings.single || !singleTransfer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  const t = singleTransfer;

  return (
    <div className=" bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Enhanced Header with Breadcrumb – FULLY CONSISTENT WITH YOUR APP */}
        <div className="mb-4 border-b pb-2 border-border/50">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 text-sm mb-8">
            <button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 hover:text-primary transition cursor-pointer"
              onClick={() => navigate("/transfer-plan")}
            >
              <ArrowLeft className="h-5 w-5" />
              Plan Transfers
            </button>
            <span className="text-foreground/40">/</span>
            <span className="text-foreground font-medium">
              Transfer Details
            </span>
          </div>

          {/* Main Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 border-chart-3/30 hover:bg-chart-3/10"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button> */}
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  {/* <RefreshCw className="h-8 w-8 text-chart-3" /> */}
                  Plan Transfer Details
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Reference:{" "}
                  <span className="font-mono font-bold ">
                    {t.reference_num}
                  </span>
                </p>
              </div>
            </div>

            {/* Right Side Badges */}
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-base px-4 py-2">
                <Calendar className="h-4 w-4 mr-2" />
                {format(new Date(t.generate_date), "dd MMM yyyy")}
              </Badge>
              {/* <Badge className="text-lg px-5 py-2 bg-gradient-to-r from-chart-1 to-chart-3 text-white shadow-lg">
                ID: {t.id}
              </Badge> */}
            </div>
          </div>

          {/* Optional: Quick Info Bar */}
          {/* <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
            <div className="flex items-center gap-6 text-muted-foreground">
              <span>
                Member:{" "}
                <strong className="text-foreground">
                  {t.member.first_name} {t.member.last_name}
                </strong>
              </span>
              <span>
                Transferred by:{" "}
                <strong className="text-foreground">
                  {t.created_by_user.first_name} {t.created_by_user.last_name}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-chart-3" />
              <span className="font-bold text-xl text-chart-3">
                 {t?.system_currency} {t.new_plan_remaining_fee.toLocaleString()}
              </span>
              <span className="text-muted-foreground">collected</span>
            </div>
          </div> */}
        </div>

        {/* Member Card */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            {/* bg-gradient-to-r from-chart-1/10 to-chart-3/10 */}
            <CardTitle className="flex items-center gap-4 ">
              Member Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 bg-gradient-to-br from-chart-1/2 to-chart-3/2">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <Avatar className="h-20 w-20 border-2 ">
                <AvatarImage
                  src={`${backendBasePath}${t.member?.profile_image}`}
                />
                <AvatarFallback className="text-3xl  text-white">
                  {t.member?.name[0]}
                  {/* {t.member.last_name[0]} */}
                </AvatarFallback>
              </Avatar>
              {t?.member ? (
                <div className="space-y-3 text-center md:text-left">
                  <h2 className="text-2xl font-bold">{t.member?.name}</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Member ID:</span>{" "}
                      <strong>{t.member?.reference_num}</strong>
                    </div>
                    {/* <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {t.member.email}
                  </div> */}
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      {t.member?.phone}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <Badge variant="secondary">{t.member?.status}</Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <span className="text-muted-foreground text-center italic text-sm">
                  Deleted Member
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transfer Summary */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Previous Plan */}
          <Card>
            <CardHeader className="bg-chart-5/5 border-b border-chart-5/20 rounded-t-lg ">
              <CardTitle className="text-chart-5 flex items-center gap-3">
                Previous Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="text-2xl font-bold">
                {t.previous_plan?.name || "—"}
                <p className="text-xs w-fit bg-muted-foreground/10 py-1 px-2 rounded-md">
                  {t.previous_plan?.reference_num}
                </p>{" "}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span>
                    {formatDateToShortString(t.current_plan_start_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Days</span>
                  <span>{t.current_plan_total_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Used Days</span>
                  <span className="font-bold text-chart-5">
                    {t.current_plan_used_days} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grace Period</span>
                  {t.previous_plan?.freeze_allowed_days == null ||
                  t.previous_plan?.freeze_allowed_days === 0
                    ? "Unlimited"
                    : `${t.previous_plan?.freeze_allowed_days} days`}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Freeze Requset Credits
                  </span>
                  <span>
                    {" "}
                    {t.previous_plan?.freeze_allowed_count == null ||
                    t.previous_plan?.freeze_allowed_count === 0
                      ? "Unlimited"
                      : `${t.previous_plan?.freeze_allowed_count}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-muted-foreground font-semibold">
                    Amount Paid
                  </span>
                  <span className="font-bold">
                    {t?.system_currency || "Rs."}{" "}
                    {t.current_plan_received_fee.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Plan */}
          <Card className="border  rounded-b-lg  shadow-lg">
            <CardHeader className="  rounded-t-lg bg-chart-3/4  border-b border-chart-3/30">
              <CardTitle className="text-chart-3/90 flex items-center gap-3">
                New Plan Transferred
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="text-2xl font-bold">
                {t.transfered_plan?.name}
                <p className="text-xs w-fit bg-muted-foreground/10 py-1 px-2 rounded-md">
                  {t.transfered_plan?.reference_num}
                </p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span className="font-bold">
                    {t?.system_currency || "Rs."}{" "}
                    {t.transfered_plan?.fee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span>{t.new_plan_total_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span>{formatDateToShortString(t.new_plan_start_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining days</span>
                  <span>{t.new_plan_remaining_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grace Period</span>
                  {t.transfered_plan?.freeze_allowed_days == null ||
                  t.transfered_plan?.freeze_allowed_days === 0
                    ? "Unlimited"
                    : `${t.transfered_plan?.freeze_allowed_days} days`}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Freeze Requset Credits
                  </span>
                  <span>
                    {" "}
                    {t.transfered_plan?.freeze_allowed_count == null ||
                    t.transfered_plan?.freeze_allowed_count === 0
                      ? "Unlimited"
                      : `${t.transfered_plan?.freeze_allowed_count}`}
                  </span>
                </div>
                <div className="flex justify-between text-xl">
                  <span className="text-muted-foreground font-bold">
                    Total New Plan Fee
                  </span>
                  <span className="font-black text-chart-3">
                    {t?.system_currency || "Rs."}{" "}
                    {t.new_plan_total_fee.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary - BIG BOX */}
        <Card className="overflow-hidden shadow-2xl">
          <CardHeader className="  ">
            <CardTitle className=" text-center flex items-center  gap-4">
              {/* <DollarSign className="h-8 w-8" /> */}
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-chart-1/2 to-chart-3/2 p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-muted-foreground text-lg mb-2">
                  Total Received (Lifetime)
                </p>
                <p className="text-2xl font-semibold ">
                  {t?.system_currency || "Rs."}{" "}
                  {t.total_fee_received.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-lg mb-2">
                  Amount Collected This Transfer
                </p>
                <p className="text-2xl font-semibold text-chart-3 drop-shadow-lg">
                  {t?.system_currency || "Rs."}{" "}
                  {t.new_plan_remaining_fee.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-lg mb-2">
                  Payment Method
                </p>
                <p className="text-xl font-semibold uppercase tracking-wider">
                  {t.deposit_method}
                </p>
                {t.deposit_method === "bank" &&
                  t?.fee_collection?.transaction?.bank && (
                    <div className="space-x-1">
                      <Badge variant={"secondary"}>
                        {t?.fee_collection?.transaction?.bank?.reference_num}
                      </Badge>
                      <span>{t?.fee_collection?.transaction?.bank?.name}</span>
                    </div>
                  )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin & System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="">Transfer Information</CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-chart-1/2 to-chart-3/2  p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-muted-foreground mb-2">Transferred By</p>
                <p className="font-bold">{t?.created_by_user?.name}</p>
                <p className="text-sm text-muted-foreground">
                  ID: {t?.created_by_user?.reference_num}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Branch</p>
                <p className="font-bold">{t?.branch?.name}</p>
                <p className="text-sm text-muted-foreground">
                  ID: {t?.branch?.reference_num}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Date & Time</p>
                <p className="font-medium">
                  {formatDateToShortString(t.generate_date)}
                  <br />
                  <span className="text-sm text-muted-foreground">
                    {formatTimeTo12Hour(t.generate_time)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Fee Collection ID</p>
                <p className="font-mono">
                  {t.fee_collection?.reference_num || "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
