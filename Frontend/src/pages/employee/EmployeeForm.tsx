// src/pages/employees/EmployeeForm.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createOrUpdateEmployeeAsyncThunk,
  refrenceEmployeeAsyncThunk,
  verifyUserFingerprintAsyncThunk,
  // checkImage,
} from "@/redux/pagesSlices/peopleSlice";
import { RootState } from "@/redux/store";
import {
  ArrowLeft,
  Camera,
  Briefcase,
  Edit,
  X,
  Check,
  ChevronsUpDown,
  EyeOff,
  Eye,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import Loading from "@/components/shared/loaders/Loading";
import FaceCaptureModal from "@/components/faceDetection/FaceCaptureModal";
import { toast } from "@/hooks/use-toast";
import { backendBasePath } from "@/constants";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getShiftsAsyncThunk } from "@/redux/pagesSlices/feeCollectionSlice";
import { usePermissions } from "@/permissions/usePermissions";
import { PERMISSIONS } from "@/permissions/permissions";
import { getCurrentBranchAsyncThunk } from "@/redux/pagesSlices/planSlice";
import { getRolesAsyncThunk } from "@/redux/pagesSlices/userSlice"; // Add this import
import { formatTimeTo12Hour, isValidTimeRange } from "@/utils/helper";
import FingerprintScanner from "@/components/fingerPrintDetection/FingerprintScanner";
import EmployeeFingerprintCapture from "@/components/fingerPrintDetection/FingerprintCapture";
import { verifyUserFaceAsyncThunk } from "@/redux/pagesSlices/peopleSlice";
import { CloudCog } from "lucide-react";
import CustomCheckbox from "@shared/CustomCheckbox";
interface Employee {
  id?: number;
  name: string;
  address?: string;
  cnic?: string;
  phone: string;
  profile_image?: string;
  employee_profile?: {
    designation?: string;
    salary?: string;
    shift_id?: number;
    rest_days?: string[];
    join_date?: string;
  };
  assign_branches?: Array<{ branch_id: number }>;
  email?: string;
}

