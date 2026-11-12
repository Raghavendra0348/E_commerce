import { T } from "../common/Translation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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
    <div id="profile-details" className="profile-details-card account-form-panel min-w-0 bg-white rounded-lg border border-[#EDEDED] shadow-xs p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EDEDED]">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-[#FF9900]" />
          <h2 className="text-base sm:text-lg font-bold text-[#0F1111]">
            Personal details
          </h2>
        </div>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            aria-label="Edit profile"
            className="text-xs h-8 border-[#D5D9D9]"
          >
            Edit
          </Button>
        )}
      </div>

      {!isEditing ? (
        <dl className="profile-details-list">
          <div>
            <dt>
              <T>{"Full Name"}</T>
            </dt>
            <dd>
              {user?.name || "Not set"}
            </dd>
          </div>

          <div>
            <dt>
              <T>{"Email Address"}</T>
            </dt>
            <dd>{user?.email || "Not set"}<small>Your sign-in email address</small></dd>
          </div>

          <div>
            <dt>
              Mobile Phone
            </dt>
            <dd>
              {user?.phone || <span className="text-gray-400 italic">No phone added</span>}
            </dd>
          </div>

        </dl>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="profName" className="text-xs font-semibold text-[#0F1111]">
              <T>{"Full Name"}</T>
            </Label>
            <Input
              id="profName"
              autoComplete="name"
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
              type="tel"
              autoComplete="tel"
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
              <T>{isSaving ? "Saving..." : "Save Changes"}</T>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="text-xs"
            >
              <T>{"Cancel"}</T>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
