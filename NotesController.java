package com.notesgen.app.controller;

import com.notesgen.app.dto.SummaryResponse;
import com.notesgen.app.service.DocumentExtractionService;
import com.notesgen.app.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/notes")
@CrossOrigin(origins = "*") // tighten this once auth/CORS policy is added
public class NotesController {

    private final DocumentExtractionService extractionService;
    private final GeminiService geminiService;

    public NotesController(DocumentExtractionService extractionService, GeminiService geminiService) {
        this.extractionService = extractionService;
        this.geminiService = geminiService;
    }

    /**
     * Upload a PDF/DOCX/PPTX and get back an AI-generated summary.
     * This is the end-to-end vertical slice: no persistence, no auth yet.
     */
    @PostMapping(value = "/summarize", consumes = "multipart/form-data")
    public ResponseEntity<SummaryResponse> summarize(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "style", defaultValue = "detailed") String style
    ) throws Exception {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }

        String extractedText = extractionService.extractText(file);
        if (extractedText.isBlank()) {
            throw new IllegalStateException(
                    "No extractable text found. If this is a scanned document, OCR support is not yet enabled in this slice.");
        }

        String summary = geminiService.summarize(extractedText, style);

        return ResponseEntity.ok(new SummaryResponse(
                file.getOriginalFilename(),
                style,
                extractedText.length(),
                summary
        ));
    }
}
