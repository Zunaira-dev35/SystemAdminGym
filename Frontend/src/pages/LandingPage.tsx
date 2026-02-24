import { Button } from "@/components/ui/button";
import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sticky Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white font-extrabold tracking-tight">
              <span className="text-lg">G</span>
            </div>
            <a href="/" className="text-lg font-semibold tracking-tight">
              Gym ERP
            </a>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-800 md:flex">
            <a href="/" className="hover:text-orange-500 transition-colors">
              Home
            </a>
            {/* <a
              href="/pricing"
              className="hover:text-orange-500 transition-colors"
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

      <main id="home" className="pb-24">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white">
          <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-80 bg-gradient-to-b from-orange-100/70 via-white to-white" />
          <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 lg:flex-row lg:items-center lg:justify-between lg:py-24 lg:px-0">
            {/* Left - Text */}
            <div className="max-w-xl space-y-6">
              <p className="text-xs font-semibold tracking-[0.3em] text-orange-500 uppercase">
                THE ALL-IN-ONE GYM ERP
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl lg:leading-[1.1]">
                All-in-One{" "}
                <span className="text-orange-500">
                  Gym Management Software
                </span>{" "}
                to Run, Track &amp; Grow Your Fitness Business
              </h1>
              <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                Manage members, trainers, payments, attendance, and performance
                — all from one powerful cloud-based Gym ERP. Designed for
                growing fitness clubs, studios, and multi-branch chains.
              </p>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  onClick={() => navigate('/registration', {
                    state: {
                      package_type: "trial",
                    }
                  })}
                  className="inline-flex items-center justify-center rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-black shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
                >
                  Start Trial
                </button>
                <button
                  onClick={() => navigate('/all-packages')}
                  className="inline-flex items-center justify-center rounded-full border border-gray-900 px-7 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-900 hover:text-white">
                  Buy Now
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4 text-xs text-gray-500">
                <span>Cloud-based • Secure • Multi-location</span>
                <span className="h-1 w-1 rounded-full bg-gray-400" />
                <span>Trusted by modern fitness brands</span>
              </div>
            </div>

            {/* Right - Mobile App Mockups (image-ready slots) */}
            <div className="relative flex flex-1 justify-center lg:justify-end">

              <div className="flex-1 rounded-[1.5rem] ">
                {<img src="/images/cardgym.png" className="h-full w-full object-cover" alt="Gym ERP dashboard" />}
              </div>




            </div>
          </div>

          {/* Trust Snapshot Strip */}
          <div className="border-y border-gray-100 bg-gray-50/80">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 text-[11px] font-medium uppercase tracking-[0.25em] text-gray-600 lg:px-0">
              <span>Cloud-Based Gym ERP</span>
              <span>Web + Android + iOS</span>
              <span>Multi-Branch Ready</span>
              <span>Secure &amp; Scalable</span>
              <span>Go Live in 30 Days</span>
            </div>
          </div>
        </section>

        {/* Built For Every Type of Fitness Business */}
        <section className="mx-auto max-w-6xl px-4 py-16 lg:py-20 lg:px-0">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
              INDUSTRY FIT
            </p>
            <h2 className="pt-2 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Built for Every Type of Fitness Business
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
              Whether you run a single studio or a multi-location gym brand,
              Gym ERP adapts to your workflows and growth plans.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              "Gyms & Fitness Clubs",
              "Fitness Studios & CrossFit",
              "Personal Trainers",
              "Multi-Branch Gym Chains",
              "Corporate / Hotel Gyms",
            ].map((label) => (
              <div
                key={label}
                className="flex flex-col items-center rounded-2xl bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                  <span>◆</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Problem → Solution */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20 lg:px-0">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                Tired of Manual Gym Management?
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                Replace spreadsheets, paper registers, and disconnected tools
                with a single cloud Gym ERP that keeps every branch, trainer,
                and member in sync.
              </p>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {/* Before */}
              <div className="rounded-2xl border border-red-100 bg-red-50/70 p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-500">
                  BEFORE — MANUAL CHAOS
                </p>
                <ul className="mt-4 space-y-3 text-sm text-red-900">
                  <li>❌ Spreadsheets for attendance &amp; renewals</li>
                  <li>❌ Missed payments and follow-ups</li>
                  <li>❌ No real-time view of branches or trainers</li>
                  <li>❌ Member experience feels outdated</li>
                </ul>
              </div>

              {/* After */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                  AFTER — WITH GYM ERP
                </p>
                <ul className="mt-4 space-y-3 text-sm text-emerald-950">
                  <li>✅ Automated billing &amp; renewal reminders</li>
                  <li>✅ Real-time dashboards across all branches</li>
                  <li>✅ QR / app-based member check-in</li>
                  <li>✅ Mobile-first member &amp; trainer experience</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20 lg:px-0">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
                PLATFORM FEATURES
              </p>
              <h2 className="pt-2 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                Everything Your Gym Needs — In One Platform
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
              {[
                {
                  title: "Member Management",
                  text: "Centralize member profiles, plans, and communication.",
                },
                {
                  title: "Attendance & Check-In",
                  text: "QR, RFID, or app-based check-ins with live tracking.",
                },
                {
                  title: "Billing & Payments",
                  text: "Automate invoices, renewals, and payment reminders.",
                },
                {
                  title: "Trainer & Staff",
                  text: "Schedules, performance, and payroll in one place.",
                },
                {
                  title: "Reports & Analytics",
                  text: "Branch-wise KPIs, revenue, and retention insights.",
                },
              ].map((feat) => (
                <article
                  key={feat.title}
                  className="flex flex-col rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-black">
                    <span>✓</span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {feat.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-gray-600">
                    {feat.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile App Section */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-20 lg:px-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
                MOBILE EXPERIENCE
              </p>
              <h2 className="pt-2 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                Gym Mobile App for Members &amp; Trainers
              </h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Members
                  </h3>
                  <ul className="mt-3 space-y-2 text-xs text-gray-600">
                    <li>• Digital membership card &amp; check-in</li>
                    <li>• Workout plans &amp; class schedules</li>
                    <li>• Payment history &amp; renewals</li>
                    <li>• Push notifications &amp; offers</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Trainers
                  </h3>
                  <ul className="mt-3 space-y-2 text-xs text-gray-600">
                    <li>• Session schedules &amp; attendance</li>
                    <li>• Member progress tracking</li>
                    <li>• Task lists &amp; follow-ups</li>
                    <li>• Mobile performance insights</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Phone mockups area with image slots */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-tr from-gray-900 via-black to-orange-600 blur-2xl opacity-80" />
              <div className="flex gap-6">

                <div className="h-90 w-90 800 rounded-2xl ">
                  {<img src="/images/card2gym.png" className="h-full w-full object-cover" alt="Member app screen" />}
                </div>



              </div>
            </div>
          </div>
        </section>

        {/* Scale & Integrations */}
        <section className="bg-gray-50">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-start lg:py-20 lg:px-0">
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl">
                Built to Scale as Your Gym Grows
              </h3>
              <p className="mt-3 text-sm text-gray-600">
                Add new branches, upgrade locations, and experiment with new
                offerings without switching systems. Gym ERP is designed to
                support you from your first studio to a nationwide network.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>• Unlimited branches and role-based access</li>
                <li>• Centralized reporting across all locations</li>
                <li>• Configurable membership plans &amp; tax rules</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight text-gray-900 sm:text-xl">
                Smart Integrations That Power Your Gym
              </h3>
              <p className="mt-3 text-sm text-gray-600">
                Connect your Gym ERP with payment gateways, access control, and
                communication tools to automate operations end-to-end.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>• Payment gateways &amp; invoicing tools</li>
                <li>• Access control (RFID, biometric, QR)</li>
                <li>• Email, SMS, and push notification providers</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20 lg:px-0">
            <div className="grid gap-10 lg:grid-cols-[2fr,1.5fr] lg:items-center">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                  Why Fitness Businesses Choose Us
                </h2>
                <p className="mt-3 text-sm text-gray-600">
                  Built with input from gym owners, trainers, and operations
                  teams across multiple countries.
                </p>
                <ul className="mt-5 space-y-2 text-sm text-gray-800">
                  <li>• Go live in 30 days with onboarding support</li>
                  <li>• Secure cloud infrastructure with backups</li>
                  <li>• Web dashboard + iOS &amp; Android apps</li>
                  <li>• Customizable workflows and roles</li>
                  <li>• Global-ready SaaS with multi-currency support</li>
                </ul>
              </div>
              <aside className="rounded-3xl border border-gray-100 bg-gray-50 p-6 text-sm text-gray-700 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-500">
                  CUSTOMER STORY
                </p>
                <p className="mt-3 text-sm text-gray-900">
                  &quot;We consolidated 5 different tools into one platform and
                  finally have real-time visibility into each branch&apos;s
                  performance.&quot;
                </p>
                <p className="mt-4 text-xs font-semibold text-gray-700">
                  — Gym Owner, Multi-Branch Fitness Brand
                </p>
              </aside>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 pb-20 lg:px-0">
            <div className="rounded-[2.5rem] bg-gray-900 px-6 py-12 text-center text-white shadow-xl sm:px-10 lg:px-16 lg:py-14">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
                FINAL CALL
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Ready to Automate &amp; Grow Your Gym?
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-200">
                Streamline operations, delight members, and unlock new revenue
                with a Gym ERP designed for modern fitness brands.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <button className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-gray-900 shadow-lg shadow-white/10 transition hover:bg-gray-100">
                  Book Free Demo
                </button>
                <button className="inline-flex items-center justify-center rounded-full border border-orange-400 bg-orange-500 px-7 py-3 text-sm font-semibold text-black shadow-lg shadow-orange-500/40 transition hover:bg-orange-400">
                  Start Your Gym SaaS Today
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;


