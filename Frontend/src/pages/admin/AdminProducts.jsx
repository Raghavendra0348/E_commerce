import { T } from "@/components/common/Translation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/common/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { productService, categoryService } from "@/services";
import ProductTable from "@/components/admin/ProductTable";
import ProductFormDialog from "@/components/admin/ProductFormDialog";

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" | "edit"
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await categoryService.getAll();
      return res.data?.data || [];
    },
  });

  // Fetch products
  const { data: prodData, isLoading } = useQuery({
    queryKey: ["adminProducts", page, searchTerm, selectedCategory],
    queryFn: async () => {
      const res = await productService.getProducts({
        page,
        limit: 10,
        search: searchTerm || undefined,
        categoryId: selectedCategory || undefined,
      });
      const raw = res.data;
      const products = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.products)
        ? raw.products
        : [];
      const pagination = raw?.pagination || raw?.data?.pagination || { totalPages: 1 };
      return { products, pagination };
    },
    keepPreviousData: true,
  });

  const products = prodData?.products || [];
  const pagination = prodData?.pagination || { totalPages: 1 };

  const openAdd = () => {
    setFormMode("add");
    setSelectedProduct(null);
    setFormModalOpen(true);
  };

  const openEdit = (product) => {
    setFormMode("edit");
    setSelectedProduct(product);
    setFormModalOpen(true);
  };

  const openDelete = (product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = async (values, selectedFiles) => {
    setSaving(true);
    try {
      if (formMode === "add") {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("description", values.description);
        formData.append("price", String(values.price));
        formData.append("stock", String(values.stock));
        formData.append("categoryId", String(values.categoryId));

        if (selectedFiles && selectedFiles.length > 0) {
          for (let i = 0; i < selectedFiles.length; i++) {
            formData.append("images", selectedFiles[i]);
          }
        }

        await productService.create(formData);
        toast.success("Product created successfully!");
      } else {
        await productService.update(selectedProduct.id, {
          name: values.name,
          description: values.description,
          price: values.price,
          stock: values.stock,
          categoryId: values.categoryId,
        });
        toast.success("Product updated successfully!");
      }
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      setFormModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${formMode} product`);
    } finally {
      setSaving(false);
    }
  };

  const onDeleteProduct = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      await productService.delete(selectedProduct.id);
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminProducts"] });
      setDeleteModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1111]">Product Catalog Management</h1>
          <p className="text-xs text-[#565959] mt-0.5">
            Add new items, update inventory pricing and stock levels, or manage photos
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-[#FF9900] hover:bg-[#E68A00] text-[#0F1111] font-semibold self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Product
        </Button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products by title..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full text-xs h-9 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[#0F1111] focus:outline-none focus:ring-1 focus:ring-[#FF9900]"
          >
            <option value=""><T>{"All Categories"}</T></option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table Component */}
      <ProductTable
        products={products}
        isLoading={isLoading}
        onEdit={openEdit}
        onDelete={openDelete}
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

      {/* Modal: Add / Edit Product Component */}
      <ProductFormDialog
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        mode={formMode}
        product={selectedProduct}
        categories={categories}
        onSubmit={handleFormSubmit}
        saving={saving}
      />

      {/* Modal: Delete Product */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#CC0C39]">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">Delete Product?</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-[#565959] pt-2">
              Are you sure you want to remove &quot;{selectedProduct?.name}&quot;? This product will be
              permanently purged from the store catalog.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              className="text-xs"
            >
              <T>{"Cancel"}</T>
            </Button>
            <Button
              size="sm"
              disabled={saving}
              onClick={onDeleteProduct}
              className="bg-[#CC0C39] hover:bg-[#A00A2D] text-white text-xs font-semibold"
            >
              {saving ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
