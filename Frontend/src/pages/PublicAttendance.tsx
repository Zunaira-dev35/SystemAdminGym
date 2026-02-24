// src/pages/PublicAttendance.tsx
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Camera,
  UserCheck,
  Calendar,
  Clock,
  Fingerprint,
  Radio,
  LogIn,
  LogOut,
  AlertTriangle,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import InlineFaceCapture from "@/components/faceDetection/InlineFaceCapture";
import MemberSearchCombobox from "@/components/MemberSearchCombobox";
import EmployeeSearchCombobox from "@/components/EmployeeSearchCombobox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAttendenceAsyncThunk,
  markAttendenceCheckoutAsyncThunk,
} from "@/redux/pagesSlices/hrmSlice";
import { useDispatch } from "react-redux";
import { usePermissions } from "@/permissions/usePermissions";
import { PERMISSIONS } from "@/permissions/permissions";
import { cn } from "@/lib/utils";
import { backendBasePath } from "@/constants";
import {
  getBranchesListsAsyncThunk,
  getCurrentBranchAsyncThunk,
} from "@/redux/pagesSlices/planSlice";
import { getShiftsAsyncThunk } from "@/redux/pagesSlices/feeCollectionSlice";
import { ChevronsUpDown, Check } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateToShortString, formatTimeTo12Hour } from "@/utils/helper";
import { CheckCircle2 } from "lucide-react";
import FingerprintScanner from "@/components/fingerPrintDetection/FingerprintScanner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import MethodButton from "@/components/ui/MethodButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loading from "@/components/shared/loaders/Loading";
type Method = "face" | "fingerprint" | "rfid" | "manual";
type RoleTab = "member" | "employee";
type ActionType = "checkin" | "checkout"; // ← NEW

