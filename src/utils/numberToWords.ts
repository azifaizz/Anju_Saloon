export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  const numStr = (num || 0).toFixed(2);
  const [rupees, paise] = numStr.split(".").map(Number);

  let words = "";
  if (rupees) {
    // Basic implementation for larger numbers (thousands/lacs)
    let r = rupees;
    let thousand = Math.floor(r / 1000) % 100;
    let lakh = Math.floor(r / 100000) % 100;
    let crore = Math.floor(r / 10000000);
    let remaining = r % 1000;

    if (crore > 0) words += inWords(crore) + " Crore ";
    if (lakh > 0) words += inWords(lakh) + " Lakh ";
    if (thousand > 0) words += inWords(thousand) + " Thousand ";
    if (remaining > 0) words += inWords(remaining);
    
    words = words.trim() + " Rupees";
  }

  if (paise) {
    words += (rupees ? " and " : "") + `${inWords(paise)} Paise`;
  }

  return words ? words + " Only" : "Zero Only";
};
