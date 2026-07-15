let map = null;
let markers = [];

async function loadDashboard() {
  try {
    const res = await fetch("/api/dashboard");
    const data = await res.json();
    renderStats(data.stats);
    renderTable(data.cases);
    renderMapMarkers(data.cases);
  } catch (err) {
    console.error("Failed to load dashboard:", err);
  }
}

function renderStats(stats) {
  document.getElementById("statTotal").textContent = stats.total;
  document.getElementById("statHigh").textContent = stats.high;
  document.getElementById("statMedium").textContent = stats.medium;
  document.getElementById("statLow").textContent = stats.low;
}

function renderTable(cases) {
  const tbody = document.getElementById("casesTable");
  if (!cases.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No cases reported yet.</td></tr>';
    return;
  }

  const sorted = [...cases].sort((a, b) => b.priority_score - a.priority_score);

  tbody.innerHTML = sorted.map(c => `
    <tr>
      <td><span class="pill ${c.priority_tier}">${c.priority_tier} (${c.priority_score})</span></td>
      <td>${c.emergency_type || "—"}</td>
      <td>${(c.hazard_profile && c.hazard_profile.district) || c.location_text || "—"}</td>
      <td>${c.summary || "—"}</td>
      <td>${new Date(c.timestamp).toLocaleString()}</td>
      <td><a href="/api/report/${c.id}/document" target="_blank">View Report</a></td>
    </tr>
  `).join("");
}

function renderMapMarkers(cases) {
  if (!map) return; // Google Maps not loaded (no API key)
  markers.forEach(m => m.setMap(null));
  markers = [];

  const colors = { High: "#dc2626", Medium: "#f59e0b", Low: "#16a34a" };

  cases.forEach(c => {
    if (c.lat == null || c.lng == null) return;
    const marker = new google.maps.Marker({
      position: { lat: c.lat, lng: c.lng },
      map: map,
      title: `${c.emergency_type} — ${c.priority_tier} priority`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: colors[c.priority_tier] || "#2563eb",
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: "#ffffff",
        scale: 9,
      },
    });
    markers.push(marker);
  });
}

// Called by the Google Maps script tag (only present if a Maps API key is configured)
function initMap() {
  const fallback = document.getElementById("mapFallback");
  if (fallback) fallback.remove();
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20.5937, lng: 78.9629 }, // India
    zoom: 5,
  });
  loadDashboard();
}

loadDashboard();
setInterval(loadDashboard, 8000);
