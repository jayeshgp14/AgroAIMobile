// ---------- ID Generator Helpers (matching Java logic) ----------
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateRandomCode(len = 8) {
  let res = "";
  for (let i = 0; i < len; i++) {
    res += CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
  }
  return res;
}

function generateDeviceId() {
  return "DV-" + generateRandomCode(8);
}

function generateBrokerClientId(clientId, sequenceNum) {
  const seq = String(sequenceNum).padStart(2, "0");
  return `${clientId}-DV${seq}`;
}

// ---------- Tenant State ----------
let clients = [
  { clId: "CL-8F3K7M2Q", name: "Green Valley Farm", brokerId: "BRK-01" },
  { clId: "CL-9P4W2Y7X", name: "Sunrise Estate", brokerId: "BRK-01" }
];

let plots = [
  { plotId: 1, name: "Plot 1 (North)", clId: "CL-8F3K7M2Q" },
  { plotId: 2, name: "Plot 2 (South)", clId: "CL-8F3K7M2Q" },
  { plotId: 3, name: "Plot 3 (Polyhouse)", clId: "CL-8F3K7M2Q" },
  { plotId: 1, name: "Sunrise Plot 1", clId: "CL-9P4W2Y7X" }
];

let users = [
  { id: "U1001", fullName: "Ravi Patel",  username: "superadmin", role: "superadmin", brokerId: "BRK-01", clId: null },
  { id: "U1002", fullName: "Anita Shah",  username: "admin",      role: "admin",      brokerId: "BRK-01", clId: "CL-8F3K7M2Q" },
  { id: "U1003", fullName: "Kiran Mehta", username: "user",       role: "user",       brokerId: "BRK-01", clId: "CL-8F3K7M2Q" },
  { id: "U1004", fullName: "Suresh Rao",  username: "suresh",     role: "user",       brokerId: "BRK-01", clId: "CL-9P4W2Y7X" }
];

let credentials = {
  superadmin: "super123",
  admin:      "admin123",
  user:       "user123",
  suresh:     "user123"
};

let currentUser = null;
const roleLabels = { superadmin: "Super Admin", admin: "Admin", user: "Normal User" };

let devices = [
  {
    _id: "dev_01",
    clId: "CL-8F3K7M2Q",
    dvId: "DV-2K7N5X9P",
    brokerClId: "CL-8F3K7M2Q-DV01",
    brokerId: "BRK-01",
    ownerId: "U1003",
    type: "Pump",
    name: "Pump - 1",
    hub: "Green Valley Farm",
    plot: 1,
    mins: 15,
    online: true,
    on: false,
    batteryLevel: 87,
    voltages: { r: "219 V", y: "230 V", b: "213 V" },
    current: "5 A",
    fault: false
  },
  {
    _id: "dev_02",
    clId: "CL-8F3K7M2Q",
    dvId: "DV-9X1B4Z7L",
    brokerClId: "CL-8F3K7M2Q-DV02",
    brokerId: "BRK-01",
    ownerId: "U1003",
    type: "Valve",
    name: "Valve - 1",
    hub: "Green Valley Farm",
    plot: 3,
    mins: 10,
    online: true,
    on: false,
    batteryLevel: null,
    voltages: null,
    current: null,
    fault: false
  },
  {
    _id: "dev_03",
    clId: "CL-9P4W2Y7X",
    dvId: "DV-4M8P3Q5T",
    brokerClId: "CL-9P4W2Y7X-DV01",
    brokerId: "BRK-01",
    ownerId: "U1004",
    type: "Pump",
    name: "Submersible Pump",
    hub: "Sunrise Estate",
    plot: 1,
    mins: 20,
    online: true,
    on: true,
    batteryLevel: 92,
    voltages: { r: "220 V", y: "225 V", b: "222 V" },
    current: "4.8 A",
    fault: false
  }
];

let schedules = [
  { _id: "sch_01", deviceId: "dev_01", deviceType: "Pump", title: "Plot 1 / Pump", farm: "Green Valley", plot: 1, status: "Postponed", startAt: "2026-09-09T18:47:00", endAt: "2026-09-09T19:12:00", durationMin: 25, meta: { notes: "Tank Fertigation" }, progress: 45 }
];

let activeFilter = "All";
const plotEl = document.getElementById("pills");
const heroTitle = document.getElementById("hero-title");
const heroDate = document.getElementById("hero-date");

