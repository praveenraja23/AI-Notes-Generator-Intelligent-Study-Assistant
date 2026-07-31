package com.notesgen.app.dto;

public record SummaryResponse(
        String filename,
        String style,
        int extractedCharacterCount,
        String summary
) {
}
