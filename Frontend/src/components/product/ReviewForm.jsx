import { T } from "@/components/common/Translation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/useAuthStore";
import { useSubmitReview } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z.string().max(500, "Maximum 500 characters").optional(),
});

export default function ReviewForm({ productId, onSuccess, alreadyReviewed }) {
  const { isAuthenticated } = useAuthStore();
  const [hoverRating, setHoverRating] = useState(0);
  const { mutateAsync: submitReview, isPending } = useSubmitReview(productId);

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  });

  const currentRating = watch("rating");
  const commentValue = watch("comment") || "";

  const onSubmit = async (data) => {
    try {
      await submitReview({ rating: data.rating, comment: data.comment || undefined });
      toast.success("Review submitted! Thank you.");
      reset();
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-[#EDEDED] bg-[#F5F5F5] p-5 text-center">
        <p className="text-sm text-[#565959]">
          <a href="/login" className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium">
            <T>{"Sign in"}</T>
          </a>{" "}
          to write a customer review.
        </p>
      </div>
    );
  }

  if (alreadyReviewed) {
    return (
      <div className="rounded-lg border border-[#EDEDED] bg-[#E6F5F0] p-5 text-center">
        <p className="text-sm text-[#067D62] font-medium">
          ✓ You've already reviewed this product.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#EDEDED] bg-white p-5">
      <h3 className="text-base font-semibold text-[#0F1111] mb-4">
        Write a Customer Review
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Star Rating Picker */}
        <div className="space-y-1.5">
          <Label>Rate this product</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setValue("rating", star, { shouldValidate: true })}
                className="transition-transform hover:scale-110"
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
              >
                <Star
                  className={cn(
                    "h-7 w-7 transition-colors",
                    star <= (hoverRating || currentRating)
                      ? "fill-[#FFA41C] text-[#FFA41C]"
                      : "fill-[#D5D9D9] text-[#D5D9D9]"
                  )}
                />
              </button>
            ))}
          </div>
          {errors.rating && (
            <p className="text-xs text-[#CC0C39]">{errors.rating.message}</p>
          )}
        </div>

        {/* Comment */}
        <div className="space-y-1.5">
          <Label htmlFor="review-comment">
            Review{" "}
            <span className="text-xs text-[#565959] font-normal">(optional)</span>
          </Label>
          <textarea
            id="review-comment"
            {...register("comment")}
            rows={4}
            maxLength={500}
            placeholder="Share your thoughts about this product..."
            className={cn(
              "w-full rounded border border-[#D5D9D9] px-3 py-2 text-sm text-[#0F1111]",
              "placeholder:text-[#BBBFBF] resize-none",
              "focus:outline-none focus:ring-2 focus:ring-[#FF9900]/40 focus:border-[#FF9900]",
              "transition-colors"
            )}
          />
          <div className="flex justify-between">
            {errors.comment ? (
              <p className="text-xs text-[#CC0C39]">{errors.comment.message}</p>
            ) : <span />}
            <p className="text-xs text-[#565959]">
              {commentValue.length}/500
            </p>
          </div>
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </div>
  );
}
