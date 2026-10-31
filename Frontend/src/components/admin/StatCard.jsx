import { Skeleton } from "@/components/ui/skeleton";

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-[#FF9900]",
  bgColor = "bg-[#FFF8E7]",
  subtext,
  isLoading = false,
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#565959]">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-full ${bgColor} ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div>
        {isLoading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold text-[#0F1111]">{value}</p>
        )}
        {subtext && <p className="text-[11px] text-[#888C8C] mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
