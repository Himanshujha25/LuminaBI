/**
 * WorkspaceDropdown.jsx
 * Drop-in replacement for the inline dataset dropdown in MainDashboard.
 * Paste this file alongside MainDashboard and import it:
 *   import WorkspaceDropdown from './WorkspaceDropdown';
 *
 * Then replace the entire <div ... ref={datasetDropRef}> block in MainDashboard
 * with:
 *   <WorkspaceDropdown
 *     datasets={datasets}
 *     activeDataset={activeDataset}
 *     setActiveDataset={setActiveDataset}
 *     onUploadClick={onUploadClick}
 *     showPreview={showPreview}
 *     setShowPreview={setShowPreview}
 *   />
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Database, ChevronDown, Search, Plus, Table } from 'lucide-react';

/* ─── Theme tokens ─────────────────────────────────────────────────────────── */
const STYLES = `
  :root, [data-theme="dark"] {
    --ws-trig-bg:          rgba(255,255,255,.04);
    --ws-trig-bdr:         rgba(255,255,255,.09);
    --ws-trig-bg-open:     rgba(99,102,241,.1);
    --ws-trig-bdr-open:    rgba(99,102,241,.35);
    --ws-trig-label:       rgba(255,255,255,.28);
    --ws-trig-name:        #f1f5f9;
    --ws-trig-chev:        rgba(255,255,255,.25);

    --ws-dd-bg:            #111116;
    --ws-dd-bdr:           rgba(255,255,255,.09);
    --ws-dd-shadow:        0 24px 64px rgba(0,0,0,.6), 0 0 0 .5px rgba(255,255,255,.05);

    --ws-hdr-bg:           rgba(255,255,255,.025);
    --ws-hdr-bdr:          rgba(255,255,255,.06);
    --ws-hdr-lbl:          rgba(255,255,255,.28);

    --ws-new-bg:           rgba(99,102,241,.15);
    --ws-new-bdr:          rgba(99,102,241,.3);
    --ws-new-txt:          #a5b4fc;

    --ws-srch-bg:          rgba(255,255,255,.05);
    --ws-srch-bdr:         rgba(255,255,255,.08);
    --ws-srch-icon:        rgba(255,255,255,.25);
    --ws-srch-ph:          rgba(255,255,255,.22);
    --ws-srch-txt:         #f1f5f9;

    --ws-item-hover-bg:    rgba(255,255,255,.05);
    --ws-item-hover-bdr:   rgba(255,255,255,.07);
    --ws-item-active-bg:   rgba(99,102,241,.1);
    --ws-item-active-bdr:  rgba(99,102,241,.22);

    --ws-av-bg:            rgba(255,255,255,.07);
    --ws-av-bdr:           rgba(255,255,255,.09);
    --ws-av-txt:           rgba(255,255,255,.5);
    --ws-av-bg-a:          rgba(99,102,241,.2);
    --ws-av-bdr-a:         rgba(99,102,241,.3);
    --ws-av-txt-a:         #a5b4fc;

    --ws-name:             #f1f5f9;
    --ws-name-a:           #c7d2fe;
    --ws-meta:             rgba(255,255,255,.22);
    --ws-dot:              #22d3ee;
    --ws-check:            #6366f1;

    --ws-ftr-bg:           rgba(255,255,255,.015);
    --ws-ftr-bdr:          rgba(255,255,255,.06);
    --ws-ftr-txt:          rgba(255,255,255,.2);
    --ws-ftr-cnt:          rgba(255,255,255,.5);
    --ws-kbd-bg:           rgba(255,255,255,.06);
    --ws-kbd-bdr:          rgba(255,255,255,.1);
    --ws-kbd-txt:          rgba(255,255,255,.3);

    --ws-prev-bg:          rgba(255,255,255,.04);
    --ws-prev-bdr:         rgba(255,255,255,.09);
    --ws-prev-txt:         rgba(255,255,255,.45);
    --ws-prev-icon:        rgba(255,255,255,.3);
    --ws-prev-hover-bg:    rgba(99,102,241,.1);
    --ws-prev-hover-bdr:   rgba(99,102,241,.3);
    --ws-prev-hover-txt:   #a5b4fc;
    --ws-prev-hover-icon:  #818cf8;
  }

  [data-theme="light"] {
    --ws-trig-bg:          #ffffff;
    --ws-trig-bdr:         rgba(0,0,0,.1);
    --ws-trig-bg-open:     rgba(99,102,241,.07);
    --ws-trig-bdr-open:    rgba(99,102,241,.3);
    --ws-trig-label:       rgba(0,0,0,.38);
    --ws-trig-name:        #0f0f12;
    --ws-trig-chev:        rgba(0,0,0,.3);

    --ws-dd-bg:            #ffffff;
    --ws-dd-bdr:           rgba(0,0,0,.09);
    --ws-dd-shadow:        0 20px 60px rgba(0,0,0,.14), 0 0 0 .5px rgba(0,0,0,.06);

    --ws-hdr-bg:           rgba(0,0,0,.02);
    --ws-hdr-bdr:          rgba(0,0,0,.07);
    --ws-hdr-lbl:          rgba(0,0,0,.35);

    --ws-new-bg:           rgba(99,102,241,.08);
    --ws-new-bdr:          rgba(99,102,241,.22);
    --ws-new-txt:          #4f46e5;

    --ws-srch-bg:          rgba(0,0,0,.04);
    --ws-srch-bdr:         rgba(0,0,0,.09);
    --ws-srch-icon:        rgba(0,0,0,.28);
    --ws-srch-ph:          rgba(0,0,0,.28);
    --ws-srch-txt:         #0f0f12;

    --ws-item-hover-bg:    rgba(0,0,0,.04);
    --ws-item-hover-bdr:   rgba(0,0,0,.06);
    --ws-item-active-bg:   rgba(99,102,241,.07);
    --ws-item-active-bdr:  rgba(99,102,241,.18);

    --ws-av-bg:            rgba(0,0,0,.05);
    --ws-av-bdr:           rgba(0,0,0,.09);
    --ws-av-txt:           rgba(0,0,0,.4);
    --ws-av-bg-a:          rgba(99,102,241,.12);
    --ws-av-bdr-a:         rgba(99,102,241,.25);
    --ws-av-txt-a:         #4f46e5;

    --ws-name:             #0f0f12;
    --ws-name-a:           #3730a3;
    --ws-meta:             rgba(0,0,0,.32);
    --ws-dot:              #0891b2;
    --ws-check:            #6366f1;

    --ws-ftr-bg:           rgba(0,0,0,.02);
    --ws-ftr-bdr:          rgba(0,0,0,.07);
    --ws-ftr-txt:          rgba(0,0,0,.28);
    --ws-ftr-cnt:          rgba(0,0,0,.55);
    --ws-kbd-bg:           rgba(0,0,0,.06);
    --ws-kbd-bdr:          rgba(0,0,0,.1);
    --ws-kbd-txt:          rgba(0,0,0,.35);

    --ws-prev-bg:          #ffffff;
    --ws-prev-bdr:         rgba(0,0,0,.1);
    --ws-prev-txt:         rgba(0,0,0,.5);
    --ws-prev-icon:        rgba(0,0,0,.3);
    --ws-prev-hover-bg:    rgba(99,102,241,.07);
    --ws-prev-hover-bdr:   rgba(99,102,241,.25);
    --ws-prev-hover-txt:   #4f46e5;
    --ws-prev-hover-icon:  #4f46e5;
  }

  /* Trigger */
  .ws-trig {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 7px 12px 7px 7px;
    border-radius: 11px;
    border: 1px solid var(--ws-trig-bdr);
    background: var(--ws-trig-bg);
    cursor: pointer;
    user-select: none;
    transition: background .15s, border-color .15s, box-shadow .15s;
  }
  .ws-trig:hover {
    border-color: rgba(99,102,241,.25);
    background: var(--ws-trig-bg-open);
  }
  .ws-trig.open {
    background: var(--ws-trig-bg-open);
    border-color: var(--ws-trig-bdr-open);
    box-shadow: 0 0 0 3px rgba(99,102,241,.1);
  }
  .ws-trig-icon {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center;
  }
  .ws-trig-label {
    font-size: 9px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; color: var(--ws-trig-label); display: block;
  }
  .ws-trig-name {
    font-size: 13px; font-weight: 600; color: var(--ws-trig-name);
    white-space: nowrap; display: block;
  }
  .ws-chev {
    color: var(--ws-trig-chev);
    transition: transform .15s;
    flex-shrink: 0;
  }
  .ws-trig.open .ws-chev { transform: rotate(180deg); }

  /* Dropdown panel */
  .ws-dd {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 300px;
    z-index: 100;
    background: var(--ws-dd-bg);
    border: 1px solid var(--ws-dd-bdr);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: var(--ws-dd-shadow);
    animation: ws-pop .15s cubic-bezier(.2,.8,.3,1);
  }
  @keyframes ws-pop {
    from { opacity: 0; transform: translateY(-6px) scale(.98); }
    to   { opacity: 1; transform: translateY(0)    scale(1);   }
  }

  /* Header */
  .ws-hdr {
    padding: 12px 14px 10px;
    background: var(--ws-hdr-bg);
    border-bottom: 1px solid var(--ws-hdr-bdr);
  }
  .ws-hdr-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 9px;
  }
  .ws-hdr-lbl {
    font-size: 9px; font-weight: 800; letter-spacing: .1em;
    text-transform: uppercase; color: var(--ws-hdr-lbl);
  }
  .ws-new-btn {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 7px;
    background: var(--ws-new-bg); border: 1px solid var(--ws-new-bdr);
    color: var(--ws-new-txt); font-size: 11px; font-weight: 600;
    cursor: pointer; font-family: inherit;
    transition: opacity .12s;
  }
  .ws-new-btn:hover { opacity: .8; }

  /* Search */
  .ws-srch {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 10px; border-radius: 8px;
    background: var(--ws-srch-bg); border: 1px solid var(--ws-srch-bdr);
    transition: border-color .12s;
  }
  .ws-srch:focus-within { border-color: rgba(99,102,241,.4); }
  .ws-srch input {
    flex: 1; background: transparent; border: none; outline: none;
    font-size: 12px; color: var(--ws-srch-txt); font-family: inherit;
  }
  .ws-srch input::placeholder { color: var(--ws-srch-ph); }

  /* List */
  .ws-list {
    padding: 6px; max-height: 232px; overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(99,102,241,.2) transparent;
  }

  .ws-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 9px; border-radius: 9px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background .1s, border-color .1s;
    width: 100%; text-align: left; background: transparent;
    font-family: inherit;
    margin-bottom: 2px;
  }
  .ws-item:last-child { margin-bottom: 0; }
  .ws-item:hover:not(.ws-item--active) {
    background: var(--ws-item-hover-bg);
    border-color: var(--ws-item-hover-bdr);
  }
  .ws-item--active {
    background: var(--ws-item-active-bg);
    border-color: var(--ws-item-active-bdr);
  }

  .ws-av {
    width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    background: var(--ws-av-bg); border: 1px solid var(--ws-av-bdr);
    color: var(--ws-av-txt);
  }
  .ws-item--active .ws-av {
    background: var(--ws-av-bg-a); border-color: var(--ws-av-bdr-a);
    color: var(--ws-av-txt-a);
  }

  .ws-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  .ws-name {
    font-size: 13px; font-weight: 600; color: var(--ws-name);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ws-item--active .ws-name { color: var(--ws-name-a); }
  .ws-meta {
    font-size: 11px; color: var(--ws-meta);
    display: flex; align-items: center; gap: 5px;
  }
  .ws-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--ws-dot); flex-shrink: 0;
  }

  .ws-check {
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--ws-check); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  .ws-empty {
    padding: 28px 16px; text-align: center;
    font-size: 13px; color: var(--ws-meta);
  }

  /* Footer */
  .ws-ftr {
    padding: 8px 14px;
    background: var(--ws-ftr-bg);
    border-top: 1px solid var(--ws-ftr-bdr);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ws-ftr-count { font-size: 11px; color: var(--ws-ftr-txt); }
  .ws-ftr-count strong { color: var(--ws-ftr-cnt); font-weight: 600; }
  .ws-ftr-keys { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--ws-ftr-txt); }
  .ws-kbd {
    padding: 1px 5px; border-radius: 4px; font-size: 9px; font-family: monospace;
    background: var(--ws-kbd-bg); border: 1px solid var(--ws-kbd-bdr);
    color: var(--ws-kbd-txt);
  }

  /* Preview button */
  .ws-preview-btn {
    display: inline-flex; align-items: center; gap: 7px;
    height: 36px; padding: 0 14px; border-radius: 9px;
    border: 1px solid var(--ws-prev-bdr);
    background: var(--ws-prev-bg);
    color: var(--ws-prev-txt);
    font-size: 13px; font-weight: 500; font-family: inherit;
    cursor: pointer;
    transition: background .13s, border-color .13s, color .13s, transform .12s;
    flex-shrink: 0;
    white-space: nowrap;
  }
  .ws-preview-btn:hover {
    background: var(--ws-prev-hover-bg);
    border-color: var(--ws-prev-hover-bdr);
    color: var(--ws-prev-hover-txt);
    transform: translateY(-1px);
  }
  .ws-preview-btn:active { transform: translateY(0) scale(.97); }
  .ws-preview-btn .ws-prev-icon { color: var(--ws-prev-icon); transition: color .13s; }
  .ws-preview-btn:hover .ws-prev-icon { color: var(--ws-prev-hover-icon); }

  /* Separator */
  .ws-sep {
    width: 1px; height: 22px;
    background: var(--ws-trig-bdr);
    flex-shrink: 0;
  }
`;

