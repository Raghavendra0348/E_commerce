import { T } from "@/components/common/Translation";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { setAuth } = useAuthStore();
  const { fetchCart } = useCartStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ name, email, phone, password }) => {
    setIsLoading(true);
    try {
      const res = await authService.register({
        name,
        email,
        password,
        ...(phone ? { phone } : {}),
      });
      const { user, accessToken, refreshToken } = res.data?.data || {};
      setAuth({ user, accessToken, refreshToken });
      fetchCart();
      toast.success(`Welcome to Amazon, ${user?.name?.split(" ")[0] || ""}! 🎉`);
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      setError("root", { message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-start pt-8 pb-12 px-4 bg-white">
      {/* Logo */}
      <Link to="/" className="mb-6">
        <div className="text-[#0F1111] text-3xl font-extrabold">
          amazon<span className="text-[#FF9900]">.in</span>
        </div>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm rounded-lg border border-[#D5D9D9] bg-white px-7 py-5">
        <h1 className="mb-1 text-xl font-semibold text-[#0F1111]"><T>{"Create account"}</T></h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3 mt-4">
          {/* Root error */}
          {errors.root && (
            <div className="flex items-start gap-2 rounded bg-[#FFF0F0] border border-[#CC0C39]/30 px-3 py-2 text-sm text-[#CC0C39]">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {errors.root.message}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="name"><T>{"Your name"}</T></Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="First and last name"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-[#CC0C39]">{errors.name.message}</p>
            )}
          </div>

          {/* Mobile (optional) */}
          <div className="space-y-1">
            <Label htmlFor="phone">
              Mobile number{" "}
              <span className="text-xs text-[#565959] font-normal">(optional)</span>
            </Label>
            <div className="flex">
              <span className="flex items-center px-3 border border-r-0 border-[#D5D9D9] rounded-l bg-gray-50 text-sm text-[#565959]">
                +91
              </span>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                className="rounded-l-none"
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-[#CC0C39]">{errors.phone.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-[#CC0C39]">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="password"><T>{"Password"}</T></Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                {...register("password")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565959] hover:text-[#0F1111]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-[#CC0C39]">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Re-enter password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                {...register("confirmPassword")}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#565959] hover:text-[#0F1111]"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-[#CC0C39]">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button type="submit" className="w-full mt-1" disabled={isLoading}>
            <T>{isLoading ? "Creating account..." : "Create your Amazon account"}</T>
          </Button>
        </form>

        <p className="mt-4 text-xs text-[#565959] leading-relaxed">
          By creating an account, you agree to Amazon's{" "}
          <a href="#" className="text-[#007185] hover:underline hover:text-[#C7511F]">
            Conditions of Use
          </a>{" "}
          and{" "}
          <a href="#" className="text-[#007185] hover:underline hover:text-[#C7511F]">
            Privacy Notice
          </a>
          .
        </p>

        <div className="mt-4 border-t border-[#EDEDED] pt-4">
          <p className="text-sm text-[#0F1111]">
            Already have an account?{" "}
            <Link
              to={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="text-[#007185] hover:text-[#C7511F] hover:underline"
            >
              Sign in ›
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
