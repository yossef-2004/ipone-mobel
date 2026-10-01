import type { ProductSpec } from "@/db/schema";

export type { ProductSpec };

export type OrderStatus = "new" | "confirmed" | "preparing" | "delivered" | "cancelled";

export type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  productCount?: number;
};

export type ProductImageDTO = {
  id: string;
  url: string;
  sortOrder: number;
};

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  description: string;
  price: number;
  oldPrice: number | null;
  isAvailable: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  specs: ProductSpec[];
  images: ProductImageDTO[];
  createdAt: string;
};

export type ProductSort = "newest" | "price_asc" | "price_desc";

export type ProductFilters = {
  q?: string;
  category?: string;
  brand?: string;
  availableOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
  /** Admin lists include hidden products. */
  includeHidden?: boolean;
  featuredOnly?: boolean;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type OrderItemDTO = {
  id: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
};

export type OrderDTO = {
  id: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  address: string;
  notes: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderItemDTO[];
};

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
