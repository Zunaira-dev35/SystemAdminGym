// Login.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/hooks/use-toast";
import {
  fetchUserAsyncThunk,
  loginAsyncThunk,
} from "@/redux/pagesSlices/authSlice";
import { getBranchesListAsyncThunk } from "@/redux/pagesSlices/planSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Eye,
  EyeOff,
  Mail,
  Phone,
} from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { branchesList } = useSelector((state: RootState) => state.plan);
  const { theme } = useTheme();

  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [gymIdFromLogin, setGymIdFromLogin] = useState<number | null>(null);

  const formik = useFormik({
    initialValues: {
      branchId: "",
      reference_num: "",
      password: "",
    },
    validationSchema: Yup.object({
      reference_num: Yup.string().required("User ID is required"),
      password: Yup.string()
        .required("Password is required"),
      branchId: Yup.string().when([], {
        is: () => showBranchSelector,
        then: (schema) => schema.required("Please select a branch"),
        otherwise: (schema) => schema.notRequired(),
      }),
    }),
    onSubmit: async (values) => {
  setIsLoading(true);

  try {
    const form = new FormData();
    form.append("reference_num", values.reference_num);
    form.append("password", values.password);

    if (!showBranchSelector) {
      const loginAction = await dispatch(loginAsyncThunk({ data: form }));
      const response = loginAction.payload;

      if (response?.status === "error") {
        toast({
          title: "Login failed",
          description:
            response?.errors ||
            response?.message ||
            "Login failed. Please check your credentials.",
          variant: "destructive",
        });

        setIsLoading(false);
        return;
      }

      if (response?.status === "success") {
        if (response?.data?.access_token) {
          await dispatch(fetchUserAsyncThunk({})).unwrap();
          toast({ title: "Welcome!", description: response?.message || "Login successful" });
          navigate("/system-dashboard");
          return;
        }

        if (
          // response?.message?.toLowerCase().includes("select branch") ||
          // response?.message?.toLowerCase().includes("branch")
          !response?.data?.access_token
        ) {
          setShowBranchSelector(true);

          const receivedGymId = response?.data?.user?.gym_id;
          if (receivedGymId) {
            setGymIdFromLogin(receivedGymId);
          }

          formik.setFieldValue("branchId", "");
          formik.setFieldTouched("branchId", false);

          toast({
            title: "Select Branch",
            description: response?.message || "Please select branch to login",
          });

          setIsLoading(false);
          return;
        }
      }
    }

    if (!values.branchId) {
      formik.setFieldTouched("branchId", true);
      setIsLoading(false);
      return;
    }

    form.append("branch_id", values.branchId);

    const loginAction = await dispatch(loginAsyncThunk({ data: form }));
    const response = loginAction.payload;

    console.log("Second login:", response);

    if (response?.status === "error") {
      toast({
        title: "Login failed",
        description:
          response?.errors ||
          response?.message ||
          "Login failed. Please check your credentials.",
        variant: "destructive",
      });

      setIsLoading(false);
      return;
    }

    if (response?.status === "success" && response?.data?.access_token) {
      await dispatch(fetchUserAsyncThunk({})).unwrap();
      // const isDefault = response?.data?.user?.type === "default";
      const isExpired = response?.data?.user?.subscription_status === "expired";
      if (isExpired /*&& isDefault*/) {
        const currentPath = window.location.pathname;

        const allowedPaths = ["/subscriptions", "/package"];

        const isAllowed = allowedPaths.some(path => 
          currentPath === path || 
          currentPath.startsWith(path + "/") ||
          currentPath.startsWith(path + "?")
        );

        if (!isAllowed) {
          return navigate("/package-expired");
        }
      }
      else{
        toast({ title: "Welcome!", description: "Login successful" });
        navigate("/dashboard");
      }
      return;
    }

    setIsLoading(false);
  } catch (err: any) {
    setIsLoading(false);

    toast({
      title: "Login failed",
      description:
        err?.response?.data?.errors ||
        err?.response?.data?.message ||
        "Something went wrong. Please try again.",
      variant: "destructive",
    });
  }
}

  });

  useEffect(() => {
    if (showBranchSelector) {
      const params = {
        // disable_page_param: 1,
        gym_id: gymIdFromLogin || undefined,
      };
      dispatch(getBranchesListAsyncThunk(params));
    }
  }, [showBranchSelector, gymIdFromLogin, dispatch]);


  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto h-16 w-16 rounded-md flex items-center justify-center">
            {theme === "light" ? (
              <img src="/images/logo_dark.png" alt="Logo" className="h-16 w-16 rounded-md" />
            ) : (
              <img src="/images/logo_light.png" alt="Logo" className="h-18 w-18 rounded-md" />
            )}
          </div>
          <CardTitle className="text-3xl font-bold">GYM ERP</CardTitle>
          <CardDescription className="text-base">
            Welcome! Please login to continue
          </CardDescription>
        </CardHeader>

        <form onSubmit={formik.handleSubmit}>
          <CardContent className="space-y-5">
            {/* User ID */}
            <div className="space-y-2">
              <Label htmlFor="reference_num">User ID </Label>
              <Input
                id="reference_num"
                type="text"
                placeholder="Enter User ID"
                {...formik.getFieldProps("reference_num")}
                disabled={isLoading}
                data-testid="input-reference_num"
              />
              {formik.touched.reference_num && formik.errors.reference_num && (
                <p className="text-sm text-destructive">{formik.errors.reference_num}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2 relative">
              <Label htmlFor="password">Password </Label>
              <Input
                id="password"
                type={show ? "text" : "password"}
                placeholder="Enter password"
                {...formik.getFieldProps("password")}
                disabled={isLoading}
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute inset-y-0 right-0 top-6 cursor-pointer flex items-center pr-3 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {formik.touched.password && formik.errors.password && (
                <p className="text-sm text-destructive">{formik.errors.password}</p>
              )}
            </div>

            {/* Branch Selector - shown only when needed */}
            {showBranchSelector && (
              <div className="space-y-2 animate-fade-in">
                <Label>Branch <span className="text-red-500 text-sm">*</span></Label>
                <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      role="combobox"
                      aria-expanded={branchOpen}
                      className="w-full justify-between h-10 font-medium mt-2 text-muted-foreground bg-background border-input"
                    >
                      {formik.values.branchId ? (
                        <span className="truncate space-x-1">
                          {branchesList.find((b) => b.id.toString() === formik.values.branchId)?.reference_num && (
                            <Badge variant="secondary" className="w-fit mr-1">
                              {branchesList.find((b) => b.id.toString() === formik.values.branchId)?.reference_num}
                            </Badge>
                          )}
                          {branchesList.find((b) => b.id.toString() === formik.values.branchId)?.name || "Loading branches..."}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Search branch...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search branch..."
                        value={branchSearch}
                        onValueChange={setBranchSearch}
                        className="h-12"
                      />
                      <CommandEmpty>
                        {branchesList.length === 0 ? "Loading branches..." : "No branch found"}
                      </CommandEmpty>
                      <CommandGroup className="max-h-80 overflow-auto">
                        {branchesList
                          .filter((branch) =>
                            `${branch.name} ${branch.reference_num || ""}`
                              .toLowerCase()
                              .includes(branchSearch.toLowerCase())
                          )
                          .map((branch) => (
                            <CommandItem
                              key={branch.id}
                              onSelect={() => {
                                formik.setFieldValue("branchId", branch.id.toString());
                                formik.setFieldTouched("branchId", true, false);
                                setBranchOpen(false);
                                setBranchSearch("");
                              }}
                              className="cursor-pointer py-3"
                            >
                              <div className="flex items-center gap-3 w-full">
                                <div className="flex gap-2 items-center">
                                  <Check
                                    className={cn(
                                      "ml-auto h-5 w-5 shrink-0",
                                      formik.values.branchId === branch.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <Building2 className="h-4 w-4" />
                                  <div className="flex gap-2 items-center">
                                    <Badge variant="secondary" className="w-fit">
                                      {branch?.reference_num}
                                    </Badge>{" "}
                                    {branch?.name}
                                  </div>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                {formik.touched.branchId && formik.errors.branchId && (
                  <p className="text-sm text-destructive">{formik.errors.branchId as string}</p>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !formik.isValid}
              data-testid="button-login"
            >
              {isLoading ? "Logging in..." : showBranchSelector ? "Complete Login" : "Login"}
            </Button>

            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p className="text-xs mb-2 max-w-xs">
                Powered by Snow Berry Systems For urgent queries, contact our helpline:
              </p>
              <p className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <a
                    href="https://wa.me/923704025441"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground underline-offset-2 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    +92 370 4025441
                  </a>
                  <a
                    href="mailto: support@snowberrysys.com"
                    className="hover:text-foreground underline-offset-2 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    support@snowberrysys.com
                  </a>
                </div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <a
                    href="tel:+923704025441"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground underline-offset-2 hover:underline flex items-center gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M16.6 14c-.2-.1-1.5-.7-1.7-.8c-.2-.1-.4-.1-.6.1c-.2.2-.6.8-.8 1c-.1.2-.3.2-.5.1c-.7-.3-1.4-.7-2-1.2c-.5-.5-1-1.1-1.4-1.7c-.1-.2 0-.4.1-.5c.1-.1.2-.3.4-.4c.1-.1.2-.3.2-.4c.1-.1.1-.3 0-.4c-.1-.1-.6-1.3-.8-1.8c-.1-.7-.3-.7-.5-.7h-.5c-.2 0-.5.2-.6.3c-.6.6-.9 1.3-.9 2.1c.1.9.4 1.8 1 2.6c1.1 1.6 2.5 2.9 4.2 3.7c.5.2.9.4 1.4.5c.5.2 1 .2 1.6.1c.7-.1 1.3-.6 1.7-1.2c.2-.4.2-.8.1-1.2l-.4-.2m2.5-9.1C15.2 1 8.9 1 5 4.9c-3.2 3.2-3.8 8.1-1.6 12L2 22l5.3-1.4c1.5.8 3.1 1.2 4.7 1.2c5.5 0 9.9-4.4 9.9-9.9c.1-2.6-1-5.1-2.8-7m-2.7 14c-1.3.8-2.8 1.3-4.4 1.3c-1.5 0-2.9-.4-4.2-1.1l-.3-.2l-3.1.8l.8-3l-.2-.3c-2.4-4-1.2-9 2.7-11.5S16.6 3.7 19 7.5c2.4 3.9 1.3 9-2.6 11.4" />
                    </svg>
                    +92 370 4025441
                  </a>
                </div>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
      <p className="mt-6 text-xs text-muted-foreground text-center">
        Powered by{" "}
        <a
          href="https://snowberrysys.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline hover:text-foreground transition-colors"
        >
          snowberrysys.com
        </a>
      </p>
    </div>
  );
}