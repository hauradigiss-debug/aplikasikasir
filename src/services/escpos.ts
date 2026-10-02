import { Order, StoreSettings, PrinterPaperWidth } from '../types';
import { formatCurrency } from '../utils';

/**
 * ESC/POS Binary Command Generator for Thermal Mini Printers (58mm & 80mm)
 * Compatible with Bluetooth, USB, and Serial Thermal Printers (e.g. Panda, RPP02N, Eppos, Zjiang, MPT-II)
 */

export const ESC_POS = {
  // Initialization
  INIT: [0x1b, 0x40], // ESC @ - Reset printer settings
  
  // Text Alignment
  ALIGN_LEFT: [0x1b, 0x61, 0x00], // ESC a 0
  ALIGN_CENTER: [0x1b, 0x61, 0x01], // ESC a 1
  ALIGN_RIGHT: [0x1b, 0x61, 0x02], // ESC a 2

  // Text Styling
  BOLD_ON: [0x1b, 0x45, 0x01], // ESC E 1
  BOLD_OFF: [0x1b, 0x45, 0x00], // ESC E 0
  UNDERLINE_ON: [0x1b, 0x2d, 0x01], // ESC - 1
  UNDERLINE_OFF: [0x1b, 0x2d, 0x00], // ESC - 0
  INVERT_ON: [0x1d, 0x42, 0x01], // GS B 1
  INVERT_OFF: [0x1d, 0x42, 0x00], // GS B 0

  // Text Sizing
  SIZE_NORMAL: [0x1d, 0x21, 0x00], // GS ! 0x00
  SIZE_DOUBLE_HEIGHT: [0x1d, 0x21, 0x01], // GS ! 0x01
  SIZE_DOUBLE_WIDTH: [0x1d, 0x21, 0x10], // GS ! 0x10
  SIZE_DOUBLE: [0x1d, 0x21, 0x11], // GS ! 0x11 (Double height & width)

  // Paper Handling
  FEED_LINE: [0x0a], // LF
  CUT_FULL: [0x1d, 0x56, 0x00], // GS V 0 (Full Cut)
  CUT_PARTIAL: [0x1d, 0x56, 0x01], // GS V 1 (Partial Cut)
  FEED_AND_CUT: [0x1d, 0x56, 0x42, 0x02], // GS V 66 2 (Feed then Cut)

  // Cash Drawer Kick (Pin 2 and Pin 5)
  DRAWER_KICK_PIN2: [0x1b, 0x70, 0x00, 0x19, 0xfa], // ESC p 0 25 250
  DRAWER_KICK_PIN5: [0x1b, 0x70, 0x01, 0x19, 0xfa], // ESC p 1 25 250
};

export class EscPosBuilder {
  private buffer: number[] = [];
  private textWidth: number;
  private previewLines: string[] = [];

  constructor(paperWidth: PrinterPaperWidth = '58mm') {
    // 58mm thermal printers usually have 32 columns (standard font A)
    // 80mm thermal printers usually have 48 columns (standard font A)
    this.textWidth = paperWidth === '80mm' ? 48 : 32;
    this.addRaw(ESC_POS.INIT);
  }

  public getWidth(): number {
    return this.textWidth;
  }

  public addRaw(bytes: number[]): this {
    this.buffer.push(...bytes);
    return this;
  }

  public alignLeft(): this {
    return this.addRaw(ESC_POS.ALIGN_LEFT);
  }

  public alignCenter(): this {
    return this.addRaw(ESC_POS.ALIGN_CENTER);
  }

  public alignRight(): this {
    return this.addRaw(ESC_POS.ALIGN_RIGHT);
  }

  public bold(enable: boolean = true): this {
    return this.addRaw(enable ? ESC_POS.BOLD_ON : ESC_POS.BOLD_OFF);
  }

  public size(type: 'normal' | 'double-height' | 'double-width' | 'double' = 'normal'): this {
    switch (type) {
      case 'double':
        return this.addRaw(ESC_POS.SIZE_DOUBLE);
      case 'double-height':
        return this.addRaw(ESC_POS.SIZE_DOUBLE_HEIGHT);
      case 'double-width':
        return this.addRaw(ESC_POS.SIZE_DOUBLE_WIDTH);
      case 'normal':
      default:
        return this.addRaw(ESC_POS.SIZE_NORMAL);
    }
  }

