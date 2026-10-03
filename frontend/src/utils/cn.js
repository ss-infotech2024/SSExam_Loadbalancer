// Joins truthy class names — keeps conditional Tailwind classes readable.
export const cn = (...parts) => parts.flat().filter(Boolean).join(" ");
