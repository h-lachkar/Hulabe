// Helper kept as ts (not route.ts) just to colocate the PDF download URL
// builder. Adjust if you move the PDF endpoint.
export function pdfDownloadUrl(invoiceId: string) {
  return `/admin/invoices/${invoiceId}/pdf`;
}
