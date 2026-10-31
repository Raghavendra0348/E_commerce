import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const addressSchema = z.object({
  name: z.string().trim().min(2, "Full name required (min 2 characters)"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Valid 10-digit Indian mobile number required"),
  address: z.string().trim().min(5, "Flat, House no., street required (min 5 characters)"),
  city: z.string().trim().min(2, "City / Town required"),
  state: z.string().trim().min(2, "State required"),
  postalCode: z.string().trim().regex(/^\d{6}$/, "Valid 6-digit PIN code required"),
  country: z.string().trim().default("India"),
});

export default function AddressForm({ onSubmit, onCancel, isSubmitting = false }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-5 rounded-lg border border-[#D5D9D9]">
      <h3 className="text-sm font-bold text-[#0F1111]">Add a new delivery address</h3>

      <div>
        <Label htmlFor="chkName" className="text-xs font-semibold text-[#0F1111]">
          Full Name (First and Last name)
        </Label>
        <Input
          id="chkName"
          {...register("name")}
          placeholder="e.g. Rahul Sharma"
          className="mt-1"
        />
        {errors.name && (
          <p className="text-xs text-[#CC0C39] mt-0.5">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="chkPhone" className="text-xs font-semibold text-[#0F1111]">
          Mobile Number
        </Label>
        <Input
          id="chkPhone"
          {...register("phone")}
          placeholder="10-digit mobile number without +91"
          className="mt-1"
        />
        <p className="text-[11px] text-[#565959] mt-0.5">May be used to assist delivery</p>
        {errors.phone && (
          <p className="text-xs text-[#CC0C39] mt-0.5">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="chkAddress" className="text-xs font-semibold text-[#0F1111]">
          Flat, House no., Building, Company, Apartment
        </Label>
        <Input
          id="chkAddress"
          {...register("address")}
          placeholder="e.g. 102, Palm Heights, Brigade Road"
          className="mt-1"
        />
        {errors.address && (
          <p className="text-xs text-[#CC0C39] mt-0.5">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="chkCity" className="text-xs font-semibold text-[#0F1111]">
            Town / City
          </Label>
          <Input
            id="chkCity"
            {...register("city")}
            placeholder="e.g. Bengaluru"
            className="mt-1"
          />
          {errors.city && (
            <p className="text-xs text-[#CC0C39] mt-0.5">{errors.city.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="chkState" className="text-xs font-semibold text-[#0F1111]">
            State
          </Label>
          <Input
            id="chkState"
            {...register("state")}
            placeholder="e.g. Karnataka"
            className="mt-1"
          />
          {errors.state && (
            <p className="text-xs text-[#CC0C39] mt-0.5">{errors.state.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="chkPostal" className="text-xs font-semibold text-[#0F1111]">
            6-Digit PIN Code
          </Label>
          <Input
            id="chkPostal"
            {...register("postalCode")}
            placeholder="e.g. 560001"
            className="mt-1"
          />
          {errors.postalCode && (
            <p className="text-xs text-[#CC0C39] mt-0.5">{errors.postalCode.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="chkCountry" className="text-xs font-semibold text-[#0F1111]">
            Country
          </Label>
          <Input
            id="chkCountry"
            {...register("country")}
            disabled
            value="India"
            className="mt-1 bg-gray-50 text-gray-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs"
        >
          {isSubmitting ? "Saving Address..." : "Use this address"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
