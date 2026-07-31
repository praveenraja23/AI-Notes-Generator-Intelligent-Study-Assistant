package com.notesgen.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Thin client around the Gemini generateContent REST endpoint.
 * Only what's needed for summarization in this slice; the RAG service
 * (chunking + embeddings + ChromaDB + chat) is a later phase.
 */
@Service
public class GeminiService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    // Gemini's per-request text limit is generous, but we cap what we send
    // to keep latency/cost predictable in this slice. Long-document handling
    // via chunking arrives with the RAG pipeline phase.
    private static final int MAX_INPUT_CHARS = 60_000;

    public GeminiService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com/v1beta")
                .build();
    }

    public String summarize(String extractedText, String style) {
        String trimmed = extractedText.length() > MAX_INPUT_CHARS
                ? extractedText.substring(0, MAX_INPUT_CHARS)
                : extractedText;

        String prompt = buildPrompt(trimmed, style);

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{Map.of("text", prompt)})
                }
        );

        String response = restClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/models/{model}:generateContent")
                        .queryParam("key", apiKey)
                        .build(model))
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return extractTextFromResponse(response);
    }

    private String buildPrompt(String text, String style) {
        String instruction = switch (style == null ? "detailed" : style.toLowerCase()) {
            case "short" -> "Write a concise 3-5 sentence summary.";
            case "bullet" -> "Summarize as clear bullet points covering the key ideas.";
            case "simplified" -> "Explain the material in simple terms, as if teaching a beginner.";
            default -> "Write a detailed, well-organized summary covering all major concepts, "
                    + "grouped under short headings where helpful.";
        };

        return """
                You are a study assistant. Summarize the following study material.
                %s
                Only use information present in the text below. Do not invent facts.

                --- STUDY MATERIAL START ---
                %s
                --- STUDY MATERIAL END ---
                """.formatted(instruction, text);
    }

    private String extractTextFromResponse(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            return root.path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text").asText("(No summary text returned by the model.)");
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse Gemini response: " + e.getMessage(), e);
        }
    }
}
