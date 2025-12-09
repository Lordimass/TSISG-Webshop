import type { ImageData } from "@shared/types/supabaseTypes.ts";

export function compareImages(a: ImageData, b: ImageData): number {
  if (a.display_order < b.display_order) {
    return -1;
  } else if (b.display_order < a.display_order) {
    return 1;
  }
  return 0;
}