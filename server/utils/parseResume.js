const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { PDFParse } = require('pdf-parse');
const PDFParser = require('pdf2json');

async function parseWithPdfParse(filePath) {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return (result.text || '').trim();
}

function parseWithPdf2json(filePath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on('pdfParser_dataError', (err) => {
      reject(new Error(err.parserError || 'PDF parse error'));
    });

    pdfParser.on('pdfParser_dataReady', () => {
      resolve((pdfParser.getRawTextContent() || '').trim());
    });

    pdfParser.loadPDF(filePath);
  });
}

async function parsePDF(filePath) {
  const errors = [];

  try {
    const text = await parseWithPdfParse(filePath);
    if (text) return text;
    errors.push('pdf-parse returned empty text');
  } catch (err) {
    errors.push(`pdf-parse: ${err.message}`);
  }

  try {
    const text = await parseWithPdf2json(filePath);
    if (text) return text;
    errors.push('pdf2json returned empty text');
  } catch (err) {
    errors.push(`pdf2json: ${err.message}`);
  }

  throw new Error(`Could not extract PDF text (${errors.join('; ')})`);
}

const parseResume = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  let text = '';

  if (ext === '.pdf') {
    text = await parsePDF(filePath);
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  } else {
    throw new Error('Unsupported file type. Only PDF and DOCX allowed.');
  }

  text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return text;
};

module.exports = parseResume;
