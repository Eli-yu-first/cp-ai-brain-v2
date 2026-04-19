export type SiteCategory = "swine" | "poultry" | "feed" | "slaughter";

export type GlobalSite = {
  id: string;
  name: string;
  country: string;
  category: SiteCategory;
  coordinates: [number, number];
  accent: string;
};

export const categoryOrder: SiteCategory[] = ["swine", "poultry", "feed", "slaughter"];

export const globalSites: GlobalSite[] = [
  { id: "xiangyang", name: "襄阳一体化猪场", country: "中国", category: "swine", coordinates: [112.1441, 32.0424], accent: "#41e0ff" },
  { id: "xianning", name: "咸宁生猪全链基地", country: "中国", category: "swine", coordinates: [114.3225, 29.8413], accent: "#41e0ff" },
  { id: "dongnai", name: "越南南部养殖节点", country: "越南", category: "swine", coordinates: [107.1676, 11.0686], accent: "#41e0ff" },
  { id: "tarlac", name: "菲律宾猪场集群", country: "菲律宾", category: "swine", coordinates: [120.5979, 15.4755], accent: "#41e0ff" },
  { id: "korat", name: "泰国养殖枢纽", country: "泰国", category: "swine", coordinates: [102.102, 14.9799], accent: "#41e0ff" },
  { id: "bangna-feed", name: "泰国饲料产线", country: "泰国", category: "feed", coordinates: [100.6051, 13.6682], accent: "#4ade80" },
  { id: "hyderabad-feed", name: "印度饲料节点", country: "印度", category: "feed", coordinates: [78.4867, 17.385], accent: "#4ade80" },
  { id: "dongnai-poultry", name: "越南鸡事业基地", country: "越南", category: "poultry", coordinates: [106.824, 10.95], accent: "#a78bfa" },
  { id: "saraburi-poultry", name: "泰国禽类加工基地", country: "泰国", category: "poultry", coordinates: [100.9167, 14.5333], accent: "#a78bfa" },
  { id: "wuhan-slaughter", name: "武汉屠宰分割中心", country: "中国", category: "slaughter", coordinates: [114.3055, 30.5928], accent: "#f59e0b" },
  { id: "brazil-food", name: "巴西食品节点", country: "巴西", category: "slaughter", coordinates: [-46.6333, -23.5505], accent: "#f59e0b" },
  { id: "uk-food", name: "英国加工节点", country: "英国", category: "slaughter", coordinates: [-0.1276, 51.5072], accent: "#f59e0b" },
];

export function getCategoryCounts(sites: GlobalSite[]) {
  return categoryOrder.map(category => ({
    category,
    count: sites.filter(site => site.category === category).length,
  }));
}

export function filterSitesByCategories(sites: GlobalSite[], categories: SiteCategory[]) {
  if (!categories.length) return sites;
  const allowed = new Set(categories);
  return sites.filter(site => allowed.has(site.category));
}
