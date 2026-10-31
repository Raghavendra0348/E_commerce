import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Package,
  MapPin,
  Heart,
  ChevronRight,
  Shield,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";
import api from "@/api/axios";

export default function Profile() {
  useDocumentTitle("Your Account Profile");
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  const handleSaveProfile = async (values) => {
    setProfileSaving(true);
    try {
      const res = await api.put("/auth/profile", {
        name: values.name,
        phone: values.phone || undefined,
      });
      const updatedUser = res.data?.data || { ...user, ...values };
      setUser(updatedUser);
      toast.success("Profile updated successfully!");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
      return false;
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (values) => {
    setPasswordSaving(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password changed successfully! Please log in again.");
      logout();
      navigate("/login");
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
      return false;
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm("Are you sure you want to sign out from all devices?")) return;
    setLoggingOutAll(true);
    try {
      await api.post("/auth/logout-all");
      toast.success("Signed out of all devices");
      logout();
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to sign out of all devices");
    } finally {
      setLoggingOutAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAEDED] py-6 sm:py-8">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F1111]">Your Account</h1>
          <p className="text-sm text-[#565959] mt-0.5">
            Manage your personal profile, credentials, and saved addresses
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/account/orders"
            className="flex items-center gap-4 bg-white p-4 rounded-lg border border-[#EDEDED] shadow-xs hover:border-[#FF9900] transition-colors group"
          >
            <div className="h-12 w-12 rounded-full bg-[#FFF8E7] flex items-center justify-center text-[#FF9900] group-hover:scale-105 transition-transform">
              <Package className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-[#0F1111] group-hover:text-[#C7511F]">
                Your Orders
              </h3>
              <p className="text-xs text-[#565959] truncate">Track, return, or buy again</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#888C8C]" />
          </Link>

          <Link
            to="/account/addresses"
            className="flex items-center gap-4 bg-white p-4 rounded-lg border border-[#EDEDED] shadow-xs hover:border-[#FF9900] transition-colors group"
          >
            <div className="h-12 w-12 rounded-full bg-[#E6F5F0] flex items-center justify-center text-[#067D62] group-hover:scale-105 transition-transform">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-[#0F1111] group-hover:text-[#C7511F]">
                Your Addresses
              </h3>
              <p className="text-xs text-[#565959] truncate">Edit addresses for orders</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#888C8C]" />
          </Link>

          <Link
            to="/wishlist"
            className="flex items-center gap-4 bg-white p-4 rounded-lg border border-[#EDEDED] shadow-xs hover:border-[#FF9900] transition-colors group"
          >
            <div className="h-12 w-12 rounded-full bg-[#FCE8EC] flex items-center justify-center text-[#CC0C39] group-hover:scale-105 transition-transform">
              <Heart className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-[#0F1111] group-hover:text-[#C7511F]">
                Your Wishlist
              </h3>
              <p className="text-xs text-[#565959] truncate">View saved items</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#888C8C]" />
          </Link>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProfileForm
            user={user}
            onSave={handleSaveProfile}
            isSaving={profileSaving}
          />

          <div className="space-y-6">
            <PasswordForm
              onSave={handleChangePassword}
              isSaving={passwordSaving}
            />

            {/* Session Management Card */}
            <div className="bg-white rounded-lg border border-[#EDEDED] shadow-xs p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[#067D62]" />
                <h3 className="text-sm font-semibold text-[#0F1111]">Active Sessions</h3>
              </div>
              <p className="text-xs text-[#565959]">
                If you suspect unauthorized activity, you can securely sign out from all active browsers and devices.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogoutAll}
                disabled={loggingOutAll}
                className="text-xs border-[#CC0C39] text-[#CC0C39] hover:bg-[#CC0C39]/10"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                {loggingOutAll ? "Signing Out..." : "Sign Out of All Devices"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
