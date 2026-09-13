export type ProductOption = { id: string; name: string; priceCents: number; imageUrl: string | null };

export type ProductOptionGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: ProductOption[];
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  optionGroups: ProductOptionGroup[];
};

export type Category = { id: string; name: string; products: Product[] };

export type SelectedOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  name: string;
  priceCents: number;
};

export type CartLine = {
  lineId: string;
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  selectedOptions: SelectedOption[];
};

export function buildLineId(productId: string, selectedOptions: SelectedOption[]): string {
  const optionIds = selectedOptions
    .map((option) => option.optionId)
    .sort()
    .join(",");
  return `${productId}::${optionIds}`;
}

export function cartLineTotalCents(line: CartLine): number {
  const optionsTotal = line.selectedOptions.reduce((sum, option) => sum + option.priceCents, 0);
  return (line.unitPriceCents + optionsTotal) * line.quantity;
}
