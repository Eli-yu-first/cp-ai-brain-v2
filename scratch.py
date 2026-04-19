import sys

with open('client/src/pages/PorkMap.tsx', 'r') as f:
    content = f.read()

# Add DropdownMenu imports
if 'DropdownMenuCheckboxItem' not in content:
    content = content.replace('import { Badge } from "@/components/ui/badge";',
        'import { Badge } from "@/components/ui/badge";\nimport { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";\nimport { Lock, Unlock, Layers } from "lucide-react";')

# Add layers state
if 'const [layers, setLayers]' not in content:
    content = content.replace('const [scenario, setScenario] = useState<ScenarioKey>("balanced");',
        'const [scenario, setScenario] = useState<ScenarioKey>("balanced");\n  const [isMapLocked, setIsMapLocked] = useState(false);\n  const [activeLayers, setActiveLayers] = useState(["pig"]);')

# Add Dropdown and Lock button
new_dropdown = """              <div className="min-w-[180px]">
                <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">产业资产图层</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between rounded-2xl border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
                      <span className="flex items-center gap-2"><Layers className="h-4 w-4" /> 选择图层</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 rounded-xl border-white/10 bg-slate-950/95 text-slate-100">
                    {[
                      { id: "pig", label: "养猪场节点" },
                      { id: "poultry", label: "家禽产业" },
                      { id: "feed", label: "饲料加工" },
                      { id: "slaughter", label: "屠宰中心" }
                    ].map(layer => (
                      <DropdownMenuCheckboxItem
                        key={layer.id}
                        checked={activeLayers.includes(layer.id)}
                        onCheckedChange={(c) => setActiveLayers(prev => c ? [...prev, layer.id] : prev.filter(x => x !== layer.id))}
                      >
                        {layer.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>"""

if '<div className="min-w-[180px]" id="layers-placeholder">' not in content and '选择图层' not in content:
    content = content.replace('              <div className="min-w-[180px]">\n                <p className="mb-2 text-[11px]',
        new_dropdown + '\n              <div className="min-w-[180px]">\n                <p className="mb-2 text-[11px]', 1)

# Add lock button below map header
lock_btn = """                  <Button variant="ghost" size="icon" onClick={() => setIsMapLocked(!isMapLocked)} className="h-7 w-7 text-cyan-400 hover:bg-cyan-400/20">
                    {isMapLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </Button>"""
if '<Lock' not in content:
    # find where to insert
    content = content.replace('{current.marketNodes}\n                  </span>', '{current.marketNodes}\n                  </span>\n' + lock_btn)


# Replace ComposableMap projection
if 'geoMercator' in content:
    content = content.replace('projection="geoMercator" projectionConfig={{ center: [104, 36], scale: 720 }}',
       'projection="geoOrthographic" projectionConfig={{ scale: 660, rotate: [-104, -36, 0] }}')

# Add pointer-events-none conditionally
# Actually, better to disable ZoomableGroup
# A reliable way: Replace `<ZoomableGroup center={[104, 36]} zoom={1}>`
# With `<ZoomableGroup center={[104, 36]} zoom={1} minZoom={isMapLocked?1:1} maxZoom={isMapLocked?1:8}>`
# Wait wait, if zoom={1} it might be locked. 

content = content.replace('<ZoomableGroup center={[104, 36]} zoom={1}>',
                          '<ZoomableGroup center={[104, 36]} zoom={1} filterZoomEvent={() => !isMapLocked} filterPanEvent={() => !isMapLocked}>')


with open('client/src/pages/PorkMap.tsx', 'w') as f:
    f.write(content)

print("Updated PorkMap.tsx")

