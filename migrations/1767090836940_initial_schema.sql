CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  password text NOT NULL,
  role text DEFAULT 'user' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  product_name text NOT NULL,
  product_code text NOT NULL UNIQUE,
  product_category text NOT NULL,
  unit text NOT NULL,
  critical_stock_level integer NOT NULL,
  brand text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_products_code ON products (product_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (product_category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products (product_name);

CREATE TABLE IF NOT EXISTS product_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  product_id uuid NOT NULL,
  action text NOT NULL,
  changed_by uuid NOT NULL,
  old_values jsonb,
  new_values jsonb,
  timestamp timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_product_id ON product_audit_log (product_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON product_audit_log (timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON product_audit_log (changed_by);