import { T } from "../components/common/Translation";
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
  ShoppingCart,
  LockKeyhole,
  MonitorSmartphone,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../store/useAuthStore";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import ProfileForm from "../components/account/ProfileForm";
import PasswordForm from "../components/account/PasswordForm";
import api from "../api/axios";
import "../styles/account-profile.css";

const ACCOUNT_SHORTCUTS = [
  { title: "Your Orders", description: "Track orders, view details or buy again", href: "/account/orders", icon: Package, tone: "orders" },
  { title: "Login & security", description: "Edit your name, mobile number and password", href: "#login-security", icon: LockKeyhole, tone: "security" },
  { title: "Your Addresses", description: "Add or edit your delivery addresses", href: "/account/addresses", icon: MapPin, tone: "addresses" },
  { title: "Your Wishlist", description: "Rediscover the products you saved", href: "/wishlist", icon: Heart, tone: "wishlist" },
  { title: "Your Cart", description: "View items and continue to checkout", href: "/cart", icon: ShoppingCart, tone: "cart" },
  { title: "Your Devices & Sessions", description: "Manage access across your devices", href: "#account-sessions", icon: MonitorSmartphone, tone: "sessions" },
];

function AccountShortcut({ item }) {
  const Destination = item.href.startsWith("#") ? "a" : Link;
  const destination = item.href.startsWith("#") ? { href: item.href } : { to: item.href };
  const Icon = item.icon;
  return (
    <Destination id={`account-shortcut-${item.tone}`} {...destination} className="account-shortcut">
      <span className={`account-shortcut-icon account-icon-${item.tone}`}><Icon aria-hidden="true" strokeWidth={1.5} /></span>
      <span className="account-shortcut-copy"><span className="account-shortcut-title"><T>{item.title}</T></span><span className="account-shortcut-description">{item.description}</span></span>
      <ChevronRight className="account-shortcut-chevron" aria-hidden="true" />
    </Destination>
  );
}

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
    <div id="account-profile" className="account-profile-page">
      <div className="account-profile-container">
        <nav className="account-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link><ChevronRight aria-hidden="true" /><span aria-current="page">Your Account</span></nav>
        <header className="account-page-header">
          <h1><T>{"Your Account"}</T></h1>
          <p>Hello, {user?.name || "there"}. Manage your account and shopping preferences.</p>
        </header>
        <nav id="account-shortcuts" className="account-shortcuts" aria-label="Account services">
          {ACCOUNT_SHORTCUTS.map(item => <AccountShortcut key={item.tone} item={item} />)}
        </nav>
        <section id="login-security" className="account-security-section" aria-labelledby="account-security-title">
          <div className="account-section-heading"><h2 id="account-security-title">Login &amp; security</h2><p>Keep your personal details and password up to date.</p></div>
          <div className="account-settings-grid">
          <ProfileForm
            user={user}
            onSave={handleSaveProfile}
            isSaving={profileSaving}
          />

            <PasswordForm
              onSave={handleChangePassword}
              isSaving={passwordSaving}
            />

          </div>
        </section>
        <section id="account-sessions" className="account-sessions-panel" aria-labelledby="account-sessions-title">
          <Shield className="account-sessions-icon" aria-hidden="true" />
          <div><h2 id="account-sessions-title">Secure your account</h2><p>Signed in on a shared device? Sign out of all browsers and devices to protect your account.</p></div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogoutAll}
                disabled={loggingOutAll}
                className="account-session-button"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                {loggingOutAll ? "Signing Out..." : "Sign Out of All Devices"}
              </Button>
        </section>
      </div>
    </div>
  );
}
