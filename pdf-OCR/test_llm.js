const parser = require('./utils/parser');
const ocrHelper = require('./utils/ocrHelper');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './.env' });

async function run() {
    console.log("Starting test...");
    const filePath = path.join(__dirname, 'uploads/1776460122479_854ec9c9.pdf.txt');
    const text = fs.readFileSync(filePath, 'utf8');
    try {
        console.log("Calling parser...");
        const result = await parser.parseFinancialText(text);
        console.log("Parsed result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
