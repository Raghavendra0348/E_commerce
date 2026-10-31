import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-extrabold text-[#EDEDED] mb-4">404</h1>
      <div className="border-t-4 border-[#FF9900] w-16 mb-6" />
      <h2 className="text-2xl font-semibold text-[#0F1111] mb-2">
        Looking for something?
      </h2>
      <p className="text-[#565959] mb-6 max-w-sm">
        We're sorry. The Web address you entered is not a functioning page on our site.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/">Go to Amazon.in Homepage</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/products">Browse Products</Link>
        </Button>
      </div>
    </div>
  );
}