interface Props {
  employee?: Employee | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
interface ShiftTime {
  morning_start_time?: string; // HH:mm:ss or HH:mm
  morning_end_time?: string;
  evening_start_time?: string;
  evening_end_time?: string;
}

interface WeekDaySchedule extends ShiftTime {
  type: "week_day";
}

interface RestDaySchedule extends ShiftTime {
  type: "rest_day";
  rest_day_name: string; // "Saturday", "Sunday", etc.
}

type ShiftScheduleItem = WeekDaySchedule | RestDaySchedule;
export default function EmployeeForm({ employee, onSuccess, onCancel }: Props) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isEdit = !!employee?.id;
  console.log("employee::", employee?.roles[0]?.name);
  const { shifts, loadings } = useSelector(
    (state: RootState) => state.feeCollection
  );
  const { employeeRefId } = useSelector((state: any) => state.people);
  const { currentBranch } = useSelector((state: RootState) => state.plan);
  const branches = useSelector(
    (state: RootState) => state.plan.branchesList || []
  );
  // console.log("currentBranch", employeeRefId);
  const [loading, setLoading] = useState(false);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [faceCaptureOpen, setFaceCaptureOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation states
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState<string>("");
  const [openRoleDropdown, setOpenRoleDropdown] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(
    employee?.roles[0]?.id || null
  );
  const [selectedRoleName, setSelectedRoleName] = useState<string>(
    employee?.roles[0]?.name || ""
  );
  const [showScanner, setShowScanner] = useState(false);
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
  const [isFaceVerifying, setIsFaceVerifying] = useState(false);
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [hasProfileImage, setHasProfileImage] = useState(false);
  const handleFingerprintCapture = (base64: string) => {
    setFingerprintImage(base64);
    // Save to form data or upload to server
    console.log("Captured Base64:", base64.substring(0, 50) + "...");
    toast({ title: "Fingerprint Captured!" });
    setShowScanner(false);
  };
  // Fetch roles from Redux (same slice as Users tab)
  const { roles, loadings: rolesLoading } = useSelector(
    (state: RootState) => state.user
  );
  const [fingerprintRaw, setFingerprintRaw] = useState<string>("");
  const [isFingerprintVerifying, setIsFingerprintVerifying] = useState(false);
  const [isFingerprintVerified, setIsFingerprintVerified] = useState(false);
  const [hasFingerprint, setHasFingerprint] = useState(false);
  const [openBranchDropdown, setOpenBranchDropdown] = useState(false);
  const [assignBranches, setAssignBranches] = useState(false);
  const [formData, setFormData] = useState({
    name: employee?.name || "",
    cnic: employee?.employee_profile?.cnic || "",
    address: employee?.employee_profile?.address || "",
    phone: employee?.phone || "",
    password: "",
    designation: employee?.employee_profile?.designation || "",
    salary: employee?.employee_profile?.salary || "",
    shift_id: employee?.employee_shifts
      ? employee.employee_shifts.map((shift) => shift?.shift?.id.toString())
      : [],
    rest_days: employee?.employee_profile?.rest_days || [],
    join_date: employee?.employee_profile?.join_date ||  new Date().toISOString().split("T")[0],
    profile_image: null as File | null,
    fingerprint_data: null as File | null,
    email: employee?.email || "",
    branch_ids: [] as number[],
  });
  const { hasPermission } = usePermissions();

  const allDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // State
  const [weekdayShift, setWeekdayShift] = useState<ShiftTime>({}); // common timings for non-rest days

  const [selectedRestDays, setSelectedRestDays] = useState<string[]>([]);

  const [restDayShifts, setRestDayShifts] = useState<Record<string, ShiftTime>>(
    {}
  );

  // Initialize from existing employee data (edit mode)
  useEffect(() => {
    if (employee?.employee_shifts?.length) {
      const schedule = employee.employee_shifts;

      // Find weekday entry
      const weekDayEntry = schedule.find((s) => s.type === "week_day");
      if (weekDayEntry) {
        setWeekdayShift({
          morning_start_time: weekDayEntry.morning_start_time,
          morning_end_time: weekDayEntry.morning_end_time,
          evening_start_time: weekDayEntry.evening_start_time,
          evening_end_time: weekDayEntry.evening_end_time,
        });
      }

      // Find rest days
      const restDays = schedule
        .filter((s) => s.type === "rest_day")
        .map((s) => ({
          name: s.rest_day_name!,
          times: {
            morning_start_time: s.morning_start_time,
            morning_end_time: s.morning_end_time,
            evening_start_time: s.evening_start_time,
            evening_end_time: s.evening_end_time,
          },
        }));

      setSelectedRestDays(restDays.map((d) => d.name));
      setRestDayShifts(
        Object.fromEntries(restDays.map((d) => [d.name, d.times]))
      );
    }
  }, [employee]);

  // Helpers
  const updateWeekdayTime = (field: keyof ShiftTime, value: string) => {
    setWeekdayShift((prev) => {
      const newShift = { ...prev, [field]: value || undefined };

      // Validate after update
      const morningValid = isValidTimeRange(
        newShift.morning_start_time,
        newShift.morning_end_time
      );
      const eveningValid = isValidTimeRange(
        newShift.evening_start_time,
        newShift.evening_end_time
      );

      setTimeErrors((prev) => ({
        ...prev,
        weekdayMorning: morningValid
          ? undefined
          : "Start time must be before end time",
        weekdayEvening: eveningValid
          ? undefined
          : "Start time must be before end time",
      }));

      return newShift;
    });
  };

  const updateRestDayTime = (
    day: string,
    field: keyof ShiftTime,
    value: string
  ) => {
    setRestDayShifts((prev) => {
      const newTimes = {
        ...prev[day],
        [field]: value || undefined,
      };

      const morningValid = isValidTimeRange(
        newTimes.morning_start_time,
        newTimes.morning_end_time
      );
      const eveningValid = isValidTimeRange(
        newTimes.evening_start_time,
        newTimes.evening_end_time
      );

      setTimeErrors((prev) => ({
        ...prev,
        restDays: {
          ...prev.restDays,
          [day]: {
            morning: morningValid
              ? undefined
              : "Start time must be before end time",
            evening: eveningValid
              ? undefined
              : "Start time must be before end time",
          },
        },
      }));

      return {
        ...prev,
        [day]: newTimes,
      };
    });
  };
  const isWeekday = (day: string) => !selectedRestDays.includes(day);
  const toggleRestDay = (day: string) => {
    setSelectedRestDays((prev) => {
      if (prev.includes(day)) {
        // Remove from rest days → becomes normal weekday
        const { [day]: _, ...remaining } = restDayShifts;
        setRestDayShifts(remaining);
        return prev.filter((d) => d !== day);
      } else {
        // Add as rest day → remove from common weekday logic
        setRestDayShifts((prev) => ({
          ...prev,
          [day]: {}, // start with empty optional times
        }));
        return [...prev, day];
      }
    });
  };
  const [timeErrors, setTimeErrors] = useState<{
    weekdayMorning?: string;
    weekdayEvening?: string;
    restDays: Record<string, { morning?: string; evening?: string }>;
  }>({
    restDays: {},
  });

  useEffect(() => {
    dispatch(getCurrentBranchAsyncThunk({ disable_page_param: 1 }));
  }, [dispatch]);
  useEffect(() => {
    if (!isEdit) {
      dispatch(refrenceEmployeeAsyncThunk({}));
    }
  }, []);
  useEffect(() => {
    const hasFp =
      !!fingerprintRaw || (isEdit && !!employee?.fingerprint_encoding);
    setHasFingerprint(hasFp);
    setIsFingerprintVerified(false); // Only true after real verification
  }, [fingerprintRaw, isEdit, employee?.fingerprint_encoding]);
  useEffect(() => {
    if (!fingerprintRaw) return;

    const checkFingerprint = async () => {
      setIsFingerprintVerifying(true);
      setIsFingerprintVerified(false);

      try {
        // Adjust type if your backend expects different (wsq, raw, etc.)
        const blob = new Blob([fingerprintRaw], {
          type: "application/octet-stream",
        });
        const file = new File([blob], "fingerprint.wsq");

        const data = new FormData();
        data.append("fingerprint_data", file);
        data.append("user_type", "employee");
        if (isEdit && employee?.id) data.append("id", employee.id.toString());

        const result = await dispatch(
          verifyUserFingerprintAsyncThunk({ data })
        ).unwrap();

        if (result.status === "success") {
          setIsFingerprintVerified(true);
          toast({
            title: "Fingerprint Verified ✓",
            description: "Fingerprint accepted",
            variant: "default",
          });
        } else {
          setIsFingerprintVerified(false);
          toast({
            title: "Fingerprint Verification Failed",
            description: result.errors || "Please recapture",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        setIsFingerprintVerified(false);
        toast({
          title: "Fingerprint Check Failed",
          description: err.errors || "Server error",
          variant: "destructive",
        });
      } finally {
        setIsFingerprintVerifying(false);
      }
    };

    checkFingerprint();
  }, [fingerprintRaw, dispatch, isEdit, employee?.id]);
  useEffect(() => {
    console.log("currentBranch::", currentBranch?.id);
    if (currentBranch?.id) {
      dispatch(
        getShiftsAsyncThunk({
          disable_page_param: 1,
          filter_status: "active",
          filter_branch_id: currentBranch?.id,
        })
      );
    }
  }, [dispatch, currentBranch]);
  useEffect(() => {
    dispatch(getRolesAsyncThunk({ disable_page_param: 1 }));
  }, [dispatch]);
  useEffect(() => {
    if (isEdit && employee) {
      const assignedBranches = employee.assign_branches || [];
      const branchIds = assignedBranches
        .map((item) => item.branch_id)
        .filter((id) => typeof id === "number" && id > 0);

      setFormData((prev) => ({
        ...prev,
        branch_ids: branchIds,
      }));

      setAssignBranches(branchIds.length > 0);
    }
  }, [isEdit, employee]);
  useEffect(() => {
    const hasImage =
      !!capturedBase64 ||
      !!formData.profile_image ||
      (isEdit && !!employee?.profile_image);

    setHasProfileImage(hasImage);

    // Never auto-verify existing image — only after real API success
    setIsFaceVerified(false);
  }, [capturedBase64, formData.profile_image, isEdit, employee?.profile_image]);
  useEffect(() => {
    if (!capturedBase64 && !formData.profile_image) return;

    const imageToVerify = capturedBase64 || formData.profile_image;

    const checkFace = async () => {
      setIsFaceVerifying(true);
      setIsFaceVerified(false);

      try {
        let file: File;
        if (typeof imageToVerify === "string") {
          const blob = await fetch(imageToVerify).then((r) => r.blob());
          file = new File([blob], "face.jpg", { type: "image/jpeg" });
        } else {
          file = imageToVerify;
        }

        const data = new FormData();
        data.append("profile_image", file);
        data.append("user_type", "employee"); // ← Important: employee
        if (isEdit && employee?.id) data.append("id", employee.id.toString());

        const result = await dispatch(
          verifyUserFaceAsyncThunk({ data })
        ).unwrap();

        if (result.status === "success") {
          setIsFaceVerified(true);
          toast({
            title: "Face Verified ✓",
            description: "Profile photo accepted",
            variant: "default",
          });
        } else {
          setIsFaceVerified(false);
          toast({
            title: "Face Verification Failed",
            description: result.errors || "Please try capturing again",
            variant: "destructive",
          });
        }
      } catch (err: any) {
        setIsFaceVerified(false);
        toast({
          title: "Face Check Failed",
          description: err.errors || "Verification failed",
          variant: "destructive",
        });
      } finally {
        setIsFaceVerifying(false);
      }
    };

    checkFace();
  }, [capturedBase64, formData.profile_image, dispatch, isEdit, employee?.id]);

// 1. Phone change handler — only updates phone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;

    setFormData((prev) => {
      const newState = {
        ...prev,
        phone: newPhone,
      };

      // Only auto-fill in CREATE mode
      if (!isEdit) {
        // If password is empty OR still exactly matches old phone → sync it
        if (!prev.password || prev.password === prev.phone) {
          newState.password = newPhone;
        }
      }

      return newState;
    });

    setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      password: e.target.value,
    }));
    setErrors((prev) => ({ ...prev, password: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string[]> = {};
    console.log("formData.salary", formData.salary);
    if (!formData.name.trim()) newErrors.name = ["Full name is required"];

    // if (!formData.phone.trim()) newErrors.phone = ["Phone is required"];
    if (!formData.designation.trim())
      newErrors.designation = ["Designation is required"];
    if (!formData.salary) newErrors.salary = ["Salary is required"];
    // if (!formData.shift_id || formData.shift_id.length === 0) {
    //   newErrors.shift_id = ["Please select at least one shift"];
    // }
    // At least one shift time (morning or evening) for each weekday
    const hasMorningShift =
      weekdayShift.morning_start_time && weekdayShift.morning_end_time;

    const hasEveningShift =
      weekdayShift.evening_start_time && weekdayShift.evening_end_time;

    if (!hasMorningShift && !hasEveningShift) {
      newErrors.shift_schedule = [
        "At least one complete shift (morning or evening) with both start and end times is required for working days",
      ];
    }
    if (!formData.join_date) newErrors.join_date = ["Join date is required"];
    const rawPhone = String(formData.phone || "").trim();
    if (!rawPhone) {
      newErrors.phone = ["Phone number is required"];
    } else {
      const digitsOnly = rawPhone.replace(/\D/g, "");

      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        newErrors.phone = ["Please enter a valid Phone number (7–15 digits)"];
      }
    }
    // const email = (formData.email || "").trim();
    // if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    //   newErrors.email = ["Please enter a valid email address"];
    // }
    // if (!formData.phone?.trim()) {
    //   newErrors.phone = ["Phone number is required"];
    // } else {
    //   const phone = formData.phone.trim();
    //   const cleaned = phone.replace(/[\s\-\(\)]/g, "");

    //   if (!/^(\+\d{1,4})?\d{7,15}$/.test(cleaned)) {
    //     newErrors.phone = [
    //       "Please enter a valid phone number (7–15 digits, country code like +1 or +44)",
    //     ];
    //   }
    // }

    if (formData.cnic?.trim()) {
      const cnic = formData.cnic.trim();

      if (cnic.length < 7) {
        newErrors.cnic = ["ID number seems too short"];
      } else if (/[^A-Za-z0-9\s\-]/.test(cnic)) {
        newErrors.cnic = ["ID number contains invalid characters"];
      }
    }
    // if (!isEdit && !capturedBase64 && !formData.profile_image) {
    //   newErrors.profile_image = ["Profile photo is required"];
    // }

    if (!isEdit && formData.password && formData.password.length < 6) {
      newErrors.password = ["Password must be at least 6 characters"];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrors({});
    setServerError("");

    if (!validateForm()) {
      toast({
        title: "Validation Failed",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const data = new FormData();

    data.append("name", formData.name.trim());
    data.append("cnic", formData.cnic.trim());
    data.append("address", formData.address.trim());
    data.append("phone", formData.phone.trim());
    data.append("designation", formData.designation);
    data.append("salary", formData.salary);
    data.append("email", formData.email.trim());
    if (formData.branch_ids?.length > 0) {
      formData.branch_ids.forEach((id) => {
        data.append("branch_id[]", id.toString());
      });
    }
    if (fingerprintRaw) {
      const blob = new Blob([fingerprintRaw], {
        type: "application/octet-stream",
      });
      const file = new File([blob], "fingerprint.wsq");
      data.append("fingerprint_data", file);
    }
    // data.append("shift_id", formData.shift_id);
    // formData.shift_id.forEach((id) => {
    //   data.append("shift_id[]", id);
    // });
    let index = 0;

    // Standard weekday timings (applies to all non-rest days)
    data.append(`shift_schedule[${index}][type]`, "week_day");
    if (weekdayShift.morning_start_time)
      data.append(
        `shift_schedule[${index}][morning_start_time]`,
        weekdayShift.morning_start_time
      );
    if (weekdayShift.morning_end_time)
      data.append(
        `shift_schedule[${index}][morning_end_time]`,
        weekdayShift.morning_end_time
      );
    if (weekdayShift.evening_start_time)
      data.append(
        `shift_schedule[${index}][evening_start_time]`,
        weekdayShift.evening_start_time
      );
    if (weekdayShift.evening_end_time)
      data.append(
        `shift_schedule[${index}][evening_end_time]`,
        weekdayShift.evening_end_time
      );
    index++;

    // Rest/special days
    selectedRestDays.forEach((day) => {
      const times = restDayShifts[day] || {};

      data.append(`shift_schedule[${index}][type]`, "rest_day");
      data.append(`shift_schedule[${index}][rest_day_name]`, day);

      if (times.morning_start_time)
        data.append(
          `shift_schedule[${index}][morning_start_time]`,
          times.morning_start_time
        );
      if (times.morning_end_time)
        data.append(
          `shift_schedule[${index}][morning_end_time]`,
          times.morning_end_time
        );
      if (times.evening_start_time)
        data.append(
          `shift_schedule[${index}][evening_start_time]`,
          times.evening_start_time
        );
      if (times.evening_end_time)
        data.append(
          `shift_schedule[${index}][evening_end_time]`,
          times.evening_end_time
        );

      index++;
    });
    data.append("join_date", formData.join_date);

    formData.rest_days.forEach((day) => {
      data.append("rest_days[]", day.toLowerCase());
    });
    if (selectedRoleId) {
      data.append("role_group_id", selectedRoleId.toString());
    }
    if (formData.password)
      //!isEdit &&
      data.append("password", formData.password);
    if (isEdit && employee?.id) data.append("id", employee.id.toString());

    if (capturedBase64) {
      const blob = await fetch(capturedBase64).then((r) => r.blob());
      const file = new File([blob], "face_capture.jpg", { type: "image/jpeg" });
      data.append("profile_image", file);
    } else if (formData.profile_image) {
      data.append("profile_image", formData.profile_image);
    }

    try {
      await dispatch(createOrUpdateEmployeeAsyncThunk(data)).unwrap();
      toast({ title: isEdit ? "Employee Updated!" : "Employee Created!" });
      onSuccess?.();
    } catch (err: any) {
      let validationErrors: Record<string, string[]> = {};

      if (
        err?.errors &&
        typeof err.errors === "object" &&
        !Array.isArray(err.errors)
      ) {
        validationErrors = err.response?.data?.errors;
      } else if (typeof err?.errors === "string") {
        const msg = err.response?.data?.errors.toLowerCase();
        if (msg?.includes("email"))
          validationErrors.email = [err.response?.data?.errors];
        else if (msg?.includes("phone"))
          validationErrors.phone = [err.response?.data?.errors];
        else if (
          msg?.includes("profile image") ||
          msg?.includes("profile_image")
        )
          validationErrors.profile_image = [err.response?.data?.errors];
        else setServerError(err.response?.data?.errors);
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast({
          title: "Validation Error",
          description: "Please check the highlighted fields",
          variant: "destructive",
        });
      } else {
        const msg = err?.errors || "Failed to save employee";
        console.log("msg", msg, err);

        setServerError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const ErrorText = ({ msg }: { msg?: string[] }) => {
    if (!msg || msg.length === 0) return null;
    return <p className="text-red-500 text-xs mt-1">{msg[0]}</p>;
  };

  return (
    <div className=" py-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 text-sm mb-4">
          <button
            onClick={onCancel || (() => navigate("/employees"))}
            className="flex items-center gap-2 hover:text-primary transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Employees
          </button>
          <span>/</span>
          <span className="font-medium">
            {isEdit ? "Edit" : "Add"} Employee
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              {isEdit ? (
                <Edit className="h-7 w-7" />
              ) : (
                <UserPlus className="h-7 w-7" />
              )}
              {isEdit ? "Edit Employee" : "Add New Employee"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-4 justify-center flex-wrap">
              {/* Profile Image Section */}
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative inline-block">
                    {capturedBase64 ||
                    formData.profile_image ||
                    employee?.profile_image ? (
                      <>
                        <img
                          src={
                            formData.profile_image
                              ? URL.createObjectURL(formData.profile_image)
                              : capturedBase64
                              ? capturedBase64
                              : `${backendBasePath}${employee?.profile_image}`
                          }
                          alt="Employee profile"
                          className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-xl"
                        />

                        {/* Verifying Spinner */}
                        {isFaceVerifying && (
                          <div className="absolute inset-0 rounded-full border-4 border-gray-300 border-t-primary animate-spin pointer-events-none"></div>
                        )}

                        {/* Success Checkmark */}
                        {isFaceVerified && !isFaceVerifying && (
                          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-green-500/30 pointer-events-none">
                            <svg
                              className="h-14 w-14 text-green-600 drop-shadow-lg"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-muted border-4 flex items-center justify-center">
                        <UserPlus className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Error under photo */}
                {errors.profile_image && (
                  <div className="flex justify-center mt-2">
                    <ErrorText msg={errors.profile_image} />
                  </div>
                )}

                {/* Capture Button */}
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={() => setFaceCaptureOpen(true)}
                    variant={errors.profile_image ? "destructive" : "default"}
                    disabled={isFaceVerifying}
                    className="min-w-48"
                  >
                    {isFaceVerifying ? (
                      <>
                        <CloudCog className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        {capturedBase64 || formData.profile_image
                          ? isFaceVerified
                            ? "Change Photo ✓"
                            : "Recapture Face"
                          : "Capture Face"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <EmployeeFingerprintCapture
                  onFingerprintCapture={(base64) => {
                    // Save to form or upload
                    console.log("Fingerprint ready:", base64);
                    setFingerprintRaw(base64);
                    setFingerprintImage(base64);
                    // Save to form data or upload to server

                    toast({ title: "Fingerprint Captured!" });
                    setShowScanner(false);
                  }}
                  isVerifying={isFingerprintVerifying}
                  isVerified={isFingerprintVerified}
                  initialFingerprint={
                    isEdit && employee?.member_profile?.fingerprint_encoding
                      ? `${backendBasePath}${employee?.member_profile?.fingerprint_encoding}`
                      : ""
                  }
                />
                {/* <Button onClick={() => setShowScanner(true)}>
                  Capture Fingerprint
                </Button>

                {fingerprintImage && (
                  <div className="mt-4">
                    <img
                      src={fingerprintImage}
                      alt="Fingerprint"
                      className="w-48 h-64 object-contain rounded-lg border"
                    />
                  </div>
                )}

                <FingerprintScanner
                  isOpen={showScanner}
                  onCapture={handleFingerprintCapture}
                  onClose={() => setShowScanner(false)}
                /> */}
              </div>
            </div>
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>
                  Reference ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  readOnly={true}
                  value={employeeRefId || employee?.reference_num}
                  placeholder="Enter Full name"
                />
                {/* <ErrorText msg={errors.name} /> */}
              </div>
              <div>
                <Label>
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={errors.name ? "border-red-500" : ""}
                  placeholder="Enter First name"
                />
                <ErrorText msg={errors.name} />
              </div>

              {/* <div>
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => {
                    setFormData({ ...formData, last_name: e.target.value });
                    setErrors((prev) => ({ ...prev, last_name: undefined }));
                  }}
                  className={errors.last_name ? "border-red-500" : ""}
                  placeholder="Enter Last name"
                />
                <ErrorText msg={errors.last_name} />
              </div> */}

              {/* <div>
                <Label>Email <span className="text-red-500">*</span></Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="user@example.com"
                />
                <ErrorText msg={errors.email} />
              </div> */}

              <div>
                <Label>
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  maxLength={15}
                  value={formData.phone}
                  // onChange={(e) => {
                  //   const value = e.target.value;
                  //   if (value.length <= 15) {
                  //     setFormData({ ...formData, phone: e.target.value });
                  //     setErrors((prev) => ({ ...prev, phone: undefined }));
                  //   }
                  // }}
                  onChange={handlePhoneChange}
                  className={errors.phone ? "border-red-500" : ""}
                  placeholder="Enter Phone"
                />
                <ErrorText msg={errors.phone} />
              </div>

              {/* {!isEdit && ( */}
              <div className="relative">
                <Label>Password  <span className="text-red-500">*</span></Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  // onChange={(e) => {
                  //   setFormData({ ...formData, password: e.target.value });
                  //   setErrors((prev) => ({ ...prev, password: undefined }));
                  // }}
                  onChange={handlePasswordChange}
                  required={!isEdit}
                  className={errors.password ? "border-red-500" : ""}
                  placeholder="Enter Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 top-7 cursor-pointer flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <ErrorText msg={errors.password} />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="Enter email"
                />
                <ErrorText msg={errors.email} />
              </div>
              {/* )} */}
              {/* <div>
                <Label>
                  Designation <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.designation}
                  onChange={(e) => {
                    setFormData({ ...formData, designation: e.target.value });
                    setErrors((prev) => ({ ...prev, designation: undefined }));
                  }}
                  className={errors.designation ? "border-red-500" : ""}
                  placeholder="Trainer, Receptionist..."
                />
                <ErrorText msg={errors.designation} />
              </div> */}
              <div>
                <Label>
                  Designation <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.designation}
                  onValueChange={(value) => {
                    setFormData({ ...formData, designation: value });
                    setErrors((prev) => ({ ...prev, designation: undefined }));
                  }}
                >
                  <SelectTrigger
                    className={errors.designation ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trainer">Trainer</SelectItem>
                    <SelectItem value="HOD">HOD</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Cleaning Staff">
                      Cleaning Staff
                    </SelectItem>
                  </SelectContent>
                </Select>
                <ErrorText msg={errors.designation} />
              </div>
              <div>
                <Label>
                  Salary <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => {
                    setFormData({ ...formData, salary: e.target.value });
                    setErrors((prev) => ({ ...prev, salary: undefined }));
                  }}
                  className={errors.salary ? "border-red-500" : ""}
                  placeholder="50000"
                />
                <ErrorText msg={errors.salary} />
              </div>
              <div className="space-y-2">
                <Label>
                  Assign Role <span className="text-red-500">*</span>
                </Label>
                <Popover
                  open={openRoleDropdown}
                  onOpenChange={setOpenRoleDropdown}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openRoleDropdown}
                      className={cn(
                        "w-full justify-between",
                        !selectedRoleId && "text-muted-foreground"
                      )}
                    >
                      {selectedRoleName || "Select role..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search role..." />
                      <CommandEmpty>
                        {rolesLoading?.getRoles
                          ? "Loading..."
                          : "No role found"}
                      </CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {roles?.results
                          ?.filter((role: any) => role.name !== "Member") // Exclude "Member"
                          .map((role: any) => (
                            <CommandItem
                              key={role.id}
                              onSelect={() => {
                                setSelectedRoleId(role.id);
                                setSelectedRoleName(role.name);
                                setErrors((prev) => ({
                                  ...prev,
                                  role_group_id: undefined,
                                }));
                                setOpenRoleDropdown(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedRoleId === role.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {role.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {/* Role validation error */}
                {errors.role_group_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.role_group_id[0]}
                  </p>
                )}
              </div>

              {/* <div>
                <Label>
                  Shifts <span className="text-red-500">*</span>
                </Label>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        errors.shift_id && "border-red-500"
                      )}
                    >
                      {formData.shift_id.length > 0
                        ? `${formData.shift_id.length} shift(s) selected`
                        : "Select shifts"}
                      <ChevronsUpDown className="ml-2 mt-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  {loadings.fetchShift ? (
                    <Loading />
                  ) : (
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search shifts..." />
                        
                        <CommandGroup className="max-h-64 overflow-auto">
                          {
                            // hasPermission(PERMISSIONS.SHIFT_VIEW) ? (
                            shifts?.length > 0 ? (
                              shifts?.map((shift: any) => (
                                <CommandItem
                                  key={shift.id}
                                  onSelect={() => {
                                    const idStr = shift.id.toString();
                                    setFormData((prev) => ({
                                      ...prev,
                                      shift_id: prev.shift_id.includes(idStr)
                                        ? prev.shift_id.filter(
                                            (id) => id !== idStr
                                          )
                                        : [...prev.shift_id, idStr],
                                    }));
                                    setErrors((prev) => ({
                                      ...prev,
                                      shift_id: undefined,
                                    }));
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.shift_id.includes(
                                        shift.id.toString()
                                      )
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <Badge variant="secondary" className="w-fit">
                                    {shift.reference_num}
                                  </Badge>
                                  {shift.name} (
                                  {formatTimeTo12Hour(shift.start_time)} -{" "}
                                  {formatTimeTo12Hour(shift.end_time)})
                                </CommandItem>
                              ))
                            ) : (
                              <p className="text-center py-4 text-sm text-muted-foreground">
                                No Shifts Available
                              </p>
                            )

                            //  ) : (
                            //   <p className="text-center py-4 text-sm text-muted-foreground">
                            //     Not authorized to view shifts
                            //   </p>
                            // )
                          }
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  )}
                </Popover>

                <ErrorText msg={errors.shift_id} />
              </div> */}

              <div>
                <Label>
                  Join Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.join_date}
                  onChange={(e) => {
                    setFormData({ ...formData, join_date: e.target.value });
                    setErrors((prev) => ({ ...prev, join_date: undefined }));
                  }}
                  className={errors.join_date ? "border-red-500" : ""}
                />
                <ErrorText msg={errors.join_date} />
              </div>
              <div>
                <Label>CNIC</Label>
                <Input
                  maxLength={20}
                  value={formData.cnic}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 20) {
                      setFormData({ ...formData, cnic: e.target.value });
                      setErrors((prev) => ({ ...prev, cnic: undefined }));
                    }
                  }}
                  className={errors.cnic ? "border-red-500" : ""}
                  placeholder="Enter CNIC"
                />
                <ErrorText msg={errors.cnic} />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    setErrors((prev) => ({ ...prev, address: undefined }));
                  }}
                  className={errors.address ? "border-red-500" : ""}
                  placeholder="Enter Address"
                />
                <ErrorText msg={errors.address} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 space-y-4 mt-2">
              <div className="md:col-span-3 space-y-2 mt-2">
                <div className="flex items-center space-x-2">
                  <CustomCheckbox
                    id="assignBranches"
                    checked={assignBranches}
                    onChange={(checked) => {
                      setAssignBranches(checked);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    label="Assign employee to specific branches"
                  />
                </div>

                {assignBranches && (
                  <div className="pt-2">
                    <Label className="mb-2 block text-sm font-medium">
                      Branches
                    </Label>

                    <Popover
                      open={openBranchDropdown}
                      onOpenChange={setOpenBranchDropdown}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openBranchDropdown}
                          className="w-[368px] justify-between h-10"
                        >
                          {formData.branch_ids?.length > 0
                            ? `${formData.branch_ids.length} branch${
                                formData.branch_ids.length > 1 ? "es" : ""
                              } selected`
                            : "Click to select branches..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent side="top" avoidCollisions={false} className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Search branches..."
                            className="h-9"
                          />
                          <CommandEmpty>
                            {branches.length === 0
                              ? "Loading branches..."
                              : "No branches found"}
                          </CommandEmpty>
                          <CommandGroup className="max-h-60 overflow-auto">
                            {branches.map((branch: any) => (
                              <CommandItem
                                key={branch.id}
                                value={branch.name}
                                onSelect={() => {
                                  setFormData((prev) => {
                                    const currentIds = prev.branch_ids || [];
                                    const newIds = currentIds.includes(
                                      branch.id
                                    )
                                      ? currentIds.filter(
                                          (id) => id !== branch.id
                                        )
                                      : [...currentIds, branch.id];
                                    return { ...prev, branch_ids: newIds };
                                  });
                                }}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <Check
                                    className={cn(
                                      "h-4 w-4",
                                      formData.branch_ids?.includes(branch.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span>{branch.name}</span>
                                  {branch.reference_num && (
                                    <span className="text-xs text-muted-foreground ml-auto">
                                      {branch.reference_num}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    {formData.branch_ids?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {formData.branch_ids.map((branchId, index) => {
                          const branch = branches.find(
                            (b) => b.id === branchId
                          );
                          if (!branch) return null;

                          return (
                            <Badge
                              key={branchId}
                              variant="secondary"
                              className="flex items-center gap-1 px-3 py-1 text-sm transition-all"
                            >
                              {branch.reference_num && (
                                <span className="text-xs mt-0.5 text-muted-foreground ml-auto">
                                  {branch.reference_num}
                                </span>
                              )}
                              {branch.name}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => {
                                    const newIds = [...prev.branch_ids];
                                    newIds.splice(index, 1);
                                    return { ...prev, branch_ids: newIds };
                                  });
                                }}
                                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-6 border-t pt-6">
              <Label className="text-base font-semibold">
                Shift Schedule <span className="text-red-500">*</span>
              </Label>

              {/* Weekdays - Standard Shift Timings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Standard Shift Timings (used by all non-rest days)
                </h3>

                <div className="border rounded-lg p-5 bg-card/50 space-y-6">
                  {/* Morning Shift - Optional but if used → both times required */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Morning Shift</div>
                      {/* <span className="text-xs text-muted-foreground">
                        (optional)
                      </span> */}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={weekdayShift.morning_start_time || ""}
                          onChange={(e) =>
                            updateWeekdayTime(
                              "morning_start_time",
                              e.target.value + ":00"
                            )
                          }
                          className={
                            weekdayShift.morning_start_time &&
                            !weekdayShift.morning_end_time
                              ? "border-amber-500"
                              : ""
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={weekdayShift.morning_end_time || ""}
                          onChange={(e) =>
                            updateWeekdayTime(
                              "morning_end_time",
                              e.target.value + ":00"
                            )
                          }
                          className={
                            weekdayShift.morning_end_time &&
                            !weekdayShift.morning_start_time
                              ? "border-amber-500"
                              : ""
                          }
                        />
                      </div>
                      {timeErrors.weekdayMorning && (
                        <p className="text-xs text-red-600 mt-1">
                          {timeErrors.weekdayMorning}
                        </p>
                      )}
                    </div>

                    {/* Visual hint if only one time is filled */}
                    {(weekdayShift.morning_start_time &&
                      !weekdayShift.morning_end_time) ||
                    (weekdayShift.morning_end_time &&
                      !weekdayShift.morning_start_time) ? (
                      <p className="text-xs text-amber-600 mt-1">
                        Both start and end times are required if using morning
                        shift
                      </p>
                    ) : null}
                  </div>

                  {/* Evening Shift - Optional but if used → both times required */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Evening Shift</div>
                      {/* <span className="text-xs text-muted-foreground">
                        (optional)
                      </span> */}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={weekdayShift.evening_start_time || ""}
                          onChange={(e) =>
                            updateWeekdayTime(
                              "evening_start_time",
                              e.target.value + ":00"
                            )
                          }
                          className={
                            weekdayShift.evening_start_time &&
                            !weekdayShift.evening_end_time
                              ? "border-amber-500"
                              : ""
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={weekdayShift.evening_end_time || ""}
                          onChange={(e) =>
                            updateWeekdayTime(
                              "evening_end_time",
                              e.target.value + ":00"
                            )
                          }
                          className={
                            weekdayShift.evening_end_time &&
                            !weekdayShift.evening_start_time
                              ? "border-amber-500"
                              : ""
                          }
                        />
                      </div>
                      {timeErrors.weekdayEvening && (
                        <p className="text-xs text-red-600 mt-1">
                          {timeErrors.weekdayEvening}
                        </p>
                      )}
                    </div>

                    {(weekdayShift.evening_start_time &&
                      !weekdayShift.evening_end_time) ||
                    (weekdayShift.evening_end_time &&
                      !weekdayShift.evening_start_time) ? (
                      <p className="text-xs text-amber-600 mt-1">
                        Both start and end times are required if using evening
                        shift
                      </p>
                    ) : null}
                  </div>

                  {/* Summary / Requirement hint */}
                  <div className="pt-3 border-t text-xs text-muted-foreground">
                    <strong>Requirement:</strong> At least one complete shift
                    (morning or evening) must be provided for working days
                  </div>
                </div>
              </div>

              {/* Rest Days Selection - ALL DAYS possible */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Rest Days / Special Days (optional)
                </h3>

                <div className="flex flex-wrap gap-2">
                  {allDays.map((day) => (
                    <Button
                      key={day}
                      variant={
                        selectedRestDays.includes(day) ? "default" : "outline"
                      }
                      size="sm"
                      className={cn(
                        "transition-all",
                        selectedRestDays.includes(day) &&
                          "bg-primary text-primary-foreground"
                      )}
                      onClick={() => toggleRestDay(day)}
                    >
                      {day}
                    </Button>
                  ))}
                </div>

                {/* Time inputs only for selected rest/special days */}
                {selectedRestDays.length > 0 && (
                  <div className="space-y-5 mt-6">
                    {selectedRestDays.map((day) => (
                      <div
                        key={day}
                        className="border rounded-lg p-5 bg-muted/40 hover:bg-muted/60 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-base">
                            {day}{" "}
                            <span className="text-xs text-muted-foreground">
                              (special/rest day)
                            </span>
                          </h4>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => toggleRestDay(day)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="text-sm font-medium opacity-80">
                              Morning Shift (optional)
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                type="time"
                                value={
                                  restDayShifts[day]?.morning_start_time || ""
                                }
                                onChange={(e) =>
                                  updateRestDayTime(
                                    day,
                                    "morning_start_time",
                                    e.target.value + ":00"
                                  )
                                }
                              />
                              <Input
                                type="time"
                                value={
                                  restDayShifts[day]?.morning_end_time || ""
                                }
                                onChange={(e) =>
                                  updateRestDayTime(
                                    day,
                                    "morning_end_time",
                                    e.target.value + ":00"
                                  )
                                }
                              />
                            </div>
                            {restDayShifts[day]?.morning_start_time ||
                            restDayShifts[day]?.morning_end_time
                              ? timeErrors.restDays?.[day]?.morning && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {timeErrors.restDays[day].morning}
                                  </p>
                                )
                              : null}
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium opacity-80">
                              Evening Shift (optional)
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <Input
                                type="time"
                                value={
                                  restDayShifts[day]?.evening_start_time || ""
                                }
                                onChange={(e) =>
                                  updateRestDayTime(
                                    day,
                                    "evening_start_time",
                                    e.target.value + ":00"
                                  )
                                }
                              />
                              <Input
                                type="time"
                                value={
                                  restDayShifts[day]?.evening_end_time || ""
                                }
                                onChange={(e) =>
                                  updateRestDayTime(
                                    day,
                                    "evening_end_time",
                                    e.target.value + ":00"
                                  )
                                }
                              />
                            </div>
                            {timeErrors.restDays?.[day]?.evening && (
                              <p className="text-xs text-red-600 mt-1">
                                {timeErrors.restDays[day].evening}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Validation error */}
              {errors.shift_schedule && (
                <p className="text-sm text-red-500 mt-3">
                  {errors.shift_schedule[0]}
                </p>
              )}
            </div>
            {serverError && (
              <div className="p-4 bg-chart-5/10 border border-chart-5 text-chart-5 rounded-md text-sm text-center">
                {serverError}
              </div>
            )}
            <div className="sticky bottom-0 left-0 right-0 bg-card/70 z-30 pb-2 px-6 mt-0">
              <div className="flex gap-4 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={onCancel || (() => navigate("/employees"))}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading
                    // ||
                    // isFaceVerifying ||
                    // // Only require verification if a NEW image was provided
                    // ((capturedBase64 || formData.profile_image) &&
                    //   !isFaceVerified) ||
                    // // For new users: must have some image
                    // (!hasProfileImage && !isEdit)
                  }
                  className="min-w-48"
                >
                  {/* {loading && <Loading inButton size="xs" />} */}
                  {loading ? (
                    <Loading inButton size="xs" />
                  ) : isFaceVerifying ? (
                    <>
                      <CloudCog className="h-4 w-4 mr-2 animate-spin" />
                      Verifying Face...
                    </>
                  ) : isEdit ? (
                    "Update"
                  ) : (
                    "Create"
                  )}{" "}
                  Employee
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <FaceCaptureModal
          open={faceCaptureOpen}
          onClose={() => setFaceCaptureOpen(false)}
          onCapture={setCapturedBase64}
        />
      </div>
    </div>
  );
}
