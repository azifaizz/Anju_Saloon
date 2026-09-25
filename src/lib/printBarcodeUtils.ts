import QRCode from 'qrcode';
import toast from 'react-hot-toast';

export interface PrintableBarcodeProduct {
    id: string;
    barcode: string;
    name: string;
    price: number | string;
    quantity: number;
    metadata?: string;
}

export const printProductBarcodes = async (products: PrintableBarcodeProduct[]) => {
    if (!products || products.length === 0) {
        toast.error("No products selected for printing");
        return;
    }

    const labels: { barcode: string; id: string; name: string; price: number | string; metadata: string; qrDataUrl: string }[] = [];

    for (const product of products) {
        const { barcode, id, name, price, metadata } = product;
        const qrDataUrl = await QRCode.toDataURL(barcode, { width: 200, margin: 1, errorCorrectionLevel: 'M' });
        for (let i = 0; i < product.quantity; i++) {
            labels.push({ barcode, id, name, price, metadata: metadata || '', qrDataUrl });
        }
    }

    if (labels.length === 0) return;

    const stickers = labels.map(l => `
        <div class="label">
            <div class="label-left">
                <img class="qr" src="${l.qrDataUrl}" />
            </div>
            <div class="label-right">
                <div class="brand">Anjus Beauty Saloon</div>
                <div class="prod-code">${l.id}</div>
                ${l.metadata ? `<div class="meta">${l.metadata}</div>` : ''}
                <div class="price">Rs.${l.price}</div>
                <div class="desc">${l.name}</div>
            </div>
        </div>`);

    const printWin = window.open('', '_blank', 'width=800,height=600');
    if (!printWin) {
        toast.error('Pop-up blocked! Please enable pop-ups.');
        return;
    }

    printWin.document.write(`<!DOCTYPE html><html><head><title>Print QR Codes</title><style>
        @page { size: auto; margin: 0mm; }
        body {
            margin: 0;
            padding: 0.1in;
            display: grid;
            grid-template-columns: repeat(2, 2in);
            justify-content: center;
            column-gap: 0.1in;
            row-gap: 0.1in;
            font-family: Arial, sans-serif;
            color: #000;
        }
        .label {
            width: 2in;
            height: 1in;
            padding: 0.04in 0.06in;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 0.06in;
            box-sizing: border-box;
            overflow: hidden;
            page-break-inside: avoid;
            border: 1px dotted #ccc;
        }
        .label-left {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .qr {
            width: 0.7in;
            height: 0.7in;
            display: block;
        }
        .label-right {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.01in;
            overflow: hidden;
            min-width: 0;
        }
        .brand {
            font-family: Arial, sans-serif;
            font-size: 7pt;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            line-height: 1.1;
        }
        .prod-code {
            font-family: Arial, sans-serif;
            font-size: 7pt;
            font-weight: bold;
            line-height: 1.1;
            color: #333;
        }
        .meta {
            font-family: Arial, sans-serif;
            font-size: 6.5pt;
            font-weight: bold;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            line-height: 1;
            color: #555;
        }
        .price {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12pt;
            font-weight: 900;
            margin: 0;
            line-height: 1;
        }
        .desc {
            font-family: Arial, sans-serif;
            font-size: 7pt;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            margin: 0;
            line-height: 1;
        }
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .label { border: none; }
        }
      </style></head><body>${stickers.join('')}</body></html>`);

    printWin.document.close();

    printWin.onload = () => {
        setTimeout(() => {
            printWin.print();
        }, 300);
    };
};
