import sys, json
import geopandas as gpd
from shapely.geometry import box, Polygon, MultiPolygon
from shapely.ops import unary_union
D, S = sys.argv[1], sys.argv[2]
CRS = 26913
cty = gpd.read_file(f"{D}/Shapefiles & JSONS/Boundaries/CO_Counties_Census_Esri_2026-10-07.gpkg").to_crs(CRS)
cty['geometry'] = cty.geometry.simplify(900)

def path(geom, tf):
    out=[]
    polys = [geom] if isinstance(geom, Polygon) else list(getattr(geom,'geoms',[]))
    for p in polys:
        if not isinstance(p, Polygon): continue
        for ring in [p.exterior, *p.interiors]:
            pts=[tf(x,y) for x,y in ring.coords]
            if len(pts)<3: continue
            out.append("M"+"L".join(f"{a:.1f},{b:.1f}" for a,b in pts)+"Z")
    return "".join(out)

def make_tf(bounds, W, H, pad=0):
    x0,y0,x1,y1=bounds
    s=min((W-2*pad)/(x1-x0),(H-2*pad)/(y1-y0))
    ox=(W-(x1-x0)*s)/2; oy=(H-(y1-y0)*s)/2
    return lambda x,y:(ox+(x-x0)*s, oy+(y1-y)*s)

# statewide
W,H=820,600
tf=make_tf(cty.total_bounds,W,H,10)
state={"w":W,"h":H,"counties":[{"name":r.NAME.replace(" County",""),"d":path(r.geometry,tf)} for r in cty.itertuples()]}
c=cty[cty.NAME=="Boulder County"].geometry.iloc[0].centroid
state["boulder_c"]=tf(c.x,c.y)

# Boulder zoom
b = gpd.read_file(f"{D}/Shapefiles & JSONS/Boundaries/CO_Counties_Census_Esri_2026-10-07.gpkg").to_crs(CRS)
bo = b[b.NAME=="Boulder County"].geometry.iloc[0]
x0,y0,x1,y1=bo.bounds; px=(x1-x0)*0.08; py=(y1-y0)*0.12
frame=box(x0-px,y0-py,x1+px,y1+py)
ZW,ZH=1100,700
# widen frame to aspect
fx0,fy0,fx1,fy1=frame.bounds; cx=(fx0+fx1)/2; cy=(fy0+fy1)/2
w=fx1-fx0; h=fy1-fy0
if w/h < ZW/ZH: w=h*ZW/ZH
else: h=w*ZH/ZW
frame=box(cx-w/2,cy-h/2,cx+w/2,cy+h/2)
ztf=make_tf(frame.bounds,ZW,ZH,0)
nb=b[b.intersects(frame)].copy(); nb['geometry']=nb.geometry.intersection(frame).simplify(60)
mun=gpd.read_file(f"{D}/Shapefiles & JSONS/Boundaries/CO_Municipal_Boundaries_PropTaxMap2025_2026-10-07.gpkg").to_crs(CRS)
mun=mun[mun.intersects(bo)].copy(); mun['geometry']=mun.geometry.simplify(40)
fl=gpd.read_file(f"{D}/Analysis/flood-x-parcel/data/Boulder_nfhl_100yr.gpkg").to_crs(CRS)
flu=unary_union(fl.geometry.buffer(0)).intersection(bo).simplify(25)
hx=gpd.read_file(f"{S}/raw/boulder_hex.geojson").to_crs(CRS)
hi=unary_union(hx[hx.MAJORITY==4].geometry.buffer(1)).intersection(bo).simplify(40)
mo=unary_union(hx[hx.MAJORITY==3].geometry.buffer(1)).intersection(bo).simplify(40)
namecol=[c for c in mun.columns if c=='Local_Government_Name']
print("mun cols", namecol, list(mun.columns)[-15:], file=sys.stderr)
zoom={"w":ZW,"h":ZH,
 "neighbors":[{"name":r.NAME.replace(" County",""),"d":path(r.geometry,ztf)} for r in nb.itertuples() if r.NAME!="Boulder County"],
 "boulder":path(bo.simplify(60),ztf),
 "towns":[{"d":path(g,ztf)} for g in mun.geometry],
 "flood":path(flu,ztf),"fire_high":path(hi,ztf),"fire_mod":path(mo,ztf)}
labels={}
for r in nb.itertuples():
    if r.NAME=="Boulder County": continue
    p=r.geometry.representative_point(); labels[r.NAME.replace(" County","")]=ztf(p.x,p.y)
zoom["labels"]=labels
if namecol:
    zoom["townlabels"]=[{"n":getattr(r,namecol[0]),"p":ztf(r.geometry.representative_point().x,r.geometry.representative_point().y),"a":r.geometry.area} for r in mun.itertuples()]
js="window.GEO="+json.dumps({"state":state,"zoom":zoom},separators=(",",":"))+";"
open(f"{S}/geo.js","w").write(js)
print(len(js)//1024,"KB")
