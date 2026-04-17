require('dotenv').config();
const path = require('path');
const fs = require('fs');
const ocrHelper = require('./utils/ocrHelper');
const parser = require('./utils/parser');

async function testPipeline() {
    try {
        const pdfPath = path.resolve(__dirname, '../sme financial health 2021.pdf');
        console.log('Testing PDF at:', pdfPath);

        if (!fs.existsSync(pdfPath)) {
            console.error('Test PDF not found!');
            return;
        }

        console.log('1. Running OCR Extraction...');

        // Use cached text if available to save time on multiple runs
        let extractedText = ocrHelper.getCachedText(pdfPath);
        if (!extractedText) {
            const result = await ocrHelper.extractTextFromPDF(pdfPath);
            extractedText = result.text;
        } else {
            console.log('Using cached OCR text.');
        }

        console.log(`\nOCR Extracted ${extractedText.length} characters.`);
        console.log('--- Sample snippet ---');
        console.log(extractedText.substring(0, 300) + '...');
        console.log('----------------------');

        console.log('\n2. Running LLM Parser...');
        const parsedJson = await parser.parseFinancialText(extractedText);

        console.log('\n3. Parsed Output:');
        console.log(JSON.stringify(parsedJson, null, 2));

        // Save output to test_output.json
        fs.writeFileSync(path.join(__dirname, 'test_output.json'), JSON.stringify(parsedJson, null, 2));
        console.log('\nSaved full JSON to pdf-OCR/test_output.json');

    } catch (e) {
        console.error('Pipeline Test Failed:', e);
    }
}

testPipeline();
