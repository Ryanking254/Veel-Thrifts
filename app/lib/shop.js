// Shared shop data + on-device persistence (localStorage).
// NOTE: data saved here lives in the browser it was created in.
// For multi-device sync (admin phone -> customer phones), connect a
// database later (Supabase / Firebase / Shopify) and swap these helpers.

export const CATEGORIES = ['Clothing', 'Shoes', 'Accessories', 'Activewear', 'Gifts & Living'];

export const AUDIENCES = ['Women', 'Men', 'Unisex'];

export const CATALOG_KEY = 'veel-catalog-v1';
export const ORDERS_KEY = 'veel-orders-v1';
export const ADMIN_OK_KEY = 'veel-admin-ok';

// Change this passcode to something only Veel knows.
export const ADMIN_PASSCODE = 'veel2026';

export const DEFAULT_PRODUCTS = [
  {
    id: 'adidas-lxcon',
    name: 'Adidas Originals LXCON 94 trainers in white',
    brand: 'Adidas',
    price: 42,
    was: 89,
    size: 'UK 7',
    category: 'Shoes',
    audience: 'Unisex',
    img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop',
    alt: 'Adidas LXCON 94 colourful trainers',
    desc: 'Colourful retro LXCON 94 runners, lightly worn with plenty of life left. Wiped down and laced fresh.',
  },
  {
    id: 'khaki-joggers',
    name: 'Lightweight super skinny joggers in light khaki',
    brand: 'Veel Basics',
    price: 18,
    was: null,
    size: 'M',
    category: 'Activewear',
    audience: 'Men',
    img: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=600&auto=format&fit=crop',
    alt: 'Person walking in light khaki joggers and trainers',
    desc: 'Featherlight skinny joggers in light khaki. Soft, stretchy, perfect for everyday runs and rest days.',
  },
  {
    id: 'orange-scarf',
    name: 'Chunky burnt-orange wool thrift scarf',
    brand: 'Vintage',
    price: 12,
    was: 24,
    size: 'One size',
    category: 'Accessories',
    audience: 'Women',
    img: 'https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=600&auto=format&fit=crop',
    alt: 'Model wearing burnt orange scarf',
    desc: 'Chunky burnt-orange wool scarf, pre-loved and extra cosy. The pop of colour every winter fit needs.',
  },
  {
    id: 'white-sneakers',
    name: 'Clean white leather low-top sneakers',
    brand: 'Nike',
    price: 35,
    was: 70,
    size: 'UK 9',
    category: 'Shoes',
    audience: 'Men',
    img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600&auto=format&fit=crop',
    alt: 'White Nike sneaker',
    desc: 'Crisp white leather low-tops, gently worn and deep-cleaned. Goes with everything.',
  },
  {
    id: 'lilac-puffer',
    name: 'Lilac cropped puffer — Winter Weekends edit',
    brand: 'Veel Rework',
    price: 55,
    was: null,
    size: 'S',
    category: 'Clothing',
    audience: 'Women',
    img: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=600&auto=format&fit=crop',
    alt: 'Model in lilac puffer jacket',
    desc: 'Cropped lilac puffer from our Rework edit. Warm, light and easy to throw over anything.',
  },
  {
    id: 'mustard-knit',
    name: 'Mustard vintage work jacket — knitwear layer',
    brand: 'Vintage',
    price: 24,
    was: 48,
    size: 'L',
    category: 'Clothing',
    audience: 'Women',
    img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop',
    alt: 'Model in mustard jacket',
    desc: 'Vintage mustard work jacket, broken in beautifully. A layering hero for knit season.',
  },
  {
    id: 'corduroy-overshirt',
    name: 'Corduroy overshirt in rust — texture edit',
    brand: 'Veel Rework',
    price: 28,
    was: null,
    size: 'M',
    category: 'Clothing',
    audience: 'Men',
    img: 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?q=80&w=600&auto=format&fit=crop',
    alt: 'Model in rust corduroy overshirt',
    desc: 'Rust corduroy overshirt with that perfect worn-in texture. Wear open or buttoned.',
  },
  {
    id: 'thrift-bundle',
    name: 'Thrift bundle: 3 vintage tees + canvas tote',
    brand: 'Veel Bundle',
    price: 16,
    was: 32,
    size: 'M–L',
    category: 'Gifts & Living',
    audience: 'Unisex',
    img: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=600&auto=format&fit=crop',
    alt: 'Folded vintage t-shirts',
    desc: 'Three hand-picked vintage tees plus a canvas tote. Best-value way to start your thrift rotation.',
  },
];

/* ------------------------------ catalog ------------------------------ */

function readKey(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeKey(key, value) {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Returns the admin-saved catalog, or null if never saved. */
export function loadCatalog() {
  const list = readKey(CATALOG_KEY);
  return Array.isArray(list) ? list : null;
}

export function saveCatalog(list) {
  return writeKey(CATALOG_KEY, list);
}

export function resetCatalog() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(CATALOG_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------- orders ------------------------------ */

export function loadOrders() {
  const list = readKey(ORDERS_KEY);
  return Array.isArray(list) ? list : [];
}

export function saveOrder(order) {
  const list = loadOrders();
  list.unshift(order);
  writeKey(ORDERS_KEY, list.slice(0, 200));
  return order;
}

export function updateOrder(ref, patch) {
  const list = loadOrders().map((o) => (o.ref === ref ? { ...o, ...patch } : o));
  writeKey(ORDERS_KEY, list);
  return list;
}

export function deleteOrder(ref) {
  const list = loadOrders().filter((o) => o.ref !== ref);
  writeKey(ORDERS_KEY, list);
  return list;
}

/* -------------------------------- images ----------------------------- */

/** Downscale an uploaded image to a compact data URL (keeps localStorage small). */
export function fileToDataUrl(file, maxDim = 900, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });
}

export function slugId(name) {
  const slug =
    String(name || 'item')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'item';
  return `${slug}-${Date.now().toString(36)}`;
}
