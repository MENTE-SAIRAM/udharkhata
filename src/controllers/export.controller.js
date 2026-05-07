import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { generatePDF, generateCSV } from '../services/export.service.js';

const exportPDF = asyncHandler(async (req, res) => {
  const { contactId, from, to } = req.query;

  const pdfBuffer = await generatePDF(
    req.user._id,
    contactId || null,
    from || null,
    to || null
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=udhar-khata-ledger-${Date.now()}.pdf`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.send(pdfBuffer);
});

const exportCSV = asyncHandler(async (req, res) => {
  const { contactId, from, to } = req.query;

  const csvData = await generateCSV(
    req.user._id,
    contactId || null,
    from || null,
    to || null
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=udhar-khata-ledger-${Date.now()}.csv`);
  res.send(csvData);
});

export { exportPDF, exportCSV };
