-- Run this after the existing tables and RLS policies have been created.

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.categories, public.products, public.product_images, public.media TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.categories, public.products, public.product_images, public.media, public.orders, public.order_items
TO authenticated;

DROP POLICY IF EXISTS "public create orders" ON public.orders;
DROP POLICY IF EXISTS "public create order items" ON public.order_items;
DROP POLICY IF EXISTS "orders_insert_public_new" ON public.orders;
DROP POLICY IF EXISTS "order_items_insert_public" ON public.order_items;

DROP POLICY IF EXISTS "public read media for visible products" ON public.media;
CREATE POLICY "public read media for visible products"
ON public.media
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.product_images AS image
    JOIN public.products AS product ON product.id = image.product_id
    WHERE image.media_id = media.id
      AND product.is_visible = true
  )
);

CREATE OR REPLACE FUNCTION public.create_public_order(
  p_product_id uuid,
  p_quantity integer,
  p_customer_name text,
  p_phone text,
  p_province text,
  p_region text,
  p_address text,
  p_color text,
  p_capacity text,
  p_notes text DEFAULT '',
  p_payment_method text DEFAULT 'cash'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  selected_product public.products%ROWTYPE;
  new_order_id uuid;
  new_order_number integer;
  new_order_created_at timestamptz;
  new_item_id uuid;
  order_total bigint;
BEGIN
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 1000 THEN
    RAISE EXCEPTION 'الكمية غير صحيحة' USING ERRCODE = '22023';
  END IF;
  IF p_payment_method IS DISTINCT FROM 'cash' THEN
    RAISE EXCEPTION 'طريقة الدفع غير مدعومة' USING ERRCODE = '22023';
  END IF;
  IF length(trim(p_customer_name)) NOT BETWEEN 2 AND 120
    OR length(trim(p_phone)) NOT BETWEEN 10 AND 20
    OR length(trim(p_province)) NOT BETWEEN 2 AND 80
    OR length(trim(p_region)) NOT BETWEEN 2 AND 80
    OR length(trim(p_address)) NOT BETWEEN 5 AND 500
    OR length(trim(p_color)) NOT BETWEEN 2 AND 80
    OR length(trim(p_capacity)) NOT BETWEEN 2 AND 80
    OR length(coalesce(p_notes, '')) > 1000 THEN
    RAISE EXCEPTION 'بيانات الطلب غير صالحة' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO selected_product
  FROM public.products
  WHERE id = p_product_id AND is_visible = true AND is_available = true
  FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'المنتج غير موجود أو غير متوفر' USING ERRCODE = 'P0002';
  END IF;

  IF selected_product.price < 0
    OR selected_product.price::numeric * p_quantity > 9007199254740991 THEN
    RAISE EXCEPTION 'إجمالي السعر يتجاوز القيمة المدعومة' USING ERRCODE = '22003';
  END IF;
  order_total := selected_product.price * p_quantity;

  INSERT INTO public.orders (
    customer_name, phone, province, region, address, color, capacity,
    notes, payment_method, status, total
  ) VALUES (
    trim(p_customer_name), trim(p_phone), trim(p_province), trim(p_region),
    trim(p_address), trim(p_color), trim(p_capacity), coalesce(trim(p_notes), ''),
    'cash', 'new', order_total
  )
  RETURNING id, order_number, created_at
  INTO new_order_id, new_order_number, new_order_created_at;

  INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES (new_order_id, selected_product.id, selected_product.name, selected_product.price, p_quantity)
  RETURNING id INTO new_item_id;

  RETURN jsonb_build_object(
    'id', new_order_id,
    'order_number', new_order_number,
    'customer_name', trim(p_customer_name),
    'phone', trim(p_phone),
    'province', trim(p_province),
    'region', trim(p_region),
    'address', trim(p_address),
    'color', trim(p_color),
    'capacity', trim(p_capacity),
    'notes', coalesce(trim(p_notes), ''),
    'payment_method', 'cash',
    'status', 'new',
    'total', order_total,
    'created_at', new_order_created_at,
    'items', jsonb_build_array(jsonb_build_object(
      'id', new_item_id,
      'product_id', selected_product.id,
      'product_name', selected_product.name,
      'unit_price', selected_product.price,
      'quantity', p_quantity
    ))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_order(
  uuid, integer, text, text, text, text, text, text, text, text, text
) FROM PUBLIC;
ALTER FUNCTION public.create_public_order(
  uuid, integer, text, text, text, text, text, text, text, text, text
) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.create_public_order(
  uuid, integer, text, text, text, text, text, text, text, text, text
) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';