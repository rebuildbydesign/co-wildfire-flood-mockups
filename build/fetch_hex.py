import json, sys, requests
U="https://services3.arcgis.com/unh8qj8OkZd7wlfi/arcgis/rest/services/H3_Hexagons_L9_CO_UTM13N_halfmile_mf_union_hydro/FeatureServer/0/query"
BB='{"xmin":-105.70,"ymin":39.91,"xmax":-105.05,"ymax":40.27,"spatialReference":{"wkid":4326}}'
feats=[]; off=0
while True:
    r=requests.get(U,params=dict(where="MAJORITY>=3",geometry=BB,geometryType="esriGeometryEnvelope",inSR=4326,spatialRel="esriSpatialRelIntersects",outFields="MAJORITY",outSR=4326,returnGeometry="true",resultOffset=off,resultRecordCount=2000,f="geojson",geometryPrecision=5),timeout=120).json()
    fs=r.get("features",[]); feats+=fs; off+=len(fs)
    print(off, file=sys.stderr)
    if not fs or not r.get("properties",{}).get("exceededTransferLimit") and len(fs)<2000: break
json.dump({"type":"FeatureCollection","features":feats},open(sys.argv[1],"w"))
print(len(feats))
