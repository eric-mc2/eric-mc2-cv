/* global Plotly */

export function plot(fig, div_id) {
    const mode = fig.data[0]?.mode
    const figtype = fig.data[0]?.type
    if (figtype === 'scatter' & mode === 'line') {
        Plotly.react(div_id, [...fig.data], {...fig.layout});
    } else {
        plot_geo(fig, div_id)
    }
};

function plot_geo(fig, div_id) {
    const minLat = Math.min(...fig.data.flatMap(d => 
        d.lat.filter(val => val != null && !isNaN(val))
    ));
    const maxLat = Math.max(...fig.data.flatMap(d => 
        d.lat.filter(val => val != null && !isNaN(val))
    ));
    const minLon = Math.min(...fig.data.flatMap(d => 
        d.lon.filter(val => val != null && !isNaN(val))
    ));
    const maxLon = Math.max(...fig.data.flatMap(d => 
        d.lon.filter(val => val != null && !isNaN(val))
    ));

    const basemapFigure = {
        data: [{
            type: 'scattergeo',
            lon: [minLon, maxLon, maxLon, minLon, minLon],
            lat: [minLat, minLat, maxLat, maxLat, minLat],
            mode: 'lines',
            line: {
                width: .1,
                color: 'rgba(0,0,0,0.2)'
            }
        }],
        layout: {
            geo: {
                projection: {
                    type: 'web-mercator'
                },
                center: {
                    lat: (minLat + maxLat) / 2,
                    lon: (minLon + maxLon) / 2
                },
                // Calculate appropriate zoom level based on bounds
                lonaxis: {
                    range: [minLon - .1, maxLon + .1]
                },
                lataxis: {
                    range: [minLat - .1, maxLat + .1]
                },
                showframe: false,
                resolution: 50, // Increases tile resolution
                showland: true,
                landcolor: 'rgb(250, 250, 250)',
                showcoastlines: true,
                showcountries: true,
                countrycolor: 'rgb(200, 200, 200)',
                showsubunits: true, // Shows administrative boundaries
                subunitcolor: 'rgb(200, 200, 200)',
                showlakes: true,
                lakecolor: 'rgb(230, 230, 250)',
            }
        }
    };
    Plotly.react(div_id, 
        [basemapFigure.data[0], ...fig.data], 
        {...basemapFigure.layout, ...fig.layout});
};