export default function PublicAttendance() {
  const { user } = useSelector((state: RootState) => state.auth);
  // console.log("userrr", user);

  const userType = user?.user_type;
  const isMember = userType === "member";
  const isEmployee = userType === "employee";
  const isAdmin = ["admin", "staff", "other"].includes(userType || "");
  const checkIp = user?.logged_branch?.branch_ip;
  // console.log("checkIp", checkIp);
  async function getPublicIP() {
    const res = await fetch("https://api.ipify.org/?format=json");
    const { ip } = await res.json();
    return ip;
  }

  async function resolveDDNS() {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${checkIp}&type=A`,
      {
        headers: {
          Accept: "application/dns-json",
        },
      }
    );
    const data = await res.json();

    if (!data.Answer) return [];

    return data.Answer.map((record: any) => record.data);
  }

  async function isOfficeNetwork() {
    try {
      const [clientIp, officeIps] = await Promise.all([
        getPublicIP(),

        checkIp && resolveDDNS(),
      ]);

      // console.log("Client IP:", clientIp);
      // console.log("Office IPs:", officeIps);

      return officeIps.includes(clientIp);
    } catch (err) {
      console.error("Network check failed", err);
      return false;
    }
  }

  useEffect(() => {
    isOfficeNetwork().then((isOfficeNetwork) => {
      if (!isOfficeNetwork) {
        console.log("You are not in the office network.");
      } else {
        console.log("You are in the office network.");
      }
    });
  }, []);
  const { toast } = useToast();
  const dispatch = useDispatch();

  const isDefault = user?.type === "default";
  // console.log("default", isDefault);

  const [activeTab, setActiveTab] = useState<RoleTab>(
    isEmployee ? "employee" : "member"
  );
  const [method, setMethod] = useState<Method>("face");
  // const isCheckedIn =
  //   user?.user_type === "employee"
  //     ? user?.today_attendance
  //       ? "checkout"
  //       : "checkin"
  //     : "checkin";
  // console.log("isCheckedIn", isCheckedIn);
  const [actionType, setActionType] = useState<ActionType>("checkin"); // ← NEW
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [selectedShift, setSelectedShift] = useState<string>("");
  const { currentBranch } = useSelector((state: RootState) => state.plan);
  const { shifts, loadings } = useSelector(
    (state: RootState) => state.feeCollection
  );
  const [successUser, setSuccessUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  // Determine if user has checked in today
  // const hasCheckedInToday =
  //   user?.today_attendance !== null && user?.today_attendance !== undefined;
  // console.log("hasCheckedInToday", hasCheckedInToday);
  // // For employees: show correct button & disable the wrong one
  // const showCheckIn =
  //   user?.user_type === "employee" ? !hasCheckedInToday : true;
  // const showCheckOut =
  //   user?.user_type === "employee" ? hasCheckedInToday : true;
  // console.log("showCheckIn, showCheckOut", showCheckIn, showCheckOut);

  // Manual fields
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().split("T")[0] || ""
  );
  const [manualTime, setManualTime] = useState("");
  const [manualCheckoutTime, setManualCheckoutTime] = useState("");
  const [showFingerprintScanner, setShowFingerprintScanner] = useState(false);
  const [fingerprintBase64, setFingerprintBase64] = useState<string>("");
  const [fingerprintCaptured, setFingerprintCaptured] = useState(false);
  const [fingerprintRaw, setFingerprintRaw] = useState("");
  const [isOtherBranch, setIsOtherBranch] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [fingerprintMsg, setFingerprintMsg] = useState(null);
  const showManual = isAdmin && method === "manual";
  const [isOnOfficeNetwork, setIsOnOfficeNetwork] = useState<boolean | null>(
    null
  );
  const [selectedAttendanceType, setSelectedAttendanceType] = useState<
    "Morning" | "Evening" | ""
  >("");
  const [open, setOpen] = useState(false);
  const targetUser = selectedPerson;
  //  || ((user?.user_type === "member" || user?.user_type === "employee") && user);
  const targetUserType = activeTab === "member" ? "member" : "employee";
  const { branchesList } = useSelector((state: RootState) => state.plan); // assuming branches are stored here
  const successAudio = new Audio("/sounds/success.mp3");
  const failureAudio = new Audio("/sounds/failure.mp3");

  useEffect(() => {
    isOfficeNetwork().then((result) => {
      setIsOnOfficeNetwork(result);
    });
  }, []);
  useEffect(() => {
    dispatch(getBranchesListsAsyncThunk({ disable_page_param: 1 }));
  }, [dispatch]);
  useEffect(() => {
    dispatch(getCurrentBranchAsyncThunk({ disable_page_param: 1 }));
  }, [dispatch]);
  // useEffect(() => {
  //   if (currentBranch?.id) {
  //     dispatch(
  //       getShiftsAsyncThunk({
  //         disable_page_param: 1,
  //         filter_status: "active",
  //         filter_branch_id: currentBranch.id,
  //       })
  //     );
  //   }
  // }, [dispatch, currentBranch]);
  const mutation = useMutation({
    mutationFn: async (payload: { faceImage?: string }) => {
      const formData = new FormData();
      formData.append("user_type", targetUserType);
      if (activeTab === "member" && isOtherBranch && selectedBranchId) {
        formData.append("base_branch_id", selectedBranchId);
      }
      // ADD FINGERPRINT DATA
      if (method === "fingerprint" && fingerprintRaw) {
        // formData.append("checkin_type", "fingerprint");
        // formData.append("fingerprint_data", fingerprintRaw);
        payload.fingerprint_data = fingerprintRaw;
        payload.checkin_type = "fingerprint"; // force it
      }
      if (actionType === "checkin") {
        formData.append(
          "checkin_type",
          method === "manual" ? "manual" : "face"
        );
        if (payload.faceImage) {
          const blob = await (await fetch(payload.faceImage)).blob();
          formData.append("profile_image", blob, "face.jpg");
        }

        if (method === "manual") {
          const now = new Date();
          // formData.append("date", now.toISOString().split("T")[0]);
          formData.append("checkin_time", now.toTimeString().slice(0, 8));
        }
      }

      if (actionType === "checkout") {
        formData.append("checkout_type", "face");
        if (payload.faceImage) {
          const blob = await (await fetch(payload.faceImage)).blob();
          formData.append("profile_image", blob, "face.jpg");
        }
      }
      if (activeTab === "employee") {
        formData.append("attendance_type", selectedAttendanceType);
      }
      if (method === "manual" && actionType === "checkin") {
        // formData.append("checkin_type", "manual");

        formData.append("user_id", targetUser?.id);
        formData.append(
          "date",
          manualDate || new Date().toISOString().split("T")[0]
        );
        formData.append(
          "checkin_time",
          manualTime || new Date().toTimeString().slice(0, 8)
        );
        if (activeTab === "employee" && manualCheckoutTime) {
          formData.append(
            "checkout_time",
            manualCheckoutTime || new Date().toISOString().split("T")[0]
          );
        }
      }
      console.log("formData", formData);
      const thunk =
        actionType === "checkin"
          ? createAttendenceAsyncThunk
          : markAttendenceCheckoutAsyncThunk;
      // console.log("formData", formData);
      return await dispatch(thunk({ data: formData })).unwrap();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `${
          actionType === "checkin" ? "Check-in" : "Check-out"
        } successful!`,
      });
      console.log("data from repsonse", data);
      if (data?.user) {
        // adjust according to your actual API response structure
        if (activeTab === "employee") {
          setUserProfile(data?.user?.employee_profile);
          setSuccessUser(data?.user);
          console.log(
            "data?.user?.employee_profile",
            data?.user?.employee_profile
          );
        } else {
          setUserProfile(data?.user?.member_profile);
          setSuccessUser(data?.user);
          console.log("data?.user?.member_profile", data?.user?.member_profile);
        }
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setSuccessUser(null);
          setUserProfile(null);
          setSelectedPerson(null);
          setFingerprintRaw("");
          setFingerprintBase64("");
          setFingerprintCaptured(false);
        }, 10000);
      } else {
        // fallback if no user in response
        setSelectedPerson(null);
      }
      setSelectedPerson(null);
      setManualDate("");
      setManualTime("");
      setManualCheckoutTime("");
      setSelectedShift("");

      // const successAudio = new Audio("/sounds/success.mp3");
      successAudio.play().catch(() => {});
    },
    onError: (err: any) => {
      setFingerprintMsg(
        err.response.data.errors ||
          `${actionType === "checkin" ? "Check-in" : "Check-out"} failed`
      );
      toast({
        variant: "destructive",
        title: "Failed",
        description:
          err.response.data.errors ||
          `${actionType === "checkin" ? "Check-in" : "Check-out"} failed`,
      });
      // const failureAudio = new Audio("/sounds/failure.mp3");
      failureAudio.play().catch(() => {});
    },
  });

  useEffect(() => {
    if (method === "face") {
      setSelectedPerson(null);
    }
  }, [method]);
  // Auto-submit when both user and fingerprint are ready
  useEffect(() => {
    console.log("actionType", actionType, selectedShift, fingerprintRaw);
    const fingerprintStore = async () => {
      try {
        if (fingerprintRaw && method === "fingerprint") {
          const blob = new Blob([fingerprintRaw], {
            type: "application/octet-stream",
          });
          const file = new File([blob], "fingerprint.wsq");
          const formData = new FormData();
          formData.append("user_type", targetUserType);

          formData.append("checkin_type", "fingerprint");
          formData.append("fingerprint_data", file);
          if (activeTab === "member" && isOtherBranch && selectedBranchId) {
            formData.append("base_branch_id", selectedBranchId);
          }
          if (activeTab === "employee") {
            formData.append("attendance_type", selectedAttendanceType);
          }
          console.log("formData", formData);
          if (actionType === "checkout") {
            console.log("markAttendenceCheckoutAsyncThunk");
            let responseData;
            responseData = await dispatch(
              markAttendenceCheckoutAsyncThunk({
                data: formData,
              })
            ).unwrap();
          } else {
            console.log("createAttendenceAsyncThunk");
            responseData = await dispatch(
              createAttendenceAsyncThunk({ data: formData })
            ).unwrap();
          }
          if (responseData) {
            console.log("responseData", responseData);
            if (activeTab === "employee") {
              setSuccessUser(responseData?.user?.employee_profile);
            } else {
              setSuccessUser(responseData?.user?.member_profile);
            }
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              setSuccessUser(null);
              setUserProfile(null);
              setSelectedPerson(null);
              setFingerprintRaw("");
              setFingerprintBase64("");
              setFingerprintCaptured(false);
            }, 10000);
          }
          // const successAudio = new Audio("/sounds/success.mp3");
          successAudio.play().catch(() => {});
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Failed",
          description:
            err?.response?.data?.errors ||
            `${actionType === "checkin" ? "Check-in" : "Check-out"} failed`,
        });
        setFingerprintRaw("");
        setFingerprintBase64("");
        setFingerprintCaptured(false);
        // const failureAudio = new Audio("/sounds/failure.mp3");
        failureAudio.play().catch(() => {});
      }
    };
    fingerprintStore();
  }, [fingerprintRaw, method, actionType]);
  const { hasPermission } = usePermissions();
  return (
    <div className=" px-6 pt-2 flex items-center justify-center">
      {checkIp && !isDefault && isOnOfficeNetwork === false ? (
        <>
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-4">
            <Card className="w-full max-w-md mx-4 border border-destructive/50">
              <CardContent className="pt-10 pb-12 text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                </div>

                <div className="space-y-3 px-6">
                  <h2 className="text-2xl font-semibold">Network Required</h2>
                  <p className="text-muted-foreground">
                    You are not connected to the <strong>Branch</strong>{" "}
                    network.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please connect to the branch WiFi to mark attendance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="w-full max-w-7xl space-y-2">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-lg md:text-4xl font-bold tracking-tight">
                Attendance
              </h1>
              <p className=" text-muted-foreground">
                Record and verify check-ins in real-time
              </p>
            </div>
            {/* ──────────────────────────────────────── */}
            {/* Main Terminal-like Card */}
            {/* <div className="border border-border rounded-2xl overflow-hidden shadow-2xl bg-card"> */}
            {/* Top tabs row */}
            <div className="bg-background px-2 py-2  rounded-md shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Role tabs */}
              {!isMember && (
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => {
                    setActiveTab(v as RoleTab);
                    setSelectedPerson(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  <TabsList className="grid w-full sm:w-auto grid-cols-2">
                    {hasPermission(PERMISSIONS.ATTENDANCE_MEMBER_CREATE) && (
                      <TabsTrigger value="member">Member</TabsTrigger>
                    )}
                    {hasPermission(PERMISSIONS.ATTENDANCE_EMPLOYEE_CREATE) && (
                      <TabsTrigger value="employee">Employee</TabsTrigger>
                    )}
                  </TabsList>
                </Tabs>
              )}

              {/* Method buttons */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                <MethodButton
                  icon={Camera}
                  label="Face"
                  active={method === "face"}
                  onClick={() => setMethod("face")}
                />
                <MethodButton
                  icon={Fingerprint}
                  label="Finger"
                  active={method === "fingerprint"}
                  onClick={() => setMethod("fingerprint")}
                />
                <MethodButton
                  icon={Radio}
                  label="RFID"
                  active={false}
                  disabled
                />
                {(isAdmin || isEmployee) && (
                  <MethodButton
                    icon={UserCheck}
                    label="Manual"
                    active={method === "manual"}
                    onClick={() => setMethod("manual")}
                  />
                )}
              </div>
            </div>
            {/* Check-in / Check-out Toggle - Only for Face */}
            {(method === "fingerprint" || method === "face") &&
              activeTab !== "member" && (
                <div className="flex justify-start mb-6 p-2 bg-background w-fit rounded-md">
                  <ToggleGroup
                    type="single"
                    value={actionType}
                    onValueChange={(value) => {
                      if (value) setActionType(value as "checkin" | "checkout");
                    }}
                  >
                    <ToggleGroupItem
                      value="checkin"
                      // disabled={!showCheckIn}
                      className={cn(
                        "rounded-md px-6 py-4 bg-card/90 cursor-pointer transition-all data-[state=on]:bg-primary data-[state=on]:text-white mr-2"
                        // !showCheckIn && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <LogIn className="h-5 w-5 mr-2" />
                      Check-in
                    </ToggleGroupItem>

                    <ToggleGroupItem
                      value="checkout"
                      // disabled={!showCheckOut}
                      className={cn(
                        "rounded-md px-6 py-4 bg-card/90 cursor-pointer transition-all data-[state=on]:bg-primary data-[state=on]:text-white"
                      )}
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Check-out
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              )}

            {/* ── Main Biometric Area ── Split into two cards when using Face or Fingerprint ── */}
            {method === "face" || method === "fingerprint" ? (
              <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                {/* LEFT COLUMN - Camera / Scanner Area */}
                <Card className="overflow-hidden border-2 shadow-lg bg-gradient-to-b from-background to-muted/30">
                  <div className="p-6 flex flex-col items-center justify-center min-h-[380px] md:min-h-[480px]">
                    {method === "face" ? (
                      <>
                        <div className="flex flex-col md:flex-row items-start justify-between w-full mb-6">
                          <div className="w-full">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                              <span className="bg-primary w-2 h-2 rounded-full"></span>{" "}
                              Verifiaction Terminal
                            </h2>
                          </div>
                          {/* Other Branch */}
                          {(method === "face" || method === "fingerprint") &&
                            activeTab === "member" && (
                              <div className="max-w-md space-y-4 px-2 flex flex-col items-end w-full">
                                <div className="flex items-center space-x-3 ">
                                  <Checkbox
                                    // type="checkbox"
                                    id="other-branch"
                                    checked={isOtherBranch}
                                    onCheckedChange={(checked) => {
                                      setIsOtherBranch(checked as boolean);
                                      if (!checked) {
                                        setSelectedBranchId("");
                                      }
                                    }}
                                    className="h-5 w-5 text-primary focus:ring-primary"
                                  />
                                  <Label
                                    htmlFor="other-branch"
                                    className="text-sm cursor-pointer"
                                  >
                                    Other Branch
                                  </Label>
                                </div>

                                {isOtherBranch && (
                                  <div className="space-y-2">
                                    <Label>Select Branch</Label>
                                    <Popover open={open} onOpenChange={setOpen}>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="outline"
                                          role="combobox"
                                          className={cn(
                                            "w-full justify-between",
                                            !selectedBranchId &&
                                              "text-muted-foreground"
                                          )}
                                        >
                                          {selectedBranchId
                                            ? (() => {
                                                const branch =
                                                  branchesList?.find(
                                                    (b: any) =>
                                                      b.id.toString() ===
                                                      selectedBranchId
                                                  );
                                                return branch ? (
                                                  <span>
                                                    <Badge
                                                      variant="secondary"
                                                      className="ml-2 text-xs"
                                                    >
                                                      {branch?.reference_num}
                                                    </Badge>{" "}
                                                    {branch?.name}
                                                  </span>
                                                ) : (
                                                  "Choose branch"
                                                );
                                              })()
                                            : "Choose branch"}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-full p-0">
                                        <Command>
                                          <CommandInput placeholder="Search branch..." />
                                          <CommandEmpty>
                                            No branch found.
                                          </CommandEmpty>
                                          <CommandGroup className="max-h-64 overflow-auto">
                                            {branchesList?.map(
                                              (branch: any) => (
                                                <CommandItem
                                                  key={branch.id}
                                                  value={branch.name}
                                                  onSelect={() => {
                                                    setSelectedBranchId(
                                                      selectedBranchId ===
                                                        branch.id.toString()
                                                        ? ""
                                                        : branch.id.toString()
                                                    );
                                                    setOpen(false);
                                                  }}
                                                >
                                                  <Check
                                                    className={cn(
                                                      "mr-2 h-4 w-4",
                                                      selectedBranchId ===
                                                        branch.id.toString()
                                                        ? "opacity-100"
                                                        : "opacity-0"
                                                    )}
                                                  />
                                                  <Badge
                                                    variant="secondary"
                                                    className="w-fit"
                                                  >
                                                    {branch.reference_num}
                                                  </Badge>

                                                  {branch.name}
                                                </CommandItem>
                                              )
                                            )}
                                          </CommandGroup>
                                        </Command>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                )}
                              </div>
                            )}
                          {/* Shift Selection – Only for Employees (Combobox Style) */}
                          {(method === "face" || method == "fingerprint") &&
                            activeTab === "employee" && (
                              <div className="flex w-full justify-start px-2">
                                <div className="w-full max-w-full">
                                  <div className="space-y-3">
                                    <Label className="text-lg font-medium flex items-center gap-2">
                                      <Clock className="h-5 w-5" />
                                      Shift
                                      <span className="text-red-500 text-base">
                                        *
                                      </span>
                                    </Label>

                                    <Select
                                      value={selectedAttendanceType}
                                      onValueChange={(
                                        value: "Morning" | "Evening"
                                      ) => setSelectedAttendanceType(value)}
                                    >
                                      <SelectTrigger className="h-12 max-w-xl">
                                        <SelectValue placeholder="Select shift" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem
                                          value="Morning"
                                          className=" py-3"
                                        >
                                          <div className="flex items-center gap-3">
                                            {/* <Sun className="h-5 w-5 text-amber-600" /> */}
                                            <span>Morning Shift</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem
                                          value="Evening"
                                          className=" py-3"
                                        >
                                          <div className="flex items-center gap-3">
                                            {/* <Moon className="h-5 w-5 text-indigo-600" /> */}
                                            <span>Evening Shift</span>
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden border-4 border-primary/60 shadow-2xl bg-black/70">
                          <InlineFaceCapture
                            key={`${
                              targetUser?.reference_num || "new"
                            }-${actionType}`}
                            onCapture={(img) =>
                              mutation.mutate({ faceImage: img })
                            }
                            onCancel={() =>
                              setMethod(isAdmin ? "manual" : "face")
                            }
                            isProcessing={mutation.isPending}
                            isSuccess={mutation.isSuccess}
                            resetTrigger={mutation.isIdle}
                          />
                        </div>
                      </>
                    ) : (
                      // Fingerprint mode
                      <>
                        <div className="flex flex-col md:flex-row items-start justify-between w-full mb-6">
                          <div className="w-full">
                            <h2 className="text-lg font-semibold flex items-center justify-start gap-2">
                              <span className="bg-primary w-2 h-2 rounded-full"></span>{" "}
                              Verifiaction Terminal
                            </h2>
                          </div>
                          {/* Shift Selection – Only for Employees (Combobox Style) */}
                          {(method === "face" || method == "fingerprint") &&
                            activeTab === "employee" && (
                              <div className="flex justify-start px-2 w-full">
                                <div className="w-full max-w-full">
                                  <div className="space-y-3">
                                    <Label className="text-lg font-medium flex items-center gap-2">
                                      <Clock className="h-5 w-5" />
                                      Shift
                                      <span className="text-red-500 text-base">
                                        *
                                      </span>
                                    </Label>

                                    <Select
                                      value={selectedAttendanceType}
                                      onValueChange={(
                                        value: "Morning" | "Evening"
                                      ) => setSelectedAttendanceType(value)}
                                    >
                                      <SelectTrigger className="h-12 max-w-xl">
                                        <SelectValue placeholder="Select shift" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem
                                          value="Morning"
                                          className=" py-3"
                                        >
                                          <div className="flex items-center gap-3">
                                            {/* <Sun className="h-5 w-5 text-amber-600" /> */}
                                            <span>Morning Shift</span>
                                          </div>
                                        </SelectItem>
                                        <SelectItem
                                          value="Evening"
                                          className=" py-3"
                                        >
                                          <div className="flex items-center gap-3">
                                            {/* <Moon className="h-5 w-5 text-indigo-600" /> */}
                                            <span>Evening Shift</span>
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            )}
                        </div>

                        <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full   bg-gradient-to-br from-background to-muted/10 border-4 border-slate-700 flex items-center justify-center shadow-2xl overflow-hidden">
                          {fingerprintCaptured && fingerprintBase64 ? (
                            <img
                              src={fingerprintBase64}
                              alt="Captured fingerprint"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Fingerprint className="w-32 h-32 md:w-40 md:h-40 text-slate-500" />
                          )}
                        </div>

                        <Button
                          size="lg"
                          className="mt-8 w-64 md:w-72 h-14 text-lg"
                          onClick={() => setShowFingerprintScanner(true)}
                        >
                          {fingerprintCaptured
                            ? "Re-scan Fingerprint"
                            : "Start Identification"}
                        </Button>
                      </>
                    )}
                  </div>
                </Card>

                {/* RIGHT COLUMN - Status / Information Area */}
                <Card className="bg-card border-2 border-border/60 shadow-lg">
                  <div className="p-8 min-h-[380px] md:min-h-[480px] text-center space-y-8">
                    {showSuccess && successUser ? (
                      <>
                        <div className="flex flex-col items-center justify-center">
                          <Avatar className="h-28 w-28 md:h-36 md:w-36 border-4 border-background shadow-xl">
                            <AvatarImage
                              src={
                                successUser?.profile_image
                                  ? `${backendBasePath}${successUser?.profile_image}`
                                  : undefined
                              }
                            />
                            <AvatarFallback className="text-4xl">
                              {successUser?.name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <h2 className="text-2xl md:text-3xl font-bold">
                              {successUser?.name}
                            </h2>
                            <p className="text-lg text-muted-foreground mt-2">
                              ID: {successUser?.reference_num || "—"}
                            </p>
                          </div>
                        </div>
                        {successUser.user_type === "member" && (
                          <div className="flex gap-6 relative">
                            {/* Content Card */}
                            <Card className="flex-1 p-4 shadow-sm hover:shadow-md transition-shadow">
                              <h2 className="text-xl font-semibold text-left mb-3">
                                Membership Detail
                              </h2>

                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 w-full gap-4 text-sm">
                                <div className="flex text-left">
                                  <div className="space-y-1">
                                    <span className="text-muted-foreground">
                                      Status:
                                    </span>{" "}
                                    <Badge
                                      className={
                                        successUser?.status === "active"
                                          ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                                          : successUser?.status === "frozen"
                                          ? "bg-chart-2/10 text-chart-2 border-chart-2/20"
                                          : "bg-chart-1/10 text-chart-1 border-chart-1/20"
                                      }
                                    >
                                      {successUser?.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex gap-1 items-center justify-end">
                                  {/* <div className="space-y-1"> */}
                                  <span className="text-muted-foreground">
                                    Branch:
                                  </span>{" "}
                                  <div className="flex gap-1 w-fit items-center">
                                    <p className="text-xs w-fit bg-muted-foreground/10 py-1 px-2 rounded-md">
                                      {successUser?.branch?.reference_num}
                                    </p>{" "}
                                    <p className="font-medium">
                                      {successUser?.branch?.name || "—"}
                                    </p>
                                  </div>
                                  {/* </div> */}
                                </div>

                                <div className="text-left flex gap-1">
                                  <span className="text-muted-foreground">
                                    Plan:
                                  </span>{" "}
                                  <div className="flex gap-1 w-fit ">
                                    <p className="text-xs w-fit bg-muted-foreground/10 py-1 px-2 rounded-md">
                                      {userProfile?.plan?.reference_num}
                                    </p>{" "}
                                    <p className="font-medium">
                                      {userProfile?.plan?.name || "—"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-end">
                                  <span className="text-muted-foreground">
                                    Start date:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {formatDateToShortString(
                                      userProfile?.current_plan_start_date
                                    )}
                                  </span>
                                </div>
                                <div className="text-left">
                                  <span className="text-muted-foreground">
                                    Expiry date:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {successUser?.plan_expire_date
                                      ? formatDateToShortString(
                                          userProfile?.plan_expire_date
                                        )
                                      : "—"}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-muted-foreground">
                                    Remaining days:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {userProfile?.remaining_days_balance} days
                                  </span>
                                </div>
                                <div className="text-left">
                                  <span className="text-muted-foreground">
                                    Duration:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {userProfile?.plan?.duration_days} days
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-6 min-h-[380px] md:min-h-[480px] flex flex-col justify-between items-center">
                        <div className="mx-auto w-28 h-28 rounded-full bg-muted/50 flex items-center justify-center">
                          <User className="h-14 w-14 text-muted-foreground/70" />
                        </div>
                        <div className="text-center">
                          <h2 className="text-xl font-semibold">
                            Awaiting Recognition
                          </h2>
                          <p className="text-sm text-muted-foreground mt-2 max-w-md">
                            Position the member's face or place finger on
                            scanner to display details
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Keep your other-branch checkbox + shift selection here if needed */}
                    {/* {(method === "face" || method === "fingerprint") &&
                      activeTab === "member" && (
                        <div className="pt-6 w-full max-w-sm">
                          <div className="flex items-center justify-center gap-3">
                            <Checkbox
                              id="other-branch"
                              checked={isOtherBranch}
                              onCheckedChange={(checked) => {
                                setIsOtherBranch(!!checked);
                                if (!checked) setSelectedBranchId("");
                              }}
                            />
                            <Label
                              htmlFor="other-branch"
                              className="text-base cursor-pointer"
                            >
                              Member from another branch?
                            </Label>
                          </div>
                        </div>
                      )} */}

                    {/* {activeTab === "employee" &&
                      (method === "face" || method === "fingerprint") && (
                        <div className="w-full max-w-sm pt-4">
                          <Label className="text-lg mb-3 block">
                            Select Shift
                          </Label>
               
                        </div>
                      )} */}
                  </div>
                </Card>
              </div>
            ) : (
              // ── MANUAL MODE remains almost the same ──
              //     <Card>
              //       <CardContent className="pt-8 pb-10 px-6 md:px-10 space-y-8">
              //         {/* Your existing manual mode content here:
              // person selection, shift select, inputs, submit button... */}
              //         {!isMember && (
              //           <>
              //             {activeTab === "member" && (
              //               <div>
              //                 <Label className="text-lg">Select Member</Label>
              //                 <MemberSearchCombobox onSelect={setSelectedPerson} />
              //               </div>
              //             )}
              //             {activeTab === "employee" && (
              //               <div>
              //                 <Label className="text-lg">Select Employee</Label>
              //                 <EmployeeSearchCombobox
              //                   onSelect={setSelectedPerson}
              //                 />
              //               </div>
              //             )}
              //           </>
              //         )}

              //         {/* Add inside manual mode, after person selection */}
              //         {showManual && activeTab === "employee" && (
              //           <div className="space-y-3">
              //             <Label className="text-lg font-medium flex items-center gap-2">
              //               <Clock className="h-5 w-5" />
              //               Shift
              //               <span className="text-red-500 text-base">*</span>
              //             </Label>

              //             <Select
              //               value={selectedAttendanceType}
              //               onValueChange={(value: "Morning" | "Evening") =>
              //                 setSelectedAttendanceType(value)
              //               }
              //             >
              //               <SelectTrigger className="h-14 text-lg">
              //                 <SelectValue placeholder="Select shift" />
              //               </SelectTrigger>
              //               <SelectContent>
              //                 <SelectItem value="Morning" className="text-lg py-3">
              //                   <div className="flex items-center gap-3">
              //                     {/* <Sun className="h-5 w-5 text-amber-600" /> */}
              //                     <span>Morning Shift</span>
              //                   </div>
              //                 </SelectItem>
              //                 <SelectItem value="Evening" className="text-lg py-3">
              //                   <div className="flex items-center gap-3">
              //                     {/* <Moon className="h-5 w-5 text-indigo-600" /> */}
              //                     <span>Evening Shift</span>
              //                   </div>
              //                 </SelectItem>
              //               </SelectContent>
              //             </Select>

              //             {/* Optional small helper text */}
              //             {selectedAttendanceType && (
              //               <p className="text-sm text-muted-foreground mt-1.5">
              //                 Selected: <strong>{selectedAttendanceType}</strong>{" "}
              //                 attendance
              //               </p>
              //             )}
              //           </div>
              //         )}
              //         {/* Selected Person */}
              //         {targetUser && (
              //           <div className="flex items-center gap-6 p-4 bg-muted/30 rounded-lg">
              //             <Avatar className="h-16 w-16">
              //               <AvatarImage
              //                 src={`${backendBasePath}${targetUser?.profile_image}`}
              //               />
              //               <AvatarFallback>{targetUser?.name?.[0]}</AvatarFallback>
              //             </Avatar>
              //             <div>
              //               <h3 className="text-xl font-semibold">
              //                 {targetUser.name}
              //               </h3>
              //               <p className="text-sm text-muted-foreground">
              //                 ID: {targetUser.reference_num}
              //               </p>
              //             </div>
              //           </div>
              //         )}

              //         {/* Manual Inputs */}
              //         {showManual && (
              //           <div className="space-y-6 p-6 bg-muted/20 rounded-lg border">
              //             <h3 className="text-lg font-semibold flex items-center gap-2">
              //               <Calendar className="h-5 w-5" /> Manual Attendance
              //             </h3>
              //             <div className="grid grid-cols-2 gap-6">
              //               <div>
              //                 <Label>Check-in Time</Label>
              //                 <Input
              //                   type="time"
              //                   value={manualTime}
              //                   onChange={(e) => setManualTime(e.target.value)}
              //                 />
              //               </div>
              //               {activeTab === "employee" && (
              //                 <div>
              //                   <Label>Check-out Time (Optional)</Label>
              //                   <Input
              //                     type="time"
              //                     value={manualCheckoutTime}
              //                     onChange={(e) =>
              //                       setManualCheckoutTime(e.target.value)
              //                     }
              //                   />
              //                 </div>
              //               )}
              //             </div>
              //             <div>
              //               <Label>Date</Label>
              //               <Input
              //                 type="date"
              //                 value={manualDate}
              //                 onChange={(e) => setManualDate(e.target.value)}
              //                 defaultValue={new Date().toISOString().split("T")[0]}
              //               />
              //             </div>
              //           </div>
              //         )}

              //         <div className="text-center">
              //           <Button
              //             size="lg"
              //             className="w-fit px-12 h-14 text-xl"
              //             onClick={() => mutation.mutate({})}
              //             disabled={!targetUser || mutation.isPending}
              //           >
              //             {mutation.isPending ? "Processing..." : "Submit Manual"}
              //           </Button>
              //         </div>
              //       </CardContent>
              //     </Card>
              // showManual &&  (

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* LEFT CARD: Selection, Inputs, Submit */}
                <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
                  <CardContent className="p-6 md:p-8 space-y-8">
                    <div className="flex items-center gap-3 pb-4 border-b">
                      <Calendar className="h-6 w-6 text-primary" />
                      <h3 className="text-xl font-bold">Manual Attendance</h3>
                    </div>

                    {/* Member / Employee Tabs */}
                    <Tabs
                      value={activeTab}
                      onValueChange={(v) => setActiveTab(v as RoleTab)}
                    >
                      {/* <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="member">Member</TabsTrigger>
            <TabsTrigger value="employee">Employee</TabsTrigger>
          </TabsList> */}

                      <TabsContent value="member" className="space-y-6">
                        <div>
                          <Label className="text-lg font-medium mb-2 block">
                            Select Member
                          </Label>
                          <MemberSearchCombobox
                            filterStatus="active"
                            onSelect={setSelectedPerson}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="employee" className="space-y-6">
                        <div>
                          <Label className="text-lg font-medium mb-2 block">
                            Select Employee
                          </Label>
                          <EmployeeSearchCombobox
                            onSelect={setSelectedPerson}
                          />
                        </div>

                        {/* Attendance Type (Morning/Evening) */}
                        {/* {user?.user_type === "other" && ( */}
                        <div className="space-y-2">
                          <Label className=" font-medium flex items-center gap-2">
                            {/* <Clock className="h-5 w-5" /> */}
                            Attendance Type
                            <span className="text-red-500 text-base">*</span>
                          </Label>
                          <Select
                            value={selectedAttendanceType}
                            onValueChange={(value: "Morning" | "Evening") =>
                              setSelectedAttendanceType(value)
                            }
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Choose type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Morning">
                                <div className="flex items-center gap-3 py-1">
                                  {/* <Sun className="h-5 w-5 text-amber-600" /> */}
                                  Morning Attendance
                                </div>
                              </SelectItem>
                              <SelectItem value="Evening">
                                <div className="flex items-center gap-3 py-1">
                                  {/* <Moon className="h-5 w-5 text-indigo-600" /> */}
                                  Evening Attendance
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* )} */}
                      </TabsContent>
                    </Tabs>

                    {/* Date & Time */}
                    {isAdmin && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input
                            type="date"
                            value={manualDate}
                            onChange={(e) => setManualDate(e.target.value)}
                            defaultValue={
                              new Date().toISOString().split("T")[0]
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Check-in Time</Label>
                          <Input
                            type="time"
                            value={manualTime}
                            onChange={(e) => setManualTime(e.target.value)}
                          />
                        </div>

                        {activeTab === "employee" && (
                          <div className="space-y-2 sm:col-span-2">
                            <Label>Check-out Time (optional)</Label>
                            <Input
                              type="time"
                              value={manualCheckoutTime}
                              onChange={(e) =>
                                setManualCheckoutTime(e.target.value)
                              }
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        size="lg"
                        className="w-full h-14 text-lg"
                        onClick={() => mutation.mutate({})}
                        disabled={
                          !targetUser ||
                          mutation.isPending ||
                          (activeTab === "employee" && !selectedAttendanceType)
                        }
                      >
                        {mutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <Loading inButton size="sm" />
                            Processing...
                          </span>
                        ) : (
                          `Submit ${
                            activeTab === "member" ? "Member" : "Employee"
                          } Attendance`
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* RIGHT CARD: Selected User Details */}
                <Card
                  className={cn(
                    "border-2 shadow-lg transition-all duration-300",
                    targetUser
                      ? "border-green-500/40 bg-green-50/5"
                      : "border-primary/20 bg-gradient-to-b from-card to-muted/20"
                  )}
                >
                  <CardContent className="p-8 flex flex-col items-center justify-center min-h-[480px] text-center">
                    {targetUser ? (
                      <div className="space-y-8 w-full max-w-lg">
                        {/* Avatar */}
                        <div className="relative flex flex-col gap-4 items-center justify-center">
                          <Avatar className="h-40 w-40 mx-auto ring-8 ring-primary/20 shadow-2xl">
                            <AvatarImage
                              src={`${backendBasePath}${targetUser?.profile_image}`}
                              alt={targetUser.name}
                            />
                            <AvatarFallback className="text-5xl bg-primary/10">
                              {targetUser?.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          {/* Status Badge */}
                          {/* <Badge
                className=" px-4 py-1 text-base"
                variant={activeTab === "member" ? "default" : "secondary"}
              >
                {activeTab === "member" ? "Member" : "Employee"}
              </Badge> */}
                        </div>

                        {/* Name & ID */}
                        <div>
                          <h3 className="text-3xl font-bold">
                            {targetUser.name}
                          </h3>
                          <p className="text-xl text-muted-foreground mt-2">
                            ID: {targetUser.reference_num || "—"}
                          </p>
                        </div>

                        {activeTab === "member" && targetUser && (
                          <div className="flex gap-6 relative">
                            {/* Content Card */}
                            <Card className="flex-1 p-4 shadow-sm hover:shadow-md transition-shadow">
                              <h2 className="text-xl font-semibold text-left mb-3">
                                Membership Detail
                              </h2>

                              <div className="mt-3 w-full gap-4 text-sm space-y-2">
                                <div className="flex text-left">
                                  <div className="space-y-1">
                                    <span className="text-muted-foreground text-lg font-semibold">
                                      Status:
                                    </span>{" "}
                                    <Badge
                                      className={
                                        targetUser?.status === "active"
                                          ? "bg-chart-3/10 text-chart-3 border-chart-3/20"
                                          : targetUser?.status === "frozen"
                                          ? "bg-chart-2/10 text-chart-2 border-chart-2/20"
                                          : "bg-chart-1/10 text-chart-1 border-chart-1/20"
                                      }
                                    >
                                      {targetUser?.status.toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                 <div className="text-left text-lg font-semibold text-primary">
                                  <span className="text-muted-foreground">
                                    Remaining days:
                                  </span>{" "}
                                  <span className="">
                                    {
                                      targetUser?.member_profile
                                        ?.remaining_days_balance
                                    }{" "}
                                    days
                                  </span>
                                </div>
                                <div className="flex col-span-2 gap-1 items-center  ">
                                  {/* <div className="space-y-1"> */}
                                  <span className="text-muted-foreground  text-lg font-bold">
                                    Base Branch:
                                  </span>{" "}
                                  <div className="flex gap-1 w-fit ">
                                    <p className="text-xs w-fit bg-muted-foreground/10 py-1 px-2 rounded-md">
                                      {targetUser?.branch?.reference_num}
                                    </p>{" "}
                                    <p className="">
                                      {targetUser?.branch?.name || "—"}
                                    </p>
                                  </div>
                                  {/* </div> */}
                                </div>
<div className="grid md:grid-cols-2 grid-cols-1 gap-3 mt-4">
                                <div className="text-left flex gap-1">
                                  <span className="text-muted-foreground">
                                    Plan:
                                  </span>{" "}
                                  <div className="flex gap-1 w-fit ">
                                    <p className="text-xs w-fit bg-muted-foreground/10 py-1 px-2 rounded-md">
                                      {
                                        targetUser?.member_profile?.plan
                                          ?.reference_num
                                      }
                                    </p>{" "}
                                    <p className="font-medium">
                                      {targetUser?.member_profile?.plan?.name ||
                                        "—"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-muted-foreground">
                                    Start date:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {targetUser?.member_profile
                                      ?.current_plan_start_date &&
                                      formatDateToShortString(
                                        targetUser?.member_profile
                                          ?.current_plan_start_date
                                      )}
                                  </span>
                                </div>
                                <div className="text-left">
                                  <span className="text-muted-foreground">
                                    Expiry date:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {targetUser?.member_profile
                                      ?.current_plan_expire_date
                                      ? formatDateToShortString(
                                          targetUser?.member_profile
                                            ?.current_plan_expire_date
                                        )
                                      : "—"}
                                  </span>
                                </div>
                               
                                <div className="text-left">
                                  <span className="text-muted-foreground">
                                    Duration:
                                  </span>{" "}
                                  <span className="font-medium">
                                    {
                                      targetUser?.member_profile?.plan
                                        ?.duration_days
                                    }{" "}
                                    days
                                  </span>
                                </div>
                              </div>
                              </div>
                            </Card>
                          </div>
                        )}

                        {/* Extra Info (if employee + type selected) */}
                        {activeTab === "employee" && selectedAttendanceType && (
                          <div className="pt-4 border-t border-border/50">
                            <Badge
                              variant="outline"
                              className="text-lg px-6 py-2"
                            >
                              {selectedAttendanceType} Attendance Selected
                            </Badge>
                          </div>
                        )}

                        <p className="text-sm text-muted-foreground italic pt-6">
                          Ready to submit manual attendance
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-12 space-y-4">
                        <User className="h-24 w-24 mx-auto opacity-30" />
                        <h4 className="text-2xl font-medium">
                          No User Selected
                        </h4>
                        <p className="max-w-xs mx-auto">
                          Search and select a {activeTab} from the left panel to
                          continue
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Today's Date */}
            {/* <div className="text-center text-3xl font-bold text-muted-foreground">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div> */}
          </div>
          {/* FINGERPRINT SCANNER MODAL */}
          <FingerprintScanner
            isOpen={showFingerprintScanner}
            title="Place finger on scanner"
            onCapture={({ preview, raw }) => {
              console.log("raw", raw);
              setFingerprintBase64(preview); // for showing in circle
              setFingerprintCaptured(true);
              // Store raw for sending
              setFingerprintRaw(raw);
            }}
            onClose={() => setShowFingerprintScanner(false)}
          />
        </>
      )}
    </div>
  );
}
