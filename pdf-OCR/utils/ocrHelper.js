const Tesseract = require('tesseract.js');
const pdf2img = require('pdf-img-convert');
const path = require('path');
const fs = require('fs');

async function extractTextFromPDF(filePath) {
    try {
        const outputImages = await pdf2img.convert(filePath);

        let combinedText = '';
        const pageCount = outputImages.length;
        console.log(`Converted PDF into ${pageCount} image(s). Beginning OCR...`);

        for (let i = 0; i < outputImages.length; i++) {
            const imgBuffer = Buffer.from(outputImages[i]);

            const { data: { text } } = await Tesseract.recognize(
                imgBuffer,
                'eng'
            );

            combinedText += `\n--- Page ${i + 1} ---\n${text}\n`;
        }

        // Cache the extracted text for parsing to avoid re-running OCR
        const textCachePath = `${filePath}.txt`;
        fs.writeFileSync(textCachePath, combinedText, 'utf8');

        return { text: combinedText, pageCount };
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Failed to extract text using OCR: ' + error.message);
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