  public text(str: string): this {
    // Clean string to ASCII-friendly printer bytes
    for (let i = 0; i < str.length; i++) {
      let code = str.charCodeAt(i);
      if (code > 127) {
        // Handle common accented characters or symbols gracefully
        if (str[i] === '•') code = 0x2a; // '*'
        else if (str[i] === '—' || str[i] === '–') code = 0x2d; // '-'
        else if (str[i] === '“' || str[i] === '”') code = 0x22; // '"'
        else if (str[i] === '‘' || str[i] === '’') code = 0x27; // "'"
        else code = 0x20; // replace with space
      }
      this.buffer.push(code);
    }
    return this;
  }

  public textLine(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0a);
    this.previewLines.push(str);
    return this;
  }

  public feed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
      this.previewLines.push('');
    }
    return this;
  }

  public divider(char: string = '-'): this {
    const line = char.repeat(this.textWidth).slice(0, this.textWidth);
    return this.textLine(line);
  }

  public doubleDivider(): this {
    return this.divider('=');
  }

  public dottedDivider(): this {
    return this.divider('.');
  }

  /**
   * Print two columns justified: Left aligned text and Right aligned text
   * Example: "Subtotal              Rp 120.000"
   */
  public twoColumns(left: string, right: string): this {
    const spaceCount = this.textWidth - (left.length + right.length);
    if (spaceCount > 0) {
      const line = left + ' '.repeat(spaceCount) + right;
      return this.textLine(line);
    } else {
      // If text is too long, wrap left onto first line and right onto second
      this.textLine(left);
      const rightSpace = Math.max(0, this.textWidth - right.length);
      return this.textLine(' '.repeat(rightSpace) + right);
    }
  }

  /**
   * Print three columns (e.g., "Item", "Qty", "Total")
   */
  public threeColumns(col1: string, col2: string, col3: string, col2Width: number = 4): this {
    const col3Width = Math.max(8, Math.floor(this.textWidth * 0.35));
    const col1Width = this.textWidth - col2Width - col3Width - 2;

    const safeCol1 = col1.length > col1Width ? col1.slice(0, col1Width) : col1.padEnd(col1Width, ' ');
    const safeCol2 = col2.padStart(col2Width, ' ');
    const safeCol3 = col3.padStart(col3Width, ' ');

    return this.textLine(`${safeCol1} ${safeCol2} ${safeCol3}`);
  }

  public cut(): this {
    this.feed(3);
    this.addRaw(ESC_POS.FEED_AND_CUT);
    return this;
  }

  public openCashDrawer(): this {
    this.addRaw(ESC_POS.DRAWER_KICK_PIN2);
    this.addRaw(ESC_POS.DRAWER_KICK_PIN5);
    return this;
  }

  public build(): { bytes: Uint8Array; textPreview: string } {
    return {
      bytes: new Uint8Array(this.buffer),
      textPreview: this.previewLines.join('\n'),
    };
  }
}

/**
 * Generate full ESC/POS bytes for an Order
 */
