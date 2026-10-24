import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen, CalendarDays, Check, CheckCircle2, Circle, ClipboardList,
  Clock3, Filter, LoaderCircle, Plus, Search, Trash2, Pencil, X,
  AlertCircle, GraduationCap, LayoutDashboard, RefreshCw, Flag
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const blankForm = {
  title: "", subject: "", description: "", dueDate: "", priority: "Medium",
};

function formatDate(date) {
  if (!date) return "No deadline";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "No deadline";
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const due = new Date(task.dueDate);
  due.setHours(23, 59, 59, 999);
  return due < new Date();
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Something went wrong");
  return payload;
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await request("/tasks");
      setTasks(result.data || []);
    } catch (err) {
      setError(`${err.message}. Make sure the backend is running and connected to MongoDB.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    request("/health")
      .then((result) => setApiStatus(result.database === "connected" ? "connected" : "disconnected"))
      .catch(() => setApiStatus("offline"));
  }, [loadTasks]);

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
    overdue: tasks.filter(isOverdue).length,
  }), [tasks]);

  const visibleTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesFilter = filter === "all" ||
        (filter === "pending" && !task.completed) ||
        (filter === "completed" && task.completed);
      const matchesSearch = !q || [task.title, task.subject, task.description]
        .some((value) => (value || "").toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [tasks, filter, search]);

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    setModalOpen(true);
    setNotice("");
  }

  function openEdit(task) {
    setEditing(task);
    setForm({
      title: task.title || "",
      subject: task.subject || "",
      description: task.description || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      priority: task.priority || "Medium",
    });
    setModalOpen(true);
    setNotice("");
  }

  async function saveTask(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError("");
    try {
      const body = { ...form, dueDate: form.dueDate || null };
      if (editing) {
        await request(`/tasks/${editing._id}`, { method: "PUT", body: JSON.stringify(body) });
        setNotice("Assignment updated successfully.");
      } else {
        await request("/tasks", { method: "POST", body: JSON.stringify(body) });
        setNotice("Assignment added successfully.");
      }
      setModalOpen(false);
      await loadTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    try {
      await request(`/tasks/${task._id}/toggle`, { method: "PATCH" });
      setTasks((current) => current.map((item) =>
        item._id === task._id ? { ...item, completed: !item.completed } : item
      ));
      setNotice(task.completed ? "Assignment marked pending." : "Nice work — assignment completed!");
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await request(`/tasks/${task._id}`, { method: "DELETE" });
      setTasks((current) => current.filter((item) => item._id !== task._id));
      setNotice("Assignment deleted.");
    } catch (err) {
      setError(err.message);
    }
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-mark"><GraduationCap size={23} /></span>
          <span>flexi<span className="brand-dot">.</span><small>STUDENT SPACE</small></span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <button className="nav-item active"><LayoutDashboard size={18} /> Dashboard</button>
        <button className="nav-item" onClick={() => { setFilter("all"); document.querySelector(".task-section")?.scrollIntoView({ behavior: "smooth" }); }}><ClipboardList size={18} /> My assignments <span className="nav-count">{counts.all}</span></button>
        <button className="nav-item" onClick={() => { setFilter("pending"); document.querySelector(".task-section")?.scrollIntoView({ behavior: "smooth" }); }}><Clock3 size={18} /> Pending <span className="nav-count">{counts.pending}</span></button>
        <button className="nav-item" onClick={() => { setFilter("completed"); document.querySelector(".task-section")?.scrollIntoView({ behavior: "smooth" }); }}><CheckCircle2 size={18} /> Completed</button>
        <div className="sidebar-bottom">
          <div className="database-card">
            <span className={`status-dot ${apiStatus === "connected" ? "online" : ""}`} />
            <div><strong>Database status</strong><small>{apiStatus === "connected" ? "MongoDB connected" : apiStatus === "checking" ? "Checking connection…" : apiStatus === "offline" ? "API unavailable" : "Database disconnected"}</small></div>
          </div>
          <div className="profile-row"><div className="avatar">S</div><div><strong>Student</strong><small>My workspace</small></div><span className="profile-more">•••</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>Dashboard</strong></div>
          <div className="topbar-right"><span className="date-label"><CalendarDays size={16} /> {today}</span><span className="top-avatar">S</span></div>
        </header>

        <section className="welcome-row">
          <div><div className="eyebrow">YOUR PERSONAL STUDY SPACE</div><h1>Let’s get things done<span className="wave"> ✦</span></h1><p>Keep your assignments organised and make every study session count.</p></div>
          <button className="primary-button" onClick={openCreate}><Plus size={18} /> Add assignment</button>
        </section>

        {notice && <div className="notice"><CheckCircle2 size={17} /> {notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={16} /></button></div>}
        {error && <div className="error-banner"><AlertCircle size={18} /><span>{error}</span><button onClick={() => { setError(""); loadTasks(); }}><RefreshCw size={15} /> Retry</button></div>}

        <section className="stats-grid">
          <article className="stat-card"><div className="stat-top"><span>Total assignments</span><span className="stat-icon lilac"><BookOpen size={19} /></span></div><div className="stat-number">{counts.all}</div><div className="stat-foot">Across all your subjects</div></article>
          <article className="stat-card"><div className="stat-top"><span>Pending tasks</span><span className="stat-icon amber"><Clock3 size={19} /></span></div><div className="stat-number">{counts.pending}</div><div className="stat-foot">Ready for you to tackle</div></article>
          <article className="stat-card"><div className="stat-top"><span>Completed</span><span className="stat-icon green"><CheckCircle2 size={19} /></span></div><div className="stat-number">{counts.completed}</div><div className="stat-foot">{counts.all ? Math.round((counts.completed / counts.all) * 100) : 0}% of all assignments</div></article>
          <article className="stat-card"><div className="stat-top"><span>Overdue</span><span className="stat-icon rose"><Flag size={19} /></span></div><div className="stat-number">{counts.overdue}</div><div className="stat-foot">Past their due date</div></article>
        </section>

        <section className="task-section">
          <div className="section-heading"><div><h2>Your assignments</h2><p>A little progress each day adds up.</p></div><button className="text-button" onClick={loadTasks}><RefreshCw size={15} /> Refresh</button></div>
          <div className="toolbar">
            <div className="filter-tabs" aria-label="Filter assignments">
              {[["all", "All tasks"], ["pending", "Pending"], ["completed", "Completed"]].map(([key, label]) => <button key={key} className={filter === key ? "filter-tab selected" : "filter-tab"} onClick={() => setFilter(key)}>{label}{key === "all" && <span>{counts.all}</span>}</button>)}
            </div>
            <label className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assignments..." /><kbd>⌕</kbd></label>
          </div>

          <div className="task-list">
            {loading ? <div className="empty-state"><LoaderCircle className="spin" size={26} /><strong>Loading your assignments…</strong><span>Connecting to your workspace</span></div> :
              visibleTasks.length === 0 ? <div className="empty-state"><div className="empty-icon"><Filter size={24} /></div><strong>{search ? "No matching assignments" : filter === "completed" ? "Nothing completed yet" : "Your workspace is clear"}</strong><span>{search ? "Try a different search term." : "Add an assignment to get your study plan started."}</span>{!search && filter !== "completed" && <button className="primary-button small" onClick={openCreate}><Plus size={16} /> Add your first assignment</button>}</div> :
              visibleTasks.map((task) => <article className={`task-card ${task.completed ? "task-done" : ""}`} key={task._id}>
                <button className={`check-button ${task.completed ? "checked" : ""}`} onClick={() => toggleTask(task)} aria-label={task.completed ? "Mark pending" : "Mark completed"}>{task.completed ? <Check size={16} /> : <Circle size={20} />}</button>
                <div className="task-main"><div className="task-title-row"><h3>{task.title}</h3>{isOverdue(task) && <span className="pill overdue-pill">Overdue</span>}</div><p>{task.description || "No description added."}</p><div className="task-meta"><span className="subject-chip"><BookOpen size={13} /> {task.subject || "General"}</span><span className={isOverdue(task) ? "due-date late" : "due-date"}><CalendarDays size={13} /> {formatDate(task.dueDate)}</span><span className={`priority ${String(task.priority || "Medium").toLowerCase()}`}><span /> {task.priority || "Medium"} priority</span></div></div>
                <div className="task-actions"><button onClick={() => openEdit(task)} aria-label="Edit assignment" title="Edit"><Pencil size={16} /></button><button onClick={() => deleteTask(task)} aria-label="Delete assignment" title="Delete"><Trash2 size={16} /></button></div>
              </article>)
            }
          </div>
          <div className="list-footer"><span>Showing <strong>{visibleTasks.length}</strong> of <strong>{counts.all}</strong> assignments</span><span className="footer-live"><span className="status-dot online" /> Saved to database</span></div>
        </section>
        <footer className="app-footer"><span>Made for a more organised semester.</span><span>FLEXI · Full-stack student workspace</span></footer>
      </main>

      {modalOpen && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <form className="task-modal" onSubmit={saveTask}>
          <div className="modal-heading"><div><span className="eyebrow">{editing ? "KEEP IT UP TO DATE" : "MAKE A PLAN"}</span><h2>{editing ? "Edit assignment" : "Add an assignment"}</h2><p>Capture the details so nothing slips through the cracks.</p></div><button type="button" className="close-button" onClick={() => setModalOpen(false)} aria-label="Close"><X size={20} /></button></div>
          <label className="field-label">Assignment title <span>*</span><input required maxLength="120" autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Data Structures lab report" /></label>
          <div className="field-row"><label className="field-label">Subject<input maxLength="80" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. DAA" /></label><label className="field-label">Due date<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label></div>
          <label className="field-label">Description<textarea rows="3" maxLength="1000" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Add notes or instructions (optional)" /></label>
          <label className="field-label">Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label>
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary-button" type="submit" disabled={saving}>{saving ? <><LoaderCircle className="spin" size={17} /> Saving…</> : <><Check size={17} /> {editing ? "Save changes" : "Create assignment"}</>}</button></div>
        </form>
      </div>}
    </div>
  );
}

export default App;
