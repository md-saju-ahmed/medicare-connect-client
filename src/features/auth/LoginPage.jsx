"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Container from "@/components/shared/Container";
import { authClient } from "@/lib/auth-client";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const { data: result, error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        toast.error(error.message || "Login failed");
        return;
      }

      toast.success("Login successful");
      router.push(callbackUrl);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: callbackUrl,
    });
  };

  return (
    <main className="flex items-center justify-center bg-background py-20">
      <Container>
        <motion.div
          initial={{ y: 60, scale: 0.92 }}
          animate={{ y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 14,
          }}
          className="mx-auto w-full max-w-md"
        >
          <div className="rounded-lg bg-card p-8 shadow-xs sm:p-10">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Welcome Back
              </h1>
              <p className="mt-2 text-muted-foreground">
                Login to manage your appointments
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="mt-2 h-12 rounded-md bg-muted/10 focus-visible:ring-ring/30"
                  {...register("email", {
                    required: "Email is required",
                  })}
                />

                {errors.email && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="h-12 rounded-md bg-muted/10 pr-12 focus-visible:ring-ring/30"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-md transition-all hover:bg-primary/90 active:scale-95"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  or continue with
                </span>
                <Separator className="flex-1" />
              </div>

              {/* Google Login */}
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                className="h-12 w-full gap-3 rounded-md bg-muted/10"
                onClick={handleGoogleSignin}
              >
                <Image
                  src="/icons/google.svg"
                  alt="Google"
                  width={20}
                  height={20}
                />
                Continue with Google
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline"
              >
                Register
              </Link>
            </p>

            {/* Demo Credentials */}
            <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-3">
              <p className="mb-2 text-xs font-medium text-foreground">
                Demo Credentials:
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <span className="font-medium">Admin:</span>{" "}
                  <code className="font-mono break-all sm:break-normal">
                    admin@medicare.com
                  </code>{" "}
                  <span className="hidden sm:inline">/</span>{" "}
                  <code className="font-mono break-all sm:break-normal">
                    Admin@123
                  </code>
                </li>
                <li className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <span className="font-medium">Doctor:</span>{" "}
                  <code className="font-mono break-all sm:break-normal">
                    sarah.mitchell@medicare.com
                  </code>{" "}
                  <span className="hidden sm:inline">/</span>{" "}
                  <code className="font-mono break-all sm:break-normal">
                    Doctor@123
                  </code>
                </li>
                <li className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <span className="font-medium">Patient:</span>{" "}
                  <code className="font-mono break-all sm:break-normal">
                    john.smith@medicare.com
                  </code>{" "}
                  <span className="hidden sm:inline">/</span>{" "}
                  <code className="font-mono break-all sm:break-normal">
                    Patient@123
                  </code>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </Container>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
