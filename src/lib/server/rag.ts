import { and, inArray, isNotNull, sql } from "drizzle-orm";
import { contentChunks } from "./db/schema";
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
    .where(isNotNull(contentChunks.embedding))
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
    .where(
      and(isNotNull(contentChunks.embedding), inArray(contentChunks.sourceFile, sourceFiles))
    )
    .orderBy(sql`${contentChunks.embedding} <=> ${vectorLiteral}`)
    .limit(limit);
};