// ---------- Simulated MQTT Logger Console ----------
function logMqtt(direction, topic, payload) {
  const logStream = document.getElementById("mqtt-log-stream");
  if (!logStream) return;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const isOut = direction === "PUB";
  const color = isOut ? "#ffa852" : "#59c7f3";

  const entry = document.createElement("div");
  entry.style.marginTop = "3px";
  entry.innerHTML = `
    <span style="color:#888;">[${time}]</span>
    <strong style="color:${color};">[${direction}]</strong>
    <span style="color:#d6edd8;">${topic}</span>
    <span style="color:#f2f2f2;">${JSON.stringify(payload)}</span>
  `;

  logStream.prepend(entry);
}

// Clock
function setClock(){
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  heroDate.textContent = now.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" });
}
setClock(); setInterval(setClock, 30000);

// ---------- Scoping Rules ----------
function scopedDevices() {
  if (!currentUser) return [];
  if (currentUser.role === "superadmin") {
    return devices.filter(d => d.brokerId === currentUser.brokerId);
  }
  if (currentUser.role === "admin") {
    return devices.filter(d => d.clId === currentUser.clId);
  }
  return devices.filter(d => d.clId === currentUser.clId && d.ownerId === currentUser.id);
}

function scopedPlots() {
  if (!currentUser) return [];
  if (currentUser.role === "superadmin") return plots;
  return plots.filter(p => p.clId === currentUser.clId);
}

function canManageResources() {
  return currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");
}

// ---------- Deletion Permissions ----------
function canDeleteUser(targetUser) {
  if (!currentUser || !targetUser) return false;
  if (targetUser.id === currentUser.id) return false;

  if (currentUser.role === "superadmin") {
    return targetUser.role === "admin" || targetUser.role === "user";
  }
  if (currentUser.role === "admin") {
    return targetUser.role === "user" && targetUser.clId === currentUser.clId;
  }
  return false;
}

function canDeleteDevice(device) {
  if (!currentUser) return false;
  if (currentUser.role === "superadmin") return true;
  if (currentUser.role === "admin") return device.clId === currentUser.clId;
  return false;
}

function canDeletePlot(plot) {
  if (!currentUser) return false;
  if (currentUser.role === "superadmin") return true;
  if (currentUser.role === "admin") return plot.clId === currentUser.clId;
  return false;
}

// ---------- Deletion Handlers ----------
function deleteDevice(deviceId) {
  const idx = devices.findIndex(d => d._id === deviceId);
  if (idx === -1) return;
  const d = devices[idx];

  if (!canDeleteDevice(d)) {
    showToast("Unauthorized to delete this device.");
    return;
  }

  devices.splice(idx, 1);
  renderDevices();
  renderPills();
  showToast(`Deleted ${d.name} (${d.brokerClId})`);
}

function deletePlot(plotId, clId) {
  const idx = plots.findIndex(p => p.plotId === plotId && p.clId === clId);
  if (idx === -1) return;
  const targetPlot = plots[idx];

  if (!canDeletePlot(targetPlot)) {
    showToast("Unauthorized to delete this plot.");
    return;
  }

  devices.forEach(d => {
    if (d.clId === clId && d.plot === plotId) d.plot = null;
  });

  plots.splice(idx, 1);
  if (activeFilter === "plot:" + plotId) activeFilter = "All";
  renderPills();
  renderDevices();
  renderPlotsManagementList();
  showToast(`Deleted Plot ${plotId}`);
}

function deleteUser(userId) {
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  const targetUser = users[idx];

  if (!canDeleteUser(targetUser)) {
    showToast("Unauthorized to delete this user.");
    return;
  }

  devices.forEach(d => {
    if (d.ownerId === targetUser.id) d.ownerId = null;
  });

  delete credentials[targetUser.username];
  users.splice(idx, 1);
  renderUserManagementList();
  renderDevices();
  showToast(`Deleted account: ${targetUser.fullName}`);
}

