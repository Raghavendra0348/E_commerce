import { T } from "@/components/common/Translation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield,
  ShieldAlert,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Pagination from "@/components/common/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { adminService } from "@/services";
import { formatPrice, cn } from "@/lib/utils";
import UserTable from "@/components/admin/UserTable";

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);

  // Fetch users
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminUsers", page],
    queryFn: async () => {
      const res = await adminService.getUsers({ page, limit: 10 });
      const raw = res.data;
      const users = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.users)
        ? raw.users
        : [];
      const pagination = raw?.pagination || raw?.data?.pagination || { totalPages: 1 };
      return { users, pagination };
    },
    keepPreviousData: true,
  });

  const users = data?.users || [];
  const pagination = data?.pagination || { totalPages: 1 };

  // Fetch single user details for inspection modal
  const { data: userDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["adminUserDetail", viewingUserId],
    queryFn: async () => {
      const res = await adminService.getUserById(viewingUserId);
      return res.data?.data || null;
    },
    enabled: !!viewingUserId,
  });

  const handleRoleToggle = async () => {
    if (!roleModalUser) return;
    const nextRole = roleModalUser.role === "ADMIN" ? "USER" : "ADMIN";
    setUpdatingRole(true);
    try {
      await adminService.changeRole(roleModalUser.id, nextRole);
      toast.success(
        `${roleModalUser.name} role changed to ${nextRole}`
      );
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setRoleModalUser(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setUpdatingRole(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1111]">User Directory & Access Control</h1>
          <p className="text-xs text-[#565959] mt-0.5">
            Manage customer accounts, inspect purchase histories, and assign administrator privileges
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="text-xs self-start sm:self-auto border-gray-300 hover:bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh Users
        </Button>
      </div>

      {/* Users Table Component */}
      <UserTable
        users={users}
        isLoading={isLoading}
        onToggleRole={setRoleModalUser}
        onViewUser={setViewingUserId}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modal: Role Toggle Confirmation */}
      <Dialog open={!!roleModalUser} onOpenChange={(open) => !open && setRoleModalUser(null)}>
        <DialogContent className="sm:max-w-md">
          {roleModalUser && (
            <div>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-[#FF9900]" />
                  <DialogTitle className="text-base font-bold">
                    {roleModalUser.role === "ADMIN" ? "Demote Administrator?" : "Promote to Admin?"}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-[#565959] pt-2 leading-relaxed">
                  {roleModalUser.role === "ADMIN" ? (
                    <>
                      Are you sure you want to demote <strong>{roleModalUser.name}</strong> to a regular{" "}
                      <span className="font-semibold text-[#0F1111]">USER</span>? They will lose access to the
                      entire Admin Console immediately.
                    </>
                  ) : (
                    <>
                      Are you sure you want to promote <strong>{roleModalUser.name}</strong> to an{" "}
                      <span className="font-semibold text-[#FF9900]">ADMIN</span>? They will gain full administrative
                      privileges over catalog items, order pipelines, and users.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRoleModalUser(null)}
                  className="text-xs"
                >
                  <T>{"Cancel"}</T>
                </Button>
                <Button
                  size="sm"
                  disabled={updatingRole}
                  onClick={handleRoleToggle}
                  className={cn(
                    "text-xs font-semibold",
                    roleModalUser.role === "ADMIN"
                      ? "bg-[#CC0C39] hover:bg-[#A00A2D] text-white"
                      : "bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111]"
                  )}
                >
                  {updatingRole
                    ? "Updating..."
                    : roleModalUser.role === "ADMIN"
                    ? "Confirm Demotion"
                    : "Confirm Promotion"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: User Inspection Dialog */}
      <Dialog open={!!viewingUserId} onOpenChange={(open) => !open && setViewingUserId(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {detailsLoading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : userDetails ? (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-[#0F1111] flex items-center justify-between">
                  <span>{userDetails.name}</span>
                  <span className="text-xs font-mono font-normal text-gray-400">
                    ID #{userDetails.id}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-[#565959]">
                  Member since {new Date(userDetails.createdAt).toLocaleDateString("en-IN")}
                </DialogDescription>
              </DialogHeader>

              {/* User overview */}
              <div className="bg-gray-50 rounded-lg p-3.5 space-y-1.5 text-xs">
                <p className="flex items-center gap-2 text-[#0F1111]">
                  <Mail className="h-3.5 w-3.5 text-gray-400" /> {userDetails.email}
                </p>
                {userDetails.phone && (
                  <p className="flex items-center gap-2 text-[#0F1111]">
                    <Phone className="h-3.5 w-3.5 text-gray-400" /> {userDetails.phone}
                  </p>
                )}
                <p className="flex items-center gap-2 text-[#0F1111]">
                  <Shield className="h-3.5 w-3.5 text-gray-400" /> Role:{" "}
                  <strong className="text-[#0F1111]">{userDetails.role}</strong>
                </p>
              </div>

              {/* Saved Addresses */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#565959]">
                  Saved Addresses ({userDetails.addresses?.length || 0})
                </h4>
                {userDetails.addresses?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No saved addresses on file.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {userDetails.addresses.map((a) => (
                      <div key={a.id} className="p-2 rounded border border-gray-200 text-xs text-[#0F1111]">
                        <p className="font-semibold">{a.name} — {a.phone}</p>
                        <p className="text-[#565959]">{a.address}, {a.city}, {a.state} {a.postalCode}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#565959]">
                  Recent Orders ({userDetails.orders?.length || 0})
                </h4>
                {userDetails.orders?.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No orders placed yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {userDetails.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-2.5 rounded border border-gray-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-[#0F1111]">Order #{ord.id}</p>
                          <p className="text-[11px] text-[#565959]">
                            {new Date(ord.createdAt).toLocaleDateString("en-IN")} • {ord.items?.length || 0} items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#B12704]">{formatPrice(ord.totalAmount)}</p>
                          <span className="text-[10px] uppercase font-semibold text-gray-500">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
