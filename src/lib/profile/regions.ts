export const UZBEKISTAN_REGIONS = [
  "Andijon viloyati",
  "Buxoro viloyati",
  "Jizzax viloyati",
  "Qashqadaryo viloyati",
  "Navoiy viloyati",
  "Namangan viloyati",
  "Samarqand viloyati",
  "Sirdaryo viloyati",
  "Surxondaryo viloyati",
  "Toshkent viloyati",
  "Toshkent shahri",
  "Farg‘ona viloyati",
  "Xorazm viloyati",
  "Qoraqalpog‘iston Respublikasi",
] as const;

export type UzbekistanRegion = (typeof UZBEKISTAN_REGIONS)[number];
