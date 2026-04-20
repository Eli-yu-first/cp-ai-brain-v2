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
import { ChevronDown, Minus, Plus, Radar, Globe, Sparkles, MapPin } from "lucide-react";
import { memo, useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { categoryOrder, filterSitesByCategories, getCategoryCounts, globalSites as sites, type SiteCategory } from "./globalAssetMapData";

const WORLD_MAP_CDN_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Topology = {
  type: string;
  objects: {
    countries: {
      type: string;
      geometries: Array<{
        type: string;
        arcs: number[][] | number[][][];
        id: string;
        properties?: { name?: string };
      }>;
    };
  };
  arcs: number[][][];
};

function GlobalAssetMapInner() {
  const { language } = useLanguage();
  const [zoom, setZoom] = useState(1.08);
  const [center, setCenter] = useState<[number, number]>([100, 18]);
  const [selectedCategories, setSelectedCategories] = useState<SiteCategory[]>(categoryOrder);
  const [topologyData, setTopologyData] = useState<Topology | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Spring animations for smooth transitions
  const zoomSpring = useSpring(zoom, {
    stiffness: 100,
    damping: 15,
  });
  
  const opacitySpring = useSpring(1, {
    duration: 0.6,
  });

  useEffect(() => {
    setIsLoading(true);
    fetch(WORLD_MAP_CDN_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch world map: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setTopologyData(data);
        setMapError(null);
      })
      .catch(err => {
        console.error("Failed to load world map:", err);
        setMapError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

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
      loading: "地图加载中...",
      error: "地图加载失败",
      siteDetails: "节点详情",
      country: "国家",
      category: "业态",
      coordinates: "坐标",
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
      loading: "Loading map...",
      error: "Map load failed",
      siteDetails: "Site Details",
      country: "Country",
      category: "Category",
      coordinates: "Coordinates",
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
      loading: "マップ読み込み中...",
      error: "マップ読み込み失敗",
      siteDetails: "サイト詳細",
      country: "国",
      category: "カテゴリー",
      coordinates: "座標",
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
      loading: "กำลังโหลดแผนที่...",
      error: "โหลดแผนที่ล้มเหลว",
      siteDetails: "รายละเอียดไซต์",
      country: "ประเทศ",
      category: "หมวดหมู่",
      coordinates: "พิกัด",
    },
  }[language];

  const visibleSites = useMemo(() => filterSitesByCategories(sites, selectedCategories), [selectedCategories]);
  const counts = useMemo(() => getCategoryCounts(visibleSites), [visibleSites]);
  const selectedSiteData = useMemo(() => visibleSites.find(site => site.id === selectedSite), [visibleSites, selectedSite]);

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)),rgba(8,14,24,0.92)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] relative overflow-hidden"
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-400/30"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              opacity: 0.3 + Math.random() * 0.7,
            }}
            animate={{
              x: [null, Math.random() * 100 + "%"],
              y: [null, Math.random() * 100 + "%"],
              opacity: [null, 0, 0.5, 0],
            }}
            transition={{
              duration: 10 + Math.random() * 20,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Globe className="h-5 w-5 text-cyan-400" />
              </motion.div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/55">{copy.eyebrow}</p>
            </div>
            <h3 className="mt-2 text-base font-semibold text-white">{copy.title}</h3>
          </motion.div>
          <motion.div 
            className="data-chip text-xs"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Radar className="h-3.5 w-3.5" />
            {copy.totalSites} {visibleSites.length}
          </motion.div>
        </div>

        <motion.p 
          className="mt-3 text-sm leading-6 text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {copy.body}
        </motion.p>

        <motion.div 
          className="mt-4 flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-2.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div>
            <p className="text-xs font-medium text-white">{copy.filterTitle}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">{copy.filterHint}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] group">
                <span>{selectedCategories.length === categoryOrder.length ? copy.clearAll : `${selectedCategories.length} / ${categoryOrder.length}`}</span>
                <motion.div
                  animate={{ rotate: selectedCategories.length === categoryOrder.length ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="ml-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                </motion.div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-52 rounded-[20px] border-white/10 bg-slate-950/95 p-2 text-slate-100"
            >
              <DropdownMenuLabel className="text-xs uppercase tracking-[0.22em] text-slate-500">{copy.filterTitle}</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/8" />
              {categoryOrder.map((category, index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <DropdownMenuCheckboxItem
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={checked => toggleCategory(category, Boolean(checked))}
                    className="rounded-xl px-3 py-2 text-slate-200 focus:bg-cyan-400/12 focus:text-cyan-50 transition-colors duration-200"
                  >
                    {copy.categories[category]}
                  </DropdownMenuCheckboxItem>
                </motion.div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>

        <motion.div 
          className="mt-4 overflow-hidden rounded-[24px] border border-cyan-400/10 bg-[radial-gradient(circle_at_50%_40%,rgba(65,224,255,0.18),transparent_38%),linear-gradient(180deg,rgba(4,12,24,0.96),rgba(6,15,30,0.94))]"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between border-b border-white/6 px-3 py-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-500">
              <span>{copy.zoom}</span>
              <motion.span 
                className="text-cyan-200/80"
                key={zoom}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {zoom.toFixed(2)}x
              </motion.span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                size="icon" 
                variant="outline" 
                onClick={zoomOut} 
                className="h-8 w-8 rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:scale-105 transition-transform duration-200"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                size="icon" 
                variant="outline" 
                onClick={zoomIn} 
                className="h-8 w-8 rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:scale-105 transition-transform duration-200"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="relative h-[230px]" ref={mapRef}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.15),transparent_46%)]" />
            
            {/* Loading animation */}
            <AnimatePresence>
              {isLoading && (
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <motion.div 
                      className="h-8 w-8 rounded-full border-2 border-cyan-500 border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.span 
                      className="text-sm text-slate-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {copy.loading}
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Error message */}
            <AnimatePresence>
              {mapError && (
                <motion.div 
                  className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="text-center p-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <Sparkles className="h-8 w-8 text-rose-400 mx-auto mb-2" />
                    </motion.div>
                    <span className="text-sm text-rose-400">{copy.error}: {mapError}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Map content */}
            <AnimatePresence>
              {topologyData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ComposableMap projection="geoEqualEarth" className="h-full w-full">
                    <ZoomableGroup
                      center={center}
                      zoom={zoom}
                      onMoveEnd={({ coordinates, zoom: nextZoom }: { coordinates: [number, number]; zoom: number }) => {
                        setCenter(coordinates);
                        setZoom(Number(nextZoom.toFixed(2)));
                      }}
                    >
                      <Geographies geography={topologyData}>
                        {({ geographies }: { geographies: Array<{ rsmKey: string }> }) =>
                          geographies.map((geo: { rsmKey: string }) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              className="fill-slate-900 stroke-[0.4] stroke-cyan-300/25 outline-none cursor-pointer"
                              style={{
                                default: { fill: "rgba(8, 24, 45, 0.98)", outline: "none", transition: "fill 0.3s ease" },
                                hover: { fill: "rgba(14, 62, 95, 0.98)", outline: "none", transition: "fill 0.3s ease" },
                                pressed: { fill: "rgba(14, 62, 95, 0.98)", outline: "none", transition: "fill 0.3s ease" },
                              }}
                            />
                          ))
                        }
                      </Geographies>

                      {/* Site markers with animations */}
                      {visibleSites.map((site, index) => (
                        <motion.g
                          key={site.id}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05, duration: 0.5, type: "spring" }}
                          whileHover={{ scale: 1.1 }}
                          onClick={() => setSelectedSite(site.id === selectedSite ? null : site.id)}
                        >
                          <Marker coordinates={site.coordinates}>
                            <g>
                              <motion.circle 
                                r={9} 
                                fill={site.accent} 
                                fillOpacity={0.14} 
                                className="animate-ping-slow"
                                animate={{
                                  r: [9, 12, 9],
                                  opacity: [0.14, 0.2, 0.14],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                }}
                              />
                              <motion.circle 
                                r={4.2} 
                                fill={site.accent} 
                                className="drop-shadow-[0_0_8px_rgba(65,224,255,0.8)]"
                                animate={{
                                  scale: [1, 1.05, 1],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                }}
                              />
                              <circle r={1.8} fill="#e2fbff" />
                            </g>
                          </Marker>
                        </motion.g>
                      ))}
                    </ZoomableGroup>
                  </ComposableMap>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Category counts with animations */}
        <motion.div 
          className="mt-4 grid grid-cols-2 gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {counts.map((item, index) => (
            <motion.div 
              key={item.category}
              className="rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2.5 hover:border-cyan-400/30 hover:bg-white/[0.05] transition-all duration-300"
              whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(6,182,212,0.15)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{copy.categories[item.category]}</p>
              <motion.p 
                className="mt-1 text-base font-semibold text-white"
                key={item.count}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {item.count}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>

        {/* Reset button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button 
            type="button" 
            variant="outline" 
            onClick={resetView} 
            className="mt-4 w-full rounded-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08] hover:border-cyan-400/30 transition-all duration-300 group"
          >
            <span className="group-hover:translate-x-1 transition-transform duration-300">{copy.reset}</span>
          </Button>
        </motion.div>

        {/* Selected site details */}
        <AnimatePresence>
          {selectedSiteData && (
            <motion.div
              className="mt-4 rounded-[20px] border border-cyan-400/20 bg-cyan-400/[0.05] p-4"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    <h4 className="text-sm font-semibold text-white">{copy.siteDetails}</h4>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{copy.country}</span>
                      <span className="text-sm text-white">{selectedSiteData.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{copy.category}</span>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", 
                        selectedSiteData.category === "swine" ? "bg-cyan-400/12 text-cyan-100" : 
                        selectedSiteData.category === "feed" ? "bg-emerald-400/12 text-emerald-100" : 
                        selectedSiteData.category === "poultry" ? "bg-violet-400/12 text-violet-100" : 
                        "bg-amber-400/12 text-amber-100"
                      )}>
                        {copy.categories[selectedSiteData.category]}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{copy.coordinates}</span>
                      <span className="text-sm text-white">{selectedSiteData.coordinates[0].toFixed(2)}, {selectedSiteData.coordinates[1].toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <motion.button
                  onClick={() => setSelectedSite(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-full transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Site list with animations */}
        <motion.div 
          className="mt-4 space-y-2.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {visibleSites.slice(0, 4).map((site, index) => (
            <motion.div 
              key={site.id}
              className="flex items-center justify-between rounded-[18px] border border-white/8 bg-white/[0.03] px-3 py-2.5 hover:border-cyan-400/30 hover:bg-white/[0.05] transition-all duration-300 cursor-pointer"
              whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(6,182,212,0.1)" }}
              onClick={() => setSelectedSite(site.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{site.name}</p>
                <p className="mt-1 text-xs text-slate-500">{site.country}</p>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", 
                site.category === "swine" ? "bg-cyan-400/12 text-cyan-100" : 
                site.category === "feed" ? "bg-emerald-400/12 text-emerald-100" : 
                site.category === "poultry" ? "bg-violet-400/12 text-violet-100" : 
                "bg-amber-400/12 text-amber-100"
              )}>
                {copy.categories[site.category]}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

export const GlobalAssetMap = memo(GlobalAssetMapInner);