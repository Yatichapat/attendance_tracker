"use client";

import { useEffect } from "react";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

export default function AuthCallbackPage() {
  useEffect(() => {
    const bootstrap = async () => {
      localStorage.setItem("attendance_logged_in", "true");
      let authEmail = "";

      try {
        const response = await fetch(`${backendBase}/api/auth/me/`, {
          method: "GET",
          credentials: "include",
        });

        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload.authenticated && payload.email) {
          authEmail = payload.email;
          localStorage.setItem("auth_email", authEmail);
        }
      } catch {
        // Ignore callback fetch failure and continue to app.
      }

      if (authEmail) {
        try {
          const profileRes = await fetch(
            `${backendBase}/api/profile/get/?email=${encodeURIComponent(authEmail)}`,
            {
              method: "GET",
              credentials: "include",
            }
          );
          const profilePayload = await profileRes.json().catch(() => ({}));
          if (profileRes.ok && profilePayload.profile) {
            localStorage.setItem("signup_profile", JSON.stringify(profilePayload.profile));
            window.location.replace("/");
            return;
          }
        } catch {
          // Ignore fetch errors
        }
      }

      window.location.replace("/login");
    };

    void bootstrap();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <p className="text-sm text-zinc-600">Completing sign in...</p>
    </main>
  );
}
