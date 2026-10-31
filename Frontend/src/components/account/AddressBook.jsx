import { useState } from "react";
import { Plus, Pencil, Trash2, Phone, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const addressFormSchema = z.object({
  name: z.string().trim().min(2, "Full name required (min 2 chars)"),
  phone: z.string().trim().regex(/^[0-9]{7,15}$/, "Valid phone number required (7-15 digits)"),
  address: z.string().trim().min(5, "Street address required (min 5 chars)"),
  city: z.string().trim().min(2, "City required"),
  state: z.string().trim().min(2, "State required"),
  postalCode: z.string().trim().min(4, "Valid PIN/Postal code required"),
  country: z.string().trim().min(2, "Country required").default("India"),
});

export default function AddressBook({
  addresses = [],
  isLoading = false,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressFormSchema),
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

  const openAdd = () => {
    setEditingAddress(null);
    reset({
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    });
    setModalOpen(true);
  };

  const openEdit = (addr) => {
    setEditingAddress(addr);
    reset({
      name: addr.name || "",
      phone: addr.phone || "",
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      postalCode: addr.postalCode || "",
      country: addr.country || "India",
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingAddress) {
        await onUpdateAddress(editingAddress.id, values);
      } else {
        await onAddAddress(values);
      }
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await onDeleteAddress(deletingId);
      setDeletingId(null);
    } catch (_) {}
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-lg border border-[#EDEDED] space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <div className="pt-3 flex gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Add Address Dashed Tile */}
        <button
          onClick={openAdd}
          className="min-h-[200px] rounded-lg border-2 border-dashed border-[#D5D9D9] hover:border-[#FF9900] bg-white/60 hover:bg-white p-6 flex flex-col items-center justify-center text-center transition-all group"
        >
          <div className="h-12 w-12 rounded-full bg-[#EDEDED] group-hover:bg-[#FFF8E7] flex items-center justify-center text-[#565959] group-hover:text-[#FF9900] transition-colors mb-3">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-base text-[#0F1111] group-hover:text-[#C7511F]">
            Add Address
          </h3>
          <p className="text-xs text-[#565959] mt-1">Add a new delivery address</p>
        </button>

        {/* Saved Addresses Cards */}
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="bg-white rounded-lg border border-[#EDEDED] shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="space-y-1.5 text-xs text-[#0F1111]">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-[#0F1111] leading-snug">{addr.name}</h3>
                <span className="text-[10px] font-semibold uppercase bg-gray-100 text-[#565959] px-2 py-0.5 rounded">
                  ID #{addr.id}
                </span>
              </div>
              <p className="font-medium">{addr.address}</p>
              <p className="text-[#565959]">
                {addr.city}, {addr.state} - <strong className="text-[#0F1111]">{addr.postalCode}</strong>
              </p>
              <p className="text-[#565959]">{addr.country || "India"}</p>
              <div className="flex items-center gap-1.5 pt-1 text-[#565959]">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <span>Phone: <strong className="text-[#0F1111]">{addr.phone}</strong></span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-[#EDEDED] flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(addr)}
                className="text-xs h-8 flex-1 border-[#D5D9D9]"
              >
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingId(addr.id)}
                className="text-xs h-8 flex-1 border-[#D5D9D9] text-[#CC0C39] hover:bg-[#CC0C39]/10 hover:border-[#CC0C39]"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add/Edit Address */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0F1111]">
              {editingAddress ? "Edit Address" : "Add a New Address"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#565959]">
              Enter shipping details for deliveries
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 mt-2">
            <div>
              <Label htmlFor="bName" className="text-xs font-semibold">Full Name</Label>
              <Input id="bName" {...register("name")} className="mt-1" />
              {errors.name && <p className="text-xs text-[#CC0C39] mt-0.5">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="bPhone" className="text-xs font-semibold">Phone Number</Label>
              <Input id="bPhone" {...register("phone")} className="mt-1" />
              {errors.phone && <p className="text-xs text-[#CC0C39] mt-0.5">{errors.phone.message}</p>}
            </div>

            <div>
              <Label htmlFor="bAddr" className="text-xs font-semibold">Address Line</Label>
              <Input id="bAddr" {...register("address")} className="mt-1" />
              {errors.address && <p className="text-xs text-[#CC0C39] mt-0.5">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bCity" className="text-xs font-semibold">City</Label>
                <Input id="bCity" {...register("city")} className="mt-1" />
                {errors.city && <p className="text-xs text-[#CC0C39] mt-0.5">{errors.city.message}</p>}
              </div>
              <div>
                <Label htmlFor="bState" className="text-xs font-semibold">State</Label>
                <Input id="bState" {...register("state")} className="mt-1" />
                {errors.state && <p className="text-xs text-[#CC0C39] mt-0.5">{errors.state.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bPin" className="text-xs font-semibold">PIN Code</Label>
                <Input id="bPin" {...register("postalCode")} className="mt-1" />
                {errors.postalCode && <p className="text-xs text-[#CC0C39] mt-0.5">{errors.postalCode.message}</p>}
              </div>
              <div>
                <Label htmlFor="bCountry" className="text-xs font-semibold">Country</Label>
                <Input id="bCountry" {...register("country")} disabled value="India" className="mt-1 bg-gray-50" />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting} className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs">
                {submitting ? "Saving..." : editingAddress ? "Save Changes" : "Add Address"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#CC0C39]">
              <AlertCircle className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">Delete Address?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#565959] pt-2">
              Are you sure you want to delete this address?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingId(null)} className="text-xs">
              Keep Address
            </Button>
            <Button size="sm" onClick={handleDelete} className="bg-[#CC0C39] hover:bg-[#A00A2D] text-white text-xs font-semibold">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
