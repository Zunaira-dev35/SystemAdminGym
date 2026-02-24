// src/pages/members/MemberForm.tsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  createOrUpdateMemberAsyncThunk,
  getRefrenceMembersAsyncThunk,
  verifyUserFaceAsyncThunk,
  verifyUserFingerprintAsyncThunk,
  // checkImage,
} from "@/redux/pagesSlices/peopleSlice";
import {
  ArrowLeft,
  Camera,
  UserPlus,
  Edit,
  EyeOff,
  Eye,
  CloudCog,
  CheckCircle2,
  ChevronsUpDown,
  Check,
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
import Loading from "@/components/shared/loaders/Loading";
import FaceCaptureModal from "@/components/faceDetection/FaceCaptureModal";
import { toast } from "@/hooks/use-toast";
import { backendBasePath } from "@/constants";
import EmployeeFingerprintCapture from "@/components/fingerPrintDetection/FingerprintCapture";
import { getCurrentBranchAsyncThunk } from "@/redux/pagesSlices/planSlice";
import { getShiftsAsyncThunk } from "@/redux/pagesSlices/feeCollectionSlice";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { formatTimeTo12Hour } from "@/utils/helper";
import { Badge } from "@/components/ui/badge";

interface Member {
  id?: number;
  name: string;
  cnic?: string;
  whatsapp_num?: string;
  // email: string;
  phone: string;
  address?: string;
  // shift_id?: string;
  gender?: string;
  profile_image?: string;
}

interface Props {
  member?: Member | null; // If provided → Edit mode
  onSuccess?: () => void; // Callback after save
  onCancel?: () => void;
}

export default function MemberForm({ member, onSuccess, onCancel }: Props) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isEdit = !!member?.id;
  // const { shifts, loadings } = useSelector((state: any) => state.feeCollection);
  const { currentBranch } = useSelector((state: any) => state.plan);

  const [loading, setLoading] = useState(false);
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [faceCaptureOpen, setFaceCaptureOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { memberRefId } = useSelector((state: any) => state.people);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState<string>("");
  const [showScanner, setShowScanner] = useState(false);
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: member?.name || "",
    whatsapp_num: member?.member_profile?.whatsapp_num || "",
    cnic: member?.member_profile?.cnic || "",
    phone: member?.phone || "",
    password: "",
    address: member?.member_profile?.address || "",
    // shift_id: member?.member_profile?.shift_id || "",
    gender: (member?.gender as "male" | "female" | "other") || "male",
    profile_image: null as File | null,
    register_date:
      member?.member_profile?.register_date ||
      new Date().toISOString().split("T")[0],
  });
  const [isFaceVerifying, setIsFaceVerifying] = useState(false);
  const [isFaceVerified, setIsFaceVerified] = useState(false);
  const [hasProfileImage, setHasProfileImage] = useState(false);
  const [fingerprintRaw, setFingerprintRaw] = useState<string>(""); // For sending to backend
  const [isFingerprintVerifying, setIsFingerprintVerifying] = useState(false);
  const [isFingerprintVerified, setIsFingerprintVerified] = useState(false);
  const [hasFingerprint, setHasFingerprint] = useState(false);
  // const [selectedShiftId, setSelectedShiftId] = useState<string | null>(
  //   member?.member_shifts?.[0]?.shift?.id?.toString() || null
  // );
  // const [selectedShift, setSelectedShift] = useState<string>(
  //   member?.member_profile?.shift
  // );
  // Fetch branch and shifts
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

  useEffect(() => {
    if (!isEdit) {
      dispatch(getRefrenceMembersAsyncThunk({}));
    }
  }, [isEdit]);

  useEffect(() => {
    // On mount: if there's already an image (edit mode or captured), consider it present
    const hasImage =
      !!capturedBase64 ||
      !!formData.profile_image ||
      (isEdit && !!member?.profile_image);

    setHasProfileImage(hasImage);

    // In edit mode with existing image → assume already verified (no need to re-check unless changed)
    // if (
    //   isEdit &&
    //   !!member?.profile_image &&
    //   !capturedBase64 &&
    //   !formData.profile_image
    // ) {
    //   setIsFaceVerified(true);
    // } else {
    setIsFaceVerified(false);
    // }
  }, [capturedBase64, formData.profile_image, isEdit, member?.profile_image]);

  useEffect(() => {
    if (!isEdit) {
      dispatch(getRefrenceMembersAsyncThunk({}));
    }
  }, []);
  useEffect(() => {
    const hasFp =
      !!fingerprintRaw || (isEdit && !!member?.fingerprint_encoding);
    setHasFingerprint(hasFp);
    setIsFingerprintVerified(false); // Only true after real verification
  }, [fingerprintRaw, isEdit, member?.fingerprint_encoding]);
  // Face check on capture or upload
  useEffect(() => {
    if (!capturedBase64 && !formData.profile_image) return;

    // Determine which image source to verify
    const imageToVerify = capturedBase64 || formData.profile_image;

    const checkFace = async () => {
      setIsFaceVerifying(true);
      setIsFaceVerified(false);

      try {
        let file: File;
        if (typeof imageToVerify === "string") {
          // Base64 from capture
          const blob = await fetch(imageToVerify).then((r) => r.blob());
          file = new File([blob], "face.jpg", { type: "image/jpeg" });
        } else {
          // Uploaded file
          file = imageToVerify;
        }

        const data = new FormData();
        data.append("profile_image", file);
        data.append("user_type", "member");
        if (isEdit && member?.id) data.append("id", member.id.toString());

        const result = await dispatch(
          verifyUserFaceAsyncThunk({ data })
        ).unwrap();
        console.log("result", result);
        if (result.status === "success") {
          setIsFaceVerified(true);
          toast({
            title: "Face Verified ✓",
            description: "Profile photo accepted", // Optional positive message
            variant: "default", // Explicitly default (neutral/good style)
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
  }, [capturedBase64, formData.profile_image, dispatch, isEdit, member?.id]);
  useEffect(() => {
    if (!fingerprintRaw) return;

    const checkFingerprint = async () => {
      setIsFingerprintVerifying(true);
      setIsFingerprintVerified(false);

      try {
        const blob = new Blob([fingerprintRaw], {
          type: "application/octet-stream",
        });
        const file = new File([blob], "fingerprint.wsq");

        const data = new FormData();
        data.append("fingerprint_data", file);
        data.append("user_type", "member");
        if (isEdit && member?.id) data.append("id", member.id.toString());

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
  }, [fingerprintRaw, dispatch, isEdit, member?.id]);

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
    const rawPhone = String(formData.phone || "").trim();

    if (!formData.name.trim()) newErrors.name = ["Full name is required"];
    // if (!formData.whatsapp_num.trim()) newErrors.whatsapp_num = ["Whatsapp number is required"];
    if (!rawPhone) {
      newErrors.phone = ["Phone number is required"];
    } else {
      const digitsOnly = rawPhone.replace(/\D/g, "");

      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        newErrors.phone = ["Please enter a valid Phone number (7–15 digits)"];
      }
    }

    // const rawWhatsapp = String(formData.whatsapp_num || "").trim();

    // if (!rawWhatsapp) {
    //   newErrors.whatsapp_num = ["WhatsApp number is required"];
    // } else {
    //   const digitsOnly = rawWhatsapp.replace(/\D/g, "");

    //   if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    //     newErrors.whatsapp_num = [
    //       "Please enter a valid WhatsApp number (7–15 digits)",
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
    if (!isEdit && !formData.password.trim())
      newErrors.password = ["Password is required"];

    if (!formData.register_date)
      newErrors.register_date = ["Register date is required"];
    if (!formData.gender) newErrors.gender = ["Gender is required"];
    // if (!formData.shift_id) newErrors.shift_id = ["Shift is required"];
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
    // data.append("whatsapp_num", formData.whatsapp_num.trim());
    data.append("cnic", formData.cnic.trim());
    data.append("phone", formData.phone.trim());
    data.append("address", formData.address);
    if (fingerprintImage) {
      console.log("Fingerprint Image:", fingerprintImage);
      const blob = new Blob([fingerprintImage], { type: "image/wsq" }); // or "application/octet-stream"
      // data.append("fingerprint_data", fingerprintImage);
      console.log("blob fingerprint_data", blob);
      data.append("fingerprint_data", blob, "fingerprint.wsq");
    }
    data.append("gender", formData.gender);
    // data.append("shift_id", formData.shift_id);
    data.append("register_date", formData.register_date);
    // if (!isEdit && formData.password)
    if (formData.password) data.append("password", formData.password);
    if (isEdit && member?.id) data.append("id", member.id.toString());

    // Attach captured face or uploaded image
    if (capturedBase64) {
      const blob = await fetch(capturedBase64).then((r) => r.blob());
      const file = new File([blob], "face_capture.jpg", { type: "image/jpeg" });
      data.append("profile_image", file);
    } else if (formData.profile_image) {
      data.append("profile_image", formData.profile_image);
    }
    // else if (isEdit && member?.profile_image) {
    // data.append("profile_image", member.profile_image);}

    try {
      await dispatch(createOrUpdateMemberAsyncThunk({ data })).unwrap();
      toast({ title: isEdit ? "Member Updated!" : "Member Created!" });
      onSuccess?.();
    } catch (err: any) {
      let validationErrors: Record<string, string[]> = {};

      if (
        err?.errors &&
        typeof err.errors === "object" &&
        !Array.isArray(err.errors)
      ) {
        validationErrors = err.errors;
      } else if (typeof err?.errors === "string") {
        const msg = err.errors.toLowerCase();

        if (msg.includes("email")) {
          validationErrors.email = [err.errors];
        } else if (msg.includes("phone")) {
          validationErrors.phone = [err.errors];
        } else if (
          msg.includes("profile image") ||
          msg.includes("profile_image")
        ) {
          validationErrors.profile_image = [err.errors];
        } else {
          setServerError(err.errors);
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toast({
          title: "Validation Error",
          description: "Please check the highlighted fields",
          variant: "destructive",
        });
      } else {
        const msg = err?.errors || "Failed to save member";
        setServerError(msg);
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const ErrorText = ({ msg }: { msg?: string[] }) => {
    if (!msg || msg.length === 0) return null;
    return (
      <p className="text-red-500 text-xs mt-1">
        {msg[0]} {/* Laravel only sends one message per field usually */}
      </p>
    );
  };

  return (
    <div className=" py-0">
      <div className="max-w-7xl mx-auto px-4 ">
        {/* flex items-start gap-4 */}
        <div className="flex items-center gap-3 text-sm mb-4">
          <button
            onClick={onCancel || (() => navigate("/members"))}
            className="flex items-center gap-2 hover:text-primary transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Members
          </button>
          <span>/</span>
          <span className="font-medium">{isEdit ? "Edit" : "Add"} Member</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              {isEdit ? (
                <Edit className="h-7 w-7" />
              ) : (
                <UserPlus className="h-7 w-7" />
              )}
              {isEdit ? "Edit Member" : "Add New Member"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6 justify-center flex-wrap">
              <div className="flex flex-col gap-6">
                {/* Profile Image */}
                <div className="flex justify-center relative">
                  {formData.profile_image ||
                  capturedBase64 ||
                  member?.profile_image ? (
                    <>
                      {" "}
                      <img
                        src={
                          formData.profile_image
                            ? URL.createObjectURL(formData.profile_image)
                            : capturedBase64
                            ? capturedBase64
                            : `${backendBasePath}${member?.profile_image}`
                        }
                        alt="Member profile"
                        className="h-32 w-32 rounded-full object-cover border-4 shadow-xl"
                      />
                      {/* Progress Animation Overlay when verifying */}
                      {isFaceVerifying && (
                        <div className="absolute h-32 w-32 left-8 inset-0 rounded-full border-4 border-gray-300 border-t-primary animate-spin"></div>
                      )}
                      {/* Success Checkmark when verified (optional nice touch) */}
                      {isFaceVerified && !isFaceVerifying && (
                        <div className="absolute h-32 w-32 left-8 inset-0 rounded-full flex items-center justify-center bg-green-500/20">
                          <svg
                            className="h-12 w-12 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={4}
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

                {/* Error Message Under Photo */}
                {errors.profile_image && (
                  <div className="flex justify-center">
                    <ErrorText msg={errors.profile_image} />
                  </div>
                )}

                {/* Capture Button */}
                <div className="flex justify-center">
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
              <EmployeeFingerprintCapture
                onFingerprintCapture={(base64) => {
                  // Save to form or upload
                  // console.log("Fingerprint ready:", base64);
                  // setFingerprintRaw(base64);
                  setFingerprintRaw(base64);
                  setFingerprintImage(base64);
                  // Save to form data or upload to server
                  // console.log("Captured Base64:", base64);
                  toast({ title: "Fingerprint Captured!" });
                  setShowScanner(false);
                }}
                initialFingerprint={
                  member?.member_profile?.fingerprint_data
                    ? `${backendBasePath}${member?.member_profile?.fingerprint_data}`
                    : ""
                }
                isVerifying={isFingerprintVerifying}
                isVerified={isFingerprintVerified}
                // initialFingerprint={
                //   "" || member?.member_profile?.fingerprint_encoding
                // } // optional
              />
            </div>
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>
                  Reference ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  readOnly={true}
                  value={memberRefId || member?.reference_num}
                  placeholder="Enter Full name"
                />
                <ErrorText msg={errors.name} />
              </div>
              <div>
                <Label>
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.name}
                  placeholder="Enter Full name"
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={errors.name ? "border-red-500" : ""}
                />
                <ErrorText msg={errors.name} />
              </div>
              {/* <div>
                <Label>Last Name <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.last_name}
                  placeholder="Enter Last name"
                  onChange={(e) => {
                    setFormData({ ...formData, last_name: e.target.value });
                    setErrors(prev => ({ ...prev, last_name: undefined }));
                  }}
                  className={errors.last_name ? "border-red-500" : ""}
                />
                <ErrorText msg={errors.last_name} />
              </div> */}
              <div>
                <Label>
                  Phone / Whatsapp Number{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  maxLength={15}
                  placeholder="Enter Phone"
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
                />
                <ErrorText msg={errors.phone} />
              </div>
              {/* {!isEdit && ( */}
              <div className="relative">
                <Label>
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  value={formData.password}
                  // onChange={(e) => {
                  //   setFormData({ ...formData, password: e.target.value });
                  // }}
                  // required
                  onChange={handlePasswordChange}
                  required={!isEdit}
                  className={errors.password ? "border-red-500" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 top-8 cursor-pointer flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
                <ErrorText msg={errors.password} />
              </div>
              {/* )} */}
              {/* <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) =>{
                    setFormData({ ...formData, birth_date: e.target.value })
                  }}
                  className={errors.birth_date ? "border-red-500" : ""}
                />
                <ErrorText msg={errors.birth_date} />
              </div> */}
              <div>
                <Label>
                  Register Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.register_date}
                  // onChange={(e) => {
                  //   setFormData({ ...formData, register_date: e.target.value });
                  //   setErrors((prev) => ({
                  //     ...prev,
                  //     register_date: undefined,
                  //   }));
                  // }}
                  required
                  readOnly
                  className="cursor-not-allowed"
                  // className={errors.register_date ? "border-red-500" : ""}
                />
                <ErrorText msg={errors.register_date} />
              </div>
              <div>
                <Label>Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) => {
                    setFormData({ ...formData, gender: v as any });
                    setErrors((prev) => ({ ...prev, gender: undefined }));
                  }}
                  className={errors.gender ? "border-red-500" : ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <ErrorText msg={errors.gender} />
              </div>
              {/* <div>
                <Label>
                  Shift <span className="text-red-500">*</span>
                </Label>

                {
                  // loadings.fetchShift ? (
                  //   <div className="h-10 flex items-center justify-center">
                  //     <Loading size="sm" />
                  //   </div>
                  // ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between",
                          !selectedShiftId && "text-muted-foreground",
                          errors.shift_id && "border-red-500"
                        )}
                      >
                        {selectedShift ? (
                          <span>
                            <Badge variant={"ghost"}>
                              {selectedShift?.reference_num}
                            </Badge>{" "}
                            {selectedShift?.name || "Select shift"}
                          </span>
                        ) : (
                          <span>Select shift</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search shift..." />
                        <CommandEmpty>No shifts found</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-auto">
                          {loadings.fetchShift ? (
                            <div className="h-10 flex items-center justify-center">
                              <Loading size="sm" />
                            </div>
                          ) : (
                            shifts?.map((shift: any) => (
                              <CommandItem
                                key={shift.id}
                                onSelect={() => {
                                  setSelectedShiftId(shift.id.toString());
                                  setSelectedShift(shift);
                                  setFormData((prev) => ({
                                    ...prev,
                                    shift_id: shift.id.toString(),
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
                                    selectedShiftId === shift.id.toString()
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <Badge variant={"ghost"}>
                                  {shift?.reference_num || "-"}
                                </Badge>{" "}
                                {shift.name} (
                                {formatTimeTo12Hour(shift.start_time)} -{" "}
                                {formatTimeTo12Hour(shift.end_time)})
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  // )
                }
                <ErrorText msg={errors.shift_id} />
              </div> */}

              {/* <div></div> */}
              {/* <div className="md:col-span-2"> */}
              {/* <div>
                <Label>
                  Whatsapp Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  maxLength={15}
                  value={formData.whatsapp_num}
                  placeholder="Enter whatsapp Number"
                  onChange={(e) => {
                    const value = e.target.value;
                    // Limit to 15 digits (common max for phone numbers)
                    if (value.length <= 15) {
                      setFormData({ ...formData, whatsapp_num: value });
                      setErrors((prev) => ({
                        ...prev,
                        whatsapp_num: undefined,
                      }));
                    }
                  }}
                  required
                  className={errors.whatsapp_num ? "border-red-500" : ""}
                />
                <ErrorText msg={errors.whatsapp_num} />
              </div> */}
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  placeholder="Enter Address.."
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    setErrors((prev) => ({ ...prev, address: undefined }));
                  }}
                  className={errors.address ? "border-red-500" : ""}
                />
                <ErrorText msg={errors.address} />
              </div>
              <div>
                <Label>CNIC </Label>
                <Input
                  maxLength={20}
                  value={formData.cnic}
                  placeholder="Enter CNIC"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 20) {
                      setFormData({ ...formData, cnic: e.target.value });
                      setErrors((prev) => ({ ...prev, cnic: undefined }));
                    }
                  }}
                  className={errors.cnic ? "border-red-500" : ""}
                />
                <ErrorText msg={errors.cnic} />
              </div>
            </div>
            {serverError && (
              <div className="p-3 bg-chart-5/10 text-chart-5 border-chart-5/20 rounded-md text-sm">
                {serverError}
              </div>
            )}
            <div className="sticky bottom-0 left-0 right-0 bg-card/70 z-30 pb-2 px-6 mt-0">
              <div className="flex gap-4 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={onCancel || (() => navigate("/members"))}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    isFaceVerifying ||
                    isFingerprintVerifying || // ← NEW: disable during fp verify
                    ((capturedBase64 || formData.profile_image) &&
                      !isFaceVerified) ||
                    (fingerprintImage && !isFingerprintVerified) || // ← NEW: require fp verify if provided
                    (!hasProfileImage && !isEdit)
                  }
                  className="min-w-48"
                >
                  {loading && <Loading inButton size="xs" />}
                  {isFaceVerifying || isFingerprintVerifying ? (
                    <>
                      <CloudCog className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : isEdit ? (
                    "Update"
                  ) : (
                    "Create"
                  )}{" "}
                  Member
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
      {/* <footer
        className={`pt-5 text-center text-sm text-muted-foreground transition-all duration-500 ease-in-out translate-y-0 opacity-100 backdrop-blur-xs`}
      >
        Powered by{" "}
        <a
          href="https://snowberrysys.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline hover:text-foreground transition-colors"
        >
          snowberrysys.com
        </a>
      </footer> */}
    </div>
  );
}
