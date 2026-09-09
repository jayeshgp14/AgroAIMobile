// ---------- Mock data, shaped exactly like the documented Device object ----------
let devices = [
  { _id: "6123abcf51e4f9a1e0c12345", type: "Pump", name: "Pump - 1", hub: "Tarhadi Farm", plot: 1, mins: 15, online: true, on: false, batteryLevel: 87, voltages: { r: "219 V", y: "230 V", b: "213 V" }, current: "5 A", fault: true },
  { _id: "6123abcf51e4f9a1e0c12346", type: "Pump", name: "Pump - 2", hub: "Farm House", plot: 1, mins: 15, online: false, on: false, batteryLevel: 50, voltages: { r: "219 V", y: "230 V", b: "213 V" }, current: "5 A", fault: true },
  { _id: "6123abcf51e4f9a1e0c12347", type: "Pump", name: "Pump - 3", hub: "Green Acres", plot: 2, mins: 15, online: true, on: true, batteryLevel: 88, voltages: { r: "219 V", y: "230 V", b: "213 V" }, current: "5 A", fault: true },
  { _id: "6123abcf51e4f9a1e0c12348", type: "Pump", name: "Pump - 4", hub: "Riverbend", plot: 2, mins: 15, online: true, on: true, batteryLevel: 60, voltages: { r: "219 V", y: "230 V", b: "213 V" }, current: "5 A", fault: true },
  { _id: "6123abcf51e4f9a1e0c12349", type: "Valve", name: "Valve - 1", hub: "SL1", plot: 3, mins: 10, online: true, on: false, batteryLevel: null, voltages: null, current: null, fault: false },
];

let schedules = [
  { _id: "64ab12f3c9f1f1001a2b3c4d", deviceId: devices[0]._id, deviceType: "Pump", title: "Plot 2 / Pump", farm: "Plot 2", plot: 2, status: "Postponed", startAt: "2025-12-14T18:47:00", endAt: "2025-12-14T18:49:00", durationMin: 25, meta: { notes: "Temperature Tank - 3" }, progress: 45 },
  { _id: "64ab12f3c9f1f1001a2b3c4e", deviceId: devices[2]._id, deviceType: "Pump", title: "Plot 1 / Pump", farm: "Plot 1", plot: 1, status: "Postponed", startAt: "2025-12-14T17:12:00", endAt: "2025-12-14T18:49:00", durationMin: 25, meta: { notes: "Temperature Tank - 3" }, progress: 30 },
  { _id: "64ab12f3c9f1f1001a2b3c4f", deviceId: devices[3]._id, deviceType: "Pump", title: "Plot 2 / Pump", farm: "Plot 2", plot: 2, status: "Upcoming", startAt: "2025-12-14T19:29:00", endAt: "2025-12-14T20:49:00", durationMin: 20, meta: { notes: "Temperature Tank - 3" }, progress: 0 },
];

let activeFilter = "All";
const plotEl = document.getElementById("pills");
const heroTitle = document.getElementById("hero-title");
const heroDate = document.getElementById("hero-date");

