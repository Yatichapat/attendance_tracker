"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

type FormState = {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
};

const defaultForm: FormState = {
  firstName: "",
  lastName: "",
  role: "",
  email: "",
};

export default function LoginPage() {
  const frontendOrigin =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existingProfile = localStorage.getItem("signup_profile");
    if (existingProfile) {
      try {
        const parsed = JSON.parse(existingProfile) as FormState;
        setForm(parsed);
        return;
      } catch {
        // ignore broken local data
      }
    }

    const authEmail = localStorage.getItem("auth_email") ?? "";
    if (authEmail) {
      setForm((prev) => ({ ...prev, email: authEmail }));
    }
  }, []);

  const isValid = useMemo(() => {
    return (
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      form.role.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
    );
  }, [form]);

  const googleLoginUrl = `${backendBase}/accounts/google/login/`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${backendBase}/api/profile/upsert/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          role: form.role,
          email: form.email,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Could not save profile.");
      }

      localStorage.setItem("signup_profile", JSON.stringify(form));
      window.location.href = "/";
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unexpected error while connecting to server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold">Complete your profile</h1>
          <p className="mt-2 text-sm text-slate-600">
            Login is complete. Please fill your name and role to continue.
          </p>

          {!form.email ? (
            <a
              href={`${googleLoginUrl}?next=${encodeURIComponent(`${frontendOrigin}/auth/callback`)}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Continue with Google
            </a>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-sm font-medium">First name</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                placeholder="Your first name"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Last name</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                placeholder="Your last name"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-slate-500"
                required
              >
                <option value="">Select role</option>
                <option value="student">Student</option>
                <option value="employee">Employee</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {loading ? "Preparing..." : "Continue with Google"}
            </button>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </div>
      </section>
    </main>
  );
}
