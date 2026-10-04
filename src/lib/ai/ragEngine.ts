import { DocumentChunk, Citation, DocumentFile } from '../../types';

export class RagEngine {
  private chunks: DocumentChunk[] = [];

  // Index document content
  indexDocument(doc: DocumentFile): DocumentChunk[] {
    const text = (doc.extractedText || doc.content || '').trim();
    if (!text) return [];

    const generatedChunks: DocumentChunk[] = [];
    const chunkSize = 500; // characters per chunk
    const overlap = 80;

    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      const chunkText = text.substring(startIndex, endIndex).trim();

      if (chunkText.length > 20) {
        generatedChunks.push({
          id: `${doc.id}_chunk_${chunkIndex}`,
          documentId: doc.id,
          documentName: doc.name,
          chunkIndex,
          content: chunkText,
          text: chunkText,
          pageNumber: Math.floor(startIndex / 1500) + 1,
          tokenCount: Math.ceil(chunkText.split(/\s+/).length),
        });
        chunkIndex++;
      }

      startIndex += chunkSize - overlap;
    }

    // Attach to doc object if present
    doc.chunks = generatedChunks;

    // Add to internal index
    this.chunks = this.chunks.filter((c) => c.documentId !== doc.id).concat(generatedChunks);
    return generatedChunks;
  }

  // Remove document from index
  removeDocument(documentId: string): void {
    this.chunks = this.chunks.filter((c) => c.documentId !== documentId);
  }

  deleteDocument(documentId: string): void {
    this.removeDocument(documentId);
  }

  // Load existing chunks into memory
  loadChunks(chunks: DocumentChunk[]): void {
    this.chunks = chunks;
  }

  // Term frequency & vector similarity retrieval
  query(queryString: string, topK: number = 3, minScore: number = 0.15): { relevantChunks: DocumentChunk[]; citations: Citation[] } {
    if (!queryString.trim() || this.chunks.length === 0) {
      return { relevantChunks: [], citations: [] };
    }

    const queryTerms = this.tokenize(queryString);
    if (queryTerms.length === 0) {
      return { relevantChunks: [], citations: [] };
    }

    const scoredChunks = this.chunks.map((chunk) => {
      const chunkText = chunk.content || chunk.text || '';
      const chunkTerms = this.tokenize(chunkText);
      let matchCount = 0;
      let exactPhraseBonus = 0;

      if (chunkText.toLowerCase().includes(queryString.toLowerCase())) {
        exactPhraseBonus = 0.5;
      }

      for (const qTerm of queryTerms) {
        const termFreq = chunkTerms.filter((t) => t === qTerm).length;
        if (termFreq > 0) {
          matchCount += 1 + Math.log(termFreq);
        }
      }

      const score = (matchCount / (Math.sqrt(chunkTerms.length) + 1)) + exactPhraseBonus;
      return { chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    const topScored = scoredChunks.filter((item) => item.score >= minScore).slice(0, topK);

    const relevantChunks = topScored.map((item) => item.chunk);
    const citations: Citation[] = topScored.map((item) => ({
      id: 'cit_' + item.chunk.id,
      documentId: item.chunk.documentId,
      documentName: item.chunk.documentName,
      pageNumber: item.chunk.pageNumber,
      snippet: (item.chunk.content || item.chunk.text || '').substring(0, 180) + '...',
      score: Number(item.score.toFixed(3)),
    }));

    return { relevantChunks, citations };
  }

  retrieve(queryString: string, topK: number = 3): Array<{ chunk: DocumentChunk; score: number }> {
    if (!queryString.trim() || this.chunks.length === 0) {
      return [];
    }

    const queryTerms = this.tokenize(queryString);
    if (queryTerms.length === 0) return [];

    const scoredChunks = this.chunks.map((chunk) => {
      const chunkText = chunk.content || chunk.text || '';
      const chunkTerms = this.tokenize(chunkText);
      let matchCount = 0;
      let exactPhraseBonus = 0;

      if (chunkText.toLowerCase().includes(queryString.toLowerCase())) {
        exactPhraseBonus = 0.5;
      }

      for (const qTerm of queryTerms) {
        const termFreq = chunkTerms.filter((t) => t === qTerm).length;
        if (termFreq > 0) {
          matchCount += 1 + Math.log(termFreq);
        }
      }

      const score = (matchCount / (Math.sqrt(chunkTerms.length) + 1)) + exactPhraseBonus;
      return { chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK);
  }

  private tokenize(text: string): string[] {
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'or',
      'it', 'with', 'as', 'by', 'that', 'this', 'are', 'was', 'were', 'be', 'been', 'from',
      'what', 'how', 'when', 'where', 'who', 'why', 'can', 'you', 'i', 'me', 'my', 'we'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 2 && !stopwords.has(term));
  }
}

export const ragEngine = new RagEngine();