// ---------- Filter Pills ----------
function renderPills() {
  const currentPlots = scopedPlots();
  let html = `<button class="pill ${activeFilter==='All'?'active':''}" data-filter="All">All</button>`;
  html += `<button class="pill ${activeFilter==='Pump'?'active':''}" data-filter="Pump">Pump</button>`;
  html += `<button class="pill ${activeFilter==='Valve'?'active':''}" data-filter="Valve">Valve</button>`;

  currentPlots.forEach(p => {
    const key = "plot:" + p.plotId;
    html += `<button class="pill ${activeFilter===key?'active':''}" data-filter="${key}">Plot-${p.plotId}</button>`;
  });

  if (canManageResources()) {
    html += `<button class="pill add" id="pill-add" title="Add Plot">+</button>`;
  }

  plotEl.innerHTML = html;
  plotEl.querySelectorAll(".pill[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      renderPills();
      renderDevices();
    });
  });

  const addPill = document.getElementById("pill-add");
  if (addPill) addPill.addEventListener("click", () => openSheet("overlay-plot"));
}

function deviceMatchesFilter(d) {
  if (activeFilter === "All") return true;
  if (activeFilter === "Pump" || activeFilter === "Valve") return d.type === activeFilter;
  if (activeFilter.startsWith("plot:")) return d.plot === Number(activeFilter.split(":")[1]);
  return true;
}

function phaseChip(letter, cls){
  return `<div class="phase-chip"><span class="phase-dot ${cls}"></span>${letter}</div>`;
}

// ---------- Device Card Component ----------
function deviceCard(d) {
  const isPump = d.type === "Pump";
  const iconSvg = isPump
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7" stroke="#2F6B4F" stroke-width="1.8"/><path d="M12 8v4l3 2" stroke="#2F6B4F" stroke-width="1.8" stroke-linecap="round"/></svg>`
    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 12h6M14 12h6M10 12l2-2 2 2-2 2-2-2z" stroke="#3E7CB1" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const owner = users.find(u => u.id === d.ownerId);
  const showDelete = canDeleteDevice(d);

  return `
  <div class="device-card ${d.fault ? 'fault' : ''}">
    <div class="device-top">
      <div class="device-id-block">
        <div class="device-icon ${isPump ? '' : 'valve'}">${iconSvg}</div>
        <div>
          <div class="device-name">${d.name}</div>
          <div class="device-farm">Hub: ${d.hub}</div>
        </div>
      </div>
      <div class="device-right">
        <div style="display:flex; align-items:center; gap:8px;">
          ${d.batteryLevel != null ? `<div class="battery-chip">⚡ ${d.batteryLevel}%</div>` : `<div class="device-time">${d.mins} min</div>`}
          ${showDelete ? `
            <button class="sched-del" data-delete-dev="${d._id}" title="Delete Device" style="width:28px; height:28px; padding:0;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>` : ''}
        </div>
        <button class="toggle ${d.on?'on':''}" ${d.online ? '' : 'disabled'} data-toggle="${d._id}"></button>
      </div>
    </div>

    <div class="device-body">
      <div>
        <div class="status-line">
          <span class="status-dot ${d.online?'online':'offline'}"></span>
          Status: ${d.online ? 'Online' : 'Offline'}
        </div>
        <div class="current-line">Plot: ${d.plot ?? '—'} | Operator: ${owner ? owner.fullName : 'Unassigned'}</div>
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

      <div class="fault-row" style="border-top: 1px dashed var(--hairline); padding-top: 8px; margin-top: 8px;">
        <div style="line-height: 1.3;">
          <div style="font-size: 11px; font-weight:700; color:var(--sky); font-family:monospace;">${d.brokerClId}</div>
          <div style="font-size: 9.5px; color:var(--muted); font-family:monospace;">CL: ${d.clId} | DV: ${d.dvId}</div>
          <div style="font-size: 9px; color:#859086; font-family:monospace;">sub: device/${d.clId}/${d.dvId}/#</div>
        </div>
        ${d.fault ? `<span class="fault-tag">FAULT</span>` : `<span class="id-tag" style="color:var(--primary); font-weight:bold;">Active</span>`}
      </div>
    </div>
  </div>`;
}

function renderDevices() {
  const list = document.getElementById("device-list");
  const filtered = scopedDevices().filter(deviceMatchesFilter);
  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="glyph">🌱</div>
        <h3>No devices available</h3>
        <p>No pumps or valves found for this account/plot.</p>
      </div>`;
    return;
  }
  list.innerHTML = filtered.map(deviceCard).join("");
  list.querySelectorAll("[data-toggle]").forEach(btn => {
    btn.addEventListener("click", () => toggleDevice(btn.dataset.toggle));
  });
  list.querySelectorAll("[data-delete-dev]").forEach(btn => {
    btn.addEventListener("click", () => deleteDevice(btn.dataset.deleteDev));
  });
}

