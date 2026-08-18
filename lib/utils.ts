import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Standard shadcn/ui `cn` helper (clsx + tailwind-merge) so conflicting
// utility classes resolve predictably when composing components.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
