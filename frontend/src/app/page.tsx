"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

type SignupProfile = {
  firstName: string;
  lastName: string;
  role: "student" | "employee";
  email: string;
};

export default function Home() {
  const [loggedIn] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return localStorage.getItem("attendance_logged_in") === "true";
  });
  const [profile] = useState<SignupProfile | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const rawProfile = localStorage.getItem("signup_profile");
    if (!rawProfile) {
      return null;
    }
    try {
      return JSON.parse(rawProfile) as SignupProfile;
    } catch {
      return null;
    }
  });

  const displayName = useMemo(() => {
    if (!profile) {
      return "Guest";
    }
    return `${profile.firstName} ${profile.lastName}`.trim();
  }, [profile]);

  const loginUrl = `${backendBase}/accounts/google/login/?next=${encodeURIComponent(
    `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/auth/callback`
  )}`;

  useEffect(() => {
    if (loggedIn && !profile) {
      window.location.href = "/login";
    }
  }, [loggedIn, profile]);

  const completeProfileUrl = "/login";

  const handleScanFace = () => {
    if (!loggedIn) {
      window.location.href = loginUrl;
      return;
    }

    if (!profile?.firstName || !profile?.lastName || !profile?.role || !profile?.email) {
      window.location.href = completeProfileUrl;
      return;
    }

    window.location.href = "/scan";
  };

  const handleLogin = () => {
    if (loggedIn) {
      window.location.href = "/scan";
      return;
    }
    window.location.href = loginUrl;
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-zinc-100 p-6 pt-24 md:p-10 md:pt-28">
        <div className="mx-auto w-full max-w-4xl rounded-2xl bg-white p-8 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
          </div>

          <p className="mt-4 text-sm text-zinc-600">
            {loggedIn ? `Logged in as ${displayName}` : "Not logged in"}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {!loggedIn ? (
              <button
                onClick={handleLogin}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-left hover:bg-zinc-100"
              >
                <p className="text-lg font-semibold text-zinc-900">Log In</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Continue with Google OAuth account.
                </p>
              </button>
            ) : null}

            {(!loggedIn || profile?.role === "student") ? (
              <button
                onClick={handleScanFace}
                className="rounded-xl bg-blue-600 px-5 py-4 text-left text-white hover:bg-blue-700"
              >
                <p className="text-lg font-semibold">Scan Face</p>
                <p className="mt-1 text-sm text-blue-100">
                  Start check-in workflow with location and face capture.
                </p>
              </button>
            ) : null}

            {loggedIn && profile?.role === "employee" ? (
              <button
                onClick={() => { window.location.href = "/scan"; }}
                className="rounded-xl bg-indigo-600 px-5 py-4 text-left text-white hover:bg-indigo-700"
              >
                <p className="text-lg font-semibold">Employee Dashboard</p>
                <p className="mt-1 text-sm text-indigo-100">
                  Monitor student check-ins and manage event locations.
                </p>
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}