// ---------- Live MQTT Simulation on Toggle ----------
function toggleDevice(id) {
  const d = devices.find(x => x._id === id);
  if (!d || !d.online) return;

  const targetState = !d.on;
  const publishTopic = `backend/${d.clId}/${d.dvId}/cmd`;
  const publishPayload = { action: "SET_POWER", state: targetState ? "ON" : "OFF", timestamp: Date.now() };
  logMqtt("PUB", publishTopic, publishPayload);

  d.on = targetState;
  renderDevices();
  showToast(`Command sent: ${targetState ? "ON" : "OFF"}`);

  setTimeout(() => {
    const responseTopic = `device/${d.clId}/${d.dvId}/cmd/result`;
    const responsePayload = { status: "SUCCESS", state: targetState ? "ON" : "OFF", dvId: d.dvId };
    logMqtt("SUB", responseTopic, responsePayload);
  }, 450);
}

// ---------- Management Lists (Users & Plots) ----------
function renderUserManagementList() {
  const container = document.getElementById("user-management-list");
  if (!container) return;

  let manageableUsers = [];
  if (currentUser.role === "superadmin") {
    manageableUsers = users.filter(u => u.id !== currentUser.id);
  } else if (currentUser.role === "admin") {
    manageableUsers = users.filter(u => u.clId === currentUser.clId && u.role === "user");
  }

  if (manageableUsers.length === 0) {
    container.innerHTML = `<div style="font-size:12px; color:var(--muted); padding:4px 0;">No manageable users found.</div>`;
    return;
  }

  container.innerHTML = manageableUsers.map(u => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--paper); padding:8px 12px; border-radius:10px; border:1px solid var(--hairline);">
      <div>
        <div style="font-weight:700; font-size:12.5px;">${u.fullName} <span class="role-badge ${u.role}">${u.role}</span></div>
        <div style="font-size:11px; color:var(--muted);">${u.clId || 'Global'} · @${u.username}</div>
      </div>
      <button class="sched-del" data-delete-user="${u.id}" style="width:26px; height:26px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
  `).join("");

  container.querySelectorAll("[data-delete-user]").forEach(btn => {
    btn.addEventListener("click", () => deleteUser(btn.dataset.deleteUser));
  });
}

function renderPlotsManagementList() {
  const container = document.getElementById("plots-management-list");
  if (!container) return;

  const manageablePlots = scopedPlots();
  if (manageablePlots.length === 0) {
    container.innerHTML = `<div style="font-size:12px; color:var(--muted); padding:4px 0;">No plots created yet.</div>`;
    return;
  }

  container.innerHTML = manageablePlots.map(p => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--paper); padding:8px 12px; border-radius:10px; border:1px solid var(--hairline);">
      <div>
        <div style="font-weight:700; font-size:12.5px;">Plot ${p.plotId}: ${p.name}</div>
        <div style="font-size:11px; color:var(--muted);">${p.clId}</div>
      </div>
      <button class="sched-del" data-delete-plot="${p.plotId}" data-plot-clid="${p.clId}" style="width:26px; height:26px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
  `).join("");

  container.querySelectorAll("[data-delete-plot]").forEach(btn => {
    btn.addEventListener("click", () => deletePlot(Number(btn.dataset.deletePlot), btn.dataset.plotClid));
  });
}

// ---------- Registration Modal ----------
function initRegisterModal() {
  const clientGroup = document.getElementById("reg-client-group");
  const clientSelect = document.getElementById("reg-client");
  const roleSelect = document.getElementById("reg-role");

  if (currentUser.role === "superadmin") {
    clientGroup.style.display = "block";
    clientSelect.innerHTML = clients.map(c => `<option value="${c.clId}">${c.name} (${c.clId})</option>`).join("");
    roleSelect.innerHTML = `
      <option value="user">Normal User</option>
      <option value="admin">Admin</option>
    `;
  } else {
    clientGroup.style.display = "none";
    roleSelect.innerHTML = `<option value="user">Normal User</option>`;
  }
}

