import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const productSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters"),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  price: z.coerce.number().positive("Price must be a positive amount"),
  stock: z.coerce.number().int().nonnegative("Stock must be 0 or greater"),
  categoryId: z.coerce.number().int().positive("Category is required"),
});

export default function ProductFormDialog({
  open,
  onOpenChange,
  mode = "add",
  product = null,
  categories = [],
  onSubmit,
  saving = false,
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const isEdit = mode === "edit";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      stock: 10,
      categoryId: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (isEdit && product) {
        reset({
          name: product.name || "",
          description: product.description || "",
          price: product.price || "",
          stock: product.stock ?? 10,
          categoryId: product.categoryId || product.category?.id || "",
        });
      } else {
        reset({
          name: "",
          description: "",
          price: "",
          stock: 10,
          categoryId: categories[0]?.id || "",
        });
        setSelectedFiles([]);
      }
    }
  }, [open, isEdit, product, categories, reset]);

  const handleFormSubmit = (data) => {
    onSubmit(data, selectedFiles);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#0F1111]">
            {isEdit ? `Edit Product #${product?.id}` : "Add New Product"}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#565959]">
            {isEdit
              ? "Update catalog information and inventory values"
              : "Add item details and upload product imagery"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3 mt-2">
          <div>
            <Label htmlFor="prodName" className="text-xs font-semibold">
              Product Title
            </Label>
            <Input
              id="prodName"
              {...register("name")}
              placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
              className="mt-1"
            />
            {errors.name && (
              <p className="text-xs text-[#CC0C39] mt-0.5">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="prodCategory" className="text-xs font-semibold">
                Category
              </Label>
              <select
                id="prodCategory"
                {...register("categoryId")}
                className="w-full text-xs h-9 rounded-md border border-gray-300 bg-white px-3 mt-1 text-[#0F1111] focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-xs text-[#CC0C39] mt-0.5">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="prodPrice" className="text-xs font-semibold">
                Price (₹)
              </Label>
              <Input
                id="prodPrice"
                type="number"
                step="0.01"
                {...register("price")}
                placeholder="2499.00"
                className="mt-1"
              />
              {errors.price && (
                <p className="text-xs text-[#CC0C39] mt-0.5">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="prodStock" className="text-xs font-semibold">
                Stock Units
              </Label>
              <Input
                id="prodStock"
                type="number"
                {...register("stock")}
                placeholder="50"
                className="mt-1"
              />
              {errors.stock && (
                <p className="text-xs text-[#CC0C39] mt-0.5">{errors.stock.message}</p>
              )}
            </div>

            {!isEdit ? (
              <div>
                <Label htmlFor="prodImages" className="text-xs font-semibold">
                  Photos (Up to 5)
                </Label>
                <input
                  id="prodImages"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                  className="w-full text-xs h-9 rounded-md border border-gray-300 bg-white px-2 py-1.5 mt-1 text-gray-500 file:mr-2 file:py-0 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-gray-100 file:text-gray-700"
                />
              </div>
            ) : (
              <div>
                <Label className="text-xs font-semibold text-gray-400">
                  Photos
                </Label>
                <p className="text-[11px] text-gray-400 mt-2">
                  Managed via catalog uploads
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="prodDesc" className="text-xs font-semibold">
              Description
            </Label>
            <textarea
              id="prodDesc"
              rows={3}
              {...register("description")}
              placeholder="Product specifications, key highlights, warranty..."
              className="w-full text-xs rounded-md border border-gray-300 bg-white p-2.5 mt-1 focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
            />
            {errors.description && (
              <p className="text-xs text-[#CC0C39] mt-0.5">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold text-xs"
            >
              {saving
                ? isEdit
                  ? "Saving Changes..."
                  : "Creating..."
                : isEdit
                ? "Save Product"
                : "Publish Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