function fmtTime(iso){
  const d = new Date(iso);
  let h = d.getHours(), m = d.getMinutes();
  const ap = h >= 12 ? "pm" : "am";
  h = h % 12; if (h === 0) h = 12;
  return `${(h+"").padStart(2,"0")}:${(m+"").padStart(2,"0")} ${ap}`;
}
function fmtDate(iso){
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[d.getMonth()]}-${(d.getDate()+"").padStart(2,"0")}`;
}

function setClock(){
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  heroDate.textContent = now.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" });
}
setClock(); setInterval(setClock, 30000);

// ---------- Filter pills ----------
function plotList(){
  const plots = [...new Set(devices.map(d => d.plot).filter(p => p != null))].sort((a,b)=>a-b);
  return plots;
}
function renderPills(){
  const plots = plotList();
  let html = `<button class="pill ${activeFilter==='All'?'active':''}" data-filter="All">All</button>`;
  html += `<button class="pill ${activeFilter==='Pump'?'active':''}" data-filter="Pump">Pump</button>`;
  html += `<button class="pill ${activeFilter==='Valve'?'active':''}" data-filter="Valve">Valve</button>`;
  plots.forEach(p => {
    const key = "plot:"+p;
    html += `<button class="pill ${activeFilter===key?'active':''}" data-filter="${key}">Plot-${p}</button>`;
  });
  html += `<button class="pill add" id="pill-add" title="Add plot">+</button>`;
  plotEl.innerHTML = html;
  plotEl.querySelectorAll(".pill[data-filter]").forEach(btn=>{
    btn.addEventListener("click", ()=>{ activeFilter = btn.dataset.filter; renderPills(); renderDevices(); });
  });
  document.getElementById("pill-add").addEventListener("click", ()=> openSheet("overlay-plot"));
}

// ---------- Device rendering ----------
function deviceMatchesFilter(d){
  if (activeFilter === "All") return true;
  if (activeFilter === "Pump" || activeFilter === "Valve") return d.type === activeFilter;
  if (activeFilter.startsWith("plot:")) return d.plot === Number(activeFilter.split(":")[1]);
  return true;
}

function phaseChip(letter, cls, val){
  return `<div class="phase-chip"><span class="phase-dot ${cls}"></span>${letter}</div>`;
}

function deviceCard(d){
  const isPump = d.type === "Pump";
  const iconSvg = isPump
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="#2F6B4F" stroke-width="1.8"/><path d="M12 8v4l3 2" stroke="#2F6B4F" stroke-width="1.8" stroke-linecap="round"/></svg>`
    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 12h6M14 12h6M10 12l2-2 2 2-2 2-2-2z" stroke="#3E7CB1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return `
  <div class="device-card ${d.fault ? 'fault' : ''}" data-id="${d._id}">
    <div class="device-top">
      <div class="device-id-block">
        <div class="device-icon ${isPump?'':'valve'}">${iconSvg}</div>
        <div>
          <div class="device-name">${d.name}</div>
          <div class="device-farm">Farm : ${d.hub}</div>
        </div>
      </div>
      <div class="device-right">
        ${d.batteryLevel != null ? `<div class="battery-chip">⚡ ${d.batteryLevel}%</div>` : `<div class="device-time">${d.mins} min timer</div>`}
        <button class="toggle ${d.on?'on':''}" ${d.online ? '' : 'disabled'} data-toggle="${d._id}"></button>
      </div>
    </div>

    <div class="device-body">
      <div>
        <div class="status-line">
          <span class="status-dot ${d.online?'online':'offline'}"></span>
          Status : ${d.online ? 'Online' : 'Offline'}
        </div>
        ${d.current ? `<div class="current-line">Current : ${d.current}</div>` : `<div class="current-line">Plot ${d.plot ?? '—'}</div>`}
      </div>
      ${d.voltages ? `
      <div class="phase-chips">
        ${phaseChip('R','phase-r')}
        ${phaseChip('Y','phase-y')}
        ${phaseChip('B','phase-b')}
      </div>` : ''}

      ${d.voltages ? `
      <div class="voltage-row">
        <span class="voltage-chip">R ${d.voltages.r}</span>
        <span class="voltage-chip">Y ${d.voltages.y}</span>
        <span class="voltage-chip">B ${d.voltages.b}</span>
      </div>` : ''}

      <div class="fault-row">
        <span class="id-tag">ID : ${d._id.slice(-7)}</span>
        ${d.fault ? `<span class="fault-tag">FAULT</span>` : `<span class="id-tag">No faults</span>`}
      </div>
    </div>
  </div>`;
}

function renderDevices(){
  const list = document.getElementById("device-list");
  const filtered = devices.filter(deviceMatchesFilter);
  if (filtered.length === 0){
    list.innerHTML = `
      <div class="empty-state">
        <div class="glyph">🌱</div>
        <h3>No controls here yet</h3>
        <p>Tap the + pill above to add a pump or valve to this plot.</p>
      </div>`;
    return;
  }
  list.innerHTML = filtered.map(deviceCard).join("");
  list.querySelectorAll("[data-toggle]").forEach(btn=>{
    btn.addEventListener("click", ()=> toggleDevice(btn.dataset.toggle));
  });
}

function toggleDevice(id){
  const d = devices.find(x => x._id === id);
  if (!d || !d.online) return;
  // Optimistic UI update, mirroring: POST /api/devices/:id/toggle { on: boolean }
  d.on = !d.on;
  renderDevices();
  showToast(`${d.name} turned ${d.on ? "on" : "off"}`);
}

// ---------- Schedule rendering ----------
function scheduleCard(s){
  return `
  <div class="sched-card" data-status="${s.status}" data-id="${s._id}">
    <div class="sched-top">
      <div class="sched-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 6 9 6 14a6 6 0 0012 0c0-5-6-12-6-12z" stroke="#3E7CB1" stroke-width="1.8"/></svg>
        ${s.title}
      </div>
      <div style="display:flex; align-items:center;">
        <span class="sched-status ${s.status}">${s.status}</span>
        <button class="sched-del" data-del="${s._id}" title="Delete schedule">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
    <div class="sched-meta">
      <div>${s.status === 'Upcoming' ? 'From' : 'Started'}<strong>${fmtDate(s.startAt)} • ${fmtTime(s.startAt)}</strong></div>
      <div>${s.status === 'Upcoming' ? 'To' : 'Ends at'}<strong>${fmtDate(s.endAt)} • ${fmtTime(s.endAt)}</strong></div>
      <div>Duration<strong>${s.durationMin.toFixed(2)} Min</strong></div>
    </div>
    <div class="sched-tank">${s.meta?.notes ?? ''}</div>
    ${s.status !== 'Upcoming' ? `<div class="sched-progress"><span style="width:${s.progress}%"></span></div>` : ''}
  </div>`;
}

function renderSchedules(){
  const list = document.getElementById("schedule-list");
  if (schedules.length === 0){
    list.innerHTML = `
      <div class="empty-state">
        <div class="glyph">🗓️</div>
        <h3>Nothing scheduled</h3>
        <p>Add a watering schedule and it'll show up here.</p>
      </div>`;
    return;
  }
  list.innerHTML = schedules.map(scheduleCard).join("");
  list.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=> deleteSchedule(btn.dataset.del));
  });
}

function deleteSchedule(id){
  // Optimistic remove, mirroring: DELETE /api/schedules/:id
  const idx = schedules.findIndex(s => s._id === id);
  if (idx === -1) return;
  const [removed] = schedules.splice(idx, 1);
  renderSchedules();
  showToast(`Deleted "${removed.title}"`);
}

// ---------- Bottom nav ----------
const navButtons = document.querySelectorAll(".nav-btn");
navButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    navButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.nav;

    document.getElementById("screen-manual").classList.remove("visible");
    document.getElementById("screen-schedule").classList.remove("visible");
    plotEl.style.display = "flex";

    if (target === "manual"){
      document.getElementById("screen-manual").classList.add("visible");
      heroTitle.textContent = "Manual Control";
    } else if (target === "schedule"){
      document.getElementById("screen-schedule").classList.add("visible");
      heroTitle.textContent = "Time Schedule";
      plotEl.style.display = "none";
    } else if (target === "sensor"){
      document.getElementById("screen-manual").classList.add("visible");
      heroTitle.textContent = "Sensor Data";
      plotEl.style.display = "none";
      showToast("Sensor Data screen — not wired up in this prototype");
    } else {
      document.getElementById("screen-manual").classList.add("visible");
      heroTitle.textContent = "Activity";
      plotEl.style.display = "none";
      showToast("Activity screen — not wired up in this prototype");
    }
  });
});

// ---------- Toast ----------
let toastTimer;
function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove("show"), 2200);
}

// ---------- Sheets (modals) ----------
function openSheet(id){ document.getElementById(id).classList.add("open"); }
function closeSheet(id){ document.getElementById(id).classList.remove("open"); }

document.querySelectorAll(".sheet-overlay").forEach(ov=>{
  ov.addEventListener("click", (e)=>{ if (e.target === ov) ov.classList.remove("open"); });
});

// Add Control sheet
let newDeviceType = "Valve";
document.querySelectorAll('#overlay-control .seg-btn').forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll('#overlay-control .seg-btn').forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    newDeviceType = btn.dataset.type;
    document.getElementById("ctrl-name").placeholder = `e.g. ${newDeviceType} - 3`;
  });
});
document.getElementById("ctrl-online-toggle").addEventListener("click", function(){ this.classList.toggle("on"); });
document.getElementById("ctrl-on-toggle").addEventListener("click", function(){ this.classList.toggle("on"); });
document.getElementById("ctrl-cancel").addEventListener("click", ()=> closeSheet("overlay-control"));

document.getElementById("ctrl-save").addEventListener("click", ()=>{
  const name = document.getElementById("ctrl-name").value.trim() || `${newDeviceType} - New`;
  const hub = document.getElementById("ctrl-hub").value.trim() || "Unassigned Hub";
  const plotVal = document.getElementById("ctrl-plot").value;
  const mins = Number(document.getElementById("ctrl-mins").value) || 15;
  const online = document.getElementById("ctrl-online-toggle").classList.contains("on");
  const on = document.getElementById("ctrl-on-toggle").classList.contains("on");

  // Mirrors POST /api/devices payload from the doc
  const newDevice = {
    _id: "id_" + Math.random().toString(36).slice(2, 10),
    type: newDeviceType,
    name, hub,
    plot: plotVal ? Number(plotVal) : null,
    mins, online, on,
    batteryLevel: newDeviceType === "Pump" ? Math.floor(40 + Math.random()*55) : null,
    voltages: newDeviceType === "Pump" ? { r: "219 V", y: "230 V", b: "213 V" } : null,
    current: newDeviceType === "Pump" ? "5 A" : null,
    fault: false,
  };
  devices.unshift(newDevice);
  renderPills(); renderDevices();
  closeSheet("overlay-control");
  showToast(`${newDevice.name} added`);

  // reset form
  document.getElementById("ctrl-name").value = "";
  document.getElementById("ctrl-hub").value = "";
  document.getElementById("ctrl-plot").value = "";
  document.getElementById("ctrl-mins").value = 15;
});

// Add Plot sheet
document.getElementById("plot-cancel").addEventListener("click", ()=> closeSheet("overlay-plot"));
document.getElementById("plot-save").addEventListener("click", ()=>{
  const rawId = document.getElementById("plot-id").value.trim();
  const plotId = Number((rawId.match(/\d+/) || [null])[0]);
  const plotName = document.getElementById("plot-name").value.trim() || "New Plot";
  if (!plotId){ showToast("Enter a valid plot ID"); return; }
  showToast(`Plot "${plotName}" (ID ${plotId}) added`);
  document.getElementById("plot-name").value = "";
  document.getElementById("plot-id").value = "";
  closeSheet("overlay-plot");
  renderPills();
});

// Add Schedule sheet
document.getElementById("btn-add-schedule").addEventListener("click", ()=>{
  const sel = document.getElementById("sch-device");
  sel.innerHTML = devices.map(d => `<option value="${d._id}">${d.name} — ${d.hub}</option>`).join("");
  const dt = new Date(Date.now() + 30*60000);
  document.getElementById("sch-start").value = dt.toISOString().slice(0,16);
  openSheet("overlay-schedule");
});
document.getElementById("sch-cancel").addEventListener("click", ()=> closeSheet("overlay-schedule"));
document.getElementById("sch-save").addEventListener("click", ()=>{
  const deviceId = document.getElementById("sch-device").value;
  const device = devices.find(d => d._id === deviceId);
  const title = document.getElementById("sch-title").value.trim() || `${device?.hub ?? 'Plot'} / ${device?.type ?? 'Pump'}`;
  const mins = Number(document.getElementById("sch-mins").value) || 20;
  const startVal = document.getElementById("sch-start").value;
  const startAt = startVal ? new Date(startVal).toISOString() : new Date().toISOString();
  const endAt = new Date(new Date(startAt).getTime() + mins*60000).toISOString();

  // Mirrors POST /api/schedules payload from the doc
  const newSchedule = {
    _id: "sch_" + Math.random().toString(36).slice(2, 10),
    deviceId, deviceType: device?.type ?? "Pump",
    title, farm: device?.hub ?? "—", plot: device?.plot ?? null,
    status: "Upcoming", startAt, endAt, durationMin: mins,
    meta: { notes: "" }, progress: 0,
  };
  schedules.unshift(newSchedule);
  renderSchedules();
  closeSheet("overlay-schedule");
  showToast("Schedule added");
  document.getElementById("sch-title").value = "";
});

// ---------- Init ----------
renderPills();
renderDevices();
renderSchedules();