document.getElementById("reg-cancel").addEventListener("click", () => closeSheet("overlay-register"));
document.getElementById("reg-save").addEventListener("click", () => {
  const name = document.getElementById("reg-name").value.trim();
  const username = document.getElementById("reg-username").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const role = document.getElementById("reg-role").value;

  if (!name || !username || !password) {
    showToast("Please fill in all registration fields.");
    return;
  }
  if (credentials[username]) {
    showToast("Username already exists.");
    return;
  }

  const assignedClientId = (currentUser.role === "superadmin")
    ? document.getElementById("reg-client").value
    : currentUser.clId;

  const newUser = {
    id: "U" + (1000 + users.length + 1),
    fullName: name,
    username,
    role,
    brokerId: currentUser.brokerId,
    clId: assignedClientId
  };

  users.push(newUser);
  credentials[username] = password;

  showToast(`${roleLabels[role]} "${name}" created.`);
  closeSheet("overlay-register");
  renderUserManagementList();

  document.getElementById("reg-name").value = "";
  document.getElementById("reg-username").value = "";
  document.getElementById("reg-password").value = "";
});

// ---------- Plot Modal ----------
function initPlotModal() {
  const clientGroup = document.getElementById("plot-client-group");
  const clientSelect = document.getElementById("plot-client");

  if (currentUser.role === "superadmin") {
    clientGroup.style.display = "block";
    clientSelect.innerHTML = clients.map(c => `<option value="${c.clId}">${c.name} (${c.clId})</option>`).join("");
  } else {
    clientGroup.style.display = "none";
  }
}

document.getElementById("plot-cancel").addEventListener("click", () => closeSheet("overlay-plot"));
document.getElementById("plot-save").addEventListener("click", () => {
  const plotNum = Number(document.getElementById("plot-id").value);
  const plotName = document.getElementById("plot-name").value.trim() || `Plot ${plotNum}`;

  if (!plotNum) {
    showToast("Please enter a valid plot number.");
    return;
  }

  const targetClientId = (currentUser.role === "superadmin")
    ? document.getElementById("plot-client").value
    : currentUser.clId;

  plots.push({
    plotId: plotNum,
    name: plotName,
    clId: targetClientId
  });

  showToast(`Plot ${plotNum} created for ${targetClientId}`);
  closeSheet("overlay-plot");
  renderPills();
  renderPlotsManagementList();

  document.getElementById("plot-id").value = "";
  document.getElementById("plot-name").value = "";
});

// ---------- Device Modal ----------
let pendingDvId = "";
let pendingBrokerClId = "";
let newDeviceType = "Valve";

function updateControlModalFields() {
  const targetClientId = (currentUser.role === "superadmin")
    ? document.getElementById("ctrl-client").value
    : currentUser.clId;

  const clientUsers = users.filter(u => u.clId === targetClientId && u.role === "user");
  const clientPlots = plots.filter(p => p.clId === targetClientId);

  const ownerSelect = document.getElementById("ctrl-owner");
  ownerSelect.innerHTML = clientUsers.length
    ? clientUsers.map(u => `<option value="${u.id}">${u.fullName} (@${u.username})</option>`).join("")
    : `<option value="">No users under this client</option>`;

  const plotSelect = document.getElementById("ctrl-plot");
  plotSelect.innerHTML = clientPlots.length
    ? clientPlots.map(p => `<option value="${p.plotId}">Plot ${p.plotId} — ${p.name}</option>`).join("")
    : `<option value="">No plots created yet</option>`;

  const clientDeviceCount = devices.filter(d => d.clId === targetClientId).length;
  pendingDvId = generateDeviceId();
  pendingBrokerClId = generateBrokerClientId(targetClientId, clientDeviceCount + 1);

  document.getElementById("preview-dvid").textContent = pendingDvId;
  document.getElementById("preview-brokerclid").textContent = pendingBrokerClId;
}

function initControlModal() {
  const clientGroup = document.getElementById("ctrl-client-group");
  const clientSelect = document.getElementById("ctrl-client");

  if (currentUser.role === "superadmin") {
    clientGroup.style.display = "block";
    clientSelect.innerHTML = clients.map(c => `<option value="${c.clId}">${c.name} (${c.clId})</option>`).join("");
    clientSelect.onchange = updateControlModalFields;
  } else {
    clientGroup.style.display = "none";
  }

  updateControlModalFields();
}

document.querySelectorAll('#overlay-control .seg-btn').forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll('#overlay-control .seg-btn').forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    newDeviceType = btn.dataset.type;
    document.getElementById("ctrl-name").placeholder = `e.g. ${newDeviceType} 1`;
  });
});

