"use client";

import React, { useState, useEffect } from 'react';
import MoodCalendar from '@/components/journal/MoodCalendar';

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Editor state
  const [editorDate, setEditorDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('neutral');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetchStats();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/journal');
      const data = await res.json();
      if (data.entries) setEntries(data.entries);
    } catch (err) {
      console.error('Failed to fetch journal entries', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/journal/stats');
      const data = await res.json();
      if (!data.error) setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (t) => {
    setTags(tags.filter(tag => tag !== t));
  };

  const handleSave = async () => {
    if (!editorDate || saving) return;
    setSaving(true);
    try {
      // Try to save via POST
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: editorDate, content, mood, tags })
      });
      
      if (res.status === 409) {
        // Exists, so update via PUT
        await fetch(`/api/journal/${editorDate}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, mood, tags })
        });
      }
      
      fetchEntries();
      fetchStats();
      alert('Journal entry saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const loadEntry = async (dateStr) => {
    try {
      const res = await fetch(`/api/journal/${dateStr}`);
      const data = await res.json();
      if (data && !data.error) {
        setEditorDate(data.date);
        setContent(data.content || '');
        setMood(data.mood || 'neutral');
        setTags(data.tags || []);
      } else {
        setEditorDate(dateStr);
        setContent('');
        setMood('neutral');
        setTags([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const moods = [
    { value: 'great', emoji: '😄', color: '#10b981' },
    { value: 'good', emoji: '🙂', color: '#6ee7b7' },
    { value: 'neutral', emoji: '😐', color: '#fcd34d' },
    { value: 'low', emoji: '😔', color: '#fb923c' },
    { value: 'rough', emoji: '😣', color: '#f43f5e' }
  ];

  return (
    <div className="module-container fade-in">
      <div className="hero-section">
        <h2 className="hero-greeting">Journal & Reflections</h2>
        <p className="hero-subtitle">Capture your thoughts, track your mood, and reflect on your journey.</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.currentStreak} 🔥</div>
            <div className="stat-label">Day Streak</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalEntries}</div>
            <div className="stat-label">Total Entries</div>
          </div>
        </div>
      )}

      <div className="journal-layout">
        {/* EDITOR */}
        <div className="editor-section kpi-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <input 
              type="date" 
              value={editorDate} 
              onChange={e => loadEntry(e.target.value)} 
              className="glowing-input date-picker"
            />
            <div className="mood-selector">
              {moods.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`mood-btn ${mood === m.value ? 'active' : ''}`}
                  style={{ '--mood-color': m.color }}
                  title={m.value}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <textarea 
            className="journal-textarea"
            placeholder="Write your reflection here... (Markdown supported)"
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          <div className="tags-section">
            <div className="tags-list">
              {tags.map(t => (
                <span key={t} className="tag-pill">
                  {t} <button onClick={() => removeTag(t)}>✕</button>
                </span>
              ))}
            </div>
            <input 
              type="text" 
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tags (press Enter)"
              className="tag-input"
            />
          </div>

          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </div>

        {/* FEED & CALENDAR */}
        <div className="sidebar-section">
          <MoodCalendar entries={entries} onDayClick={loadEntry} />
          
          <div className="entries-feed kpi-card" style={{ marginTop: 20 }}>
            <h3 className="section-title">Recent Entries</h3>
            <div className="feed-list">
              {entries.length === 0 && <p className="empty-text">No recent entries.</p>}
              {entries.slice(0, 5).map(e => (
                <div key={e.id} className="feed-item" onClick={() => loadEntry(e.date)}>
                  <div className="feed-header">
                    <span className="feed-date">{new Date(e.date).toLocaleDateString()}</span>
                    <span className="mood-dot" style={{ backgroundColor: moods.find(m => m.value === e.mood)?.color || '#ccc' }} />
                  </div>
                  <p className="feed-preview">{e.content ? e.content.substring(0, 60) + '...' : 'No content'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .stat-card { background: var(--surface); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); text-align: center; }
        .stat-value { font-size: 1.5rem; font-weight: bold; color: var(--text-primary); }
        .stat-label { font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }

        .journal-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
        @media (max-width: 900px) { .journal-layout { grid-template-columns: 1fr; } }
        
        .editor-section { padding: 24px; }
        .date-picker { width: auto; font-weight: bold; }
        .glowing-input { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-low); color: var(--text-primary); outline: none; }
        .glowing-input:focus { border-color: #8b5cf6; }

        .mood-selector { display: flex; gap: 8px; }
        .mood-btn { background: transparent; border: 2px solid transparent; font-size: 1.5rem; cursor: pointer; border-radius: 50%; padding: 4px; transition: 0.2s; }
        .mood-btn:hover { transform: scale(1.1); }
        .mood-btn.active { background: var(--surface-low); border-color: var(--mood-color); box-shadow: 0 0 10px var(--mood-color); }

        .journal-textarea { width: 100%; min-height: 400px; background: var(--surface-low); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; color: var(--text-primary); font-size: 1rem; line-height: 1.6; resize: vertical; margin-bottom: 16px; outline: none; font-family: inherit; }
        .journal-textarea:focus { border-color: #8b5cf6; }

        .tags-section { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; align-items: center; }
        .tags-list { display: flex; gap: 8px; flex-wrap: wrap; }
        .tag-pill { background: rgba(139,92,246,0.15); color: #8b5cf6; padding: 4px 10px; border-radius: 16px; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .tag-pill button { background: none; border: none; color: #8b5cf6; cursor: pointer; padding: 0; font-size: 0.7rem; opacity: 0.7; }
        .tag-pill button:hover { opacity: 1; }
        .tag-input { background: transparent; border: none; color: var(--text-primary); font-size: 0.85rem; outline: none; padding: 4px; }

        .btn-save { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; width: 100%; }
        .btn-save:hover { box-shadow: 0 4px 15px rgba(139,92,246,0.4); transform: translateY(-2px); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

        .entries-feed { padding: 16px; }
        .section-title { font-size: 1rem; margin-bottom: 12px; color: var(--text-primary); }
        .feed-list { display: flex; flex-direction: column; gap: 12px; }
        .feed-item { padding: 12px; border-radius: 8px; background: var(--surface-low); cursor: pointer; transition: 0.2s; border: 1px solid transparent; }
        .feed-item:hover { border-color: var(--border-color); transform: translateX(4px); }
        .feed-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .feed-date { font-size: 0.8rem; font-weight: bold; color: var(--text-secondary); }
        .mood-dot { width: 10px; height: 10px; border-radius: 50%; }
        .feed-preview { font-size: 0.8rem; color: var(--text-muted); margin: 0; line-height: 1.4; }
        .empty-text { font-size: 0.85rem; color: var(--text-muted); }

        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
