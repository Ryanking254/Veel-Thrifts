// Shared backend: Supabase when configured, on-device storage otherwise.
// Configure with env vars (see .env.example):
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
// Until those are set, the shop runs fully offline-capable on localStorage.

import { createClient } from '@supabase/supabase-js';
import {
  ORDERS_KEY,
  fileToDataUrl,
  loadCatalog,
  loadOrders,
  saveOrder,
} from './shop';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isBackend = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client = null;
export function backend() {
  if (!isBackend) return null;
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}

/* ------------------------------ products ----------------------------- */

/** Returns array of products, or null when local store is also empty. */
export async function fetchProducts() {
  const sb = backend();
  if (!sb) return loadCatalog();
  const { data, error } = await sb
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand || 'Veel',
    price: Number(p.price),
    was: p.was == null ? null : Number(p.was),
    size: p.size || 'M',
    category: p.category,
    audience: p.audience || 'Unisex',
    img: p.img,
    alt: p.alt || p.name,
    desc: p.desc || '',
  };
}

export async function upsertProduct(product) {
  const sb = backend();
  if (!sb) {
    const list = loadCatalog() || [];
    const i = list.findIndex((p) => p.id === product.id);
    const next = i >= 0 ? list.map((p) => (p.id === product.id ? product : p)) : [product, ...list];
    try {
      window.localStorage.setItem('veel-catalog-v1', JSON.stringify(next));
    } catch {
      /* storage full */
    }
    return product;
  }
  const { error } = await sb.from('products').upsert(
    {
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      was: product.was,
      size: product.size,
      category: product.category,
      audience: product.audience,
      img: product.img,
      alt: product.alt,
      desc: product.desc,
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
  return product;
}

export async function removeProduct(id) {
  const sb = backend();
  if (!sb) {
    const list = loadCatalog() || [];
    try {
      window.localStorage.setItem(
        'veel-catalog-v1',
        JSON.stringify(list.filter((p) => p.id !== id))
      );
    } catch {
      /* ignore */
    }
    return;
  }
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) throw error;
}

/** Upload a product photo. Returns a URL. Falls back to an embedded data URL offline. */
export async function uploadProductImage(file) {
  const sb = backend();
  if (!sb) return fileToDataUrl(file);
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 4);
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from('product-images').upload(path, file, {
    contentType: file.type || 'image/jpeg',
  });
  if (error) throw error;
  const { data } = sb.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

/* ------------------------------- orders ------------------------------ */

export async function createOrder(order) {
  const sb = backend();
  if (!sb) {
    saveOrder(order);
    return order;
  }
  const { error } = await sb.from('orders').insert({
    ref: order.ref,
    items: order.items,
    subtotal: order.subtotal,
    phone: order.phone,
    location: order.location,
    note: order.note || '',
    status: order.status || 'New',
  });
  if (error) throw error;
  return order;
}

export async function fetchOrders() {
  const sb = backend();
  if (!sb) return loadOrders();
  const { data, error } = await sb
    .from('orders')
    .select('*')
    .order('date', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []).map((o) => ({
    ref: o.ref,
    date: o.date,
    items: o.items || [],
    subtotal: Number(o.subtotal),
    phone: o.phone,
    location: o.location,
    note: o.note || '',
    status: o.status || 'New',
  }));
}

export async function setOrderStatus(ref, status) {
  const sb = backend();
  if (!sb) {
    try {
      const raw = window.localStorage.getItem(ORDERS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      window.localStorage.setItem(
        ORDERS_KEY,
        JSON.stringify(list.map((o) => (o.ref === ref ? { ...o, status } : o)))
      );
      return list.map((o) => (o.ref === ref ? { ...o, status } : o));
    } catch {
      return [];
    }
  }
  const { error } = await sb.from('orders').update({ status }).eq('ref', ref);
  if (error) throw error;
  return fetchOrders();
}

export async function removeOrder(ref) {
  const sb = backend();
  if (!sb) {
    try {
      const raw = window.localStorage.getItem(ORDERS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const next = list.filter((o) => o.ref !== ref);
      window.localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
      return next;
    } catch {
      return [];
    }
  }
  const { error } = await sb.from('orders').delete().eq('ref', ref);
  if (error) throw error;
  return fetchOrders();
}
