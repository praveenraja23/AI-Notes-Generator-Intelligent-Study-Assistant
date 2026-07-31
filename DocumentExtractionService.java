package com.notesgen.app.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

/**
 * Extracts raw text from PDF, DOCX, and PPTX uploads.
 * This is the first stage of the ingestion pipeline: file bytes in, plain text out.
 */
@Service
public class DocumentExtractionService {

    public String extractText(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);

        if (filename.endsWith(".pdf")) {
            return extractPdf(file.getInputStream());
        } else if (filename.endsWith(".docx")) {
            return extractDocx(file.getInputStream());
        } else if (filename.endsWith(".pptx")) {
            return extractPptx(file.getInputStream());
        } else {
            throw new IllegalArgumentException(
                    "Unsupported file type. Only .pdf, .docx, and .pptx are supported.");
        }
    }

    private String extractPdf(InputStream inputStream) throws IOException {
        try (PDDocument document = Loader.loadPDF(inputStream.readAllBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        }
    }

    private String extractDocx(InputStream inputStream) throws IOException {
        try (XWPFDocument document = new XWPFDocument(inputStream)) {
            StringBuilder sb = new StringBuilder();
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                sb.append(paragraph.getText()).append(System.lineSeparator());
            }
            return sb.toString();
        }
    }

    private String extractPptx(InputStream inputStream) throws IOException {
        try (XMLSlideShow ppt = new XMLSlideShow(inputStream)) {
            StringBuilder sb = new StringBuilder();
            int slideNumber = 1;
            for (XSLFSlide slide : ppt.getSlides()) {
                sb.append("--- Slide ").append(slideNumber++).append(" ---").append(System.lineSeparator());
                for (XSLFShape shape : slide.getShapes()) {
                    if (shape instanceof XSLFTextShape textShape) {
                        String text = textShape.getText();
                        if (text != null && !text.isBlank()) {
                            sb.append(text).append(System.lineSeparator());
                        }
                    }
                }
            }
            return sb.toString();
        }
    }
}
