export type CatalogueTemplate = "CLEAN_GRID" | "LUXURY_LOOKBOOK" | "WHOLESALE" | "PRICE_LIST";

export type GenerateCatalogueInput = {
  shopId: string;
  productIds: string[];
  template: CatalogueTemplate;
  includePrices: boolean;
  includeQrCodes: boolean;
};

export async function generateCataloguePdf(input: GenerateCatalogueInput) {
  // MVP placeholder:
  // 1. Load shop and selected products from Prisma.
  // 2. Render an HTML template.
  // 3. Generate QR codes for product URLs.
  // 4. Convert HTML to PDF with Puppeteer or Playwright.
  // 5. Upload the PDF to Supabase Storage.
  // 6. Save pdfFileUrl on PdfCatalogue.
  return {
    status: "DRAFT",
    message: "PDF catalogue generation is ready for implementation.",
    input
  };
}
