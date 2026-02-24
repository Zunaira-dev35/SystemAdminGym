import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getPackagesAsyncThunk } from "@/redux/pagesSlices/generalSlice";
import { RootState } from "@/redux/store";
import Loading from "@/components/shared/loaders/Loading";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, User, Briefcase, Smartphone } from "lucide-react";

const AllPackages = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { packages, loadings } = useSelector((state: RootState) => state.general);

  const isLoading = loadings.getPackages;
  const packageList = packages?.data || [];
  const systemCurrency = "Rs";

  useEffect(() => {
    dispatch(getPackagesAsyncThunk({}));
  }, [dispatch]);

  const handleBuyNow = (pkg: any) => {
    navigate("/registration", {
      state: {
        package_type: pkg.type || "trial",
        package_id: pkg.id,
      },
    });
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
            <a href="/" className="hover:text-orange-500 transition-colors">
              Home
            </a>
            {/* <a
              href="/pricing"
              className="text-orange-500 hover:text-orange-600 transition-colors"
            >
              Pricing
            </a> */}
            {/* <a
              href="/trial"
              className="hover:text-orange-500 transition-colors"
            >
              Trial
            </a> */}
            <Button className="bg-orange-500 border-none" onClick={() => navigate("/login")}>
                Login
            </Button>
          </nav>
        </div>
      </header>

      <main className="pb-20">
        {/* Hero / Banner */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center lg:py-20 lg:px-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
              PRICING
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Simple, Transparent Pricing
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
              Start with a 14-day trial tailored to your gym size and growth
              stage. Upgrade to any paid plan when you're ready.
            </p>
          </div>
        </section>

        <section className="bg-gray-50 mt-10">
          <div className="mx-auto max-w-6xl px-4 pb-20 lg:px-0">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loading size="lg" />
              </div>
            ) : packageList.length === 0 ? (
              <div className="text-center py-20 text-gray-600">
                No packages available at the moment.
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                {packageList.map((pkg: any, index: number) => {
                  const isFeatured = index === 1; 
                  return (
                    <article
                      key={pkg.id}
                      className={`relative flex flex-col rounded-3xl border ${
                        isFeatured
                          ? "border-orange-300 shadow-[0_20px_45px_rgba(0,0,0,0.12)] ring-2 ring-orange-400/60"
                          : "border-gray-200 shadow-sm"
                      } bg-white p-7 text-left transition hover:-translate-y-1 hover:shadow-md`}
                    >
                      {isFeatured && (
                        <div className="absolute -top-3 left-6 rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300">
                          Most Popular
                        </div>
                      )}

                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                        {pkg.type?.toUpperCase() || "STANDARD"} PLAN
                      </p>

                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-gray-900">
                          {systemCurrency} {pkg.price?.toLocaleString() || "0"}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          / {pkg.duration || "month"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        {pkg.description || "Perfect for your fitness business."}
                      </p>

                      <ul className="mt-4 flex-1 space-y-2 text-sm text-gray-700">
                        <li>• Up to {pkg.member_limit || "—"} active members</li>
                        <li>• {pkg.branch_limit || "—"} branches</li>
                        <li>• {pkg.user_limit || "—"} users</li>
                        <li>• {pkg.employee_limit || "—"} employees</li>
                        {String(pkg.is_app_avail) === "1" && <li>• Mobile App included</li>}
                      </ul>

                      <button
                        onClick={() => handleBuyNow(pkg)}
                        className="mt-6 w-full py-2 rounded bg-orange-500 hover:bg-orange-600 text-black shadow-lg shadow-orange-500/30"
                      >
                        Buy Now
                      </button>
                    </article>
                  );
                })}
              </div>
            )}

            <p className="mt-8 text-center text-xs text-gray-500">
              All plans include a trial period. No long-term contracts. Upgrade or
              cancel anytime.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AllPackages;