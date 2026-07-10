mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ';

// Size map below header
const header = document.getElementById('header-bar');
const mapEl = document.getElementById('map');
function sizeMap() {
  const h = header.offsetHeight;
  mapEl.style.top = h + 'px';
}
sizeMap();
window.addEventListener('resize', sizeMap);

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/j00by/cm60z8amk005801qvfi826b4d',
  center: [-73.9850, 40.666],
  zoom: 14.7
});

map.on('load', () => {

  // === Sewersheds (OH 06 Sewer Shed) ===
  // OFF by default — user can toggle on
  map.addSource('sewersheds', {
    type: 'geojson',
    data: 'data/sewersheds.geojson'
  });

  // Fill for OH (Gowanus) + others
  map.addLayer({
    id: 'sewersheds-fill',
    type: 'fill',
    source: 'sewersheds',
    layout: { 'visibility': 'none' },
    paint: {
      'fill-color': [
        'case',
        ['==', ['get', 'Sewershed'], 'OH'],
        '#b3cde3',
        '#eeeeee'
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
    layout: { 'visibility': 'none' },
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
  // Only OH-006 is visible by default (priority area)
  map.addSource('drainage', {
    type: 'geojson',
    data: 'data/sewer_drainage_areas.geojson'
  });

  // OH-006 highlighted fill
  map.addLayer({
    id: 'drainage-oh006',
    type: 'fill',
    source: 'drainage',
    filter: ['==', ['get', 'outfall'], 'OH-006'],
    paint: {
      'fill-color': '#feb24c',
      'fill-opacity': 0.35,
      'fill-outline-color': '#e6550d'
    }
  });

  // OH-006 outline emphasis
  map.addLayer({
    id: 'drainage-oh006-outline',
    type: 'line',
    source: 'drainage',
    filter: ['==', ['get', 'outfall'], 'OH-006'],
    paint: {
      'line-color': '#e6550d',
      'line-width': 2.5
    }
  });

  // OH-006 label
  map.addLayer({
    id: 'drainage-oh006-label',
    type: 'symbol',
    source: 'drainage',
    filter: ['==', ['get', 'outfall'], 'OH-006'],
    layout: {
      'text-field': 'OH-006',
      'text-size': 13,
      'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular']
    },
    paint: {
      'text-color': '#b45309',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5
    }
  });

  // === CSO Outfalls ===
  // All outfalls visible, OH-006 highlighted
  map.addSource('outfalls', {
    type: 'geojson',
    data: 'data/cso_outfalls.geojson'
  });

  // Non-OH outfalls (subtle)
  map.addLayer({
    id: 'outfalls-other',
    type: 'circle',
    source: 'outfalls',
    filter: ['!', ['in', 'OH', ['slice', ['get', 'spdes'], 0, 2]]],
    paint: {
      'circle-color': '#aaa',
      'circle-radius': 4,
      'circle-opacity': 0.4
    }
  });

  // OH outfalls (Gowanus area)
  map.addLayer({
    id: 'outfalls-oh',
    type: 'circle',
    source: 'outfalls',
    filter: ['in', 'OH', ['slice', ['get', 'spdes'], 0, 2]],
    paint: {
      'circle-color': [
        'case',
        ['==', ['get', 'spdes'], 'OH-006'],
        '#e6550d',  // priority outfall — highlighted
        '#666'
      ],
      'circle-radius': [
        'case',
        ['==', ['get', 'spdes'], 'OH-006'],
        9,
        6
      ],
      'circle-stroke-color': '#fff',
      'circle-stroke-width': [
        'case',
        ['==', ['get', 'spdes'], 'OH-006'],
        2,
        1
      ]
    }
  });

  // Click popup for all outfalls
  ['outfalls-oh', 'outfalls-other'].forEach(layerId => {
    map.on('click', layerId, e => {
      const f = e.features[0].properties;
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(`
          <strong>SPDES:</strong> ${f.spdes}<br>
          <strong>Waterbody:</strong> ${f.Waterbody || 'N/A'}<br>
          <strong>Volume (2015):</strong> ${f.volume_15} MG<br>
          <strong>Events:</strong> ${f.events_15}
        `)
        .addTo(map);
    });
  });

  // === City Green Infrastructure (DEP) ===
  // OFF by default — toggle to see
  map.addSource('green-infra', {
    type: 'geojson',
    data: 'data/gi-gowanus.geojson'
  });

  map.addLayer({
    id: 'green-infra-dots',
    type: 'circle',
    source: 'green-infra',
    layout: { 'visibility': 'none' },
    paint: {
      'circle-color': '#22c55e',
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        12, 2,
        15, 5,
        17, 8
      ],
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 0.8,
      'circle-opacity': 0.8
    }
  });

  // Click popup for GI assets
  map.on('click', 'green-infra-dots', e => {
    const p = e.features[0].properties;
    new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(`
        <strong>${p.project_na || 'Green Infrastructure'}</strong><br>
        <strong>Type:</strong> ${p.asset_type}<br>
        <strong>Status:</strong> ${p.status}<br>
        <strong>Outfall:</strong> ${p.outfall}<br>
        ${p.asset_area ? '<strong>Area:</strong> ' + p.asset_area + ' sq ft' : ''}
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
      'circle-color': '#3899C9',
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

  // === Hover Tooltips + Pointer Cursor ===
  const hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 12,
    className: 'hover-tooltip'
  });

  // Blue Dots hover
  map.on('mouseenter', 'bluedots', e => {
    map.getCanvas().style.cursor = 'pointer';
    const p = e.features[0].properties;
    const gallons = parseInt(p.cso_reduction_gallons || 0).toLocaleString();
    hoverPopup
      .setLngLat(e.lngLat)
      .setHTML(`<strong>${p.intervention_type}</strong><br>${gallons} gal diverted<br><span class="tooltip-hint">Click for details</span>`)
      .addTo(map);
  });

  map.on('mouseleave', 'bluedots', () => {
    map.getCanvas().style.cursor = '';
    hoverPopup.remove();
  });

  // Green Infrastructure hover
  map.on('mouseenter', 'green-infra-dots', e => {
    map.getCanvas().style.cursor = 'pointer';
    const p = e.features[0].properties;
    hoverPopup
      .setLngLat(e.lngLat)
      .setHTML(`<strong>${p.asset_type}</strong><br>${p.project_na || ''}<br><span class="tooltip-hint">Click for details</span>`)
      .addTo(map);
  });

  map.on('mouseleave', 'green-infra-dots', () => {
    map.getCanvas().style.cursor = '';
    hoverPopup.remove();
  });

  // CSO Outfalls hover
  ['outfalls-oh', 'outfalls-other'].forEach(layerId => {
    map.on('mouseenter', layerId, e => {
      map.getCanvas().style.cursor = 'pointer';
      const p = e.features[0].properties;
      hoverPopup
        .setLngLat(e.lngLat)
        .setHTML(`<strong>${p.spdes}</strong><br>${p.Waterbody || 'CSO Outfall'}<br><span class="tooltip-hint">Click for details</span>`)
        .addTo(map);
    });

    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
      hoverPopup.remove();
    });
  });

  // === Toggle Layer Visibility ===

  // OH 06 Sewer Shed toggle
  document.getElementById('toggle-sewersheds').onchange = (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('sewersheds-fill', 'visibility', visibility);
    map.setLayoutProperty('sewersheds-outline', 'visibility', visibility);
  };

  // Blue Dots toggle
  document.getElementById('toggle-bluedots').onchange = (e) =>
    map.setLayoutProperty('bluedots', 'visibility', e.target.checked ? 'visible' : 'none');

  // CSO Outfalls toggle
  document.getElementById('toggle-outfalls').onchange = (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('outfalls-oh', 'visibility', visibility);
    map.setLayoutProperty('outfalls-other', 'visibility', visibility);
  };

  // City Green Infrastructure toggle
  document.getElementById('toggle-gi').onchange = (e) =>
    map.setLayoutProperty('green-infra-dots', 'visibility', e.target.checked ? 'visible' : 'none');

  // OH-006 Drainage toggle
  document.getElementById('toggle-drainage').onchange = (e) => {
    const visibility = e.target.checked ? 'visible' : 'none';
    map.setLayoutProperty('drainage-oh006', 'visibility', visibility);
    map.setLayoutProperty('drainage-oh006-outline', 'visibility', visibility);
    map.setLayoutProperty('drainage-oh006-label', 'visibility', visibility);
  };

  // === Animated Gallon Counter ===
  fetch('data/bluedots.geojson')
    .then(res => res.json())
    .then(data => {
      const totalGallons = data.features.reduce((sum, f) => {
        const gallons = parseFloat(f.properties.cso_reduction_gallons);
        return sum + (isNaN(gallons) ? 0 : gallons);
      }, 0);

      let current = 0;
      const increment = totalGallons / 100;
      const counterEl = document.getElementById('counter-number');

      const interval = setInterval(() => {
        current += increment;
        if (current >= totalGallons) {
          current = totalGallons;
          clearInterval(interval);
        }
        counterEl.textContent = Math.floor(current).toLocaleString('en-US');
      }, 20);
    });

  // === Legend Panel Minimize / Restore ===
  const legendPanel = document.getElementById('legend-panel');
  const legendMinimize = document.getElementById('legend-minimize');
  const legendRestore = document.getElementById('legend-restore');

  legendMinimize.onclick = () => {
    legendPanel.classList.add('minimized');
    legendRestore.classList.add('visible');
  };

  legendRestore.onclick = () => {
    legendPanel.classList.remove('minimized');
    legendRestore.classList.remove('visible');
  };

  // === Mobile Info Popup Toggle ===
  const infoBtn = document.getElementById('map-info-btn');
  const infoPopup = document.getElementById('map-info-popup');

  if (infoBtn && infoPopup) {
    infoBtn.onclick = () => {
      infoPopup.style.display =
        infoPopup.style.display === 'block' ? 'none' : 'block';
    };
  }

});
