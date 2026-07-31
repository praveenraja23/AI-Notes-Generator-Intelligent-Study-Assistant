package com.notesgen.app.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
public class StudyDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String fileType; // pdf, docx, pptx

    @Lob
    @Column(nullable = false)
    private String extractedText;

    @Column(nullable = false)
    private int characterCount;

    @Column(nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();
}
