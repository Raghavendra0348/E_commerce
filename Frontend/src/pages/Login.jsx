import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
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
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await authService.login(data);
      const { user, accessToken, refreshToken } = res.data?.data || {};
      setAuth({ user, accessToken, refreshToken });
      fetchCart();
      toast.success(`Welcome back, ${user?.name?.split(" ")[0] || ""}! 👋`);
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid email or password";
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
        <h1 className="mb-4 text-xl font-semibold text-[#0F1111]">Sign in</h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Root error */}
          {errors.root && (
            <div className="flex items-start gap-2 rounded bg-[#FFF0F0] border border-[#CC0C39]/30 px-3 py-2 text-sm text-[#CC0C39]">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {errors.root.message}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email or mobile phone number</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-xs text-[#CC0C39]">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                {...register("password")}
                aria-invalid={!!errors.password}
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

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-xs text-[#565959] leading-relaxed">
          By continuing, you agree to Amazon's{" "}
          <a href="#" className="text-[#007185] hover:text-[#C7511F] hover:underline">
            Conditions of Use
          </a>{" "}
          and{" "}
          <a href="#" className="text-[#007185] hover:text-[#C7511F] hover:underline">
            Privacy Notice
          </a>
          .
        </p>
      </div>

      {/* Divider */}
      <div className="w-full max-w-sm mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-[#EDEDED]" />
        <span className="text-xs text-[#565959]">New to Amazon?</span>
        <div className="flex-1 h-px bg-[#EDEDED]" />
      </div>

      {/* Create account */}
      <div className="w-full max-w-sm mt-4">
        <Button variant="secondary" className="w-full" asChild>
          <Link
            to={`/register${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          >
            Create your Amazon account
          </Link>
        </Button>
      </div>
    </div>
  );
}
