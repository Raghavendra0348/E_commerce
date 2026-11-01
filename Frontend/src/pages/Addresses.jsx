import { T } from "@/components/common/Translation";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import AddressBook from "@/components/account/AddressBook";
import { addressService } from "@/services";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Addresses() {
  useDocumentTitle("Your Addresses");
  const queryClient = useQueryClient();

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await addressService.getAll();
      return res.data?.data || [];
    },
  });

  const handleAddAddress = async (data) => {
    try {
      await addressService.create(data);
      toast.success("New address added successfully");
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add address");
      return false;
    }
  };

  const handleUpdateAddress = async (id, data) => {
    try {
      await addressService.update(id, data);
      toast.success("Address updated successfully");
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update address");
      return false;
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      await addressService.delete(id);
      toast.success("Address deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete address");
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEDED] py-6 sm:py-8">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#565959]">
          <Link to="/account/profile" className="hover:text-[#C7511F] hover:underline">
            <T>{"Your Account"}</T>
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[#0F1111] font-semibold"><T>{"Your Addresses"}</T></span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1111]"><T>{"Your Addresses"}</T></h1>
          <p className="text-sm text-[#565959] mt-0.5">
            Manage saved shipping addresses for orders and deliveries
          </p>
        </div>

        <AddressBook
          addresses={addresses}
          isLoading={isLoading}
          onAddAddress={handleAddAddress}
          onUpdateAddress={handleUpdateAddress}
          onDeleteAddress={handleDeleteAddress}
        />
      </div>
    </div>
  );
}
