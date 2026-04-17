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

// Function to extract text from PDF and return as structured JSON
async function extractTextFromPDFAsJSON(filePath, fileId) {
    try {
        const outputImages = await pdf2img.convert(filePath);
        
        const pages = [];
        const pageCount = outputImages.length;
        console.log(`Converted PDF into ${pageCount} image(s). Beginning OCR to JSON...`);
        
        for (let i = 0; i < outputImages.length; i++) {
            const imgBuffer = Buffer.from(outputImages[i]);
            
            const result = await Tesseract.recognize(imgBuffer, 'eng');
            const { text, confidence } = result.data;
            
            pages.push({
                pageNumber: i + 1,
                text: text,
                confidence: confidence || null
            });
        }
        
        const ocrOutput = {
            fileId: fileId || 'unknown',
            timestamp: new Date().toISOString(),
            totalPages: pageCount,
            pages: pages
        };
        
        // Save OCR JSON for validation
        const jsonCachePath = `${filePath}.ocr.json`;
        fs.writeFileSync(jsonCachePath, JSON.stringify(ocrOutput, null, 2), 'utf8');
        
        console.log(`OCR JSON saved to ${jsonCachePath}`);
        
        return ocrOutput;
    } catch (error) {
        console.error('OCR to JSON Error:', error);
        throw new Error('Failed to extract text as JSON using OCR: ' + error.message);
    }
}

module.exports = {
    extractTextFromPDF,
    getCachedText,
    extractTextFromPDFAsJSON
};
