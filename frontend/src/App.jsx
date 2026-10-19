import { useEffect, useMemo, useState } from 'react'
import { Activity, Bell, Boxes, Building2, ChevronDown, CircleHelp, Cpu, LayoutDashboard, Network, Plus, RefreshCw, Search, Server, ShieldCheck, Wifi, X } from 'lucide-react'

const typeLabels = {
  core_switch: 'Core switch', distribution_switch: 'Distribution switch', access_switch: 'Access switch',
  router: 'Router', firewall: 'Firewall', server: 'Server', access_point: 'Access point',
  cctv_nvr: 'CCTV / NVR', printer: 'Printer', other: 'Other'
}
const types = Object.entries(typeLabels).map(([value, label]) => ({ value, label }))

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split('; ') : []
  const cookie = cookies.find(item => item.startsWith(`${name}=`))
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null
}

function App() {
  const [summary, setSummary] = useState({ total_devices: 0, enabled_devices: 0, up: 0, down: 0, unknown: 0, maintenance: 0 })
  const [devices, setDevices] = useState([])
  const [locations, setLocations] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', ip_address: '', device_type: 'access_switch', vendor: '', model: '', location: '', notes: '' })

  async function loadData({ silent = false } = {}) {
    if (!silent) setLoading(true)
    setError('')
    try {
      const [s, d, l] = await Promise.all([
        fetch('/api/dashboard/summary/'), fetch('/api/devices/?page_size=100'), fetch('/api/locations/')
      ])
      if (!s.ok || !d.ok || !l.ok) throw new Error('API request failed. Confirm the Django backend is running.')
      const sj = await s.json(), dj = await d.json(), lj = await l.json()
      setSummary(sj)
      setDevices(Array.isArray(dj) ? dj : (dj.results || []))
      setLocations(Array.isArray(lj) ? lj : (lj.results || []))
    } catch (e) { setError(e.message || 'Unable to connect to the backend.') }
    finally { if (!silent) setLoading(false) }
  }
  useEffect(() => {
    loadData()
    const timer = setInterval(() => loadData({ silent: true }), 15000)
    return () => clearInterval(timer)
  }, [])

  const filtered = useMemo(() => devices.filter(d => {
    const hay = `${d.name} ${d.ip_address} ${d.vendor} ${d.model}`.toLowerCase()
    return hay.includes(search.toLowerCase()) && (statusFilter === 'all' || d.status === statusFilter)
  }), [devices, search, statusFilter])

  async function addDevice(e) {
    e.preventDefault()
    setError('')
    try {
      // Ask Django to set a CSRF cookie before sending the unsafe POST request.
      const csrfResponse = await fetch('/api/csrf/', { method: 'GET', credentials: 'include' })
      if (!csrfResponse.ok) throw new Error('Could not initialize CSRF protection. Confirm Django is running.')
      const csrfToken = getCookie('csrftoken')
      if (!csrfToken) throw new Error('Django did not set a CSRF cookie. Check the frontend URL and browser cookies.')

      const payload = { ...form, location: form.location || null }
      const response = await fetch('/api/devices/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      if (!response.ok) {
        const msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`).join(' · ')
        throw new Error(msg || 'Could not save device.')
      }
      setForm({ name: '', ip_address: '', device_type: 'access_switch', vendor: '', model: '', location: '', notes: '' })
      setShowForm(false)
      await loadData()
    } catch (e) { setError(e.message || 'Could not save device.') }
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><Network size={21}/></div><div><strong>AIIMS NMS</strong><span>Network Operations</span></div></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>
        <a className="nav-item active"><LayoutDashboard size={18}/> Overview</a>
        <a className="nav-item"><Boxes size={18}/> Device inventory</a>
        <a className="nav-item"><Network size={18}/> Topology <span className="soon">Next</span></a>
        <a className="nav-item"><Bell size={18}/> Alerts <span className="nav-count">{summary.down || 0}</span></a>
        <a className="nav-item"><Activity size={18}/> Performance</a>
        <a className="nav-item"><Server size={18}/> Servers</a>
      </nav>
      <div className="sidebar-bottom"><div className="secure"><ShieldCheck size={17}/><div><b>Internal monitoring</b><span>Authorized use only</span></div></div><div className="user"><div className="avatar">IT</div><div><b>IT Cell</b><span>Local development</span></div><ChevronDown size={15}/></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><span className="internal-pill"><span/> Development mode</span><button className="icon-btn" onClick={loadData} title="Refresh"><RefreshCw size={17}/></button></div></header>
      <section className="content">
        <div className="page-heading"><div><div className="eyebrow">AIIMS DEOGHAR · IT CELL</div><h1>Network overview</h1><p>Monitor infrastructure inventory and prepare your network operations workspace.</p></div><button className="primary-btn" onClick={() => setShowForm(true)}><Plus size={17}/> Add device</button></div>
        {error && <div className="error-banner"><CircleHelp size={17}/><span>{error}</span><button onClick={() => setError('')}><X size={15}/></button></div>}
        <div className="notice"><div className="notice-icon"><Activity size={19}/></div><div><b>Reachability monitoring</b><p>Run <code>python manage.py monitor_devices</code> in the backend terminal to check registered devices every 30 seconds. The dashboard refreshes status automatically every 15 seconds. ICMP ping only; SNMP metrics are a later milestone.</p></div></div>
        <div className="section-head"><div><h2>Infrastructure summary</h2><p>Inventory counts from the application database</p></div><span className="updated"><span className="dot"/> {loading ? 'Refreshing…' : 'Data loaded'}</span></div>
        <div className="stats-grid">
          <Stat icon={<Boxes/>} label="Total devices" value={summary.total_devices} hint={`${summary.enabled_devices} monitoring enabled`} tone="blue"/>
          <Stat icon={<Wifi/>} label="Online" value={summary.up} hint="Responding to ping" tone="green"/>
          <Stat icon={<Activity/>} label="Offline" value={summary.down} hint="No ping reply received" tone="red"/>
          <Stat icon={<Cpu/>} label="Unknown status" value={summary.unknown} hint="Awaiting first check" tone="amber"/>
        </div>
        <div className="section-head table-heading"><div><h2>Device inventory</h2><p>Search registered network equipment</p></div><button className="secondary-btn" onClick={loadData}><RefreshCw size={15}/> Refresh</button></div>
        <div className="table-card">
          <div className="table-tools"><div className="searchbox"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, IP, vendor or model…"/></div><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="unknown">Unknown</option><option value="up">Online</option><option value="down">Offline</option><option value="maintenance">Maintenance</option></select></div>
          <div className="table-wrap"><table><thead><tr><th>DEVICE</th><th>TYPE</th><th>LOCATION</th><th>STATUS</th><th>MONITORING</th></tr></thead><tbody>
            {loading ? <tr><td colSpan="5" className="empty">Loading device inventory…</td></tr> : filtered.length === 0 ? <tr><td colSpan="5" className="empty"><div className="empty-icon"><Building2 size={22}/></div><b>No devices found</b><span>Add an approved device to begin building the inventory.</span></td></tr> : filtered.map(d => <tr key={d.id}><td><div className="device-cell"><div className="device-icon"><Network size={17}/></div><div><b>{d.name}</b><span>{d.ip_address}</span></div></div></td><td>{typeLabels[d.device_type] || d.device_type}</td><td>{d.location_name || '—'}</td><td><Status status={d.status}/></td><td><span className={d.monitoring_enabled ? 'enabled' : 'disabled'}><span/>{d.monitoring_enabled ? 'Enabled' : 'Disabled'}</span></td></tr>)}
          </tbody></table></div>
          <div className="table-footer">Showing <b>{filtered.length}</b> of <b>{devices.length}</b> loaded devices <span>Auto-refresh every 15 seconds · ICMP reachability</span></div>
        </div>
        <footer>AIIMS Deoghar · Network Management System <span>Starter v0.1.0</span></footer>
      </section>
    </main>
    {showForm && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowForm(false) }}><div className="modal"><div className="modal-head"><div><h2>Add network device</h2><p>Register a device approved for monitoring.</p></div><button className="icon-btn" onClick={() => setShowForm(false)}><X size={18}/></button></div><form onSubmit={addDevice} className="device-form">
      <label>Device name *<input required value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="e.g. Core-Switch-01"/></label>
      <label>IPv4 address *<input required type="text" pattern="^(?:\d{1,3}\.){3}\d{1,3}$" value={form.ip_address} onChange={e => setForm({...form, ip_address:e.target.value})} placeholder="e.g. 192.168.10.1"/></label>
      <label>Device type *<select value={form.device_type} onChange={e => setForm({...form, device_type:e.target.value})}>{types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
      <div className="form-row"><label>Vendor<input value={form.vendor} onChange={e => setForm({...form, vendor:e.target.value})} placeholder="e.g. Cisco"/></label><label>Model<input value={form.model} onChange={e => setForm({...form, model:e.target.value})} placeholder="Model"/></label></div>
      <label>Location<select value={form.location} onChange={e => setForm({...form, location:e.target.value})}><option value="">No location assigned</option>{locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select><span className="field-help">Create locations in Django Admin for now.</span></label>
      <label>Notes<textarea rows="2" value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} placeholder="Optional asset notes"/></label>
      <div className="form-actions"><button type="button" className="secondary-btn" onClick={() => setShowForm(false)}>Cancel</button><button className="primary-btn" type="submit">Save device</button></div>
    </form></div></div>}
  </div>
}

function Stat({ icon, label, value, hint, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-hint">{hint}</div></div>
}
function Status({ status }) {
  const label = { up: 'Online', down: 'Offline', unknown: 'Unknown', maintenance: 'Maintenance' }[status] || status
  return <span className={`status status-${status}`}><span/>{label}</span>
}
export default App
