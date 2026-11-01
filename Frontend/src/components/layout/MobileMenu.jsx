import { T } from "@/components/common/Translation";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { useCategories } from "@/hooks/useCategories";
import { useAuthStore } from "@/store/useAuthStore";

export default function MobileMenu({ open, onOpenChange }) {
  const { data: categories = [], isError, refetch } = useCategories();
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const isAdmin = useAuthStore(state => state.user?.role === "ADMIN");
  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent id="mobile-navigation" side="left" className="overflow-y-auto">
      <SheetHeader>
        <SheetTitle><T>{"Shop by category"}</T></SheetTitle>
        <SheetDescription>Browse products and manage your account.</SheetDescription>
      </SheetHeader>
      <nav aria-label="Mobile navigation" className="mt-6 flex flex-col gap-4">
        <SheetClose asChild><Link to="/products"><T>{"All products"}</T></Link></SheetClose>
        {categories.map(category => <SheetClose asChild key={category.id}><Link to={`/products?categoryId=${category.id}`}><T>{category.name}</T></Link></SheetClose>)}
        {isError && <button onClick={() => refetch()}>Retry loading categories</button>}
        <SheetClose asChild><Link to={authenticated ? "/account/profile" : "/login"}><T>{authenticated ? "Your account" : "Sign in"}</T></Link></SheetClose>
        {authenticated && <SheetClose asChild><Link to="/account/orders"><T>{"Your orders"}</T></Link></SheetClose>}
        {authenticated && isAdmin && <SheetClose asChild><Link to="/admin/dashboard"><T>{"Admin Console"}</T></Link></SheetClose>}
      </nav>
    </SheetContent>
  </Sheet>;
}
