function useMyLocation() {
  const status = document.getElementById("locationStatus");
  if (!navigator.geolocation) {
    status.textContent = "Geolocation not supported by this browser.";
    return;
  }
  status.textContent = "Getting location...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById("lat").value = pos.coords.latitude;
      document.getElementById("lng").value = pos.coords.longitude;
      status.textContent = `Captured (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
    },
    (err) => {
      status.textContent = "Could not get location: " + err.message;
    }
  );
}

document.getElementById("reportForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Analyzing...";

  const form = new FormData();
  form.append("description", document.getElementById("description").value);
  form.append("location", document.getElementById("location").value);
  form.append("lat", document.getElementById("lat").value);
  form.append("lng", document.getElementById("lng").value);
  const imageFile = document.getElementById("image").files[0];
  if (imageFile) form.append("image", imageFile);

  try {
    const res = await fetch("/api/report", { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Something went wrong.");
      return;
    }

    renderResult(data);
  } catch (err) {
    alert("Network error: " + err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Report";
  }
});

function renderResult(data) {
  const card = document.getElementById("resultCard");
  card.classList.add("show");

  const badge = document.getElementById("priorityBadge");
  badge.textContent = data.priority_tier + " Priority";
  badge.className = "badge " + data.priority_tier;

  document.getElementById("priorityScoreText").textContent = `Priority Score: ${data.priority_score} / 10`;
  document.getElementById("rEmergencyType").textContent = data.emergency_type || "—";
  document.getElementById("rPeopleAtRisk").textContent = (data.people_at_risk || []).join(", ") || "None reported";
  document.getElementById("rTeams").textContent = (data.required_teams || []).join(", ") || "—";

  const hz = data.hazard_profile || {};
  document.getElementById("rHazard").textContent = hz.district
    ? `${hz.district}, ${hz.state} — known hazards: ${(hz.hazards || []).join(", ")}`
    : "—";

  document.getElementById("rSummary").textContent = data.summary || "—";

  const detections = data.detections || [];
  document.getElementById("rVision").textContent = detections.length
    ? detections.map(d => `${d.label} (${d.confidence})`).join(" · ") + `  [engine: ${data.analysis_source === "gemini" ? "gemini" : "rule-based"} / vision]`
    : "No image submitted.";

  document.getElementById("rReportLink").href = `/api/report/${data.id}/document`;

  card.scrollIntoView({ behavior: "smooth", block: "start" });
}
