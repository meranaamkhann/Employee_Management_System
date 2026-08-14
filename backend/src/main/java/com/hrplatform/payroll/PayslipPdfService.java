=package com.hrplatform.payroll;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;

@Service
public class PayslipPdfService {

    public byte[] render(Payslip p) {
        try {
            Document document = new Document(PageSize.A4, 40, 40, 50, 50);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD);
            Font labelFont = new Font(Font.HELVETICA, 10, Font.NORMAL, java.awt.Color.GRAY);
            Font valueFont = new Font(Font.HELVETICA, 11, Font.NORMAL);
            Font boldFont = new Font(Font.HELVETICA, 11, Font.BOLD);

            document.add(new Paragraph("Rosterly", titleFont));
            document.add(new Paragraph("Payslip — " + p.getPayMonth(), labelFont));
            document.add(Chunk.NEWLINE);

            document.add(new Paragraph(p.getEmployee().getFullName() + " (" + p.getEmployee().getEmployeeCode() + ")", boldFont));
            document.add(new Paragraph(p.getEmployee().getDesignation() != null ? p.getEmployee().getDesignation() : "", valueFont));
            document.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            addRow(table, "Basic Salary", p.getBasicSalary());
            addRow(table, "HRA", p.getHra());
            addRow(table, "Conveyance Allowance", p.getConveyanceAllowance());
            addRow(table, "Special Allowance", p.getSpecialAllowance());
            addRow(table, "Bonus", p.getBonus());
            addSeparator(table);
            addRow(table, "Gross Earnings", p.getGrossEarnings().add(p.getBonus()));
            addSeparator(table);
            addRow(table, "Provident Fund", p.getProvidentFund().negate());
            addRow(table, "Professional Tax", p.getProfessionalTax().negate());
            addRow(table, "Unpaid Leave Deduction", p.getUnpaidLeaveDeduction().negate());
            addSeparator(table);

            PdfPCell netLabel = new PdfPCell(new Phrase("Net Salary", boldFont));
            netLabel.setBorder(Rectangle.NO_BORDER);
            PdfPCell netValue = new PdfPCell(new Phrase("Rs. " + p.getNetSalary(), boldFont));
            netValue.setBorder(Rectangle.NO_BORDER);
            netValue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(netLabel);
            table.addCell(netValue);

            document.add(table);
            document.add(Chunk.NEWLINE);
            document.add(new Paragraph("Status: " + p.getStatus(), labelFont));

            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new RuntimeException("Failed to generate payslip PDF", e);
        }
    }

    private void addRow(PdfPTable table, String label, BigDecimal amount) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label));
        labelCell.setBorder(Rectangle.NO_BORDER);
        PdfPCell valueCell = new PdfPCell(new Phrase("Rs. " + amount));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addSeparator(PdfPTable table) {
        PdfPCell cell = new PdfPCell(new Phrase(" "));
        cell.setColspan(2);
        cell.setBorder(Rectangle.TOP);
        table.addCell(cell);
    }
}