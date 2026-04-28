export const CATEGORY_LABELS: Record<string, string> = {
  "sfsg-domesticviolence": "Domestic Violence",
  "sfsg-health": "Health",
  "sfsg-finance": "Financial Assistance",
  "sfsg-food": "Food",
  "sfsg-housing": "Housing",
  "sfsg-hygiene": "Hygiene",
  "sfsg-internet": "Internet Access",
  "sfsg-jobs": "Jobs & Employment",
  "sfsg-lgbtqa": "LGBTQ+ Services",
  "sfsg-substanceuse": "Substance Use",
  "sfsg-shelter": "Shelter",
  "sfsg-longterm": "Long-term Housing",
  "sfsg-familyservices": "Family Services",
};

export function mapCategories(categories: string[]): string[] {
  return categories.map(c => CATEGORY_LABELS[c]).filter((l): l is string => !!l);
}
