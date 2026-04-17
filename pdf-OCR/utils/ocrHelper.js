const fs = require('fs');
const pdfParse = require('pdf-parse');

function render_page(pageData) {
    return pageData.getTextContent().then(function (textContent) {
        let items = textContent.items.map(item => ({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            width: item.width
        }));

        // Sort items by Y (top to bottom) first, then by X (left to right)
        items.sort((a, b) => {
            if (Math.abs(a.y - b.y) > 2) return b.y - a.y;
            return a.x - b.x;
        });

        let text = '';
        let lastY = null;
        let lastX = 0;

        for (let item of items) {
            if (lastY === null || Math.abs(item.y - lastY) > 2) {
                text += '\n' + item.str;
            } else {
                let gap = item.x - lastX;
                if (gap > 5) {
                    text += '   '; // add space for table column separation
                }
                text += item.str;
            }
            lastY = item.y;
            lastX = item.x + item.width;
        }
        return text + '\n';
    });
}

async function extractTextFromPDF(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);

        console.log('Extracting text directly using pdf-parse...');
        // pdf-parse natively using custom pagerender to preserve spatial tabular layouts
        const data = await pdfParse(dataBuffer, { pagerender: render_page });

        const combinedText = data.text;
        const pageCount = data.numpages;

        // Cache the extracted text for parsing to avoid re-running
        const textCachePath = `${filePath}.txt`;
        fs.writeFileSync(textCachePath, combinedText, 'utf8');

        return { text: combinedText, pageCount };
    } catch (error) {
        console.error('PDF Extraction Error:', error);
        throw new Error('Failed to extract text from PDF: ' + error.message);
    }
}

// Function to get cached text if needed
function getCachedText(filePath) {
    const textCachePath = `${filePath}.txt`;
    if (fs.existsSync(textCachePath)) {
        return fs.readFileSync(textCachePath, 'utf8');
    }
    return null;
}

module.exports = {
    extractTextFromPDF,
    getCachedText
};