document.getElementById("ctrl-online-toggle").addEventListener("click", function(){ this.classList.toggle("on"); });
document.getElementById("ctrl-on-toggle").addEventListener("click", function(){ this.classList.toggle("on"); });
document.getElementById("ctrl-cancel").addEventListener("click", () => closeSheet("overlay-control"));

document.getElementById("ctrl-save").addEventListener("click", () => {
  const targetClientId = (currentUser.role === "superadmin")
    ? document.getElementById("ctrl-client").value
    : currentUser.clId;

  const ownerId = document.getElementById("ctrl-owner").value;
  const plotVal = document.getElementById("ctrl-plot").value;
  const name = document.getElementById("ctrl-name").value.trim() || `${newDeviceType} - New`;
  const hub = document.getElementById("ctrl-hub").value.trim() || "Main Farm Hub";
  const mins = Number(document.getElementById("ctrl-mins").value) || 15;
  const online = document.getElementById("ctrl-online-toggle").classList.contains("on");
  const on = document.getElementById("ctrl-on-toggle").classList.contains("on");

  const newDevice = {
    _id: "dev_" + Math.random().toString(36).slice(2, 9),
    clId: targetClientId,
    dvId: pendingDvId,
    brokerClId: pendingBrokerClId,
    brokerId: currentUser.brokerId,
    ownerId: ownerId || null,
    type: newDeviceType,
    name,
    hub,
    plot: plotVal ? Number(plotVal) : null,
    mins,
    online,
    on,
    batteryLevel: newDeviceType === "Pump" ? 85 : null,
    voltages: newDeviceType === "Pump" ? { r: "220 V", y: "225 V", b: "220 V" } : null,
    current: newDeviceType === "Pump" ? "5 A" : null,
    fault: false
  };

  devices.unshift(newDevice);
  renderPills();
  renderDevices();
  closeSheet("overlay-control");
  showToast(`Registered ${newDevice.name} (${newDevice.brokerClId})`);

  document.getElementById("ctrl-name").value = "";
  document.getElementById("ctrl-hub").value = "";
});

