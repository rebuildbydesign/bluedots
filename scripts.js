mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v11',
  center: [-73.985, 40.67],
  zoom: 14
});

map.on('load', () => {

  // === Sewersheds (Gowanus Highlight) ===
  map.addSource('sewersheds', {
    type: 'geojson',
    data: 'data/sewersheds.geojson'
  });

  // Fill for Gowanus + others
  map.addLayer({
    id: 'sewersheds-fill',
    type: 'fill',
    source: 'sewersheds',
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'Sewershed'], 'OH'],
        '#b3cde3', // highlight Gowanus
        '#eeeeee'  // muted gray for others
      ],
      'fill-opacity': [
        'case',
        ['==', ['get', 'Sewershed'], 'OH'],
        0.35,
        0.15
      ]
    }
  });

  // Outline
  map.addLayer({
    id: 'sewersheds-outline',
    type: 'line',
    source: 'sewersheds',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'Sewershed'], 'OH'],
        '#2b8cbe',
        '#cccccc'
      ],
      'line-width': [
        'case',
        ['==', ['get', 'Sewershed'], 'OH'],
        2,
        0.5
      ]
    }
  });

  // === Sewer Drainage Areas ===
  map.addSource('drainage', {
    type: 'geojson',
    data: 'data/sewer_drainage_areas.geojson'
  });

  // Fill polygons
  map.addLayer({
    id: 'drainage',
    type: 'fill',
    source: 'drainage',
    paint: {
      'fill-color': [
        'match',
        ['get', 'outfall'],
        'OH-007', '#fed976',
        'OH-006', '#feb24c',
        'OH-005', '#fd8d3c',
        '#cccccc'
      ],
      'fill-opacity': 0.3,
      'fill-outline-color': '#999'
    }
  });

  // Labels for sewer drainage areas
  map.addLayer({
    id: 'drainage-labels',
    type: 'symbol',
    source: 'drainage',
    layout: {
      'text-field': ['get', 'outfall'],
      'text-size': 12
    },
    paint: {
      'text-color': 'rgba(0, 0, 0, 0.7)',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5
    }
  });

  // === CSO Outfalls ===
  map.addSource('outfalls', {
    type: 'geojson',
    data: 'data/cso_outfalls.geojson'
  });

  map.addLayer({
    id: 'outfalls',
    type: 'circle',
    source: 'outfalls',
    paint: {
      'circle-color': '#666',
      'circle-radius': 6
    }
  });

  map.on('click', 'outfalls', e => {
    const f = e.features[0].properties;
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>SPDES:</strong> ${f.spdes}<br>
        <strong>Volume (2015):</strong> ${f.volume_15} MG<br>
        <strong>Events:</strong> ${f.events_15}
      `)
      .addTo(map);
  });

  // === Blue Dots ===
  map.addSource('bluedots', {
    type: 'geojson',
    data: 'data/bluedots.geojson'
  });

  map.addLayer({
    id: 'bluedots',
    type: 'circle',
    source: 'bluedots',
    paint: {
      'circle-color': '#1f78b4',
      'circle-radius': [
        'match',
        ['get', 'dot_size'],
        'small', 4,
        'medium', 8,
        'large', 12,
        6
      ],
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1
    }
  });

  map.on('click', 'bluedots', e => {
    const p = e.features[0].properties;
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>ID:</strong> ${p.project_id}<br>
        <strong>Type:</strong> ${p.intervention_type}<br>
        <strong>Gallons Diverted:</strong> ${p.cso_reduction_gallons}<br>
        <em>${p.description}</em>
      `)
      .addTo(map);
  });

  // === Toggle Layer Visibility ===
  document.getElementById('toggle-sewersheds').onchange = (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('sewersheds-fill', 'visibility', visibility);
    map.setLayoutProperty('sewersheds-outline', 'visibility', visibility);
  };

  document.getElementById('toggle-drainage').onchange = (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('drainage', 'visibility', visibility);
    map.setLayoutProperty('drainage-labels', 'visibility', visibility);
  };

  document.getElementById('toggle-outfalls').onchange = (e) =>
    map.setLayoutProperty('outfalls', 'visibility', e.target.checked ? 'visible' : 'none');

  document.getElementById('toggle-bluedots').onchange = (e) =>
    map.setLayoutProperty('bluedots', 'visibility', e.target.checked ? 'visible' : 'none');
});
