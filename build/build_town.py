import sys, json
import geopandas as gpd, pandas as pd, pyogrio
from shapely.geometry import box, Polygon
from shapely.ops import unary_union
D,S=sys.argv[1],sys.argv[2]; CRS=26913
mun=gpd.read_file(f"{D}/Shapefiles & JSONS/Boundaries/CO_Municipal_Boundaries_PropTaxMap2025_2026-10-07.gpkg").to_crs(CRS)
ly=mun[mun.Local_Government_Name==sys.argv[3]].geometry.union_all()
x0,y0,x1,y1=ly.bounds; cx,cy=(x0+x1)/2,(y0+y1)/2
W,H=760,640; half_w=max(x1-x0,(y1-y0)*W/H)*1.4
frame=box(cx-half_w,cy-half_w*H/W,cx+half_w,cy+half_w*H/W)
fb=gpd.GeoSeries([frame],crs=CRS).to_crs(4326).total_bounds
par=pyogrio.read_dataframe(f"{D}/Analysis/flood-x-parcel/data/Boulder_parcels.gpkg",bbox=tuple(fb)).to_crs(CRS)
par=par[par.geometry.notna()].copy()
par['geometry']=par.geometry.buffer(0)
par=par.drop_duplicates(subset=['account']).copy()
fl=gpd.read_file(f"{D}/Analysis/flood-x-parcel/data/Boulder_nfhl_100yr.gpkg",bbox=tuple(fb)).to_crs(CRS)
flu=unary_union(fl.geometry.buffer(0))
hx=gpd.read_file(f"{S}/raw/boulder_hex.geojson").to_crs(CRS)
hx=hx[hx.intersects(frame)]
hi=unary_union(hx[hx.MAJORITY==4].geometry.buffer(0.5))
par['pf']=par.geometry.intersection(flu).area/par.geometry.area
pts=par.geometry.representative_point()
par['fire']=pts.within(hi)
par['flood']=par.pf>=0.5
par['cat']=[('both' if a and b else 'flood' if a else 'fire' if b else 'none') for a,b in zip(par.flood,par.fire)]
par['inly']=pts.within(ly)
par['val']=pd.to_numeric(par.a2025ActVal,errors='coerce').fillna(pd.to_numeric(par.a2024ActVal,errors='coerce'))
L=par[par.inly]
stats={k:{"n":int((L.cat.isin([k] if k!='flood_any' else ['flood','both'])).sum())} for k in ['both','flood','fire','none']}
stats['flood_any']=int(L.flood.sum()); stats['fire_any']=int(L.fire.sum()); stats['both']=int((L.flood&L.fire).sum()); stats['total']=len(L)
stats['val_flood']=float(L[L.flood].val.sum()); stats['val_fire']=float(L[L.fire].val.sum()); stats['val_both']=float(L[L.flood&L.fire].val.sum())
stats['any']=int((L.flood|L.fire).sum())
print(json.dumps(stats))
def make_tf(bounds,W,H):
    x0,y0,x1,y1=bounds; s=min(W/(x1-x0),H/(y1-y0))
    return lambda x,y:(( x-x0)*s,(y1-y)*s)
tf=make_tf(frame.bounds,W,H)
def path(geom):
    out=[]
    polys=[geom] if isinstance(geom,Polygon) else list(getattr(geom,'geoms',[]))
    for p in polys:
        if not isinstance(p,Polygon) or p.is_empty: continue
        for ring in [p.exterior,*p.interiors]:
            pts=[tf(x,y) for x,y in ring.coords]
            if len(pts)<3: continue
            out.append("M"+"L".join(f"{a:.1f},{b:.1f}" for a,b in pts)+"Z")
    return "".join(out)
clip=par[par.intersects(frame)].copy(); clip['geometry']=clip.geometry.intersection(frame).simplify(2)
cats={c:path(unary_union(clip[clip.cat==c].geometry.buffer(0.3)).simplify(1.5)) for c in ['none','flood','fire','both']}
out={"w":W,"h":H,"parcels":cats,
 "flood":path(flu.intersection(frame).simplify(5)),
 "fire":path(hi.intersection(frame).simplify(8)),
 "town":path(ly.simplify(3)),
 "label":tf(*ly.representative_point().coords[0])}
open(f"{S}/town.js","w").write("window.TOWN="+json.dumps(out,separators=(",",":"))+";")
print(len(open(f"{S}/town.js").read())//1024,"KB", len(clip))
