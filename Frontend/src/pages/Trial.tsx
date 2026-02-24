import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "@/hooks/use-toast";
import { AppDispatch, RootState } from "@/redux/store";
import { sendPackageMailAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import { Button } from "@/components/ui/button";

const Trial = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const { loadings } = useSelector((state: RootState) => state.general);
  const isLoading = loadings.sendPackageMail || false;

  const { package_type = "trial", package_id } = location.state || {};

  const initialFormState = {
  company_name: "",
  company_email: "",
  deposit_method: "cash",
};
  const [formData, setFormData] = useState(initialFormState);

  const showDepositMethod = package_type === "standard";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name.trim() || !formData.company_email.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in both company name and email.",
        variant: "destructive",
      });
      return;
    }

    // Extra validation for standard plan
    if (showDepositMethod && !formData.deposit_method) {
      toast({
        title: "Missing Deposit Method",
        description: "Please select a deposit method.",
        variant: "destructive",
      });
      return;
    }

    // Prepare FormData
    const data = new FormData();
    data.append("company_name", formData.company_name.trim());
    data.append("company_email", formData.company_email.trim());
    data.append("package_type", package_type);

    if (showDepositMethod) {
      data.append("deposit_method", formData.deposit_method);
      if (package_id) {
        data.append("package_id", package_id);
      }
    }

    try {
      const response = await dispatch(sendPackageMailAsyncThunk({ data })).unwrap();

      toast({
        title: "Success!",
        description: response?.message || "Request sent successfully! Check your email.",
        variant: "default",
      });
      setFormData(initialFormState);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.errors || "Failed to send request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white font-extrabold tracking-tight">
              <span className="text-lg">G</span>
            </div>
            <a href="/" className="text-lg font-semibold tracking-tight">Gym ERP</a>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-800 md:flex">
            <a href="/" className="hover:text-orange-500 transition-colors">Home</a>
            {/* <a href="/pricing" className="hover:text-orange-500 transition-colors">Pricing</a> */}
            {/* <a href="/trial" className="text-orange-500 hover:text-orange-600 transition-colors">
              Trial
            </a> */}
            <Button className="bg-orange-500 border-none" onClick={() => navigate("/login")}>
              Login
            </Button>
          </nav>
        </div>
      </header>

      <main className="pb-20">
        <section className="bg-gray-50">
          <div className="mx-auto flex max-w-6xl justify-center px-4 py-16 lg:py-20 lg:px-0">
            <div className="w-full max-w-xl rounded-[2.5rem] bg-gray-100 px-8 py-10 shadow-2xl shadow-black/40 sm:px-10">
              <h1 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                Tell Us About Your
                <br />
                Fitness Business
              </h1>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="company_name"
                    className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-600"
                  >
                    Company / Gym Name
                  </label>
                  <input
                    id="company_name"
                    name="company_name"
                    type="text"
                    value={formData.company_name}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none ring-orange-400/0 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/60"
                    placeholder="Enter your gym or studio name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="company_email"
                    className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-600"
                  >
                    Company Email
                  </label>
                  <input
                    id="company_email"
                    name="company_email"
                    type="email"
                    value={formData.company_email}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none ring-orange-400/0 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/60"
                    placeholder="you@yourgym.com"
                  />
                </div>

                {/* Deposit Method - ONLY shown for "standard" package */}
                {showDepositMethod && (
                  <div>
                    <label
                      htmlFor="deposit_method"
                      className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-600"
                    >
                      Deposit Method
                    </label>
                    <select
                      id="deposit_method"
                      name="deposit_method"
                      value={formData.deposit_method}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none ring-orange-400/0 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/60"
                    >
                      <option value="">Select deposit method</option>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                )}

                {/* Hidden fields */}
                <input type="hidden" name="package_type" value={package_type} />
                {package_id && <input type="hidden" name="package_id" value={package_id} />}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition ${isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-black hover:bg-gray-900 shadow-gray-900/40"
                    }`}
                >
                  {isLoading ? "Sending..." : "Submit Request"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-gray-500">
                We’ll send you a confirmation email with next steps.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Trial;