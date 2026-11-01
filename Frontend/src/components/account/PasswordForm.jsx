import { T } from "@/components/common/Translation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/\d/, "Must contain at least one number")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"],
  });

export default function PasswordForm({ onSave, isSaving = false }) {
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values) => {
    const success = await onSave(values);
    if (success !== false) {
      reset();
    }
  };

  return (
    <div className="account-form-panel min-w-0 bg-white rounded-lg border border-[#EDEDED] shadow-xs p-6 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-[#EDEDED]">
        <KeyRound className="h-5 w-5 text-[#FF9900]" />
        <h2 className="text-base sm:text-lg font-bold text-[#0F1111]"><T>{"Change Password"}</T></h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div>
          <Label htmlFor="currPw" className="text-xs font-semibold text-[#0F1111]">
            <T>{"Current Password"}</T>
          </Label>
          <div className="relative mt-1">
            <Input
              id="currPw"
              type={showCurrentPw ? "text" : "password"}
              {...register("currentPassword")}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw(!showCurrentPw)}
              className="absolute right-3 top-2.5 text-[#565959] hover:text-[#0F1111]"
              aria-label="Toggle current password visibility"
            >
              {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-[#CC0C39] mt-1">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="newPw" className="text-xs font-semibold text-[#0F1111]">
            <T>{"New Password"}</T>
          </Label>
          <div className="relative mt-1">
            <Input
              id="newPw"
              type={showNewPw ? "text" : "password"}
              {...register("newPassword")}
              placeholder="Min. 8 characters with 1 number & uppercase"
            />
            <button
              type="button"
              onClick={() => setShowNewPw(!showNewPw)}
              className="absolute right-3 top-2.5 text-[#565959] hover:text-[#0F1111]"
              aria-label="Toggle new password visibility"
            >
              {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-[#CC0C39] mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confPw" className="text-xs font-semibold text-[#0F1111]">
            Re-enter New Password
          </Label>
          <div className="relative mt-1">
            <Input
              id="confPw"
              type={showConfirmPw ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPw(!showConfirmPw)}
              className="absolute right-3 top-2.5 text-[#565959] hover:text-[#0F1111]"
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-[#CC0C39] mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs"
          >
            <T>{isSaving ? "Updating Password..." : "Update Password"}</T>
          </Button>
        </div>
      </form>
    </div>
  );
}
