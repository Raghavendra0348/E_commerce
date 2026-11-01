import { T } from "@/components/common/Translation";
import { Users, Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function UserTable({
  users = [],
  isLoading = false,
  onToggleRole,
  onViewUser,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs py-12 text-center text-xs text-[#565959]">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
        <p className="font-semibold text-sm text-[#0F1111]">No users registered</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto" role="region" aria-label="User directory, scroll horizontally for more columns" tabIndex={0}>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F0F2F2] text-[#565959] uppercase font-semibold border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Customer Name</th>
              <th className="px-4 py-3"><T>{"Email Address"}</T></th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => {
              const isAdmin = u.role === "ADMIN";
              const formattedDate = new Date(u.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-[#0F1111]">
                    #{u.id}
                  </td>

                  <td className="px-4 py-3 font-semibold text-[#0F1111]">
                    {u.name}
                  </td>

                  <td className="px-4 py-3 text-[#565959]">
                    {u.email}
                  </td>

                  <td className="px-4 py-3 text-[#565959]">
                    {u.phone || <span className="text-gray-400 italic">None</span>}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase",
                        isAdmin
                          ? "bg-[#131921] text-[#FF9900]"
                          : "bg-gray-100 text-[#565959]"
                      )}
                    >
                      {isAdmin ? <Shield className="h-3 w-3" /> : null}
                      {u.role}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-[#565959] whitespace-nowrap">
                    {formattedDate}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewUser(u.id)}
                        className="h-7 px-2 text-xs text-[#007185] hover:text-[#C7511F]"
                        title="Inspect User Details"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleRole(u)}
                        className={cn(
                          "h-7 px-2 text-[11px] font-semibold border",
                          isAdmin
                            ? "text-[#CC0C39] hover:bg-[#CC0C39]/10 border-[#CC0C39]"
                            : "text-[#2B6CB0] hover:bg-[#2B6CB0]/10 border-[#90CDF4]"
                        )}
                      >
                        {isAdmin ? "Demote" : "Make Admin"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
