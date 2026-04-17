const { SpatialGraph } = require('./index');

// Mock OCR Data (Simulating Tesseract output with bounding boxes)
// Imagine an invoice that looks like:
// ---------------------------------
// Invoice No:    INV-1002
// Date:          2026-04-18
// 
// Grand Total    $1,500.00
// 
// Amount Due:
//    $500.00
// ---------------------------------

const mockOCRWords = [
    { text: 'Invoice', bbox: { x0: 10, y0: 10, x1: 60, y1: 25 } },
    { text: 'No:',     bbox: { x0: 65, y0: 10, x1: 90, y1: 25 } },
    { text: 'INV-1002',bbox: { x0: 150,y0: 10, x1: 220,y1: 25 } },
    
    { text: 'Date:',   bbox: { x0: 10, y0: 35, x1: 50, y1: 50 } },
    { text: '2026-04-18', bbox: { x0: 150, y0: 35, x1: 230, y1: 50 } },

    { text: 'Grand',   bbox: { x0: 10, y0: 80, x1: 60, y1: 95 } },
    { text: 'Total',   bbox: { x0: 65, y0: 80, x1: 100, y1: 95 } },
    { text: '$1,500.00', bbox: { x0: 150, y0: 80, x1: 220, y1: 95 } },
    
    { text: 'Amount',  bbox: { x0: 10, y0: 110, x1: 60, y1: 125 } },
    { text: 'Due:',    bbox: { x0: 65, y0: 110, x1: 100, y1: 125 } },
    // Positioned below "Amount Due:" (horizontally centered around cx=55 -> "Amount" ends at 60)
    { text: '$500.00', bbox: { x0: 20, y0: 140, x1: 100, y1: 155 } } 
];

console.log("Building Spatial Graph...");
const graph = new SpatialGraph(mockOCRWords);

const schema = {
    "invoice_id": { search_text: "Invoice No", direction: "right" },
    "invoice_date": { search_text: "Date", direction: "right" },
    "total_amount": { search_text: "Grand Total", direction: "right" },
    "amount_due": { search_text: "Due:", direction: "bottom" }
};

console.log("Extracting Data...");
const extractedData = graph.extract(schema);

console.log("\nExtraction Results:");
console.log(JSON.stringify(extractedData, null, 2));
