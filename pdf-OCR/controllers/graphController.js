const path = require('path');
const fs = require('fs');

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTH_SET = new Set(MONTH_NAMES);

// ─── Format Detection ──────────────────────────────────────
function detectFormat(lines) {
  for (const line of lines) {
    if (line.toLowerCase().includes('sme financial health')) return 'sme';
    if (line.includes('Quarterly Results') || line.includes('Profit & Loss')) return 'corporate';
  }
  // Fallback heuristics
  for (const line of lines) {
    if (line.includes('Financing Profit') || line.includes('Financing Margin')) return 'corporate';
    if (line.includes('Gross Sales K') || line.includes('Business ID')) return 'sme';
  }
  return 'unknown';
}

// ─── Helper: parse comma-separated Indian numbers like "1,02,592" or "-262" ──
function parseIndianNumber(str) {
  if (!str || str === '') return 0;
  const clean = str.replace(/,/g, '').replace(/%/g, '').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

// ─── SME Format Parser (existing) ──────────────────────────
function parseSME(lines) {
  let year = 'Unknown';
  for (const line of lines) {
    const m = line.match(/sme financial health\s+(\d{4})/i);
    if (m) { year = m[1]; break; }
  }

  const salesRows = [], expenseRows = [], ratioRows = [];
  const companies = [], healthRows = [];
  let section = '';

  for (const line of lines) {
    if (line.startsWith('Page ') || line.toLowerCase().startsWith('sme financial health')) { section = ''; continue; }
    if (line.includes('Business ID') && (line.includes('Business Name') || line.includes('Business_Name'))) { section = 'companies'; continue; }
    if (line.includes('Gross Sales K') && line.includes('Purchase K')) { section = 'sales'; continue; }
    if (line.includes('Shop Rent K') && line.includes('Misc Expenses K')) { section = 'expenses'; continue; }
    if (line.includes('NP Pct') && (line.includes('Opening Stock') || line.includes('Closing Stock'))) { section = 'ratios'; continue; }
    if (line.includes('Financial Health Score')) { section = 'health'; continue; }
    if (line.includes('Sundry Debtors K') || line.includes('Current Assets K') ||
      line.includes('Total Asset') || line.includes('CC Limit') ||
      line.includes('Owner Capital K')) { section = ''; continue; }

    const parts = line.split(/\s{2,}/);

    if (section === 'companies' && parts.length >= 3) {
      companies.push({ businessId: parts[0], name: parts[1], state: parts[2], sector: parts[3] || 'Unknown' });
    } else if (section === 'sales' && parts.length >= 2 && MONTH_SET.has(parts[0])) {
      const nums = parts.slice(1).map(Number);
      salesRows.push({ month: parts[0], grossSales: nums[0] || 0, purchase: nums[1] || 0, grossProfit: nums[2] || 0, gpPct: nums[3] || 0, staffSalary: nums[4] || 0 });
    } else if (section === 'expenses') {
      const nums = line.split(/\s+/).map(Number).filter(n => !isNaN(n));
      if (nums.length >= 5) expenseRows.push({ shopRent: nums[0] || 0, loadingUnloading: nums[1] || 0, miscExpenses: nums[2] || 0, depreciation: nums[3] || 0, interest: nums[4] || 0, netProfit: nums[5] || 0 });
    } else if (section === 'ratios') {
      const nums = line.split(/\s+/).map(Number).filter(n => !isNaN(n));
      if (nums.length >= 1) ratioRows.push({ npPct: nums[0] });
    } else if (section === 'health') {
      const lastPart = parts[parts.length - 1];
      const scoreMatch = lastPart.match(/^(\d+)(Good|Medium|Poor|Bad)$/i);
      if (scoreMatch) healthRows.push({ score: parseInt(scoreMatch[1], 10), riskLabel: scoreMatch[2] });
    }
  }

  const count = Math.min(salesRows.length, expenseRows.length, ratioRows.length);
  const monthlyData = [];
  for (let i = 0; i < count; i++) {
    monthlyData.push({
      month: salesRows[i].month,
      grossSales: salesRows[i].grossSales,
      purchase: salesRows[i].purchase,
      grossProfit: salesRows[i].grossProfit,
      gpPct: salesRows[i].gpPct,
      netProfit: expenseRows[i].netProfit,
      npPct: ratioRows[i].npPct
    });
  }

  return { year, companies, monthlyData, healthRows, format: 'sme' };
}

// ─── Corporate Format Parser (Quarterly / P&L) ────────────
function parseCorporate(lines) {
  // The format has row-oriented data: each line starts with a metric name,
  // followed by tab/multi-space separated values for each period column.
  // We parse ection headers to find "Quarterly Results" and "Profit & Loss" sections.

  const sections = {};
  let currentSection = '';
  let periodHeaders = [];

  for (const line of lines) {
    // Section headers
    if (line === 'Quarterly Results') { currentSection = 'quarterly'; continue; }
    if (line === 'Profit & Loss') { currentSection = 'annual'; continue; }
    if (line === 'Balance Sheet') { currentSection = 'balance'; continue; }
    if (line === 'Cash Flows') { currentSection = 'cashflow'; continue; }
    if (line === 'Ratios') { currentSection = 'ratios'; continue; }
    if (line.startsWith('Consolidated Figures') || line.startsWith('Standalone Figures')) continue;
    if (line.startsWith('Upcoming result') || line.startsWith('Compounded')) { currentSection = ''; continue; }

    if (!currentSection) continue;

    // Period header row detection (starts with "Dec 2022" or "Mar 2015" pattern)
    if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/.test(line)) {
      periodHeaders = line.split(/\s{2,}/).map(p => p.trim()).filter(p => p);
      if (!sections[currentSection]) sections[currentSection] = { periods: periodHeaders, metrics: {} };
      else sections[currentSection].periods = periodHeaders;
      continue;
    }

    // Metric row: "Revenue +   10,787   11,364   ..."
    const parts = line.split(/\s{2,}/);
    if (parts.length >= 2 && sections[currentSection]) {
      const metricName = parts[0].replace(/\s*\+$/, '').trim();
      const values = parts.slice(1).map(parseIndianNumber);
      sections[currentSection].metrics[metricName] = values;
    }
  }

  // Build monthly/quarterly data from the best available section
  // Prefer quarterly for granularity, fall back to annual
  const src = sections['quarterly'] || sections['annual'];
  if (!src || !src.periods.length) {
    return { year: 'Unknown', companies: [], monthlyData: [], healthRows: [], format: 'corporate' };
  }

  const periods = src.periods;
  const revenue = src.metrics['Revenue'] || [];
  const interest = src.metrics['Interest'] || [];
  const expenses = src.metrics['Expenses'] || [];
  const financingProfit = src.metrics['Financing Profit'] || [];
  const financingMargin = src.metrics['Financing Margin %'] || [];
  const netProfit = src.metrics['Net Profit'] || [];
  const profitBeforeTax = src.metrics['Profit before tax'] || [];
  const depreciation = src.metrics['Depreciation'] || [];

  // Detect year from periods
  const lastPeriod = periods[periods.length - 1] || '';
  const yearMatch = lastPeriod.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : 'Unknown';

  const monthlyData = [];
  for (let i = 0; i < periods.length; i++) {
    // Skip "TTM" column (trailing twelve months — derived, not a real period)
    if (periods[i] === 'TTM') continue;

    const rev = revenue[i] || 0;
    const np = netProfit[i] || 0;

    // Map to our standard schema:
    // grossSales = Revenue
    // purchase = Interest + Expenses (total costs before financing profit)
    // grossProfit = Financing Profit (Revenue - Interest - Expenses)
    // gpPct = Financing Margin %
    // netProfit = Net Profit
    // npPct = Net Profit / Revenue * 100 (computed)
    monthlyData.push({
      month: periods[i],
      grossSales: rev,
      purchase: (interest[i] || 0) + (expenses[i] || 0),
      grossProfit: financingProfit[i] || (rev - (interest[i] || 0) - (expenses[i] || 0)),
      gpPct: financingMargin[i] || (rev > 0 ? Math.round(((rev - (interest[i] || 0) - (expenses[i] || 0)) / rev) * 100) : 0),
      netProfit: np,
      npPct: rev > 0 ? Math.round((np / rev) * 10000) / 100 : 0
    });
  }

  // Build companies list from the data for compatibility
  const companies = [{
    businessId: 'CORP-001',
    name: 'Company',
    state: 'India',
    sector: 'Financial Services'
  }];

  // Extract health-like scores from ratios if available
  const healthRows = [];
  if (sections['ratios'] && sections['ratios'].metrics['ROE %']) {
    const roeValues = sections['ratios'].metrics['ROE %'];
    roeValues.forEach(roe => {
      const score = Math.min(100, Math.round(roe * 5)); // Scale ROE to 0-100
      healthRows.push({
        score,
        riskLabel: score >= 80 ? 'Good' : score >= 60 ? 'Medium' : 'Poor'
      });
    });
  }

  return { year, companies, monthlyData, healthRows, format: 'corporate' };
}