import useStore from '../store/useStore';

const WorkspaceDropdown = () => {
  const {
    datasets,
    activeDataset,
    setActiveDataset,
    setIsUploadOpen,
    setShowPreview,
  } = useStore();

  const onUploadClick = () => setIsUploadOpen(true);

  const [open, setOpen]         = useState(false);
  const [search, setSearch]     = useState('');
  const ref                     = useRef(null);
  const searchRef               = useRef(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return datasets;
    const q = search.toLowerCase();
    return datasets.filter(d =>
      d.name.toLowerCase().includes(q) || String(d.id).includes(q)
    );
  }, [datasets, search]);

  /* close on outside click */
  useEffect(() => {
    const fn = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  /* focus search when opens */
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const select = d => {
    setActiveDataset(d);
    setOpen(false);
    setSearch('');
  };

  const initials = name =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }} ref={ref}>

        {/* ── Trigger ── */}
        <button
          className={`ws-trig${open ? ' open' : ''}`}
          onClick={() => setOpen(o => !o)}
          type="button"
        >
          <div className="ws-trig-icon">
            <Database size={14} color="white" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span className="ws-trig-label">Workspace</span>
            <span className="ws-trig-name">
              {activeDataset?.name || 'Select workspace'}
            </span>
          </div>
          <ChevronDown size={14} className="ws-chev" />
        </button>

        {/* ── Dropdown ── */}
        {open && (
          <div className="ws-dd">

            {/* Header */}
            <div className="ws-hdr">
              <div className="ws-hdr-row">
                <span className="ws-hdr-lbl">Workspaces</span>
                <button
                  className="ws-new-btn"
                  type="button"
                  onClick={e => { e.stopPropagation(); setOpen(false); onUploadClick(); }}
                >
                  <Plus size={10} />
                  New
                </button>
              </div>
              <div className="ws-srch">
                <Search size={13} color="var(--ws-srch-icon)" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search workspaces…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* List */}
            <div className="ws-list">
              {filtered.length === 0 ? (
                <div className="ws-empty">No workspaces found.</div>
              ) : (
                filtered.map(d => {
                  const isActive = activeDataset?.id === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      className={`ws-item${isActive ? ' ws-item--active' : ''}`}
                      onClick={() => select(d)}
                    >
                      <div className="ws-av">{initials(d.name)}</div>
                      <div className="ws-info">
                        <span className="ws-name">{d.name}</span>
                        <span className="ws-meta">
                          {isActive && <span className="ws-dot" />}
                          {isActive ? 'Active · ' : ''}ID: {String(d.id).slice(0, 8)}
                        </span>
                      </div>
                      {isActive && (
                        <div className="ws-check">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>  
          </div>
        )}

        {/* ── Divider + Preview button ── */}
        {activeDataset && (
          <>
            <div className="ws-sep" />
            <button
              type="button"
              className="ws-preview-btn"
              onClick={() => setShowPreview(true)}
              title="Preview raw data"
            >
              <Table size={14} className="ws-prev-icon" />
              <span className="hidden sm:inline">Preview Dataset</span>
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default WorkspaceDropdown;