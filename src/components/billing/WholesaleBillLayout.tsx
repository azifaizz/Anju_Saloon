
import * as React from 'react';
import './WholesaleBillLayout.css';
import { APP_CONFIG } from '@/config';
import { numberToWords } from '@/utils/numberToWords';

interface PrintableBillItem {
    barcode?: string;
    productId?: string;
    name?: string;
    productName?: string;
    particulars?: string;
    quantity?: number | string;
    qty?: number | string;
    unitPrice?: number;
    rate?: number;
    price?: number;
    gstRate?: number;
    GST?: number;
    gstPercent?: number;
    baseAmount?: number;
    gstAmount?: number;
    finalAmount?: number;
    discountRate?: number;
    Discount?: number | string;
    discount?: number | string;
    discountAmt?: number | string;
    discountAmount?: number | string;
    netAmount?: number;
    total?: number;
    hsn?: string;
}

interface PrintableBillData {
    id?: string;
    invoiceId?: string;
    invoiceNumber?: string;
    customerName?: string;
    partyName?: string;
    customerPhone?: string | number;
    customerAddress?: string;
    customerGst?: string;
    status?: string;
    items?: PrintableBillItem[];
    subtotal?: number;
    totalDiscountAmount?: number;
    totalGstAmount?: number;
    finalAmount?: number;
    amountPaid?: number;
    paymentMethod?: string;
    createdAt?: string;
    billType?: string;
    invoiceMode?: string;
}