// ---------- Schedules Screen ----------
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
      <div>${s.status === 'Upcoming' ? 'From' : 'Started'}<strong>${s.startAt.slice(11,16)}</strong></div>
      <div>${s.status === 'Upcoming' ? 'To' : 'Ends at'}<strong>${s.endAt.slice(11,16)}</strong></div>
      <div>Duration<strong>${s.durationMin.toFixed(0)} Min</strong></div>
    </div>
    <div class="sched-tank">${s.meta?.notes ?? ''}</div>
  </div>`;
}

function renderSchedules(){
  const list = document.getElementById("schedule-list");
  if (!list) return;
  if (schedules.length === 0){
    list.innerHTML = `
      <div class="empty-state">
        <div class="glyph">🗓️</div>
        <h3>Nothing scheduled</h3>
        <p>Add a schedule to track run times.</p>
      </div>`;
    return;
  }
  list.innerHTML = schedules.map(scheduleCard).join("");
  list.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=> {
      const idx = schedules.findIndex(s => s._id === btn.dataset.del);
      if (idx !== -1) {
        schedules.splice(idx, 1);
        renderSchedules();
        showToast("Schedule removed");
      }
    });
  });
}

document.getElementById("btn-add-schedule")?.addEventListener("click", ()=>{
  const sel = document.getElementById("sch-device");
  sel.innerHTML = scopedDevices().map(d => `<option value="${d._id}">${d.name} (${d.brokerClId})</option>`).join("");
  const dt = new Date(Date.now() + 30*60000);
  document.getElementById("sch-start").value = dt.toISOString().slice(0,16);
  openSheet("overlay-schedule");
});
document.getElementById("sch-cancel")?.addEventListener("click", ()=> closeSheet("overlay-schedule"));
document.getElementById("sch-save")?.addEventListener("click", ()=>{
  const deviceId = document.getElementById("sch-device").value;
  const device = devices.find(d => d._id === deviceId);
  const title = document.getElementById("sch-title").value.trim() || `${device?.hub ?? 'Plot'} / ${device?.type ?? 'Pump'}`;
  const mins = Number(document.getElementById("sch-mins").value) || 20;
  const startVal = document.getElementById("sch-start").value;
  const startAt = startVal ? new Date(startVal).toISOString() : new Date().toISOString();
  const endAt = new Date(new Date(startAt).getTime() + mins*60000).toISOString();

  schedules.unshift({
    _id: "sch_" + Math.random().toString(36).slice(2, 9),
    deviceId, deviceType: device?.type ?? "Pump",
    title, farm: device?.hub ?? "—", plot: device?.plot ?? null,
    status: "Upcoming", startAt, endAt, durationMin: mins,
    meta: { notes: "" }, progress: 0,
  });
  renderSchedules();
  closeSheet("overlay-schedule");
  showToast("Schedule saved");
  document.getElementById("sch-title").value = "";
});

// ---------- Sheet System & Navigation ----------
function openSheet(id) {
  if (id === "overlay-register") initRegisterModal();
  if (id === "overlay-plot") initPlotModal();
  if (id === "overlay-control") initControlModal();
  document.getElementById(id).classList.add("open");
}
function closeSheet(id) {
  document.getElementById(id).classList.remove("open");
}

document.querySelectorAll(".sheet-overlay").forEach(ov => {
  ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("open"); });
});

const navButtons = document.querySelectorAll(".nav-btn");
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.nav;

    document.getElementById("screen-manual").classList.remove("visible");
    document.getElementById("screen-schedule").classList.remove("visible");
    plotEl.style.display = "flex";

    if (target === "manual") {
      document.getElementById("screen-manual").classList.add("visible");
      heroTitle.textContent = "Manual Control";
    } else if (target === "schedule") {
      document.getElementById("screen-schedule").classList.add("visible");
      heroTitle.textContent = "Time Schedule";
      plotEl.style.display = "none";
    }
    refreshFabVisibility();
  });
});

const fab = document.getElementById("fab-add-control");
fab.addEventListener("click", () => openSheet("overlay-control"));

function refreshFabVisibility() {
  const manualVisible = document.getElementById("screen-manual").classList.contains("visible");
  fab.style.display = (manualVisible && canManageResources()) ? "flex" : "none";
}

// Account Sheet Open
document.getElementById("btn-account").addEventListener("click", () => {
  document.getElementById("acct-initials").textContent =
    currentUser.fullName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  document.getElementById("acct-name").textContent = currentUser.fullName;
  
  const roleBadge = document.getElementById("acct-role");
  roleBadge.textContent = roleLabels[currentUser.role];
  roleBadge.className = "role-badge " + currentUser.role;

  const scopeNote = document.getElementById("scope-note");
  const manageUserSec = document.getElementById("manage-users-section");
  const managePlotSec = document.getElementById("manage-plots-section");

  if (currentUser.role === "superadmin") {
    scopeNote.textContent = `Super Admin (${currentUser.brokerId}) — Global access across all client farms.`;
    manageUserSec.style.display = "block";
    managePlotSec.style.display = "block";
    renderUserManagementList();
    renderPlotsManagementList();
  } else if (currentUser.role === "admin") {
    scopeNote.textContent = `Client Admin (${currentUser.clId}) — Full control of plots, devices, and operators.`;
    manageUserSec.style.display = "block";
    managePlotSec.style.display = "block";
    renderUserManagementList();
    renderPlotsManagementList();
  } else {
    scopeNote.textContent = `Operator (${currentUser.clId}) — Viewing only your assigned controls.`;
    manageUserSec.style.display = "none";
    managePlotSec.style.display = "none";
  }

  openSheet("overlay-account");
});

document.getElementById("btn-open-register").addEventListener("click", () => {
  closeSheet("overlay-account");
  openSheet("overlay-register");
});

document.getElementById("btn-logout").addEventListener("click", () => {
  closeSheet("overlay-account");
  currentUser = null;
  document.getElementById("login-username").value = "";
  document.getElementById("login-password").value = "";
  document.getElementById("login-overlay").style.display = "flex";
});

// ---------- Login Handlers ----------
function attemptLogin() {
  const username = document.getElementById("login-username").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const errorBox = document.getElementById("login-error");

  if (!credentials[username] || credentials[username] !== password) {
    errorBox.textContent = "Invalid username or password.";
    errorBox.classList.add("show");
    return;
  }

  currentUser = users.find(u => u.username === username);
  errorBox.classList.remove("show");
  document.getElementById("login-overlay").style.display = "none";

  renderPills();
  renderDevices();
  renderSchedules();
  refreshFabVisibility();
  showToast(`Signed in as ${currentUser.fullName} (${roleLabels[currentUser.role]})`);
}

document.getElementById("login-submit").addEventListener("click", attemptLogin);
document.getElementById("login-password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") attemptLogin();
});

let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}
