import sys, json, geopandas as gpd
from shapely.geometry import box, Polygon
D,S=sys.argv[1],sys.argv[2]; CRS=26913
hd=gpd.read_file(f"{D}/Shapefiles & JSONS/Boundaries/CO_House_Districts_2021_2026-10-07.gpkg").to_crs(CRS)
cty=gpd.read_file(f"{D}/Shapefiles & JSONS/Boundaries/CO_Counties_Census_Esri_2026-10-07.gpkg").to_crs(CRS)
h=hd[hd.District==49].geometry.iloc[0]
x0,y0,x1,y1=h.bounds; W,H=900,700
cx,cy=(x0+x1)/2,(y0+y1)/2; hw=max(x1-x0,(y1-y0)*W/H)*0.58
frame=box(cx-hw,cy-hw*H/W,cx+hw,cy+hw*H/W)
fx0,fy0,fx1,fy1=frame.bounds; s=W/(fx1-fx0)
tf=lambda x,y:((x-fx0)*s,(fy1-y)*s)
def path(geom):
    out=[]
    for p in ([geom] if isinstance(geom,Polygon) else list(getattr(geom,'geoms',[]))):
        if not isinstance(p,Polygon) or p.is_empty: continue
        for r in [p.exterior,*p.interiors]:
            pts=[tf(x,y) for x,y in r.coords]
            if len(pts)>2: out.append("M"+"L".join(f"{a:.1f},{b:.1f}" for a,b in pts)+"Z")
    return "".join(out)
ds=hd[hd.intersects(frame)].copy(); ds['geometry']=ds.geometry.intersection(frame).simplify(150)
cs=cty[cty.intersects(h)].copy(); cs['geometry']=cs.geometry.intersection(h).simplify(150)
out={"w":W,"h":H,
 "districts":[{"n":int(r.District),"d":path(r.geometry)} for r in ds.itertuples()],
 "hd":path(h.simplify(150)),
 "cty":[{"n":r.NAME.replace(" County",""),"d":path(r.geometry),"p":tf(*r.geometry.representative_point().coords[0])} for r in cs.itertuples() if r.geometry.area>5e6],
}
open(f"{S}/hd.js","w").write("window.HD="+json.dumps(out,separators=(",",":"))+";")
print(len(out['districts']), [c['n'] for c in out['cty']], len(open(f"{S}/hd.js").read())//1024,"KB")
