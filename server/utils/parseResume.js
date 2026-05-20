// server/utils/parseResume.js

const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const PDFParser = require("pdf2json");

const parsePDF = (filePath) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(null, 1);

    pdfParser.on("pdfParser_dataError", (err) => {
      reject(new Error(err.parserError));
    });

    pdfParser.on("pdfParser_dataReady", () => {
      const text = pdfParser.getRawTextContent();
      resolve(text);
    });

    pdfParser.loadPDF(filePath);
  });
};

const parseResume = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  let text = "";

  if (ext === ".pdf") {
    text = await parsePDF(filePath);
  } else if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  } else {
    throw new Error("Unsupported file type. Only PDF and DOCX allowed.");
  }

  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return text;
};

module.exports = parseResume;