export const WholesaleBillLayout: React.FC<{ data: PrintableBillData }> = ({ data }) => {
    // Standard slots to ensure vertical fit
    const SAFE_LIMIT = 15; // Max items on last page with footer
    const HARD_LIMIT = 25; // Max items on intermediate pages without footer
    const HSN_SLOTS = 3;

    const billNo = data.id || data.invoiceId || data.invoiceNumber || "";
    const customerName = data.customerName || data.partyName || "CASH";
    const customerPhone = data.customerPhone || "";
    const customerAddress = data.customerAddress || "";
    const customerGst = data.customerGst || "";
    const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    const formattedDate = createdAt.toLocaleDateString('en-GB');
    const isEstimate = data.invoiceMode === 'ESTIMATE' || data.billType === 'ESTIMATE';
    const taxType = (data as any).taxType || ((data as any).igstAmount > 0 ? "INTER_STATE" : "INTRA_STATE");

    const rawItems = data.items || [];
    const items = rawItems.map(item => {
        const q = Number(item.quantity ?? item.qty ?? 0);
        const p = Number(item.unitPrice ?? item.price ?? item.rate ?? 0);
        const g = Number(item.gstPercent ?? item.gstRate ?? item.GST ?? 0);
        const d = Number(item.discount ?? item.discountAmt ?? item.discountAmount ?? 0);

        const base = Number(item.baseAmount || (p * q)) || 0;
        const ga = Number(item.gstAmount || (base * g / 100)) || 0;
        const total = Number(item.finalAmount ?? item.total ?? (base + ga)) || 0;

        return {
            id: item.productId || item.barcode || "-",
            name: item.productName || item.name || item.particulars || "-",
            qty: q,
            rate: p,
            discount: d,
            baseAmount: base,
            gstPercent: g,
            gstAmount: ga,
            total: total,
            hsn: item.hsn || "9997"
        };
    });

    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    const totalBaseAmount = items.reduce((sum, i) => sum + i.baseAmount, 0);
    const totalGst = items.reduce((sum, i) => sum + i.gstAmount, 0);
    const finalAmount = Math.round(data.finalAmount || (totalBaseAmount + totalGst));

    const gstGroups = items.reduce((acc, item) => {
        const key = item.gstPercent;
        if (!acc[key]) {
            acc[key] = { hsn: item.hsn, taxable: 0, gstRate: key, amount: 0 };
        }
        acc[key].taxable += item.baseAmount;
        acc[key].amount += item.gstAmount;
        return acc;
    }, {} as Record<number, any>);

    const gstRows = Object.values(gstGroups);
    const paddedGstRows = [...gstRows];
    while (paddedGstRows.length < HSN_SLOTS) {
        paddedGstRows.push(null as any);
    }

    const pages = [];
    let currentIndex = 0;

    while (true) {
        const remainingCount = items.length - currentIndex;
        const isFinalPageFit = remainingCount <= SAFE_LIMIT;

        if (isFinalPageFit) {
            // Final page with footer
            const pageItems = items.slice(currentIndex);
            const paddedItems = [...pageItems];
            while (paddedItems.length < SAFE_LIMIT) paddedItems.push(null as any);

            pages.push({
                items: paddedItems,
                showFooter: true,
                startIndex: currentIndex
            });
            break;
        } else {
            // Intermediate page without footer
            const takeCount = Math.min(remainingCount, HARD_LIMIT);
            const pageItems = items.slice(currentIndex, currentIndex + takeCount);
            const paddedItems = [...pageItems];
            while (paddedItems.length < HARD_LIMIT) paddedItems.push(null as any);

            pages.push({
                items: paddedItems,
                showFooter: false,
                startIndex: currentIndex
            });
            currentIndex += takeCount;
        }
    }

    const totalPages = pages.length;

    return (
        <div className="wholesale-bill-wrapper">
            {pages.map((page, pageIdx) => (
                <div key={pageIdx} className="wholesale-page">
                    {/* TOP YELLOW BAND */}
                    <div className="header-yellow-band"></div>

                    {/* COMPANY BOX */}
                    <div className="company-details-box">
                        <div className="company-top-labels">
                            <span className="label-left">{isEstimate ? "ESTIMATION" : "TAX INVOICE"}</span>
                            <span className="label-center"></span>
                            <span className="label-right">ORIGINAL</span>
                        </div>
                        <div className="company-middle-row">
                            <div className="spacer"></div>
                            <div className="company-name-section">
                                <h1 className="shop-name">{APP_CONFIG.COMPANY_NAME}</h1>
                                <p className="shop-address">{APP_CONFIG.ADDRESS_LINE_1}</p>
                                <p className="shop-address">{APP_CONFIG.ADDRESS_LINE_2}</p>
                            </div>
                            <div className="company-info-right">
                                <p>GSTIN: {APP_CONFIG.GSTIN}</p>
                                <p>PH: {APP_CONFIG.CONTACT_NO}</p>
                            </div>
                        </div>
                        <div className="company-bottom-row">
                            STATE CODE: 33
                        </div>
                    </div>

                    {/* CUSTOMER SECTION */}
                    <table className="customer-invoice-table">
                        <tbody>
                            <tr>
                                <td className="billed-to-section">
                                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', marginBottom: '1.5mm', fontSize: '9.5pt' }}>BILLED TO / SHIPPED TO</div>
                                    <div style={{ fontWeight: '900', fontSize: '13pt', textTransform: 'uppercase' }}>{customerName}</div>
                                    <div style={{ fontSize: '10.2pt', whiteSpace: 'pre-wrap', marginTop: '1.5mm' }}>{customerAddress}</div>
                                    <div style={{ fontSize: '10.2pt', marginTop: '1.5mm' }}>PH: {customerPhone}</div>
                                    {customerGst && <div style={{ fontSize: '10.2pt', fontWeight: 'bold', marginTop: '1.5mm' }}>GSTIN: {customerGst}</div>}
                                </td>
                                <td className="invoice-info-section">
                                    <div className="invoice-info-split">
                                        <div className="info-box-top">
                                            <div style={{ fontSize: '10.5pt' }}>Invoice No: <b style={{ fontSize: '12pt' }}>{billNo}</b></div>
                                            <div style={{ fontSize: '10.5pt', marginTop: '2.5mm' }}>Date: <b style={{ fontSize: '12pt' }}>{formattedDate}</b></div>
                                        </div>
                                        <div className="info-box-bottom" style={{ fontSize: '10pt' }}>
                                            <div>Mode: {data.invoiceMode === "ESTIMATE" ? "Estimation" : "Tax Invoice"}</div>
                                            <div>Terminal: POS 1</div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* PRODUCT TABLE SECTION */}
                    <div className="product-section-wrapper">
                        <table className="product-table">
                            <thead>
                                <tr>
                                    <th className="sno-col">S.No</th>
                                    <th className="id-col">Item ID</th>
                                    <th className="desc-col">Particulars</th>
                                    <th className="qty-col">Qty</th>
                                    <th className="rate-col">Rate</th>
                                    <th className="disc-col">Disc</th>
                                    <th className="amt-col">Taxable</th>
                                </tr>
                            </thead>
                            <tbody>
                                {page.items.map((item, idx) => (
                                    <tr key={idx} className="product-row">
                                        <td className="text-center">{item ? (page.startIndex + idx + 1) : ""}</td>
                                        <td className="text-center">{item ? (item.productId || item.id || item.barcode) : ""}</td>
                                        <td className="text-left">
                                            {item ? (
                                                <>
                                                    <div>{item.productName || item.name}</div>
                                                    {item.type === 'SERVICE' && (
                                                        <div style={{ fontSize: '8pt', color: '#555', marginTop: '2px' }}>
                                                            Staff: {item.staffName || 'Any'}
                                                        </div>
                                                    )}
                                                </>
                                            ) : ""}
                                        </td>
                                        <td className="text-center">{item ? item.qty : ""}</td>
                                        <td className="text-right">{item ? item.rate.toFixed(2) : ""}</td>
                                        <td className="text-right">{item ? (item.discount || 0).toFixed(2) : ""}</td>
                                        <td className="text-right">{item ? item.baseAmount.toFixed(2) : ""}</td>
                                    </tr>
                                ))}
                                {page.showFooter && (
                                    <tr className="total-row">
                                        <td colSpan={3} className="text-right" style={{ paddingRight: '5mm' }}>TOTAL</td>
                                        <td className="text-center">{totalQty}</td>
                                        <td></td>
                                        <td className="text-right">{items.reduce((sum, i) => sum + (i.discount || 0), 0).toFixed(2)}</td>
                                        <td className="text-right">{totalBaseAmount.toFixed(2)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* TAX & FOOTER SECTION - ONLY ON LAST PAGE */}
                    {page.showFooter && (
                        <div className="footer-reserved-area">
                            <div className="hsn-summary-box">
                                <div className="hsn-left">
                                    <table className="hsn-table">
                                        <thead>
                                            <tr>
                                                <th>Taxable Value</th>
                                                <th>CGST %</th>
                                                <th>CGST Amt</th>
                                                <th>SGST %</th>
                                                <th>SGST Amt</th>
                                                <th>IGST %</th>
                                                <th>IGST Amt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paddedGstRows.map((row, i) => (
                                                <tr key={i}>
                                                    <td>{row ? row.taxable.toFixed(2) : ""}</td>
                                                    {taxType === "INTRA_STATE" ? (
                                                        <>
                                                            <td>{row ? (row.gstRate / 2).toFixed(1) : ""}</td>
                                                            <td>{row ? (row.amount / 2).toFixed(2) : ""}</td>
                                                            <td>{row ? (row.gstRate / 2).toFixed(1) : ""}</td>
                                                            <td>{row ? (row.amount / 2).toFixed(2) : ""}</td>
                                                            <td>{row ? "0" : ""}</td>
                                                            <td>{row ? "0.00" : ""}</td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td>{row ? "0" : ""}</td>
                                                            <td>{row ? "0.00" : ""}</td>
                                                            <td>{row ? "0" : ""}</td>
                                                            <td>{row ? "0.00" : ""}</td>
                                                            <td>{row ? row.gstRate.toFixed(1) : ""}</td>
                                                            <td>{row ? row.amount.toFixed(2) : ""}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                            <tr className="hsn-total-row">
                                                <td>{totalBaseAmount.toFixed(2)}</td>
                                                {taxType === "INTRA_STATE" ? (
                                                    <>
                                                        <td></td>
                                                        <td>{(totalGst / 2).toFixed(2)}</td>
                                                        <td></td>
                                                        <td>{(totalGst / 2).toFixed(2)}</td>
                                                        <td></td>
                                                        <td>0.00</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td></td>
                                                        <td>0.00</td>
                                                        <td></td>
                                                        <td>0.00</td>
                                                        <td></td>
                                                        <td>{totalGst.toFixed(2)}</td>
                                                    </>
                                                )}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="tax-summary-right">
                                    <table className="summary-table">
                                        <tbody>
                                            <tr>
                                                <td>Taxable Value:</td>
                                                <td className="text-right">₹{totalBaseAmount.toFixed(2)}</td>
                                            </tr>
                                            {taxType === "INTER_STATE" ? (
                                                <tr>
                                                    <td>IGST:</td>
                                                    <td className="text-right">₹{totalGst.toFixed(2)}</td>
                                                </tr>
                                            ) : (
                                                <>
                                                    <tr>
                                                        <td>CGST:</td>
                                                        <td className="text-right">₹{(totalGst / 2).toFixed(2)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td>SGST:</td>
                                                        <td className="text-right">₹{(totalGst / 2).toFixed(2)}</td>
                                                    </tr>
                                                </>
                                            )}
                                            <tr>
                                                <td>Parcel:</td>
                                                <td className="text-right">₹0.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="amount-words-row">
                                <div className="amount-in-words"><b>Rupees in Words:</b> {numberToWords(finalAmount)}</div>
                                <div className="net-amount-label">NET AMOUNT: ₹{finalAmount.toFixed(2)}</div>
                            </div>

                            <div className="signature-section">
                                <div className="bank-info">
                                    <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '2.5mm' }}>Bank Details:</div>
                                    <div>Bank: <b>{APP_CONFIG.BANK_NAME}</b></div>
                                    <div>A/C No: <b>{APP_CONFIG.ACCOUNT_NO}</b></div>
                                    <div>IFSC: <b>{APP_CONFIG.IFSC_CODE}</b></div>
                                </div>
                                <div className="sign-box">
                                    <div className="sign-top">For {APP_CONFIG.COMPANY_NAME}</div>
                                    <div className="sign-bottom">
                                        <div className="eo-text">E & O.E</div>
                                        <div className="auth-text">Authorised Signatory</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FOOTER YELLOW BAND */}
                    <div className="footer-yellow-band">
                        <div className="jurisdiction-text">Subject to Kanchipuram Jurisdiction</div>
                        <div className="page-indicator">Page {pageIdx + 1} of {totalPages}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
