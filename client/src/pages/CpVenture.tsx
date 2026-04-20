import { SectionHeader, TechPanel, NumberTicker } from "@/components/platform/PlatformPrimitives";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  cpVentureCompanies as seedCompanies,
  cpVentureLinks as seedLinks,
  cpVentureSources as seedSources,
  ventureDomains,
  ventureStages,
  type VentureCompany,
  type VentureDomain,
  type VentureStage,
} from "@shared/cpVenture";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, GitBranch, Layers3, Network, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

const domainOrder: VentureDomain[] = [
  "agri-food",
  "retail",
  "telecom",
  "digital",
  "property",
  "pharma",
  "finance",
  "strategic",
];

const stageOrder: VentureStage[] = ["core", "controlled", "platform", "strategic", "ecosystem"];

const linkColor = {
  ownership: "#38bdf8",
  subsidiary: "#22c55e",
  strategic: "#eab308",
  ecosystem: "#a78bfa",
  "value-chain": "#fb7185",
};

function getCompany(companies: VentureCompany[], id: string) {
  return companies.find(company => company.id === id) ?? companies[0]!;
}

export default function CpVenturePage() {
  const [selectedId, setSelectedId] = useState("cp-group");
  const [domainFilter, setDomainFilter] = useState<VentureDomain | "all">("all");
  const [stageFilter, setStageFilter] = useState<VentureStage | "all">("all");
  const [query, setQuery] = useState("");
  const { data } = trpc.platform.cpVentureMap.useQuery(undefined, {
    placeholderData: {
      companies: seedCompanies,
      links: seedLinks,
      sources: seedSources,
      persisted: false,
    },
  });
  const companies = data?.companies ?? seedCompanies;
  const links = data?.links ?? seedLinks;
  const sources = data?.sources ?? seedSources;

  const filteredCompanies = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return companies.filter(company => {
      const matchesDomain = domainFilter === "all" || company.domain === domainFilter;
      const matchesStage = stageFilter === "all" || company.stage === stageFilter;
      const matchesQuery =
        !normalized ||
        company.name.toLowerCase().includes(normalized) ||
        company.englishName.toLowerCase().includes(normalized) ||
        company.business.toLowerCase().includes(normalized);
      return matchesDomain && matchesStage && matchesQuery;
    });
  }, [companies, domainFilter, query, stageFilter]);

  const visibleIds = new Set(filteredCompanies.map(company => company.id));
  visibleIds.add("cp-group");
  const visibleLinks = links.filter(link => visibleIds.has(link.source) && visibleIds.has(link.target));
  const selected = getCompany(companies, selectedId);

  const stageColumns = useMemo(() => {
    return stageOrder.map(stage => ({
      stage,
      companies: filteredCompanies
        .filter(company => company.stage === stage)
        .sort((a, b) => b.depth - a.depth),
    }));
  }, [filteredCompanies]);

  return (
    <PlatformShell title="正大创投" eyebrow="CP Venture Graph" pageId="cp-venture">
      <SectionHeader
        eyebrow="Investment Atlas"
        title="正大集团投资版图与企业关系图谱"
        description="以公开资料可核实的正大核心企业、平台公司、战略参股和生态合作关系为基础，展示正大如何通过农牧食品、零售、通信、数字、地产、医药和金融形成复合生态。图谱支持点击企业节点查看参与方式，并用投资矩阵观察参与深度。"
        aside={
          <div className="flex flex-wrap gap-2">
            <Badge className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
              <Network className="mr-1 h-3 w-3" /> {companies.length} 家公开样本
            </Badge>
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
              <ShieldCheck className="mr-1 h-3 w-3" /> {data?.persisted ? "数据库持久化" : "种子数据兜底"}
            </Badge>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {[
          { label: "企业节点", value: filteredCompanies.length, suffix: "", desc: "支持按领域、阶段和关键词筛选。", color: "text-white" },
          { label: "关系连线", value: visibleLinks.length, suffix: "", desc: "包含控股、子公司、生态和战略投资。", color: "text-white" },
          { label: "最高参与深度", value: Math.max(...filteredCompanies.map(item => item.depth)), suffix: "", desc: "越高表示正大参与越深。", color: "text-emerald-300" },
          { label: "覆盖领域", value: new Set(filteredCompanies.map(item => item.domain)).size, suffix: "", desc: "跨产业协同是正大投资版图的核心。", color: "text-cyan-300" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <TechPanel className="rounded-[18px] p-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500 relative">{stat.label}</p>
              <p className={`mt-3 font-mono text-3xl font-bold relative ${stat.color}`}>
                <NumberTicker value={stat.value} />
              </p>
              <p className="mt-2 text-[12px] text-slate-400 relative">{stat.desc}</p>
            </TechPanel>
          </motion.div>
        ))}
      </div>

      <TechPanel className="mb-6 rounded-[24px] p-5">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="搜索企业、英文名、业务关键词"
              className="h-11 w-full rounded-xl border border-white/10 bg-[#081020] pl-10 pr-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50"
            />
          </div>
          <select
            value={domainFilter}
            onChange={event => setDomainFilter(event.target.value as VentureDomain | "all")}
            className="h-11 rounded-xl border border-white/10 bg-[#081020] px-3 text-sm text-white outline-none focus:border-cyan-500/50"
          >
            <option value="all">全部领域</option>
            {domainOrder.map(domain => (
              <option key={domain} value={domain}>{ventureDomains[domain].label}</option>
            ))}
          </select>
          <select
            value={stageFilter}
            onChange={event => setStageFilter(event.target.value as VentureStage | "all")}
            className="h-11 rounded-xl border border-white/10 bg-[#081020] px-3 text-sm text-white outline-none focus:border-cyan-500/50"
          >
            <option value="all">全部阶段</option>
            {stageOrder.map(stage => (
              <option key={stage} value={stage}>{ventureStages[stage].label}</option>
            ))}
          </select>
        </div>
      </TechPanel>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <TechPanel className="min-h-[620px] rounded-[24px] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                <GitBranch className="h-5 w-5 text-cyan-300" /> 动态企业关系图谱
              </h3>
              <p className="mt-1 text-[12px] text-slate-400">点击节点查看企业信息；节点越大表示参与深度越高。</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
              {Object.entries(linkColor).map(([type, color]) => (
                <span key={type} className="flex items-center gap-1.5">
                  <span className="h-2 w-5 rounded-full" style={{ background: color }} />
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="relative h-[540px] overflow-hidden rounded-2xl border border-white/[0.06] bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.12),transparent_32%),rgba(3,9,22,0.72)]">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {visibleLinks.map(link => {
                const source = getCompany(companies, link.source);
                const target = getCompany(companies, link.target);
                return (
                  <line
                    key={`${link.source}-${link.target}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={linkColor[link.type]}
                    strokeWidth={0.18 + link.strength * 0.34}
                    strokeOpacity={selectedId === link.source || selectedId === link.target ? 0.9 : 0.32}
                    strokeDasharray={link.type === "strategic" ? "1.2 1.4" : undefined}
                  />
                );
              })}
              {filteredCompanies.map(company => {
                const domain = ventureDomains[company.domain];
                const selectedNode = company.id === selectedId;
                const radius = company.stage === "core" ? 4.7 : 2.1 + company.depth / 48;
                return (
                  <g
                    key={company.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(company.id)}
                    onKeyDown={event => {
                      if (event.key === "Enter" || event.key === " ") setSelectedId(company.id);
                    }}
                    className="cursor-pointer"
                  >
                    <motion.circle
                      cx={company.x}
                      cy={company.y}
                      r={radius}
                      fill={domain.color}
                      fillOpacity={selectedNode ? 0.96 : 0.72}
                      stroke={selectedNode ? "#ffffff" : "rgba(255,255,255,0.36)"}
                      strokeWidth={selectedNode ? 0.55 : 0.18}
                      filter={selectedNode ? "url(#glow)" : undefined}
                      animate={{ r: selectedNode ? [radius, radius + 0.75, radius] : radius }}
                      transition={{ duration: 1.8, repeat: selectedNode ? Infinity : 0 }}
                    />
                    <text
                      x={company.x}
                      y={company.y + radius + 2.2}
                      textAnchor="middle"
                      className="pointer-events-none select-none fill-slate-200 text-[2.1px] font-semibold"
                    >
                      {company.name.length > 6 ? company.name.slice(0, 6) : company.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </TechPanel>

        <AnimatePresence mode="wait">
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <CompanyDetail company={selected} />
          </motion.div>
        </AnimatePresence>
      </div>

      <TechPanel className="mb-8 rounded-[24px] p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-base font-bold text-white">
              <Layers3 className="h-5 w-5 text-emerald-300" /> 投资矩阵
            </h3>
            <p className="mt-1 text-[12px] text-slate-400">不同层级代表正大的参与阶段，不同列代表领域；每列按参与深度从高到低排序。</p>
          </div>
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200">Depth Sorted</Badge>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-[1120px] grid-cols-[150px_repeat(8,minmax(120px,1fr))] gap-2">
            <div />
            {domainOrder.map(domain => (
              <div key={domain} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center">
                <p className="text-[12px] font-bold text-white">{ventureDomains[domain].label}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">{ventureDomains[domain].short}</p>
              </div>
            ))}
            {stageColumns.map(({ stage }) => (
              <StageRow
                key={stage}
                stage={stage}
                companies={filteredCompanies.filter(company => company.stage === stage)}
                onSelect={setSelectedId}
                selectedId={selectedId}
              />
            ))}
          </div>
        </div>
      </TechPanel>

      <TechPanel className="rounded-[24px] p-5">
        <h3 className="mb-3 text-base font-bold text-white">资料来源与边界</h3>
        <p className="mb-4 text-[13px] leading-7 text-slate-400">
          本页当前是公开资料可核实的核心样本图谱，并非法律意义上的全部股权穿透表。后续可接入工商数据、年报、公告和内部投资台账，扩展为完整“正大创投知识图谱”。
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sources.map((source, i) => (
            <motion.a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ x: 4, transition: { duration: 0.15 } }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-[12px] text-cyan-200 transition-colors hover:border-cyan-400/40 hover:bg-cyan-400/[0.06]"
            >
              {source.label}
            </motion.a>
          ))}
        </div>
      </TechPanel>
    </PlatformShell>
  );
}

function CompanyDetail({ company }: { company: VentureCompany }) {
  const domain = ventureDomains[company.domain];
  const stage = ventureStages[company.stage];
  const logoDomain = company.logoDomain ?? new URL(company.sourceUrl).hostname;
  const logoUrl = `https://www.google.com/s2/favicons?domain=${logoDomain}&sz=128`;

  return (
    <TechPanel className="rounded-[24px] p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <Badge className="mb-3 border-white/10 bg-white/[0.06] text-slate-200">{stage.label}</Badge>
          <h3 className="text-xl font-bold text-white">{company.name}</h3>
          <p className="mt-1 text-[12px] text-slate-400">{company.englishName}</p>
        </div>
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 p-2"
          style={{ background: `${domain.color}1f`, color: domain.color }}
        >
          <img
            src={logoUrl}
            alt={`${company.name} logo`}
            className="h-full w-full rounded-lg object-contain"
            onError={event => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement?.classList.add("after:content-['LOGO']");
            }}
          />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {[
          { label: "领域", value: domain.label },
          { label: "参与深度", value: `${company.depth}/100` },
          { label: "关系", value: company.relation },
          { label: "地域", value: company.geography },
        ].map((pill, i) => (
          <motion.div
            key={pill.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{pill.label}</p>
            <p className="mt-1 text-[12px] font-semibold text-white">{pill.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        {[
          company.ownershipSummary ? { title: "股权/关系口径", text: company.ownershipSummary } : null,
          company.boardRole ? { title: "董事会/治理参与", text: company.boardRole } : null,
          { title: "正大如何参与", text: company.participation },
          { title: "正大角色", text: company.cpRole },
          { title: "主营业务", text: company.business },
          { title: "协同逻辑", text: company.synergy },
          { title: "依据", text: company.evidence },
        ].filter((b): b is { title: string; text: string } => b !== null).map((block, i) => (
          <motion.div
            key={block.title}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">{block.title}</p>
            <p className="text-[13px] leading-6 text-slate-300">{block.text}</p>
          </motion.div>
        ))}
      </div>

      <a
        href={company.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[12px] font-semibold text-cyan-200 transition-colors hover:bg-cyan-500/20"
      >
        查看公开来源
      </a>
    </TechPanel>
  );
}

function StageRow({
  stage,
  companies,
  onSelect,
  selectedId,
}: {
  stage: VentureStage;
  companies: VentureCompany[];
  onSelect: (id: string) => void;
  selectedId: string;
}) {
  const byDomain = new Map<VentureDomain, VentureCompany[]>();
  for (const domain of domainOrder) byDomain.set(domain, []);
  companies
    .sort((a, b) => b.depth - a.depth)
    .forEach(company => byDomain.get(company.domain)?.push(company));

  return (
    <>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
        <p className="text-[12px] font-bold text-white">{ventureStages[stage].label}</p>
        <p className="mt-2 text-[11px] leading-5 text-slate-500">{ventureStages[stage].description}</p>
      </div>
      {domainOrder.map(domain => (
        <div key={`${stage}-${domain}`} className="min-h-[120px] rounded-xl border border-white/[0.06] bg-white/[0.02] p-2">
          {(byDomain.get(domain) ?? []).map((company, ci) => (
            <motion.button
              key={company.id}
              onClick={() => onSelect(company.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.03 * ci, duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "mb-2 w-full rounded-lg border px-2 py-2 text-left transition-all",
                selectedId === company.id
                  ? "border-cyan-400/60 bg-cyan-400/[0.12]"
                  : "border-white/[0.05] bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-semibold text-white">{company.name}</span>
                <span className="font-mono text-[10px] text-slate-500">{company.depth}</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: ventureDomains[company.domain].color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${company.depth}%` }}
                  transition={{ duration: 0.6, delay: 0.05 * ci, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </motion.button>
          ))}
        </div>
      ))}
    </>
  );
}
