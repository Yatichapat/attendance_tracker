export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-zinc-900">Login Failed</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Could not complete OAuth sign in. Please try again from the login page.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Back to Login
        </a>
      </div>
    </main>
  );
}
