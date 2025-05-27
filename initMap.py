async function initMap() {
  const data = await fetchData();

  // Initialize map with max zoom 32
  const map = L.map("map", {
    maxZoom: 32,
  }).setView([0, 0], 2);

  // OpenStreetMap base layer
  const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, // Max zoom for OpenStreetMap
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Google Maps Satellite base layer (Optional)
  const googleSatelliteLayer = L.tileLayer(
    `https://maps.googleapis.com/maps/api/staticmap?center={y},{x}&zoom={z}&size=256x256&maptype=satellite&key=YOUR_GOOGLE_MAPS_API_KEY`,
    {
      maxZoom: 32,
      attribution: '&copy; <a href="https://maps.google.com">Google Maps</a>',
    }
  );

  // Layer Control for toggling between OSM and Satellite views
  const baseLayers = {
    "OpenStreetMap": osmLayer,
    "Google Satellite": googleSatelliteLayer, // Optional layer
  };
  L.control.layers(baseLayers).addTo(map); // Add layer switcher control

  // Calculate bounds for dynamic zoom
  const bounds = L.latLngBounds();

  // Add markers with tooltips
  data.forEach((entry) => {
    const marker = L.marker([entry.lat, entry.lon]).addTo(map);

    // Extend bounds
    bounds.extend([entry.lat, entry.lon]);

    // Add mouse-over tooltip
    marker.bindTooltip(
      `<div>
         <strong>IP:</strong> ${entry.ip}<br>
         <strong>ASN:</strong> ${entry.asn}<br>
         <strong>Latitude:</strong> ${entry.lat}<br>
         <strong>Longitude:</strong> ${entry.lon}
       </div>`,
      { permanent: false, opacity: 0.9, direction: "top" }
    );

    // Show tooltip on mouse-over
    marker.on("mouseover", function () {
      marker.openTooltip(); // Opens tooltip on mouse-over
    });

    // Hide tooltip on mouse-out
    marker.on("mouseout", function () {
      marker.closeTooltip(); // Closes tooltip on mouse-out
    });
  });

  // Adjust map zoom to fit all markers
  if (data.length > 1) {
    map.fitBounds(bounds); // Dynamic zoom
  } else if (data.length === 1) {
    map.setView([data[0].lat, data[0].lon], 10); // If only one marker, center it
  }
}
```