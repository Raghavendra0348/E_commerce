import { toast } from "sonner";
import { Trash2, User } from "lucide-react";
import StarRating from "@/components/common/StarRating";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useProductReviews, useDeleteReview } from "@/hooks/useProducts";
import ReviewForm from "./ReviewForm";
import { cn } from "@/lib/utils";

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right text-[#007185]">{star}★</span>
      <div className="flex-1 h-2.5 rounded-full bg-[#EDEDED] overflow-hidden">
        <div
          className="h-full bg-[#FFA41C] rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-[#565959]">{pct}%</span>
    </div>
  );
}

export default function ReviewList({ productId, avgRating, reviewCount }) {
  const { data, isLoading, isError, refetch } = useProductReviews(productId);
  const reviews = Array.isArray(data) ? data : Array.isArray(data?.reviews) ? data.reviews : [];
  const rating = Number(data?.averageRating ?? avgRating) || 0;
  const totalRatings = Number(data?.totalReviews ?? reviewCount) || reviews.length;
  const { user, isAuthenticated } = useAuthStore();
  const { mutateAsync: deleteReview } = useDeleteReview(productId);

  const alreadyReviewed = isAuthenticated && reviews.some((r) => r.user?.id === user?.id);

  const handleDelete = async (reviewId) => {
    if (!confirm("Delete this review?")) return;
    try {
      await deleteReview(reviewId);
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete review");
    }
  };

  // Calculate distribution
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <div id="product-reviews-error" role="alert" className="text-sm text-[#565959]">Reviews could not be loaded. <button onClick={() => refetch()} className="text-[#007185] underline">Try again</button></div>;
  }

  return (
    <div id="product-review-list" className="space-y-6">
      {/* Rating summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 p-5 rounded-lg border border-[#EDEDED] bg-white">
          {/* Big average */}
          <div className="flex flex-col items-center justify-center sm:border-r sm:border-[#EDEDED] sm:pr-6 sm:mr-2">
            <span className="text-4xl font-light text-[#0F1111]">
              {rating.toFixed(1)}
            </span>
            <StarRating rating={rating} size="sm" />
            <span className="text-xs text-[#565959] mt-1">
              {totalRatings.toLocaleString("en-IN")} ratings
            </span>
          </div>
          {/* Distribution bars */}
          <div className="flex-1 space-y-1.5">
            {distribution.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={reviews.length} />
            ))}
          </div>
        </div>
      )}

      {/* Review cards */}
      {reviews.length === 0 ? (
        <p className="text-sm text-[#565959]">
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => {
            const isOwner = user?.id === review.user?.id;
            const isAdmin = user?.role === "ADMIN";
            const initials = review.user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <li
                key={review.id}
                className="rounded-lg border border-[#EDEDED] bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Avatar */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#232F3E] text-white text-xs font-semibold shrink-0">
                      {initials || <User className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0F1111]">
                        {review.user?.name || "Anonymous"}
                      </p>
                      <StarRating rating={review.rating} size="xs" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[#565959]">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => handleDelete(review.id)}
                        className="text-[#CC0C39] hover:text-[#a30930] transition-colors"
                        aria-label="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-[#333333] leading-relaxed pl-10">
                    {review.comment}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Review Form */}
      <ReviewForm
        productId={productId}
        alreadyReviewed={alreadyReviewed}
      />
    </div>
  );
}
