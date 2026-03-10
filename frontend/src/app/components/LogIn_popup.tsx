"use client";

export default function Home() {

  const handleLogin = () => {
    window.location.href =
      "http://127.0.0.1:8000/accounts/google/login/?prompt=select_account";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">

      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-xl dark:bg-zinc-900 text-center">

        <h1 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-white">
          Attendance Tracker
        </h1>

        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Please log in first to continue
        </p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-zinc-300 py-3 font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            className="w-5 h-5"
          />

          Continue with Google
        </button>

      </div>

    </div>
  );
}