"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui';

// 7 days starting from Saturday (0 = Saturday ... 6 = Friday)
const WEEK_DAYS = [
  { dayIndex: 0, code: 'sat', short: 'Sat', label: 'Saturday', num: 1 },
  { dayIndex: 1, code: 'sun', short: 'Sun', label: 'Sunday', num: 2 },
  { dayIndex: 2, code: 'mon', short: 'Mon', label: 'Monday', num: 3 },
  { dayIndex: 3, code: 'tue', short: 'Tue', label: 'Tuesday', num: 4 },
  { dayIndex: 4, code: 'wed', short: 'Wed', label: 'Wednesday', num: 5 },
  { dayIndex: 5, code: 'thu', short: 'Thu', label: 'Thursday', num: 6 },
  { dayIndex: 6, code: 'fri', short: 'Fri', label: 'Friday', num: 7 },
];

const HOURS = Array.from({ length: 17 }, (_, i) => 6 + i); // 06:00 to 22:00
const HOUR_HEIGHT = 56; // 56px per hour
const START_HOUR = 6;

// Convert "HH:MM" to minutes from 06:00
function timeToOffsetMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m;
  const startMins = START_HOUR * 60;
  return Math.max(0, totalMins - startMins);
}

// Convert "HH:MM" start and end to height in pixels
function calculateDurationHeight(startStr, endStr) {
  if (!startStr || !endStr) return 38;
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh, em] = endStr.split(':').map(Number);
  const durationMins = Math.max(15, (eh * 60 + em) - (sh * 60 + sm));
  return Math.max(28, (durationMins / 60) * HOUR_HEIGHT);
}

// Map day string to 0-6 index (Sat=0..Fri=6)
function parseDayIndex(val) {
  if (typeof val === 'number') {
    if (val >= 1 && val <= 7) return val - 1;
    if (val >= 0 && val <= 6) return val;
  }
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s.startsWith('sat')) return 0;
    if (s.startsWith('sun')) return 1;
    if (s.startsWith('mon')) return 2;
    if (s.startsWith('tue')) return 3;
    if (s.startsWith('wed')) return 4;
    if (s.startsWith('thu')) return 5;
    if (s.startsWith('fri')) return 6;
    const num = parseInt(s, 10);
    if (!isNaN(num)) {
      if (num >= 1 && num <= 7) return num - 1;
      if (num >= 0 && num <= 6) return num;
    }
  }
  return null;
}

const CATEGORY_GRADIENTS = {
  Work: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(59, 130, 246, 0.25))',
  Education: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.25))',
  Health: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.25))',
  Personal: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.25))',
  Focus: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(225, 29, 72, 0.25))',
  Default: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.25))',
};

const CATEGORY_BORDER_COLORS = {
  Work: '#0ea5e9',
  Education: '#8b5cf6',
  Health: '#10b981',
  Personal: '#f59e0b',
  Focus: '#f43f5e',
  Default: '#06b6d4',
};

