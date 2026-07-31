package com.notesgen.app.controller;

import com.notesgen.app.dto.DocumentSummaryView;
import com.notesgen.app.dto.SummaryResponse;
import com.notesgen.app.entity.StudyDocument;
import com.notesgen.app.entity.Summary;
import com.notesgen.app.entity.User;
import com.notesgen.app.repository.StudyDocumentRepository;
import com.notesgen.app.repository.SummaryRepository;
import com.notesgen.app.service.DocumentExtractionService;
import com.notesgen.app.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/notes")
public class NotesController {

    private final DocumentExtractionService extractionService;
    private final GeminiService geminiService;
    private final StudyDocumentRepository documentRepository;
    private final SummaryRepository summaryRepository;

    public NotesController(
            DocumentExtractionService extractionService,
            GeminiService geminiService,
            StudyDocumentRepository documentRepository,
            SummaryRepository summaryRepository
    ) {
        this.extractionService = extractionService;
        this.geminiService = geminiService;
        this.documentRepository = documentRepository;
        this.summaryRepository = summaryRepository;
    }

    /**
     * Upload a PDF/DOCX/PPTX, extract its text, save the document, generate a summary,
     * and save that too. Requires authentication -- the document is owned by the caller.
     */
    @PostMapping(value = "/summarize", consumes = "multipart/form-data")
    public ResponseEntity<SummaryResponse> summarize(
            @AuthenticationPrincipal User currentUser,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "style", defaultValue = "detailed") String style
    ) throws Exception {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }

        String extractedText = extractionService.extractText(file);
        if (extractedText.isBlank()) {
            throw new IllegalStateException(
                    "No extractable text found. If this is a scanned document, OCR support is not yet enabled.");
        }

        String filename = file.getOriginalFilename() == null ? "untitled" : file.getOriginalFilename();
        String fileType = filename.contains(".")
                ? filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT)
                : "unknown";

        StudyDocument document = new StudyDocument();
        document.setOwner(currentUser);
        document.setFilename(filename);
        document.setFileType(fileType);
        document.setExtractedText(extractedText);
        document.setCharacterCount(extractedText.length());
        documentRepository.save(document);

        String summaryText = geminiService.summarize(extractedText, style);

        Summary summary = new Summary();
        summary.setDocument(document);
        summary.setStyle(style);
        summary.setContent(summaryText);
        summaryRepository.save(summary);

        return ResponseEntity.ok(new SummaryResponse(
                document.getFilename(),
                style,
                document.getCharacterCount(),
                summaryText
        ));
    }

    /** List the current user's documents with their most recent summary. */
    @GetMapping("/documents")
    public ResponseEntity<List<DocumentSummaryView>> listDocuments(@AuthenticationPrincipal User currentUser) {
        List<StudyDocument> documents = documentRepository.findByOwnerOrderByUploadedAtDesc(currentUser);

        List<DocumentSummaryView> views = documents.stream()
                .map(doc -> {
                    List<Summary> summaries = summaryRepository.findByDocumentOrderByCreatedAtDesc(doc);
                    Summary latest = summaries.isEmpty() ? null : summaries.get(0);
                    return new DocumentSummaryView(
                            doc.getId(),
                            doc.getFilename(),
                            doc.getFileType(),
                            doc.getCharacterCount(),
                            doc.getUploadedAt(),
                            latest == null ? null : latest.getStyle(),
                            latest == null ? null : latest.getContent()
                    );
                })
                .toList();

        return ResponseEntity.ok(views);
    }
}
