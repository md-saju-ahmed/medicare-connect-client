"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import Container from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import ComboboxFilter from "@/components/shared/ComboboxFilter";
import { authClient } from "@/lib/auth-client";

const roleOptions = [
  {
    value: "patient",
    label: "Patient",
  },
  {
    value: "doctor",
    label: "Doctor",
  },
];

const genderOptions = [
  {
    value: "male",
    label: "Male",
  },
  {
    value: "female",
    label: "Female",
  },
  {
    value: "other",
    label: "Other",
  },
];

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "",
      gender: "",
      photo: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const { error } = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        gender: data.gender,
        image: data.photo,
      });

      if (error) {
        toast.error(error.message || "Registration failed");
        return;
      }

      toast.success("Registration successful");
      router.push(callbackUrl);
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);

      await authClient.signIn.social({
        provider: "google",
        callbackURL: callbackUrl,
      });
    } catch (error) {
      toast.error(error.message || "Google signup failed");

      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center bg-background py-20">
      <Container>
        <motion.div
          initial={{ y: 60, scale: 0.92 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="rounded-lg bg-card p-8 shadow-xs sm:p-10">
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Create Account
              </h1>
              <p className="mt-2 text-muted-foreground">
                Register to manage your healthcare journey
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground"
                >
                  Full Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  className="mt-2 h-12 rounded-md bg-muted/10"
                  {...register("name", {
                    required: "Full name is required",
                  })}
                />

                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="mt-2 h-12 rounded-md bg-muted/10"
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
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password *
                </label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="h-12 rounded-md bg-muted/10 pr-12"
                    {...register("password", {
                      required: "Password is required",

                      validate: {
                        minLength: (value) =>
                          value.length >= 6 ||
                          "Password must be at least 6 characters",

                        hasNumber: (value) =>
                          /\d/.test(value) ||
                          "Password must contain at least one number",

                        hasSpecialChar: (value) =>
                          /[!@#$%^&*(),.?":{}|<>]/.test(value) ||
                          "Password must contain at least one special character",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}

                {/* Password Requirements */}
                <div className="mt-3 rounded-md border bg-muted/40 p-3">
                  <p className="mb-2 text-xs font-medium text-foreground">
                    Password requirements:
                  </p>

                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      At least 6 characters
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Include at least one number
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">✓</span>
                      Include at least one special character
                    </li>
                  </ul>
                </div>
              </div>

              {/* Role + Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Clinic Role *
                  </label>
                  <Controller
                    name="role"
                    control={control}
                    rules={{
                      required: "Role is required",
                    }}
                    render={({ field }) => (
                      <ComboboxFilter
                        options={roleOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select role"
                        width="w-full"
                      />
                    )}
                  />

                  {errors.role && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.role.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Gender *
                  </label>
                  <Controller
                    name="gender"
                    control={control}
                    rules={{
                      required: "Gender is required",
                    }}
                    render={({ field }) => (
                      <ComboboxFilter
                        options={genderOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select gender"
                        width="w-full"
                      />
                    )}
                  />

                  {errors.gender && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.gender.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Photo */}
              <div>
                <label
                  htmlFor="photo"
                  className="text-sm font-medium text-foreground"
                >
                  Profile Photo URL
                </label>
                <Input
                  id="photo"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  className="mt-2 h-12 rounded-md bg-muted/10"
                  {...register("photo")}
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-md"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  or continue with
                </span>
                <Separator className="flex-1" />
              </div>

              {/* Google */}
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={handleGoogleSignup}
                className="h-12 w-full gap-3 bg-muted/10"
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </motion.div>
      </Container>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  );
}
