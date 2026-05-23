const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const PDFParser = require('pdf2json');

const dir = path.join(__dirname, '..', 'uploads');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.pdf')).slice(0, 5);

async function tryPdfParse(filePath) {
  const buf = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buf });
  const result = await parser.getText();
  return (result.text || '').length;
}

function tryPdf2json(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);
    pdfParser.on('pdfParser_dataError', (e) => reject(new Error(e.parserError)));
    pdfParser.on('pdfParser_dataReady', () => resolve((pdfParser.getRawTextContent() || '').length));
    pdfParser.loadPDF(filePath);
  });
}

(async () => {
  for (const f of files) {
    const fp = path.join(dir, f);
    process.stdout.write(`${f}: `);
    try {
      const n = await tryPdfParse(fp);
      console.log(`pdf-parse OK (${n} chars)`);
    } catch (e1) {
      try {
        const n = await tryPdf2json(fp);
        console.log(`pdf2json OK (${n} chars)`);
      } catch (e2) {
        console.log(`FAIL pdf-parse=${e1.message} pdf2json=${e2.message}`);
      }
    }
  }
})();
