# Colorado Wildfire + Flood Map: mockups

Target screens for Rebuild by Design's Colorado wildfire and flood map, so the mapping team builds toward the same thing. Adapted from Rebuild by Design's [NJ Underwater map](https://rebuildbydesign.github.io/nj-flood-risk/).

**The numbers on these screens are placeholders, not findings.** Map shapes are real data.

## What's on the page

1. **The target:** four screens of one tool (statewide on load, Boulder County, Jamestown, House District 49), with a table under each one listing where every element's data comes from.
2. **How we get there:** the steps from raw data to the map, what "clean" means for each file, and the files the map will read.
3. **What's in, what's out:** scope guardrails.

## Files

| Path | What it is |
|---|---|
| `index.html` | The page |
| `styles.css` | Styles |
| `scripts.js` | Draws the maps and popups |
| `data/geo.js` | Colorado counties and western Boulder County layers (FEMA 100-year floodplain, state wildfire hexagons, towns) |
| `data/town.js` | Jamestown parcels coloured by hazard |
| `data/hd.js` | House District 49 and neighbouring districts |
| `build/` | Python scripts that made the `data/` files |

No build step. Open `index.html` in a browser, or publish with GitHub Pages from `main`.

## Rebuilding the map shapes

Needs Python with geopandas. `DATA` is the project's data folder (boundaries, parcels, Boulder FEMA layer); `OUT` is any working folder.

```
python build/fetch_hex.py OUT/raw/boulder_hex.geojson   # state wildfire hexagons around Boulder
python build/build_geo.py DATA OUT                       # writes OUT/geo.js
python build/build_town.py DATA OUT Jamestown            # writes OUT/town.js
python build/build_hd.py DATA OUT                        # writes OUT/hd.js
```

Then copy the three `.js` files into `data/`.

## Sources

FEMA National Flood Hazard Layer; Colorado Wildfire Resiliency Code hexagons (SB23-166, draft); State of Colorado public parcels, county, municipal and House district boundaries.
