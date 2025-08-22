import { useEffect, useMemo, useState } from 'react';
import {
  Product,
  fetchProducts,
  createProduct,
  READ_ONLY,
  detectReadOnly,
} from './api';

type SortKey = 'id' | 'name' | 'price' | 'sku';
type SortDir = 'asc' | 'desc';

export default function App() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [sku, setSku] = useState('');

  const [filterName, setFilterName] = useState('');
  const [filterPrice, setFilterPrice] = useState('');
  const [filterSku, setFilterSku] = useState('');

  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [readOnly, setReadOnly] = useState<boolean>(READ_ONLY);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await fetchProducts();
        setRows(data);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    detectReadOnly().then((auto) => {
      if (READ_ONLY) return;
      setReadOnly(auto);
    });
  }, []);

  const filtered = useMemo(() => {
    let r = rows.slice();
    if (filterName.trim()) {
      const q = filterName.toLowerCase();
      r = r.filter((x) => x.name.toLowerCase().includes(q));
    }
    if (filterSku.trim()) {
      const q = filterSku.toLowerCase();
      r = r.filter((x) => (x.sku ?? '').toLowerCase().includes(q));
    }
    if (filterPrice.trim()) {
      const n = Number(filterPrice);
      if (!Number.isNaN(n)) r = r.filter((x) => Number(x.price) === n);
    }
    r.sort((a, b) => {
      const va = (a as any)[sortKey] ?? '';
      const vb = (b as any)[sortKey] ?? '';
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [rows, filterName, filterSku, filterPrice, sortKey, sortDir]);

  async function onReload() {
    setLoading(true);
    setErr(null);
    try {
      setRows(await fetchProducts());
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function onAdd() {
    if (readOnly) {
      alert('This demo is in read-only mode. Cannot add products now.');
      return;
    }

    const n = name.trim();
    const p = Number(price);
    const s = sku.trim() || undefined;

    if (!n || Number.isNaN(p)) {
              alert('Name and price are required.');
      return;
    }
    try {
      const id = await createProduct({ name: n, price: p, sku: s });
      setRows((prev) => [{ id, name: n, price: p, sku: s ?? null }, ...prev]);
      setName('');
      setPrice('');
      setSku('');
    } catch (e: any) {
      if (e?.code === 'READ_ONLY') {
        alert('الخادم لا يسمح بإنشاء عناصر في هذا الوضع (Read-only).');
      } else {
        alert(e?.message ?? 'تعذّر إنشاء المنتج.');
      }
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        Products
        {readOnly && (
          <span
            style={{
              fontSize: 12,
              background: '#ffe7b3',
              border: '1px solid #f0c36d',
              color: '#7a5600',
              padding: '2px 8px',
              borderRadius: 6,
            }}
            title="الديمو يعمل بوضع القراءة فقط؛ الإضافة/التعديل مُعطّلة الآن."
          >
            Read-only demo
          </span>
        )}
      </h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: 180 }}
        />
        <input
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={{ width: 120 }}
        />
        <input
          placeholder="SKU (opt)"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          style={{ width: 160 }}
        />
        <button onClick={onAdd} disabled={readOnly || !name.trim() || price.trim() === ''}>
          Add
        </button>
        <button onClick={onReload} disabled={loading}>
          Reload
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          placeholder="Filter: name"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
          style={{ width: 180 }}
        />
        <input
          placeholder="Filter: price (=)"
          value={filterPrice}
          onChange={(e) => setFilterPrice(e.target.value)}
          style={{ width: 140 }}
        />
        <input
          placeholder="Filter: sku"
          value={filterSku}
          onChange={(e) => setFilterSku(e.target.value)}
          style={{ width: 160 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Sort:</span>
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="id">ID</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="sku">SKU</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)}>
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>

      {loading && <div>Loading…</div>}
      {err && (
        <div style={{ color: '#b00020', marginBottom: 8 }}>
          Error: {err}
          <div style={{ fontSize: 12, color: '#666' }}>
            API: <code>/api/products</code>. During development, use Vite proxy or set{' '}
            <code>VITE_API_URL</code>.
          </div>
        </div>
      )}

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #ddd',
        }}
      >
        <thead>
          <tr style={{ background: '#fafafa' }}>
            <th style={th}>ID</th>
            <th style={th}>Name</th>
            <th style={th}>Price</th>
            <th style={th}>SKU</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td style={td}>{p.id}</td>
              <td style={td}>{p.name}</td>
              <td style={td}>{p.price}</td>
              <td style={td}>{p.sku ?? ''}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td style={td} colSpan={4}>
                {loading ? 'Loading…' : 'No data'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid #eee',
};
const td: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid #f3f3f3',
};