export default function TimetablePage() {
  const { addToast } = useToast();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active day for Mobile View
  const todaySatIndex = (new Date().getDay() + 1) % 7;
  const [selectedMobileDay, setSelectedMobileDay] = useState(todaySatIndex);

  // Add / Edit Entry Modal
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [entryForm, setEntryForm] = useState({
    day_of_week: 0,
    start_time: '08:00',
    end_time: '09:30',
    title: '',
    category: 'Work',
  });
  const [entryFormError, setEntryFormError] = useState('');
  const [savingEntry, setSavingEntry] = useState(false);

  // View Details Modal
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Delete Confirm
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedEntries, setParsedEntries] = useState([]);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Convert to Tasks Confirm
  const [isConvertToTasksOpen, setIsConvertToTasksOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  // Fetch all timetable entries
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/timetable');
      if (res.ok) {
        const data = await res.json();
        setEntries(data || []);
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to load timetable entries' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Handle Entry Form Open
  const handleOpenAdd = (defaultDay = 0) => {
    setEditingEntry(null);
    setEntryForm({
      day_of_week: defaultDay,
      start_time: '08:00',
      end_time: '09:30',
      title: '',
      category: 'Work',
    });
    setEntryFormError('');
    setIsEntryModalOpen(true);
  };

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setEntryForm({
      day_of_week: Number(entry.day_of_week),
      start_time: entry.start_time,
      end_time: entry.end_time,
      title: entry.title,
      category: entry.category || 'General',
    });
    setEntryFormError('');
    setSelectedEntry(null);
    setIsEntryModalOpen(true);
  };

  // Save Entry (Create / Update)
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.title.trim()) {
      setEntryFormError('Activity title is required.');
      return;
    }
    if (entryForm.start_time >= entryForm.end_time) {
      setEntryFormError('Start time must be earlier than end time.');
      return;
    }

    try {
      setSavingEntry(true);
      setEntryFormError('');

      const url = editingEntry ? `/api/timetable/${editingEntry.id}` : '/api/timetable';
      const method = editingEntry ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryForm),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save entry');
      }

      addToast({
        type: 'success',
        message: editingEntry ? 'Timetable entry updated' : 'Timetable entry added',
      });

      setIsEntryModalOpen(false);
      await fetchEntries();
    } catch (err) {
      setEntryFormError(err.message);
    } finally {
      setSavingEntry(false);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/timetable/${deletingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      addToast({ type: 'success', message: 'Timetable entry deleted' });
      setDeletingId(null);
      setSelectedEntry(null);
      await fetchEntries();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to delete' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Download Template
  const handleDownloadTemplate = async () => {
    try {
      addToast({ type: 'info', message: 'Generating Excel template...' });
      const res = await fetch('/api/timetable/template');
      if (!res.ok) throw new Error('Failed to generate template');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ApexHub_Timetable_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      addToast({ type: 'success', message: 'Template downloaded successfully' });
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    }
  };

  // File Parse with XLSX.read()
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      const parsed = json.map((row, idx) => {
        const rawDay = row.Day || row.day || row['Day of Week'] || row.day_of_week || '';
        const dayIndex = parseDayIndex(rawDay);
        const startTime = String(row['Start Time'] || row.start_time || row.Start || '').trim();
        const endTime = String(row['End Time'] || row.end_time || row.End || '').trim();
        const title = String(row.Activity || row.activity || row.Title || row.title || '').trim();
        const category = String(row.Category || row.category || 'General').trim() || 'General';

        const isValid =
          dayIndex !== null &&
          Boolean(startTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) &&
          Boolean(endTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) &&
          startTime < endTime &&
          title.length > 0;

        return {
          idx: idx + 1,
          rawDay,
          day_of_week: dayIndex,
          start_time: startTime,
          end_time: endTime,
          title,
          category,
          isValid,
        };
      });

      setParsedEntries(parsed);
      setIsImportModalOpen(true);
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to read file: ' + err.message });
    }
  };

  // Submit Import
  const handleExecuteImport = async () => {
    const validRows = parsedEntries.filter((p) => p.isValid);
    if (validRows.length === 0) {
      addToast({ type: 'error', message: 'No valid entries found to import.' });
      return;
    }

    try {
      setImporting(true);
      const res = await fetch('/api/timetable/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: validRows.map((r) => ({
            day_of_week: r.day_of_week,
            start_time: r.start_time,
            end_time: r.end_time,
            title: r.title,
            category: r.category,
          })),
          replaceExisting,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      addToast({
        type: 'success',
        message: `Imported ${data.imported} entries (${data.skipped} skipped).`,
      });

      setIsImportModalOpen(false);
      setParsedEntries([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchEntries();
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setImporting(false);
    }
  };

  // Execute Convert to Tasks
  const handleConvertToTasks = async () => {
    try {
      setConverting(true);
      const res = await fetch('/api/timetable/to-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to convert');

      addToast({
        type: 'success',
        message: `Created ${data.created} recurring weekly tasks (${data.skipped} already existed).`,
      });
      setIsConvertToTasksOpen(false);
    } catch (err) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setConverting(false);
    }
  };

  // Group entries by day index (0 to 6)
  const entriesByDay = useMemo(() => {
    const map = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    entries.forEach((entry) => {
      const d = Number(entry.day_of_week);
      if (map[d]) {
        map[d].push(entry);
      }
    });
    return map;
  }, [entries]);

  return (
    <div className="module-container fade-in">
      {/* Header Section */}
      <div className="hero-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="hero-greeting">Weekly Timetable</h2>
          <p className="hero-subtitle">Plan and visualize your structured routine (Saturday to Friday).</p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx, .xls, .csv"
            style={{ display: 'none' }}
          />

          <button className="btn-secondary-action" onClick={handleDownloadTemplate}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Template
          </button>

          <button className="btn-secondary-action" onClick={() => fileInputRef.current?.click()}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Import Excel
          </button>

          <button className="create-entry-btn" onClick={() => handleOpenAdd(todaySatIndex)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Activity
          </button>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="mobile-timetable-view">
        {/* Day Tabs */}
        <div className="mobile-day-tabs">
          {WEEK_DAYS.map((d) => {
            const isSelected = selectedMobileDay === d.dayIndex;
            const count = entriesByDay[d.dayIndex]?.length || 0;
            return (
              <button
                key={d.dayIndex}
                onClick={() => setSelectedMobileDay(d.dayIndex)}
                className={`mobile-day-tab ${isSelected ? 'active' : ''}`}
              >
                <span>{d.short}</span>
                {count > 0 && <span className="tab-dot" />}
              </button>
            );
          })}
        </div>

        {/* Selected Day List */}
        <div className="mobile-day-content">
          <div className="day-header-row">
            <h3 className="day-title">{WEEK_DAYS[selectedMobileDay].label}</h3>
            <button className="btn-small-add" onClick={() => handleOpenAdd(selectedMobileDay)}>
              + Add
            </button>
          </div>

          {entriesByDay[selectedMobileDay]?.length === 0 ? (
            <div className="empty-day glass-3d">
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No activities scheduled for this day.</p>
              <button className="btn-secondary-action" style={{ marginTop: '10px' }} onClick={() => handleOpenAdd(selectedMobileDay)}>
                Add First Activity
              </button>
            </div>
          ) : (
            <div className="mobile-entries-list">
              {entriesByDay[selectedMobileDay]
                ?.sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEntry(item)}
                    className="mobile-entry-card glass-3d"
                    style={{
                      borderLeft: `4px solid ${CATEGORY_BORDER_COLORS[item.category] || CATEGORY_BORDER_COLORS.Default}`,
                    }}
                  >
                    <div>
                      <div className="entry-card-title">{item.title}</div>
                      <div className="entry-card-time">{item.start_time} – {item.end_time}</div>
                    </div>
                    {item.category && (
                      <span className="entry-cat-badge">{item.category}</span>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* DESKTOP TIMETABLE GRID (Saturday -> Friday) */}
      <div className="desktop-timetable-view glass-3d">
        {/* Headers */}
        <div className="grid-header-row">
          <div className="time-header-cell">TIME</div>
          {WEEK_DAYS.map((d) => {
            const isToday = d.dayIndex === todaySatIndex;
            return (
              <div key={d.dayIndex} className={`day-header-cell ${isToday ? 'today-cell' : ''}`}>
                <div className="day-name">{d.label}</div>
                <div className="day-sub">Day {d.num}</div>
              </div>
            );
          })}
        </div>

        {/* Calendar Body */}
        <div className="grid-calendar-body">
          {/* Time axis */}
          <div className="time-axis-col">
            {HOURS.map((hour, idx) => (
              <div key={hour} className="time-hour-label" style={{ top: `${idx * HOUR_HEIGHT}px` }}>
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 7 Day Columns */}
          {WEEK_DAYS.map((d) => {
            const dayEntries = entriesByDay[d.dayIndex] || [];
            return (
              <div key={d.dayIndex} className="day-column">
                {/* Guidelines */}
                {HOURS.map((_, idx) => (
                  <div key={idx} className="hour-guideline" style={{ top: `${idx * HOUR_HEIGHT}px` }} />
                ))}

                {/* Entry Blocks */}
                {dayEntries.map((entry) => {
                  const topOffset = (timeToOffsetMinutes(entry.start_time) / 60) * HOUR_HEIGHT;
                  const blockHeight = calculateDurationHeight(entry.start_time, entry.end_time);
                  const bgGradient = CATEGORY_GRADIENTS[entry.category] || CATEGORY_GRADIENTS.Default;
                  const borderColor = CATEGORY_BORDER_COLORS[entry.category] || CATEGORY_BORDER_COLORS.Default;

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      style={{
                        top: `${topOffset}px`,
                        height: `${blockHeight}px`,
                        background: bgGradient,
                        borderColor: borderColor,
                      }}
                      className="entry-block"
                    >
                      <div className="block-title">{entry.title}</div>
                      <div className="block-time">{entry.start_time} - {entry.end_time}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Convert to Tasks Banner */}
      <div className="sync-tasks-banner glass-3d">
        <div>
          <h3 className="sync-title">Sync Timetable with Tasks</h3>
          <p className="sync-desc">Automatically convert your weekly timetable activities into recurring tasks.</p>
        </div>
        <button className="create-entry-btn" onClick={() => setIsConvertToTasksOpen(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          Import as Tasks
        </button>
      </div>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="custom-modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="custom-modal-box glass-3d" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Activity Details</h3>
              <button className="modal-close" onClick={() => setSelectedEntry(null)}>✕</button>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Activity Title</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 12px' }}>{selectedEntry.title}</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                <div className="detail-pill">
                  <span className="pill-label">Day</span>
                  <span className="pill-val">{WEEK_DAYS.find((d) => d.dayIndex === Number(selectedEntry.day_of_week))?.label}</span>
                </div>
                <div className="detail-pill">
                  <span className="pill-label">Time</span>
                  <span className="pill-val">{selectedEntry.start_time} – {selectedEntry.end_time}</span>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <span className="pill-label" style={{ display: 'block', marginBottom: '4px' }}>Category</span>
                <span className="entry-cat-badge" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>{selectedEntry.category || 'General'}</span>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setDeletingId(selectedEntry.id);
                  setSelectedEntry(null);
                }}
              >
                Delete
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn-cancel" onClick={() => setSelectedEntry(null)}>Close</button>
                <button type="button" className="btn-submit" onClick={() => handleOpenEdit(selectedEntry)}>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Entry Modal */}
      {isEntryModalOpen && (
        <div className="custom-modal-overlay" onClick={() => setIsEntryModalOpen(false)}>
          <div className="custom-modal-box glass-3d" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEntry ? 'Edit Activity' : 'Add Schedule Activity'}</h3>
              <button className="modal-close" onClick={() => setIsEntryModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveEntry} className="modal-form">
              <div className="form-group">
                <label className="form-label">Activity Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics Lecture, Deep Focus Block, Gym Workout"
                  value={entryForm.title}
                  onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Day of Week (Saturday – Friday)</label>
                <select
                  value={entryForm.day_of_week}
                  onChange={(e) => setEntryForm({ ...entryForm, day_of_week: Number(e.target.value) })}
                  className="form-input"
                >
                  {WEEK_DAYS.map((d) => (
                    <option key={d.dayIndex} value={d.dayIndex}>
                      {d.label} (Day {d.num})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Start Time (24h)</label>
                  <input
                    type="time"
                    value={entryForm.start_time}
                    onChange={(e) => setEntryForm({ ...entryForm, start_time: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time (24h)</label>
                  <input
                    type="time"
                    value={entryForm.end_time}
                    onChange={(e) => setEntryForm({ ...entryForm, end_time: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Work, Education, Health, Focus, Personal"
                  value={entryForm.category}
                  onChange={(e) => setEntryForm({ ...entryForm, category: e.target.value })}
                  className="form-input"
                />
              </div>

              {entryFormError && <div className="form-error-box">{entryFormError}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEntryModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={savingEntry}>
                  {savingEntry ? 'Saving...' : editingEntry ? 'Save Changes' : 'Add to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="custom-modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="custom-modal-box glass-3d" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Import Excel Timetable</h3>
              <button className="modal-close" onClick={() => setIsImportModalOpen(false)}>✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '14px' }}>
              Preview parsed rows below. Valid items will be imported into your weekly schedule.
            </p>

            <div className="import-preview-table-container">
              <table className="import-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Activity</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedEntries.map((row) => (
                    <tr key={row.idx} className={row.isValid ? '' : 'row-error'}>
                      <td>{row.isValid ? <span style={{ color: '#10b981', fontWeight: 800 }}>✓ Valid</span> : <span style={{ color: '#ef4444', fontWeight: 800 }}>✗ Error</span>}</td>
                      <td>{row.rawDay || '—'}</td>
                      <td>{row.start_time} - {row.end_time}</td>
                      <td>{row.title || '—'}</td>
                      <td>{row.category || 'General'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <label className="replace-checkbox-label">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
              />
              <span>Replace existing timetable (Warning: Clears all previous schedule entries)</span>
            </label>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
              <button type="button" className="btn-submit" onClick={handleExecuteImport} disabled={importing}>
                {importing ? 'Importing...' : `Import ${parsedEntries.filter((p) => p.isValid).length} Entries`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingId && (
        <div className="custom-modal-overlay" onClick={() => setDeletingId(null)}>
          <div className="custom-modal-box glass-3d" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444' }}>Delete Activity</h3>
              <button className="modal-close" onClick={() => setDeletingId(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '14px 0 20px' }}>
              Are you sure you want to remove this activity from your schedule?
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setDeletingId(null)}>Cancel</button>
              <button type="button" className="btn-danger" onClick={handleDeleteEntry} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Tasks Modal */}
      {isConvertToTasksOpen && (
        <div className="custom-modal-overlay" onClick={() => setIsConvertToTasksOpen(false)}>
          <div className="custom-modal-box glass-3d" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Convert to Weekly Tasks</h3>
              <button className="modal-close" onClick={() => setIsConvertToTasksOpen(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '14px 0 20px' }}>
              This will automatically convert all timetable activities into weekly recurring tasks in your Tasks module. Already converted entries won't be duplicated.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setIsConvertToTasksOpen(false)}>Cancel</button>
              <button type="button" className="btn-submit" onClick={handleConvertToTasks} disabled={converting}>
                {converting ? 'Converting...' : 'Convert Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .module-container { padding: 0; }

        .btn-secondary-action {
          display: inline-flex;
          align-items: center;
          padding: 9px 16px;
          border-radius: 12px;
          border: 1px solid var(--border-color);
          background: var(--surface);
          color: var(--text-primary);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary-action:hover {
          background: var(--surface-low);
          border-color: var(--accent);
          color: var(--accent);
        }

        .create-entry-btn {
          display: inline-flex;
          align-items: center;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 9px 18px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px var(--accent-glow);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .create-entry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--accent-glow);
        }

        /* Desktop Grid */
        .desktop-timetable-view {
          border-radius: 18px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          padding: 16px;
          overflow: hidden;
          margin-bottom: 24px;
        }

        .grid-header-row {
          display: grid;
          grid-template-columns: 64px repeat(7, 1fr);
          gap: 6px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color);
        }
        .time-header-cell {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .day-header-cell {
          text-align: center;
          padding: 6px;
          border-radius: 10px;
        }
        .day-header-cell.today-cell {
          background: rgba(0, 153, 255, 0.1);
          border: 1px solid var(--accent);
        }
        .day-name {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .day-sub {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        .grid-calendar-body {
          display: grid;
          grid-template-columns: 64px repeat(7, 1fr);
          gap: 6px;
          position: relative;
          height: 560px;
          overflow-y: auto;
          margin-top: 10px;
        }

        .time-axis-col {
          position: relative;
          height: ${HOURS.length * HOUR_HEIGHT}px;
        }
        .time-hour-label {
          position: absolute;
          width: 100%;
          text-align: center;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .day-column {
          position: relative;
          height: ${HOURS.length * HOUR_HEIGHT}px;
          background: rgba(255, 255, 255, 0.015);
          border-left: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .hour-guideline {
          position: absolute;
          width: 100%;
          border-bottom: 1px dashed var(--border-color);
          opacity: 0.4;
          pointer-events: none;
        }

        .entry-block {
          position: absolute;
          left: 3px;
          right: 3px;
          border-radius: 8px;
          padding: 6px 8px;
          border: 1px solid;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          backdrop-filter: blur(4px);
        }
        .entry-block:hover {
          transform: scale(1.02);
          z-index: 10;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
        }
        .block-title {
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .block-time {
          font-size: 0.68rem;
          color: var(--text-secondary);
          margin-top: 2px;
          font-weight: 600;
        }

        /* Mobile View */
        .mobile-timetable-view {
          display: none;
          margin-bottom: 24px;
        }
        .mobile-day-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--surface-low);
          border-radius: 14px;
          border: 1px solid var(--border-color);
          overflow-x: auto;
          margin-bottom: 16px;
        }
        .mobile-day-tab {
          flex: 1;
          min-width: 44px;
          padding: 8px 4px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-weight: 800;
          font-size: 0.78rem;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .mobile-day-tab.active {
          background: var(--surface);
          color: var(--accent);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .tab-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--accent);
          margin-top: 3px;
        }

        .day-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .day-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .btn-small-add {
          padding: 4px 10px;
          border-radius: 8px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
          color: var(--accent);
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .mobile-entries-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .mobile-entry-card {
          padding: 12px 14px;
          border-radius: 12px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }
        .entry-card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .entry-card-time {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin-top: 2px;
        }
        .entry-cat-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          background: var(--surface-low);
          color: var(--accent);
          border: 1px solid var(--border-color);
        }

        /* Sync Tasks Banner */
        .sync-tasks-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(0, 153, 255, 0.08), rgba(99, 102, 241, 0.08));
          border: 1px solid rgba(0, 153, 255, 0.25);
          gap: 16px;
        }
        .sync-title {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 3px;
        }
        .sync-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }

        .detail-pill {
          padding: 10px;
          border-radius: 10px;
          background: var(--surface-low);
          border: 1px solid var(--border-color);
        }
        .pill-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .pill-val {
          display: block;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-top: 2px;
        }

        /* Modals */
        .custom-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .custom-modal-box {
          width: 100%;
          max-width: 480px;
          background: var(--surface);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
          animation: modalAppear 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .modal-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
        }

        .form-group { margin-bottom: 14px; }
        .form-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--surface-low);
          color: var(--text-primary);
          font-size: 0.9rem;
          outline: none;
        }
        .form-input:focus { border-color: var(--accent); }

        .form-error-box {
          padding: 10px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 14px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        .btn-cancel {
          padding: 9px 16px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          font-weight: 700;
          cursor: pointer;
        }
        .btn-submit {
          padding: 9px 20px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, var(--accent-start), var(--accent-end));
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px var(--accent-glow);
        }
        .btn-danger {
          padding: 9px 20px;
          border-radius: 10px;
          border: none;
          background: #ef4444;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .import-preview-table-container {
          max-height: 240px;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          margin-bottom: 14px;
        }
        .import-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
          text-align: left;
        }
        .import-table th {
          padding: 10px;
          background: var(--surface-low);
          color: var(--text-muted);
          position: sticky;
          top: 0;
        }
        .import-table td {
          padding: 8px 10px;
          border-top: 1px solid var(--border-color);
          color: var(--text-primary);
        }
        .row-error { background: rgba(239, 68, 68, 0.08); color: #ef4444; }

        .replace-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: 10px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #f59e0b;
          cursor: pointer;
        }

        @media (max-width: 1024px) {
          .desktop-timetable-view { display: none; }
          .mobile-timetable-view { display: block; }
        }
      `}</style>
    </div>
  );
}
