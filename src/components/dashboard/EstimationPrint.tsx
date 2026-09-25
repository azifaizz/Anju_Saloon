import React from 'react';

interface EstimationItem {
  name: string;
  qty: number | string;
  unit?: string;
  rate: number;
  discount?: number | string;
  total: number;
}

interface EstimationPrintProps {
  company: {
    name: string;
    address: string;
    phone?: string;
    gstin: string;
    email: string;
    state?: string;
  };
  estimation: {
    id: string;
    date: string;
  };
  customer: {
    name: string;
    phone: string;
    address?: string; // Bill To
    shippingAddress?: string; // Ship To
  };
  items: EstimationItem[];
  totals: {
    totalQty: number;
    grandTotal: number;
    amountInWords: string;
  };
  printedAt: string;
}

export const EstimationPrint = React.forwardRef<HTMLDivElement, EstimationPrintProps>(({
  company,
  estimation,
  customer,
  items,
  totals,
  printedAt
}, ref) => {
  const MIN_ROWS = 25;
  const itemsCount = items.length;
  const emptyRowsCount = Math.max(0, MIN_ROWS - itemsCount);
  const emptyRows = Array.from({ length: emptyRowsCount });

  const styles = `
    @media print {
      @page {
        size: A5 portrait;
        margin: 8mm;
      }
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact;
        height: 100%;
      }
      .a5-container {
        height: 100%;
      }
    }
    body {
      font-family: "Times New Roman", serif;
      font-size: 9.5px;
      line-height: 1.1;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .a5-container {
      width: 132mm;
      margin: 0 auto;
      background: white;
      position: relative;
    }
    .header-outside {
      position: relative;
      margin-bottom: 2px;
      height: 15px; 
    }
    .memo-title {
      float: left;
      width: 100%;
      text-align: center;
      font-weight: bold;
      font-size: 11px;
      margin-top: 5px;
    }
    .printed-on {
      position: absolute;
      right: 0;
      top: 0;
      font-size: 9px;
      line-height: 15px;
      text-align: right;
    }
    .master-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000;
      table-layout: fixed;
    }
    .master-table th, .master-table td {
      border: 1px solid #000;
      padding: 1px 2px;
      vertical-align: top;
      word-wrap: break-word;
      font-size: 9px;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
    }
    .layout-table {
      width: 100%;
      border-collapse: collapse;
      margin: 0;
      padding: 0;
      border: none;
      table-layout: fixed;
    }
    .layout-table td {
      border: none;
      padding: 4px;
      vertical-align: top;
      width: 50%;
      box-sizing: border-box;
    }
    .company-name {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11px;
      margin-bottom: 1px;
    }
    .customer-stack {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .cust-divider {
      border-top: 1px solid #000;
      margin: 2px 0;
    }
    .buyer-section {
      padding-bottom: 6px; 
    }
    .invoice-row td {
      text-align: left;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 2px 4px;
      font-weight: bold;
    }
    .product-header th {
      font-weight: bold;
      text-align: center;
      font-size: 9.5px;
      background: #fff;
      height: 15px;
    }
    .product-row td {
      height: 14px;
    }
    .total-row td {
      font-weight: bold;
      border-top: 1px solid #000;
      padding: 3px 2px;
    }
    .footer-wrapper-td {
      padding: 0 !important;
      border-top: 1px solid #000;
    }
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      border: none;
    }
    .footer-table td {
      padding: 0;
      vertical-align: top;
    }
    .footer-left {
      width: 50%;
      border-right: none !important;
      padding: 2px 4px !important;
    }
    .footer-right {
      width: 50%;
      padding: 0 !important;
      border-left: 1px solid #000;
    }
    .bank-details-wrapper {
      padding: 2px 4px;
      min-height: 70px;
    }
    .signature-section {
      border-top: 1px solid #000; 
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 4px;
      min-height: 80px;
      width: 100%;
      box-sizing: border-box;
    }
    .bank-mini-table {
      width: 100%;
      border-collapse: collapse;
    }
    .bank-mini-table td {
      padding: 0;
      border: none;
      font-size: 9px;
    }
    .declaration-container {
      margin-top: 5px; 
      padding-top: 5px;
    }
    .thanks-text {
      text-align: center;
      text-transform: uppercase;
      font-size: 10px;
      font-weight: bold;
      margin-top: 5px;
    }
    .master-table tbody tr.product-row td {
        border-top: none !important;
        border-bottom: none !important;
        border-left: 1px solid #000 !important;
        border-right: 1px solid #000 !important;
    }
    .product-header th {
        border-bottom: 2px solid #000 !important;
    }
    .total-row td {
        border-top: 1px solid #000 !important;
    }
  `;

  return (
    <div className="a5-container" ref={ref}>
      <style>{styles}</style>

      <div className="header-outside">
        <div className="memo-title">ESTIMATION MEMO</div>
        <div className="printed-on">Printed on : {printedAt}</div>
      </div>

      <table className="master-table">
        <colgroup>
          <col style={{ width: '8mm' }} />
          <col style={{ width: '52mm' }} />
          <col style={{ width: '18mm' }} />
          <col style={{ width: '18mm' }} />
          <col style={{ width: '10mm' }} />
          <col style={{ width: '12mm' }} />
          <col style={{ width: '14mm' }} />
        </colgroup>

        <thead>
          <tr>
            <td colSpan={7} style={{ padding: 0, border: '1px solid #000' }}>
              <table className="layout-table">
                <tbody>
                  <tr className="header-split-row">
                    <td style={{ borderRight: '1px solid #000' }}>
                      <div className="company-name">{company.name}</div>
                      <div>{company.address}</div>
                      {company.phone && <div>Phone: {company.phone}</div>}
                      {company.gstin && <div>GSTIN/UIN: {company.gstin}</div>}
                      {company.state && <div>State: {company.state}</div>}
                      <div>Email: {company.email}</div>
                    </td>

                    <td>
                      <div className="customer-stack">
                        <div className="cust-section">
                          <span style={{ fontWeight: 'bold' }}>Consignee (Ship to)</span><br />
                          <span style={{ fontWeight: 'bold' }}>{customer.name}</span><br />
                          {customer.address && <div>{customer.address}</div>}
                          Contact No: {customer.phone}
                        </div>
                        <div className="cust-divider"></div>
                        <div className="cust-section buyer-section">
                          <span style={{ fontWeight: 'bold' }}>Buyer (Bill to)</span><br />
                          <span style={{ fontWeight: 'bold' }}>{customer.name}</span><br />
                          {customer.address && <div>{customer.address}</div>}
                          Contact No: {customer.phone}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <tr className="invoice-row">
            <td colSpan={7}>
              <span style={{ display: 'inline-block', width: '40%' }}>Est No : {estimation.id}</span>
              <span style={{ display: 'inline-block', width: '30%' }}>Date : {estimation.date}</span>
              <span style={{ display: 'inline-block', width: '30%' }}> </span>
            </td>
          </tr>

          <tr className="product-header">
            <th>Sl No</th>
            <th>Description of Goods</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th>per</th>
            <th>Disc %</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={`item-${index}`} className="product-row">
              <td style={{ textAlign: 'center' }}>{index + 1}</td>
              <td style={{ textAlign: 'left' }}>{item.name}</td>
              <td style={{ textAlign: 'center' }}>{item.qty} {item.unit || 'Nos'}</td>
              <td style={{ textAlign: 'right' }}>{(item.rate || 0).toFixed(2)}</td>
              <td style={{ textAlign: 'center' }}>{item.unit || 'Nos'}</td>
              <td style={{ textAlign: 'center' }}>{item.discount ? (Number(item.discount) || 0).toFixed(2) : ""}</td>
              <td style={{ textAlign: 'right' }}>{(item.total || 0).toFixed(2)}</td>
            </tr>
          ))}

          {emptyRows.map((_, index) => (
            <tr key={`empty-${index}`} className="product-row">
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}

          <tr className="total-row">
            <td></td>
            <td style={{ textAlign: 'right' }}>Total</td>
            <td style={{ textAlign: 'center' }}>{totals.totalQty} {items.length > 0 ? (items[0]?.unit || 'Nos') : 'Nos'}</td>
            <td></td>
            <td></td>
            <td></td>
            <td style={{ textAlign: 'right' }}>₹ {(totals.grandTotal || 0).toFixed(2)}</td>
          </tr>

          <tr>
            <td colSpan={7} className="footer-wrapper-td">
              <table className="footer-table">
                <tbody>
                  <tr>
                    <td className="footer-left">
                      <div style={{ minHeight: '60px' }}>
                        <div style={{ marginBottom: '2px' }}>Amount Chargeable (in words)</div>
                        <div style={{ fontWeight: 'bold', textTransform: 'capitalize', marginBottom: '10px' }}>
                          INR {totals.amountInWords}
                        </div>
                      </div>

                      <div className="declaration-container">
                        <span style={{ textDecoration: 'underline' }}>Declaration:</span><br />
                        <div style={{ textAlign: 'justify' }}>
                          We declare that this estimation shows the intended price of the goods described and that all particulars are true and correct.
                        </div>
                      </div>
                    </td>

                    <td className="footer-right">
                      <div className="bank-details-wrapper">
                        <div style={{ fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: '2px', display: 'inline-block' }}>
                          Company's Bank Details
                        </div>
                        <div>(Available on Final Bill)</div>
                      </div>

                      <div className="signature-section">
                        <div style={{ fontWeight: 'bold' }}>For {company.name}</div>
                        <div style={{ fontWeight: 'bold' }}>Authorized Signatory</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="thanks-text">THANKS FOR YOUR INTEREST</div>
    </div>
  );
});

export default EstimationPrint;
