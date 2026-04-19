import { asc } from "drizzle-orm";
import {
  cpVentureCompanies as seedCompanies,
  cpVentureLinks as seedLinks,
  cpVentureSources,
  type VentureCompany,
  type VentureLink,
} from "@shared/cpVenture";
import {
  cpVentureCompaniesTable,
  cpVentureLinksTable,
  type InsertCpVentureCompanyRow,
  type InsertCpVentureLinkRow,
} from "../drizzle/schema";
import { getDb } from "./db";

function toCompanyRow(company: VentureCompany): InsertCpVentureCompanyRow {
  return {
    companyId: company.id,
    name: company.name,
    englishName: company.englishName,
    domain: company.domain,
    stage: company.stage,
    depth: company.depth,
    x: company.x,
    y: company.y,
    relation: company.relation,
    logoDomain: company.logoDomain ?? null,
    ownershipSummary: company.ownershipSummary ?? null,
    boardRole: company.boardRole ?? null,
    cpRole: company.cpRole,
    participation: company.participation,
    business: company.business,
    synergy: company.synergy,
    geography: company.geography,
    evidence: company.evidence,
    sourceUrl: company.sourceUrl,
  };
}

function toLinkRow(link: VentureLink): InsertCpVentureLinkRow {
  return {
    linkId: `${link.source}:${link.target}:${link.type}`,
    source: link.source,
    target: link.target,
    type: link.type,
    strength: Math.round(link.strength * 1000),
  };
}

function fromCompanyRow(row: typeof cpVentureCompaniesTable.$inferSelect): VentureCompany {
  return {
    id: row.companyId,
    name: row.name,
    englishName: row.englishName,
    domain: row.domain as VentureCompany["domain"],
    stage: row.stage as VentureCompany["stage"],
    depth: row.depth,
    x: row.x,
    y: row.y,
    relation: row.relation,
    logoDomain: row.logoDomain ?? undefined,
    ownershipSummary: row.ownershipSummary ?? undefined,
    boardRole: row.boardRole ?? undefined,
    cpRole: row.cpRole,
    participation: row.participation,
    business: row.business,
    synergy: row.synergy,
    geography: row.geography,
    evidence: row.evidence,
    sourceUrl: row.sourceUrl,
  };
}

function fromLinkRow(row: typeof cpVentureLinksTable.$inferSelect): VentureLink {
  return {
    source: row.source,
    target: row.target,
    type: row.type as VentureLink["type"],
    strength: row.strength / 1000,
  };
}

export async function seedCpVentureData() {
  const db = await getDb();
  if (!db) {
    return { persisted: false, companyCount: seedCompanies.length, linkCount: seedLinks.length };
  }

  for (const company of seedCompanies) {
    const values = toCompanyRow(company);
    await db.insert(cpVentureCompaniesTable).values(values).onDuplicateKeyUpdate({
      set: {
        name: values.name,
        englishName: values.englishName,
        domain: values.domain,
        stage: values.stage,
        depth: values.depth,
        x: values.x,
        y: values.y,
        relation: values.relation,
        logoDomain: values.logoDomain,
        ownershipSummary: values.ownershipSummary,
        boardRole: values.boardRole,
        cpRole: values.cpRole,
        participation: values.participation,
        business: values.business,
        synergy: values.synergy,
        geography: values.geography,
        evidence: values.evidence,
        sourceUrl: values.sourceUrl,
      },
    });
  }

  for (const link of seedLinks) {
    const values = toLinkRow(link);
    await db.insert(cpVentureLinksTable).values(values).onDuplicateKeyUpdate({
      set: {
        source: values.source,
        target: values.target,
        type: values.type,
        strength: values.strength,
      },
    });
  }

  return { persisted: true, companyCount: seedCompanies.length, linkCount: seedLinks.length };
}

export async function getCpVentureMap() {
  const db = await getDb();
  if (!db) {
    return {
      companies: seedCompanies,
      links: seedLinks,
      sources: cpVentureSources,
      persisted: false,
    };
  }

  await seedCpVentureData();

  const [companyRows, linkRows] = await Promise.all([
    db.select().from(cpVentureCompaniesTable).orderBy(asc(cpVentureCompaniesTable.id)),
    db.select().from(cpVentureLinksTable).orderBy(asc(cpVentureLinksTable.id)),
  ]);

  return {
    companies: companyRows.map(fromCompanyRow),
    links: linkRows.map(fromLinkRow),
    sources: cpVentureSources,
    persisted: true,
  };
}
