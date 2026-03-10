"use client";

import { useEffect, useState } from "react";

type SignupProfile = {
    firstName: string;
    lastName: string;
    role: "student" | "employee";
    email: string;
};

export default function Navbar() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [profile, setProfile] = useState<SignupProfile | null>(null);
    const [mounted, setMounted] = useState(false);

    const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

    useEffect(() => {
        setMounted(true);
        const authStatus = localStorage.getItem("attendance_logged_in") === "true";
        setLoggedIn(authStatus);

        if (authStatus) {
            const existingProfile = localStorage.getItem("signup_profile");
            if (existingProfile) {
                try {
                    const parsed = JSON.parse(existingProfile) as SignupProfile;
                    setProfile(parsed);
                } catch {
                    // ignore
                }
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("attendance_logged_in");
        localStorage.removeItem("auth_email");
        localStorage.removeItem("signup_profile");
        window.location.href = `${backendBase}/accounts/logout/`;
    };

    if (!mounted) {
        return <div className="h-16 w-full bg-zinc-900 flex items-center shadow-md"></div>;
    }

    const displayName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "Guest";

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-between bg-zinc-900 px-6 shadow-md md:px-10">
            <div className="flex items-center gap-4">
                <a href="/" className="text-lg font-bold text-white hover:text-zinc-300 transition-colors">
                    Attendance Tracker
                </a>
            </div>

            <div className="flex items-center gap-4">
                {loggedIn ? (
                    <>
                        <span className="hidden text-sm font-medium text-zinc-300 md:inline-block">
                            {displayName}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-zinc-900"
                        >
                            Log Out
                        </button>
                    </>
                ) : null}
            </div>
        </nav>
    );
}