export function generateReceiptEscPos(
  order: Order,
  settings: StoreSettings,
  paperWidth: PrinterPaperWidth = '58mm',
  options?: {
    feedLines?: number;
    cut?: boolean;
    openCashDrawer?: boolean;
  }
): { bytes: Uint8Array; textPreview: string } {
  const builder = new EscPosBuilder(paperWidth);

  // Optional: Kick cash drawer at start of printing
  if (options?.openCashDrawer) {
    builder.openCashDrawer();
  }

  // 1. Store Header
  builder.alignCenter();
  builder.bold(true);
  builder.size('double-height');
  builder.textLine(settings.storeName.toUpperCase());
  builder.size('normal');
  builder.bold(false);

  if (settings.tagline) {
    builder.textLine(settings.tagline);
  }
  if (settings.address) {
    builder.textLine(settings.address);
  }
  if (settings.phone) {
    builder.textLine(`Tel: ${settings.phone}`);
  }

  builder.divider('-');

  // 2. Receipt Metadata
  builder.alignLeft();
  builder.twoColumns('No. Nota:', order.receiptNumber);
  
  const dateObj = new Date(order.timestamp);
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ' ' + dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  builder.twoColumns('Tanggal :', formattedDate);
  builder.twoColumns('Kasir   :', order.cashierName || 'Staff POS');
  if (order.customerName) {
    builder.twoColumns('Pelanggan:', order.customerName);
  }
  builder.twoColumns('Bayar   :', order.paymentMethod.toUpperCase());

  if (order.status === 'refunded') {
    builder.alignCenter();
    builder.bold(true);
    builder.textLine('*** TRANSAKSI DI-REFUND ***');
    builder.bold(false);
    builder.alignLeft();
  }

  builder.divider('-');

  // 3. Line Items
  order.items.forEach((item) => {
    // Line 1: Item name (bold or normal)
    builder.bold(true);
    builder.textLine(item.product.name);
    builder.bold(false);

    // Line 2: Qty x Price and Line Total
    const qtyPrice = ` ${item.quantity}x @${formatCurrency(item.product.price, settings.currencySymbol)}`;
    const lineTotal = formatCurrency(item.product.price * item.quantity, settings.currencySymbol);
    builder.twoColumns(qtyPrice, lineTotal);
  });

  builder.divider('-');

  // 4. Totals & Payment Summary
  builder.twoColumns('Subtotal', formatCurrency(order.subtotal, settings.currencySymbol));

  if (order.discount > 0) {
    builder.twoColumns('Diskon Member', `-${formatCurrency(order.discount, settings.currencySymbol)}`);
  }

  if (order.tax > 0) {
    const taxLabel = `Pajak (${Math.round(settings.taxRate * 100)}%)`;
    builder.twoColumns(taxLabel, formatCurrency(order.tax, settings.currencySymbol));
  }

  builder.doubleDivider();

  // Grand Total in Bold / Highlight
  builder.bold(true);
  builder.size('double-height');
  builder.twoColumns('TOTAL', formatCurrency(order.total, settings.currencySymbol));
  builder.size('normal');
  builder.bold(false);

  builder.divider('-');

  // Payment Breakdown
  builder.twoColumns('Tunai/Diterima', formatCurrency(order.amountPaid, settings.currencySymbol));
  if (order.paymentMethod === 'cash') {
    builder.bold(true);
    builder.twoColumns('Kembali', formatCurrency(order.change, settings.currencySymbol));
    builder.bold(false);
  }

  builder.divider('-');

  // 5. Footer & Barcode simulation
  builder.alignCenter();
  if (settings.receiptFooter) {
    builder.textLine(settings.receiptFooter);
  } else {
    builder.textLine('Terima kasih atas kunjungan Anda');
    builder.textLine('Barang yang dibeli tidak dapat ditukar');
  }

  // Simulated barcode text representation
  builder.feed(1);
  builder.textLine(`*${order.receiptNumber}*`);
  builder.textLine('--- Layanan Konsumen: ' + settings.phone + ' ---');

  // Feed & Cut
  const feedCount = options?.feedLines ?? 4;
  builder.feed(feedCount);
  
  if (options?.cut) {
    builder.cut();
  }

  return builder.build();
}

/**
 * Generate a standard ESC/POS Test Slip for printer verification
 */
export function generateTestReceiptEscPos(
  storeName: string,
  paperWidth: PrinterPaperWidth = '58mm'
): { bytes: Uint8Array; textPreview: string } {
  const builder = new EscPosBuilder(paperWidth);

  builder.openCashDrawer();
  builder.alignCenter();
  builder.bold(true);
  builder.size('double');
  builder.textLine('TEST PRINT');
  builder.size('normal');
  builder.bold(false);
  builder.textLine(storeName);
  builder.textLine('Bluetooth Thermal Mini Printer');
  builder.divider('=');

  builder.alignLeft();
  builder.twoColumns('Status Bluetooth:', 'TERHUBUNG (OK)');
  builder.twoColumns('Ukuran Kertas   :', paperWidth);
  builder.twoColumns('Lebar Karakter  :', `${builder.getWidth()} Kolom`);
  builder.twoColumns('Protokol Cetak  :', 'ESC/POS Standard');
  builder.twoColumns('Baud Rate / SPP :', 'Auto Negotiated');

  const now = new Date();
  builder.twoColumns('Waktu Uji Coba  :', now.toLocaleTimeString('id-ID'));
  builder.divider('-');

  builder.alignCenter();
  builder.bold(true);
  builder.textLine('Font Style & Formatting Test:');
  builder.bold(false);
  builder.textLine('Regular: ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  builder.textLine('Numbers: 0123456789 - Rp 999.000');
  builder.bold(true);
  builder.textLine('Bold Text: Stationery POS System');
  builder.bold(false);

  builder.divider('-');
  builder.textLine('Koneksi Mini Printer Siap Digunakan!');
  builder.feed(3);
  builder.cut();

  return builder.build();
}

/**
 * Generate Cash Drawer RJ11 Kick command bytes
 */
export function generateCashDrawerEscPos(): Uint8Array {
  const builder = new EscPosBuilder('58mm');
  builder.openCashDrawer();
  return builder.build().bytes;
}

/**
 * Generate simple Feed Paper command bytes
 */
export function generateFeedPaperEscPos(lines: number = 3): Uint8Array {
  const builder = new EscPosBuilder('58mm');
  builder.feed(lines);
  return builder.build().bytes;
}
