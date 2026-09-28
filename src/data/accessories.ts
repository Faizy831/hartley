/**
 * Hartley straps and accessories — names, prices and URLs from
 * int.hartleywatches.com (September 2026). No 3D representation; these link
 * to the client's product pages.
 */
export interface Accessory {
  id: string;
  name: string;
  category: "Leather strap" | "Silicone strap" | "Mesh strap" | "Croc strap" | "Steel bracelet" | "Collector box";
  detail?: string;
  price: { amount: number; currency: "USD" };
  url: string;
  /** Swatch for the card visual (no photography available in the project). */
  swatch: string;
}

const B = "https://int.hartleywatches.com";

export const STRAP_ACCESSORIES: Accessory[] = [
  { id: "strap-black-leather", name: "Black Leather Interchangeable Strap", category: "Leather strap", detail: "Black leather · gold buckle", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-leather-straps/products/black-leather-strap`, swatch: "linear-gradient(135deg,#2b2729,#0b0a0a)" },
  { id: "strap-brown-leather", name: "Brown Leather Interchangeable Strap", category: "Leather strap", detail: "Brown leather · black buckle", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-leather-straps/products/hartley-brown-leather-strap`, swatch: "linear-gradient(135deg,#8a5a3b,#3a2416)" },
  { id: "strap-darkbrown-leather", name: "Dark Brown Leather Interchangeable Strap", category: "Leather strap", detail: "Dark brown leather · black buckle", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-leather-straps/products/dark-brown-leather-interchangeable-strap`, swatch: "linear-gradient(135deg,#5c3a27,#20130c)" },
  { id: "strap-grey-leather", name: "Grey Leather Interchangeable Strap", category: "Leather strap", detail: "Grey leather · silver buckle", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-leather-straps/products/grey-leather-strap`, swatch: "linear-gradient(135deg,#8c8987,#4a4846)" },
  { id: "strap-beige-leather", name: "Beige Leather Interchangeable Strap", category: "Leather strap", detail: "Beige leather · rose gold buckle", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-leather-straps/products/hartley-peach-leather-strap`, swatch: "linear-gradient(135deg,#e5d6bd,#a08e72)" },
  { id: "strap-pink-leather", name: "Pink Leather Interchangeable Strap", category: "Leather strap", detail: "Pink leather · rose gold buckle", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-leather-straps/products/hartley-pink-leather-strap`, swatch: "linear-gradient(135deg,#efc6c3,#b98380)" },
  { id: "strap-white-leather", name: "White Leather Interchangeable Strap", category: "Leather strap", detail: "White leather · silver buckle", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-leather-straps/products/hartley-white-leather-strap`, swatch: "linear-gradient(135deg,#fbf8f2,#c9c3b8)" },
  { id: "strap-black-silicone", name: "Black Silicone Interchangeable Strap", category: "Silicone strap", detail: "Black silicone · gold buckle", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-silicone-straps/products/black-silicone-interchangeable-strap`, swatch: "linear-gradient(135deg,#232427,#0a0a0b)" },
  { id: "strap-white-silicone", name: "White Silicone Interchangeable Strap", category: "Silicone strap", detail: "White silicone · black buckle", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-silicone-straps/products/white-silicone-interchangeable-strap`, swatch: "linear-gradient(135deg,#ffffff,#c9c7c2)" },
  { id: "strap-black-mesh", name: "Black Mesh Interchangeable Strap", category: "Mesh strap", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-mesh-straps/products/black-mesh-interchangeable-strap`, swatch: "repeating-linear-gradient(45deg,#44464b 0 2px,#111214 2px 4px)" },
  { id: "strap-silver-mesh", name: "Silver Mesh Interchangeable Strap", category: "Mesh strap", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-mesh-straps/products/silver-mesh-interchangeable-strap`, swatch: "repeating-linear-gradient(45deg,#e6e6e8 0 2px,#8f9094 2px 4px)" },
  { id: "strap-gold-mesh", name: "Gold Mesh Interchangeable Strap", category: "Mesh strap", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-mesh-straps/products/gold-mesh-interchangeable-strap`, swatch: "repeating-linear-gradient(45deg,#f0d28a 0 2px,#9a7431 2px 4px)" },
  { id: "strap-rosegold-mesh", name: "Rose Gold Mesh Interchangeable Strap", category: "Mesh strap", price: { amount: 59, currency: "USD" }, url: `${B}/collections/interchangeable-mesh-straps/products/rose-gold-mesh-interchangeable-strap`, swatch: "repeating-linear-gradient(45deg,#f0c5ae 0 2px,#9c6a55 2px 4px)" },
  { id: "strap-black-croc", name: "Black Leather Interchangeable Strap with Crocodile Embossing", category: "Croc strap", price: { amount: 79, currency: "USD" }, url: `${B}/collections/interchangeable-leather-straps-with-crocodile-embossing/products/black-leather-interchangeable-strap-with-crocodile-embossing`, swatch: "linear-gradient(135deg,#2a2628,#080707)" },
  { id: "bracelet-black", name: "Black Interchangeable Steel Bracelet", category: "Steel bracelet", price: { amount: 99, currency: "USD" }, url: `${B}/collections/interchangeable-steel-bracelets/products/black-interchangeable-steel-bracelet`, swatch: "linear-gradient(135deg,#4a4c50,#141517)" },
  { id: "bracelet-silver", name: "Silver Interchangeable Steel Bracelet", category: "Steel bracelet", price: { amount: 99, currency: "USD" }, url: `${B}/collections/interchangeable-steel-bracelets/products/silver-interchangeable-steel-bracelet`, swatch: "linear-gradient(135deg,#f0f0f2,#8f9094)" },
  { id: "bracelet-gold", name: "Gold Interchangeable Steel Bracelet", category: "Steel bracelet", price: { amount: 99, currency: "USD" }, url: `${B}/collections/interchangeable-steel-bracelets/products/gold-interchangeable-steel-bracelet`, swatch: "linear-gradient(135deg,#f5d88d,#9a7431)" },
  { id: "bracelet-rosegold", name: "Rose Gold Interchangeable Steel Bracelet", category: "Steel bracelet", price: { amount: 99, currency: "USD" }, url: `${B}/collections/interchangeable-steel-bracelets/products/rose-gold-interchangeable-steel-bracelet`, swatch: "linear-gradient(135deg,#f0c5ae,#9c6a55)" },
];

export const BOX_ACCESSORIES: Accessory[] = [
  { id: "box-6", name: "Hartley Black 6-Slot Collectors Box", category: "Collector box", detail: "Holds 6 watches", price: { amount: 119, currency: "USD" }, url: `${B}/collections/watch-collector-boxes/products/hartley-black-6-slot-collectors-box`, swatch: "linear-gradient(135deg,#1e1d1c,#080808)" },
  { id: "box-12", name: "Hartley Black 12-Slot Collectors Box", category: "Collector box", detail: "Holds 12 watches", price: { amount: 149, currency: "USD" }, url: `${B}/collections/watch-collector-boxes/products/hartley-black-12-slot-collectors-box`, swatch: "linear-gradient(135deg,#1e1d1c,#080808)" },
];

export const ACCESSORY_COLLECTIONS = [
  { label: "Watch straps", url: `${B}/collections/straps` },
  { label: "Collector boxes", url: `${B}/collections/watch-collector-boxes` },
  { label: "Rings", url: `${B}/collections/rings` },
  { label: "Wallets", url: `${B}/collections/wallets` },
  { label: "Fountain pens", url: `${B}/collections/fountain-pens` },
];
