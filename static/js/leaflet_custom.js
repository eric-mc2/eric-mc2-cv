/* global L */

function get_bounds(fig) {
    if ('lat' in fig['data'][0]) {
        // Data are list of points
        var minLat = Math.min(...fig.data.flatMap(d => 
        d.lat.filter(val => val != null && !isNaN(val))
        ));
        var maxLat = Math.max(...fig.data.flatMap(d => 
            d.lat.filter(val => val != null && !isNaN(val))
        ));
        var minLon = Math.min(...fig.data.flatMap(d => 
            d.lon.filter(val => val != null && !isNaN(val))
        ));
        var maxLon = Math.max(...fig.data.flatMap(d => 
            d.lon.filter(val => val != null && !isNaN(val))
        ));
    } else if ('geojson' in fig['data'][0]) {
        // Data are list of polygons
        const lons = fig['data']
            .flatMap(d => d['geojson']['features'])
            .flatMap(f => f['geometry']['coordinates'])
            .flatMap(cc => cc.map(([x, y]) => x))
            .filter(x => x != null && !isNaN(x));
        const lats = fig['data']
            .flatMap(d => d['geojson']['features'])
            .flatMap(f => f['geometry']['coordinates'])
            .flatMap(cc => cc.map(([x, y]) => y))
            .filter(y => y != null && !isNaN(y));
        var minLat = Math.min(...lats);
        var maxLat = Math.max(...lats);
        var minLon = Math.min(...lons);
        var maxLon = Math.max(...lons);
    }
    return [minLat, maxLat, minLon, maxLon]
}

export function plot(fig, div_id) {
    // Initialize Leaflet map first
    const [minLat, maxLat, minLon, maxLon] = get_bounds(fig)
    const centerLat = (minLat + maxLat) / 2
    const centerLon = (minLon + maxLon) / 2
    const map = L.map(div_id).setView([centerLat, centerLon], 10);
    
    // Carto is less visually distracting
    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png').addTo(map);
    // OSM style is a little too busy for this.
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    
    // Create layer control to switch between facets
    // So far I'm only graphing faceted polygon data. 
    // The line data is not faceted. 
    if (fig.data[0]['type'] === "choropleth") {
        var layerControl = L.control.layers(null, {}, { collapsed: false }).addTo(map);
        var layers = {};  // Store layers for later reference
    }
    
    // Convert Plotly traces to Leaflet layers
    fig.data.forEach((trace, traceIndex) => {
        if (trace.type === 'scattergeo' || trace.type === 'scatter') {
            // Line plot
            const latitudes = trace.lat;
            const longitudes = trace.lon;
            const color = trace.line?.color || 'blue';
            const weight = trace.line?.width || 2;
            
            let points = [];
            
            for (let i = 0; i < latitudes.length; i++) {
                const lat = latitudes[i];
                const lon = longitudes[i];
                
                if (lat != null && lon != null && !isNaN(lat) && !isNaN(lon)) {
                    // Add the point to the current segment if it's valid
                    points.push([lat, lon]);
                } else if (points.length) {
                    // End of a segment, draw it and reset points
                    L.polyline(points, { color, weight }).addTo(map);
                    points = []; // Reset points for the next segment
                }
            }
            
            // Draw the last segment if it exists (in case there's no trailing null)
            if (points.length) {
                L.polyline(points, { color, weight }).addTo(map);
            }
        }
        else if (trace.type === 'scattermap') {
            // Point plot
            const color = trace.marker?.color || 'blue';
            const points = trace.lat
                            .map((lat,i) => [trace.lon[i], lat])
                            .filter(([lon,lat]) => lon != null && !isNaN(lon));
            for (const [lon,lat] of points) {
                L.circle([lat,lon], {'color': color, 'radius': 20}).addTo(map);
            }
            
        }
        else if (trace.type === 'choropleth') {
            const facetName = trace.name || `Layer ${traceIndex + 1}`;

            const layer = L.geoJSON(trace.geojson, {
                style: feature => ({
                    fillColor: feature.properties.cmap,
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                })}).addTo(map);
            
            // Add to layer control
            layerControl.addOverlay(layer, facetName);
            layers[facetName] = layer;

            // Show first layer by default
            if (traceIndex === 0) {
                layer.addTo(map);
            }
        }
    });

    // Optional: Add radio button behavior (only one layer visible at a time)
    map.on('overlayadd', e => {
        Object.entries(layers).forEach(([name, layer]) => {
            if (name !== e.name) {
                map.removeLayer(layer);
                layerControl.removeLayer(layer);
                layerControl.addOverlay(layer, name);
            }
        })
    });
};