// ─── Main Dispatcher ─────────────────────────────────────
function parseTextFile(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const format = detectFormat(lines);

  switch (format) {
    case 'sme': return parseSME(lines);
    case 'corporate': return parseCorporate(lines);
    default:
      // Try corporate first (more common going forward), then SME
      const corpResult = parseCorporate(lines);
      if (corpResult.monthlyData.length > 0) return corpResult;
      return parseSME(lines);
  }
}

// ─── Route Handler ─────────────────────────────────────────
const getGraphData = async (req, res) => {
  try {
    const { fileId } = req.params;
    const uploadDir = path.join(__dirname, '../uploads');

    // Try cached graph file first
    const graphsCachePath = path.join(uploadDir, `${fileId}.pdf_graphs.json`);
    if (fs.existsSync(graphsCachePath)) {
      return res.status(200).json({
        success: true, fileId,
        data: JSON.parse(fs.readFileSync(graphsCachePath, 'utf8'))
      });
    }

    // Try to find the text file
    const txtPath = path.join(uploadDir, `${fileId}.pdf.txt`);
    const altTxtPath = path.join(uploadDir, `${fileId}.txt`);
    let text = null;

    if (fs.existsSync(txtPath)) text = fs.readFileSync(txtPath, 'utf8');
    else if (fs.existsSync(altTxtPath)) text = fs.readFileSync(altTxtPath, 'utf8');

    // Fall back to shared graph.json
    if (!text) {
      const sharedGraphPath = path.join(uploadDir, 'graph.json');
      if (fs.existsSync(sharedGraphPath)) {
        return res.status(200).json({
          success: true, fileId,
          data: JSON.parse(fs.readFileSync(sharedGraphPath, 'utf8'))
        });
      }
      return res.status(404).json({ success: false, message: 'No data found for this file' });
    }

    // Parse directly — no AI
    const parsed = parseTextFile(text);

    // Determine resolution label based on format
    const resolution = parsed.format === 'corporate' ? 'quarter' : 'month';

    const graphData = {
      availableYears: [parsed.year],
      graphs: [{
        year: parsed.year,
        chartType: "line",
        title: `Financial Performance - FY ${parsed.year}`,
        resolution,
        data: parsed.monthlyData
      }]
    };

    // Cache it
    fs.writeFileSync(graphsCachePath, JSON.stringify(graphData, null, 2), 'utf8');

    return res.status(200).json({ success: true, fileId, data: graphData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getGraphData, parseTextFile, detectFormat, parseIndianNumber };
