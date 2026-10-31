import { Clock, CheckCircle, Package, Truck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TRACKER_STEPS = [
  { key: "PENDING", label: "Ordered", icon: Clock },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle },
];

const STEP_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function OrderTimeline({ status, paymentStatus }) {
  const isCancelled = status === "CANCELLED";
  const currentStepIndex = STEP_ORDER.indexOf(status);

  if (isCancelled) {
    return (
      <div className="bg-[#FCE8EC] border border-[#FEB2B2] rounded-lg p-4 flex items-center gap-3 text-[#CC0C39]">
        <XCircle className="h-6 w-6 shrink-0" />
        <div>
          <p className="text-sm font-bold">This order has been cancelled</p>
          <p className="text-xs text-[#565959] mt-0.5">
            {paymentStatus === "REFUNDED"
              ? "Your refund has been completed."
              : paymentStatus === "REFUND_PENDING"
              ? "Your refund is being processed to your original payment method."
              : "Items have been returned to inventory."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="relative flex items-center justify-between">
        {/* Connecting track line */}
        <div className="absolute top-4 left-6 right-6 h-1 bg-[#EDEDED] -z-0">
          <div
            className="h-full bg-[#067D62] transition-all duration-500"
            style={{
              width: `${(Math.max(0, currentStepIndex) / (STEP_ORDER.length - 1)) * 100}%`,
            }}
          />
        </div>

        {TRACKER_STEPS.map((step, idx) => {
          const isDone = currentStepIndex >= idx;
          const isCurrent = currentStepIndex === idx;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center z-10 text-center">
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-colors shadow-2xs",
                  isDone
                    ? "bg-[#067D62] text-white"
                    : "bg-white border-2 border-[#D5D9D9] text-[#888C8C]"
                )}
              >
                <StepIcon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-[11px] sm:text-xs mt-2 font-medium max-w-[70px] sm:max-w-none leading-tight",
                  isCurrent ? "font-bold text-[#0F1111]" : isDone ? "text-[#067D62]" : "text-[#888C8C]"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
