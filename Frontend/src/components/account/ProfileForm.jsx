import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .regex(/^(\+?[1-9]\d{6,14})?$/, "Enter a valid phone number (e.g. +919876543210)")
    .optional()
    .or(z.literal("")),
});

export default function ProfileForm({ user, onSave, isSaving = false }) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
    },
  });

  const handleEditClick = () => {
    reset({
      name: user?.name || "",
      phone: user?.phone || "",
    });
    setIsEditing(true);
  };

  const handleFormSubmit = async (values) => {
    const success = await onSave(values);
    if (success !== false) {
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[#EDEDED] shadow-xs p-6 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#EDEDED]">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-[#FF9900]" />
          <h2 className="text-base sm:text-lg font-bold text-[#0F1111]">
            Login & Profile Details
          </h2>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            className="text-xs h-8 border-[#D5D9D9]"
          >
            Edit Profile
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-4 text-xs">
          <div>
            <span className="font-semibold text-[#565959] uppercase tracking-wider block">
              Full Name
            </span>
            <p className="text-sm font-semibold text-[#0F1111] mt-0.5">
              {user?.name || "Not set"}
            </p>
          </div>

          <div>
            <span className="font-semibold text-[#565959] uppercase tracking-wider block">
              Email Address
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-semibold text-[#0F1111]">{user?.email}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#067D62] bg-[#E6F5F0] px-2 py-0.5 rounded-full">
                <CheckCircle className="h-3 w-3" /> Verified
              </span>
            </div>
          </div>

          <div>
            <span className="font-semibold text-[#565959] uppercase tracking-wider block">
              Mobile Phone
            </span>
            <p className="text-sm font-medium text-[#0F1111] mt-0.5">
              {user?.phone || <span className="text-gray-400 italic">No phone added</span>}
            </p>
          </div>

          <div>
            <span className="font-semibold text-[#565959] uppercase tracking-wider block">
              Account Role
            </span>
            <div className="mt-0.5">
              <span className="inline-block bg-[#131921] text-white text-xs font-semibold px-2.5 py-0.5 rounded">
                {user?.role || "USER"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="profName" className="text-xs font-semibold text-[#0F1111]">
              Full Name
            </Label>
            <Input
              id="profName"
              {...register("name")}
              placeholder="Enter your full name"
              className="mt-1"
            />
            {errors.name && (
              <p className="text-xs text-[#CC0C39] mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="profPhone" className="text-xs font-semibold text-[#0F1111]">
              Mobile Phone Number
            </Label>
            <Input
              id="profPhone"
              {...register("phone")}
              placeholder="+919876543210"
              className="mt-1"
            />
            {errors.phone && (
              <p className="text-xs text-[#CC0C39] mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
