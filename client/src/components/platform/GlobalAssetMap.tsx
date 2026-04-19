import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { ChevronDown, Minus, Plus, Radar } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { categoryOrder, filterSitesByCategories, getCategoryCounts, globalSites as sites, type SiteCategory } from "./globalAssetMapData";
import worldAtlas from "@/data/countries-110m.json";

// 本地化缓存：避免运行时依赖 CDN，提升内网部署可用性
const geoUrl = worldAtlas as unknown;

function GlobalAssetMapInner() {
  const { language } = useLanguage();
  const [zoom, setZoom] = useState(1.08);
  const [center, setCenter] = useState<[number, number]>([100, 18]);
  const [selectedCategories, setSelectedCategories] = useState<SiteCategory[]>(categoryOrder);

  const copy = {
    zh: {
      eyebrow: "Global Ops Map",
      title: "全球产业节点",
      body: "左侧模块展示正大集团养猪及相关产业节点，支持缩放查看全球布局，并可按业态多选筛选。",
      reset: "回到亚洲视角",
      totalSites: "可见节点",
      zoom: "缩放",
      filterTitle: "业态筛选",
      filterHint: "多选联动",
      clearAll: "仅看全部",
      categories: {
        swine: "猪事业",
        poultry: "鸡事业",
        feed: "饲料厂",
        slaughter: "屠宰加工",
      },
    },
    en: {
      eyebrow: "Global Ops Map",
      title: "Global Asset Map",
      body: "The side module highlights CP swine and related industrial nodes with zoomable global coverage and multi-select category filters.",
      reset: "Reset to Asia",
      totalSites: "Visible nodes",
      zoom: "Zoom",
      filterTitle: "Category Filter",
      filterHint: "Multi-select linked",
      clearAll: "Show all",
      categories: {
        swine: "Swine",
        poultry: "Poultry",
        feed: "Feed",
        slaughter: "Processing",
      },
    },
    ja: {
      eyebrow: "Global Ops Map",
      title: "グローバル産業ノード",
      body: "左側モジュールでCPの養豚および関連産業ノードを表示し、世界配置を拡大縮小と業態複数選択で確認できます。",
      reset: "アジア視点に戻す",
      totalSites: "表示ノード",
      zoom: "ズーム",
      filterTitle: "業態フィルター",
      filterHint: "複数選択",
      clearAll: "すべて表示",
      categories: {
        swine: "豚事業",
        poultry: "鶏事業",
        feed: "飼料工場",
        slaughter: "と畜加工",
      },
    },
    th: {
      eyebrow: "Global Ops Map",
      title: "โหนดอุตสาหกรรมทั่วโลก",
      body: "โมดูลด้านซ้ายแสดงจุดดำเนินงานสุกรและโหนดธุรกิจที่เกี่ยวข้องของ CP พร้อมซูมและเลือกหลายหมวดหมู่ได้",
      reset: "กลับไปมุมมองเอเชีย",
      totalSites: "โหนดที่แสดง",
      zoom: "ซูม",
      filterTitle: "ตัวกรองหมวดธุรกิจ",
      filterHint: "เลือกได้หลายรายการ",
      clearAll: "แสดงทั้งหมด",
      categories: {
        swine: "สุกร",
        poultry: "ไก่",
        feed: "โรงงานอาหารสัตว์",
        slaughter: "ชำแหละแปรรูป",
      },
    },
  }[language];

  const visibleSites = useMemo(() => filterSitesByCategories(sites, selectedCategories), [selectedCategories]);
  const counts = useMemo(() => getCategoryCounts(visibleSites), [visibleSites]);

  const toggleCategory = (category: SiteCategory, checked: boolean) => {
    if (checked) {
      setSelectedCategories(current => (current.includes(category) ? current : [...current, category]));
      return;
    }

    setSelectedCategories(current => {
      const next = current.filter(item => item !== category);
      return next.length ? next : categoryOrder;
    });
  };

  const zoomIn = () => setZoom(current => Math.min(3.2, Number((current + 0.2).toFixed(2))));
  const zoomOut = () => setZoom(current => Math.max(1, Number((current - 0.2).toFixed(2))));
  const resetView = () => {
    setZoom(1.08);
    setCenter([100, 18]);
  };

  return (
    <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)),rgba(8,14,24,0.92)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">{copy.eyebrow}</p>
          <h3 className="mt-2 text-base font-semibold text-white">{copy.title}</h3>
        </div>
        <div className="data-chip text-xs">
          <Radar className="h-3.5 w-3.5" />
          {copy.totalSites} {visibleSites.length}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-400">{copy.body}</p>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
        <div>
          <p className="text-xs font-medium text-white">{copy.filterTitle}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">{copy.filterHint}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
              <span>{selectedCategories.length === categoryOrder.length ? copy.clearAll : `${selectedCategories.length} / ${categoryOrder.length}`}</span>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-[20px] border-white/10 bg-slate-950/95 p-2 text-slate-100">
            <DropdownMenuLabel className="text-xs uppercase tracking-[0.22em] text-slate-500">{copy.filterTitle}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/8" />
            {categoryOrder.map(category => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={checked => toggleCategory(category, Boolean(checked))}
                className="rounded-xl px-3 py-2 text-slate-200 focus:bg-cyan-400/12 focus:text-cyan-50"
              >
                {copy.categories[category]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 overflow-hidden rounded-[24px] border border-cyan-400/10 bg-[radial-gradient(circle_at_50%_40%,rgba(65,224,255,0.18),transparent_38%),linear-gradient(180deg,rgba(4,12,24,0.96),rgba(6,15,30,0.94))]">
        <div className="flex items-center justify-between border-b border-white/6 px-3 py-2">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
            <span>{copy.zoom}</span>
            <span className="text-cyan-200/80">{zoom.toFixed(2)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="icon" variant="outline" onClick={zoomOut} className="h-8 w-8 rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
              <Minus className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="outline" onClick={zoomIn} className="h-8 w-8 rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative h-[230px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.15),transparent_46%)]" />
          <ComposableMap projection="geoEqualEarth" className="h-full w-full">
            <ZoomableGroup
              center={center}
              zoom={zoom}
              onMoveEnd={({ coordinates, zoom: nextZoom }: { coordinates: [number, number]; zoom: number }) => {
                setCenter(coordinates);
                setZoom(Number(nextZoom.toFixed(2)));
              }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
                  geographies.map((geo: { rsmKey: string }) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      className="fill-slate-900 stroke-[0.4] stroke-cyan-300/25 outline-none"
                      style={{
                        default: { fill: "rgba(8, 24, 45, 0.98)", outline: "none" },
                        hover: { fill: "rgba(14, 62, 95, 0.98)", outline: "none" },
                        pressed: { fill: "rgba(14, 62, 95, 0.98)", outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {visibleSites.map(site => (
                <Marker key={site.id} coordinates={site.coordinates}>
                  <g>
                    <circle r={9} fill={site.accent} fillOpacity={0.14} className="animate-ping-slow" />
                    <circle r={4.2} fill={site.accent} className="drop-shadow-[0_0_8px_rgba(65,224,255,0.8)]" />
                    <circle r={1.8} fill="#e2fbff" />
                  </g>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {counts.map(item => (
          <div key={item.category} className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{copy.categories[item.category]}</p>
            <p className="mt-1 text-base font-semibold text-white">{item.count}</p>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={resetView} className="mt-4 w-full rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
        {copy.reset}
      </Button>

      <div className="mt-4 space-y-2.5">
        {visibleSites.slice(0, 4).map(site => (
          <div key={site.id} className="flex items-center justify-between rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{site.name}</p>
              <p className="mt-1 text-xs text-slate-500">{site.country}</p>
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", site.category === "swine" ? "bg-cyan-400/12 text-cyan-100" : site.category === "feed" ? "bg-emerald-400/12 text-emerald-100" : site.category === "poultry" ? "bg-violet-400/12 text-violet-100" : "bg-amber-400/12 text-amber-100")}>
              {copy.categories[site.category]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// React.memo 避免父级重渲染时开销（地图 TopoJSON 解析成本较高）
export const GlobalAssetMap = memo(GlobalAssetMapInner);
