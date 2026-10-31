export const ORDER_STATUSES = {
  PENDING: { label: "Pending", variant: "warning" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  PROCESSING: { label: "Processing", variant: "secondary" },
  SHIPPED: { label: "Shipped", variant: "success" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

export const PAYMENT_STATUSES = {
  PENDING: { label: "Pending", variant: "warning" },
  PAID: { label: "Paid", variant: "success" },
  FAILED: { label: "Failed", variant: "danger" },
  REFUNDED: { label: "Refunded", variant: "secondary" },
};

export const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

export const ITEMS_PER_PAGE = 20;
