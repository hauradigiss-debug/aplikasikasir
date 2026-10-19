/**
 * Standard Indonesian QRIS (Quick Response Code Indonesian Standard)
 * EMVCo Dynamic QR Code Payload Generator & Validator
 * Conforms to Bank Indonesia & ASPI (Asosiasi Sistem Pembayaran Indonesia) Specifications
 */

export interface QrisPayloadOptions {
  merchantName: string;
  nmid: string;
  terminalId?: string;
  amount: number;
  currencyCode?: string; // default "360" (IDR)
  invoiceNumber?: string;
  city?: string;
  postalCode?: string;
}

/**
 * Format an EMVCo data object: ID (2 digits) + Length (2 digits) + Value
 */
function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Standard CRC16-CCITT algorithm (Polynomial: 0x1021, Init: 0xFFFF)
 * Used by EMVCo and QRIS Tag 63
 */
export function calculateCRC16(data: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generate standard dynamic QRIS payload string with real-time nominal amount
 */
export function generateDynamicQrisPayload(options: QrisPayloadOptions): string {
  const {
    merchantName = 'STATIONERY POS',
    nmid = 'ID1020038291039',
    terminalId = 'A01',
    amount = 0,
    currencyCode = '360', // IDR
    invoiceNumber = 'INV-' + Date.now().toString().slice(-6),
    city = 'JAKARTA',
    postalCode = '10110',
  } = options;

  // Sanitize merchant name (alphanumeric, max 25 chars)
  const cleanMerchant = merchantName.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 25).toUpperCase() || 'STATIONERY POS';
  const cleanCity = city.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 15).toUpperCase() || 'JAKARTA';

  // Format amount as integer or standard 2-decimal string
  const formattedAmount = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);

  // Sub-tags for Tag 26 (Merchant Account Information)
  const tag26Sub00 = formatTag('00', 'ID.CO.QRIS.WWW');
  const tag26Sub01 = formatTag('01', '936009110020038291');
  const tag26Sub02 = formatTag('02', nmid);
  const tag26Sub03 = formatTag('03', 'UME');
  const tag26 = formatTag('26', `${tag26Sub00}${tag26Sub01}${tag26Sub02}${tag26Sub03}`);

  // Sub-tags for Tag 51 (National Merchant ID - NMID)
  const tag51Sub02 = formatTag('02', nmid);
  const tag51 = formatTag('51', tag51Sub02);

  // Sub-tags for Tag 62 (Additional Data Field: Terminal & Invoice)
  const tag62Sub01 = invoiceNumber ? formatTag('01', invoiceNumber.slice(0, 20)) : '';
  const tag62Sub07 = formatTag('07', terminalId);
  const tag62 = formatTag('62', `${tag62Sub01}${tag62Sub07}`);

  // Assemble full payload prior to CRC16
  let payload = '';
  payload += formatTag('00', '01'); // Format Indicator
  payload += formatTag('01', '12'); // Dynamic QR (12), Static is (11)
  payload += tag26;
  payload += tag51;
  payload += formatTag('52', '5943'); // Merchant Category: Stationery / Office Supplies
  payload += formatTag('53', currencyCode); // 360 for IDR
  payload += formatTag('54', formattedAmount); // Nominal Real-time!
  payload += formatTag('58', 'ID'); // Country Code
  payload += formatTag('59', cleanMerchant); // Merchant Name
  payload += formatTag('60', cleanCity); // Merchant City
  payload += formatTag('61', postalCode); // Postal Code
  payload += tag62; // Additional Data (Invoice & Terminal)
  payload += '6304'; // Tag 63 with length 04, CRC appended after

  // Calculate CRC16 checksum
  const checksum = calculateCRC16(payload);
  return `${payload}${checksum}`;
}
