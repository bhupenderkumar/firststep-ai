export const CLASS_OPTIONS = [
  "Nursery",
  "KG",
  "KG 2",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
] as const;

export type ClassName = (typeof CLASS_OPTIONS)[number];

// A4 portrait at 150 DPI (good for both screen + print)
export const A4 = { width: 1240, height: 1754 } as const;
