const fs = require('fs');
const path = require('path');

// Check if puppeteer is available, if not, provide instructions
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.log('Puppeteer not found. Installing...');
  console.log('Please run: npm install puppeteer');
  console.log('\nAlternatively, you can:');
  console.log('1. Open PROJECT_REPORT.html in your browser');
  console.log('2. Press Ctrl+P (or Cmd+P on Mac)');
  console.log('3. Select "Save as PDF"');
  console.log('4. Save the file');
  process.exit(1);
}

async function generatePDF() {
  const htmlPath = path.join(__dirname, 'PROJECT_REPORT.html');
  const pdfPath = path.join(__dirname, 'PROJECT_REPORT.pdf');
  
  if (!fs.existsSync(htmlPath)) {
    console.error('PROJECT_REPORT.html not found!');
    process.exit(1);
  }

  console.log('Starting PDF generation...');
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Read HTML file
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Set content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });
    
    await browser.close();
    
    console.log(`✅ PDF generated successfully: ${pdfPath}`);
    console.log(`📄 File size: ${(fs.statSync(pdfPath).size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    console.log('\nAlternative method:');
    console.log('1. Open PROJECT_REPORT.html in your browser');
    console.log('2. Press Ctrl+P (or Cmd+P on Mac)');
    console.log('3. Select "Save as PDF"');
    process.exit(1);
  }
}

generatePDF();



