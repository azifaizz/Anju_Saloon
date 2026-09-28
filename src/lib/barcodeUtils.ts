/**
 * Shared utility for consistent barcode label formatting.
 */

export interface BarcodeMetadata {
  billNo?: string;
  vendorNickname?: string;
  series?: string;
}

/**
 * Formats the supplier info string for the barcode label.
 * For Retail: "BillNo-Nickname-Series"
 */
export const formatBarcodeMeta = (data: BarcodeMetadata): string => {
  const nickname = data.vendorNickname;
  const parts = [];
  if (nickname) parts.push(nickname);
  if (data.series) parts.push(data.series);
  
  if (parts.length > 0) {
    return parts.join(' - ');
  }

  return [
    data.billNo,
    data.vendorNickname,
    data.series
  ].filter(Boolean).join('-');
};
