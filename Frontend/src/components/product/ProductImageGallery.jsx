import ProductImage from "@/components/common/ProductImage";
import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductImageGallery({ images = [], productName = "" }) {
  const allImages = images.length > 0 ? images : [{ id: 0, url: "/product-placeholder.svg" }];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  return (
    <div id="product-image-gallery" className="product-detail-gallery flex flex-col gap-3">
      {/* Main Carousel */}
      <div className="relative rounded-lg border border-[#EDEDED] bg-white overflow-hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {allImages.map((img, idx) => (
              <div
                key={img.id ?? idx}
                className="detail-gallery-slide flex-[0_0_100%] min-w-0 flex items-center justify-center p-4 aspect-square"
              >
                <div className="overflow-hidden flex items-center justify-center w-full h-full group">
                  <ProductImage
                    src={img.url}
                    alt={`${productName} — image ${idx + 1}`}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg"; }}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-150 cursor-zoom-in"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prev / Next arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canScrollPrev}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow-md border border-[#EDEDED] p-1.5 transition-opacity",
                canScrollPrev ? "opacity-100 hover:bg-gray-50" : "opacity-30 cursor-not-allowed"
              )}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-[#0F1111]" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canScrollNext}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow-md border border-[#EDEDED] p-1.5 transition-opacity",
                canScrollNext ? "opacity-100 hover:bg-gray-50" : "opacity-30 cursor-not-allowed"
              )}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-[#0F1111]" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {allImages.map((img, idx) => (
            <button
              key={img.id ?? idx}
              onClick={() => scrollTo(idx)}
              aria-label={`View image ${idx + 1}`}
              className={cn(
                "flex-shrink-0 h-16 w-16 rounded border-2 overflow-hidden bg-white transition-all",
                idx === selectedIndex
                  ? "border-[#FF9900] ring-1 ring-[#FF9900]"
                  : "border-[#EDEDED] hover:border-[#565959]"
              )}
            >
              <ProductImage
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/product-placeholder.svg"; }}
                className="h-full w-full object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
