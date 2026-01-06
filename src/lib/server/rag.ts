import { and, eq, ilike, inArray, isNotNull, or, sql } from "drizzle-orm";
import { contentChunks, documents } from "./db/schema";
import type { Database } from "./db";

const formatVector = (embedding: number[]) =>
  `[${embedding.map((value) => (Number.isFinite(value) ? value : 0)).join(",")}]`;

export const findSimilarChunks = async (db: Database, embedding: number[], limit = 5) => {
  const vectorLiteral = sql`${formatVector(embedding)}::vector`;
  const similarity = sql<number>`1 - (${contentChunks.embedding} <=> ${vectorLiteral})`.as("similarity");

  return db
    .select({
      id: contentChunks.id,
      content: contentChunks.content,
      sourceFile: contentChunks.sourceFile,
      heading: contentChunks.heading,
      similarity
    })
    .from(contentChunks)
    .innerJoin(documents, eq(documents.sourceFile, contentChunks.sourceFile))
    .where(
      and(
        isNotNull(contentChunks.embedding),
        eq(documents.isTemplate, false)
      )
    )
    .orderBy(sql`${contentChunks.embedding} <=> ${vectorLiteral}`)
    .limit(limit);
};

export const findSimilarChunksForSources = async (
  db: Database,
  embedding: number[],
  sourceFiles: string[],
  limit = 5
) => {
  if (sourceFiles.length === 0) {
    return [];
  }

  const vectorLiteral = sql`${formatVector(embedding)}::vector`;
  const similarity = sql<number>`1 - (${contentChunks.embedding} <=> ${vectorLiteral})`.as("similarity");

  return db
    .select({
      id: contentChunks.id,
      content: contentChunks.content,
      sourceFile: contentChunks.sourceFile,
      heading: contentChunks.heading,
      similarity
    })
    .from(contentChunks)
    .innerJoin(documents, eq(documents.sourceFile, contentChunks.sourceFile))
    .where(
      and(
        isNotNull(contentChunks.embedding),
        inArray(contentChunks.sourceFile, sourceFiles),
        eq(documents.public, true),
        eq(documents.isTemplate, false)
      )
    )
    .orderBy(sql`${contentChunks.embedding} <=> ${vectorLiteral}`)
    .limit(limit);
};

export const findChunksForSourcesByHeading = async (
  db: Database,
  sourceFiles: string[],
  headingPatterns: string[],
  limit = 5
) => {
  if (sourceFiles.length === 0 || headingPatterns.length === 0) {
    return [];
  }

  const headingFilter = or(...headingPatterns.map((pattern) => ilike(contentChunks.heading, pattern)));

  return db
    .select({
      id: contentChunks.id,
      content: contentChunks.content,
      sourceFile: contentChunks.sourceFile,
      heading: contentChunks.heading,
      similarity: sql<number>`NULL`.as("similarity")
    })
    .from(contentChunks)
    .innerJoin(documents, eq(documents.sourceFile, contentChunks.sourceFile))
    .where(
      and(
        inArray(contentChunks.sourceFile, sourceFiles),
        headingFilter,
        eq(documents.public, true),
        eq(documents.isTemplate, false)
      )
    )
    .orderBy(contentChunks.id)
    .limit(limit);
};
