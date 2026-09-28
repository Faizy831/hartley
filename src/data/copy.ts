export interface SectionMeta {
  id: string;
  index: string;
  label: string;
}

/** Home: the collection story. */
export const HOME_SECTIONS: SectionMeta[] = [
  { id: "hero", index: "01", label: "Hartley" },
  { id: "discover", index: "02", label: "Two expressions" },
  { id: "legacy", index: "03", label: "Legacy" },
  { id: "legacy-stage", index: "04", label: "Legacy collection" },
  { id: "legacy-catalog", index: "05", label: "Legacy catalog" },
  { id: "legacy-craft", index: "06", label: "Legacy movement" },
  { id: "heritage", index: "07", label: "Heritage" },
  { id: "heritage-stage", index: "08", label: "Heritage collection" },
  { id: "heritage-catalog", index: "09", label: "Heritage catalog" },
  { id: "heritage-design", index: "10", label: "Heritage design" },
  { id: "accessories", index: "11", label: "Straps & accessories" },
  { id: "watch", index: "12", label: "The Watch" },
  { id: "explore", index: "13", label: "Explore" },
];

/** Product detail: the deep single-object film. */
export const PRODUCT_SECTIONS: SectionMeta[] = [
  { id: "hero", index: "01", label: "Hero" },
  { id: "object", index: "02", label: "The Object" },
  { id: "case", index: "03", label: "The Case" },
  { id: "dial", index: "04", label: "The Dial" },
  { id: "movement", index: "05", label: "The Movement" },
  { id: "materials", index: "06", label: "The Materials" },
  { id: "craft", index: "07", label: "The Craft" },
  { id: "watch", index: "08", label: "The Watch" },
  { id: "collection", index: "09", label: "Reserve" },
];

export const NAV_LINKS = [
  { label: "Legacy", href: "/#s-legacy", index: "03" },
  { label: "Heritage", href: "/#s-heritage", index: "07" },
  { label: "All watches", href: "/watches", index: "40" },
  { label: "Straps", href: "/watches#straps", index: "18" },
];
export const MENU_LINKS = [
  ...NAV_LINKS,
  { label: "Story", href: "/#s-discover", index: "02" },
  { label: "Accessories", href: "/watches#accessories", index: "05" },
];
