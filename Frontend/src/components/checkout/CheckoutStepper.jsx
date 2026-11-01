import { T } from "@/components/common/Translation";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { index: 0, title: "Delivery Address" },
  { index: 1, title: "Payment Method" },
  { index: 2, title: "Review & Place Order" },
];

export default function CheckoutStepper({ currentStep = 0 }) {
  return (
    <div id="checkout-progress" className="checkout-progress w-full py-4">
      <div className="grid grid-cols-3 max-w-xl mx-auto px-3 sm:px-4">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <div key={step.index} className="relative flex min-w-0 justify-center" aria-current={isActive ? "step" : undefined}>
              <div className="relative z-10 flex w-full min-w-0 flex-col items-center px-1">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs",
                    isDone
                      ? "bg-[#067D62] text-white"
                      : isActive
                      ? "bg-[#FF9900] text-[#0F1111] ring-4 ring-[#FF9900]/20"
                      : "bg-[#EDEDED] text-[#565959]"
                  )}
                >
                  {isDone ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "text-[11px] sm:text-xs mt-1.5 font-semibold text-center leading-tight max-w-[100px]",
                    isActive
                      ? "text-[#0F1111]"
                      : isDone
                      ? "text-[#067D62]"
                      : "text-[#888C8C]"
                  )}
                >
                  <T>{step.title}</T>
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-4 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 transition-colors",
                    isDone ? "bg-[#067D62]" : "bg-[#D5D9D9]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
