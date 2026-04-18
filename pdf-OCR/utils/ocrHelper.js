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
                    text += '   ';
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
        const data = await pdfParse(dataBuffer, { pagerender: render_page });

        const combinedText = data.text;
        const pageCount = data.numpages;

        const textCachePath = `${filePath}.txt`;
        fs.writeFileSync(textCachePath, combinedText, 'utf8');

        return { text: combinedText, pageCount };
    } catch (error) {
        console.error('PDF Extraction Error:', error);
        throw new Error('Failed to extract text from PDF: ' + error.message);
    }
}

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
