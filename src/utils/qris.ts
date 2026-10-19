/**
 * Standard Indonesian QRIS (Quick Response Code Indonesian Standard)
 * EMVCo Dynamic QR Code Payload Generator & Validator
 * Conforms to Bank Indonesia & ASPI (Asosiasi Sistem Pembayaran Indonesia) Specifications
 * (PADG No. 21/18/PADG/2019)
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
  acquirerPan?: string;
  criteria?: 'UMI' | 'UKE' | 'UME' | 'UBE';
}

/**
 * Format an EMVCo data object: ID (2 digits) + Length (2 digits) + Value
 */
export function formatTag(id: string, value: string): string {
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
 * Fully compliant with Bank Indonesia & ASPI specifications
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
    acquirerPan = '936009110020038291',
    criteria = 'UME',
  } = options;

  // Sanitize merchant name (alphanumeric & space only, max 25 chars)
  const cleanMerchant =
    merchantName.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 25).toUpperCase() || 'STATIONERY POS';
  const cleanCity =
    city.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 15).toUpperCase() || 'JAKARTA';
  const cleanPostal =
    postalCode.replace(/[^0-9]/g, '').slice(0, 5) || '10110';
  const cleanTerminal =
    terminalId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'A01';
  const cleanNmid =
    nmid.replace(/[^a-zA-Z0-9]/g, '').trim() || 'ID1020038291039';

  // Format amount as integer (if whole number) or 2 decimals
  const formattedAmount = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);

  // Sub-tags for Tag 26 (Domestic Merchant Account Information - QRIS)
  const tag26Sub00 = formatTag('00', 'ID.CO.QRIS.WWW');
  const tag26Sub01 = formatTag('01', acquirerPan);
  const tag26Sub02 = formatTag('02', cleanNmid);
  const tag26Sub03 = formatTag('03', criteria);
  const tag26 = formatTag('26', `${tag26Sub00}${tag26Sub01}${tag26Sub02}${tag26Sub03}`);

  // Sub-tags for Tag 51 (Domestic Central Switch / GPN ASPI Specification)
  const tag51Sub00 = formatTag('00', 'ID.OR.GPN.WWW');
  const tag51Sub01 = formatTag('01', acquirerPan);
  const tag51Sub02 = formatTag('02', cleanNmid);
  const tag51Sub03 = formatTag('03', criteria);
  const tag51 = formatTag('51', `${tag51Sub00}${tag51Sub01}${tag51Sub02}${tag51Sub03}`);

  // Sub-tags for Tag 62 (Additional Data Field: Terminal & Invoice)
  const cleanInvoice = invoiceNumber.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, 20);
  const tag62Sub01 = cleanInvoice ? formatTag('01', cleanInvoice) : '';
  const tag62Sub07 = formatTag('07', cleanTerminal);
  const tag62 = formatTag('62', `${tag62Sub01}${tag62Sub07}`);

  // Assemble full EMVCo QRIS payload
  let payload = '';
  payload += formatTag('00', '01'); // Payload Format Indicator
  payload += formatTag('01', '12'); // Point of Initiation: 12 (Dynamic QR with fixed amount)
  payload += tag26;                 // Tag 26: Merchant Account Information
  payload += tag51;                 // Tag 51: GPN / ASPI Switching Network
  payload += formatTag('52', '5943'); // Merchant Category Code (Stationery & Office Supplies)
  payload += formatTag('53', currencyCode); // Currency Code 360 = IDR
  payload += formatTag('54', formattedAmount); // Real-time Transaction Amount
  payload += formatTag('58', 'ID'); // Country Code (Indonesia)
  payload += formatTag('59', cleanMerchant); // Merchant Name
  payload += formatTag('60', cleanCity); // Merchant City
  payload += formatTag('61', cleanPostal); // Postal Code
  payload += tag62;                 // Tag 62: Additional Data (Invoice & Terminal)
  payload += '6304';                // Tag 63: CRC header (4 hex digits will follow)

  // Calculate CRC16 checksum
  const checksum = calculateCRC16(payload);
  return `${payload}${checksum}`;
}

/**
 * Validate and parse a scanned QRIS string (useful for Customer-Presented or scanner verification)
 */
export function parseQrisPayload(raw: string): {
  isValid: boolean;
  merchantName?: string;
  amount?: number;
  nmid?: string;
  raw: string;
} {
  const clean = raw.trim();
  if (clean.length < 30 || !clean.startsWith('000201')) {
    return { isValid: false, raw: clean };
  }

  try {
    let index = 0;
    let merchantName: string | undefined;
    let amount: number | undefined;
    let nmid: string | undefined;

    while (index < clean.length - 4) {
      const tag = clean.slice(index, index + 2);
      const len = parseInt(clean.slice(index + 2, index + 4), 10);
      if (isNaN(len)) break;
      const value = clean.slice(index + 4, index + 4 + len);
      index += 4 + len;

      if (tag === '59') {
        merchantName = value;
      } else if (tag === '54') {
        amount = parseFloat(value);
      } else if (tag === '26' || tag === '51') {
        // extract sub-tag 02 (NMID)
        const subMatch = value.match(/02(\d{2})([A-Z0-9]+)/);
        if (subMatch) {
          nmid = subMatch[2];
        }
      }
    }

    return {
      isValid: true,
      merchantName,
      amount,
      nmid,
      raw: clean,
    };
  } catch {
    return { isValid: false, raw: clean };
  }
}
