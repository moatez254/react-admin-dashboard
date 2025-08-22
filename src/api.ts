// src/api.ts
export type Product = {
  id: number;
  name: string;
  price: number;
  sku?: string | null;
};

const BASE =
  (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, '') ?? '';

/** هل الواجهة في وضع القراءة فقط؟ (افتراضي true لو ما ضبطت بيئة) */
export const READ_ONLY: boolean = (() => {
  const v = (import.meta as any)?.env?.VITE_READ_ONLY;
  if (typeof v === 'string') {
    const s = v.toLowerCase().trim();
    return s === '1' || s === 'true' || s === 'yes';
  }
  // الوضع الآمن الافتراضي: Read-only
  return true;
})();

function apiUrl(p: string) {
  return `${BASE}${p.startsWith('/') ? p : `/${p}`}`;
}

/** جلب المنتجات (نطبِّع الاستجابة سواء كانت {data:[]}/[] ) */
export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(apiUrl('/api/products'), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`GET /api/products failed: ${res.status}`);
  }
  const body = await res.json();
  const items = Array.isArray(body) ? body : body?.data ?? [];
  return items as Product[];
}

/** محاولة إنشاء منتج — تُرمى READ_ONLY إن كان الوضع قراءة فقط */
export async function createProduct(payload: Omit<Product, 'id'>): Promise<number> {
  if (READ_ONLY) {
    const e = new Error('READ_ONLY');
    (e as any).code = 'READ_ONLY';
    throw e;
  }

  const res = await fetch(apiUrl('/api/products/create'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 405 || res.status === 501 || res.status === 403) {
    const e = new Error('READ_ONLY');
    (e as any).code = 'READ_ONLY';
    throw e;
  }
  if (!res.ok) {
    throw new Error(`POST /api/products/create failed: ${res.status}`);
  }
  const data = await res.json();
  return (data?.id ?? 0) as number;
}

/** اكتشاف تلقائي لو أن السيرفر لا يدعم الإنشاء (اختياري) */
export async function detectReadOnly(): Promise<boolean> {
  if (READ_ONLY) return true;
  try {
    // بعض الخوادم ترد 404/405/501 على OPTIONS
    const res = await fetch(apiUrl('/api/products/create'), { method: 'OPTIONS' });
    if ([404, 405, 501].includes(res.status)) return true;
    return false;
  } catch {
    // لما نفشل نتعامل كقراءة فقط
    return true;
  }
}
