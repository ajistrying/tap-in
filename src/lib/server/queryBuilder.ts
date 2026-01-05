import { and, arrayOverlaps, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { documents } from "$lib/server/db/schema";
import type { Database } from "$lib/server/db";
import type { QueryPlan } from "$lib/server/queryPlanner";

type DocumentSummary = {
  sourceFile: string;
  title: string | null;
  docType: string;
  docDate: Date | string | null;
  tags: string[];
  project: string | null;
  status: string | null;
  progress: number | null;
  goalHorizon: string | null;
  periodStart: Date | string | null;
  periodEnd: Date | string | null;
};

const formatDate = (value: DocumentSummary["docDate"]) => {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
};

const sanitizeList = (values: string[]) =>
  values.map((value) => value.trim()).filter((value) => value.length > 0);

export const hasDocumentFilters = (plan: QueryPlan) => {
  if (plan.time_range) {
    return true;
  }
  if (plan.project && plan.project.trim().length > 0) {
    return true;
  }
  if (plan.doc_types.length > 0) {
    return true;
  }
  if (plan.statuses.length > 0) {
    return true;
  }
  if (plan.tags.length > 0) {
    return true;
  }
  return false;
};

export const buildDocumentFilters = (plan: QueryPlan) => {
  const docTypes = sanitizeList(plan.doc_types);
  const statuses = sanitizeList(plan.statuses);
  const tags = sanitizeList(plan.tags);
  const project = plan.project?.trim() || null;

  const range = plan.time_range;
  const rangeFilter = range
    ? and(gte(documents.docDate, range.start), lte(documents.docDate, range.end))
    : undefined;

  return and(
    eq(documents.public, true),
    eq(documents.isTemplate, false),
    docTypes.length > 0 ? inArray(documents.docType, docTypes) : undefined,
    statuses.length > 0 ? inArray(documents.status, statuses) : undefined,
    tags.length > 0 ? arrayOverlaps(documents.tags, tags) : undefined,
    project ? eq(documents.project, project) : undefined,
    rangeFilter
  );
};

export const fetchDocumentsForPlan = async (
  db: Database,
  plan: QueryPlan,
  limitOverride?: number
) => {
  const limit = limitOverride ?? plan.limit ?? 50;
  const where = buildDocumentFilters(plan);

  return db
    .select({
      sourceFile: documents.sourceFile,
      title: documents.title,
      docType: documents.docType,
      docDate: documents.docDate,
      tags: documents.tags,
      project: documents.project,
      status: documents.status,
      progress: documents.progress,
      goalHorizon: documents.goalHorizon,
      periodStart: documents.periodStart,
      periodEnd: documents.periodEnd
    })
    .from(documents)
    .where(where)
    .orderBy(desc(documents.docDate), desc(documents.updatedAt))
    .limit(limit);
};

export const formatDocumentContext = (docs: DocumentSummary[], startIndex = 1) => {
  if (docs.length === 0) {
    return "";
  }

  return docs
    .map((doc, index) => {
      const lines = [`Source ${startIndex + index}: ${doc.sourceFile}`];
      if (doc.title) {
        lines.push(`Title: ${doc.title}`);
      }
      lines.push(`Type: ${doc.docType}`);

      const docDate = formatDate(doc.docDate);
      if (docDate) {
        lines.push(`Date: ${docDate}`);
      }

      if (doc.project) {
        lines.push(`Project: ${doc.project}`);
      }
      if (doc.status) {
        lines.push(`Status: ${doc.status}`);
      }
      if (doc.progress !== null && doc.progress !== undefined) {
        lines.push(`Progress: ${doc.progress}`);
      }
      if (doc.goalHorizon) {
        lines.push(`Goal horizon: ${doc.goalHorizon}`);
      }
      const periodStart = formatDate(doc.periodStart);
      const periodEnd = formatDate(doc.periodEnd);
      if (periodStart || periodEnd) {
        lines.push(`Period: ${periodStart ?? "?"} to ${periodEnd ?? "?"}`);
      }
      if (doc.tags && doc.tags.length > 0) {
        lines.push(`Tags: ${doc.tags.join(", ")}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
};
