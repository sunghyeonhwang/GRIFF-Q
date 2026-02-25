import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
}) {
  const user = await getUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoginForm redirectTo={params.redirectTo} error={params.error} />
    </div>
  );
}
