import { Category } from "./types";

// Order is fixed and maps 1:1 to the validated categorical palette slots
// (see app/globals.css --series-1..8). Never reassign an existing category
// to a different slot, and never add a 9th — fold overflow into "Other".
export const CATEGORIES: Category[] = [
  { id: "email", label: "Email", emoji: "📧", slot: 1 },
  { id: "planning", label: "Planning", emoji: "📝", slot: 2 },
  { id: "grading", label: "Grading", emoji: "✅", slot: 3 },
  { id: "parent-contact", label: "Parent Contact", emoji: "👨‍👩‍👧", slot: 4 },
  { id: "paperwork", label: "IEP / Paperwork", emoji: "📋", slot: 5 },
  { id: "meetings", label: "Meetings", emoji: "👥", slot: 6 },
  { id: "instruction", label: "Instruction", emoji: "🎯", slot: 7 },
  { id: "other", label: "Other", emoji: "📌", slot: 8 },
];

export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
