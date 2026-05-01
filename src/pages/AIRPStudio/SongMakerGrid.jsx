import { useState, useEffect, useRef } from 'react';

const COLS = 16;
const ROWS = 8;

const ROW_NOTES = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];

const PITCH_OPTIONS = [
  'C6', 'B5', 'A5', 'G5', 'F5', 'E5', 'D5',
  'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4',
  'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3',
];

const NOTE_FREQ = {
  'C6': 1046.50, 'B5': 987.77, 'A5': 880.00, 'G5': 783.99,
  'F5': 698.46, 'E5': 659.25, 'D5': 587.33,
  'C5': 523.25, 'B4': 493.88, 'A4': 440.00, 'G4': 392.00,
  'F4': 349.23, 'E4': 329.63, 'D4': 293.66,
  'C4': 261.63, 'B3': 246.94, 'A3': 220.00, 'G3': 196.00,
  'F3': 174.61, 'E3': 164.81, 'D3': 146.83, 'C3': 130.81,
};

const NOTE_HUE = { C: 0, D: 30, E: 55, F: 140, G: 190, A: 220, B: 270 };
const OCT_LIGHTNESS = { 3: 30, 4: 50, 5: 65, 6: 78 };

function noteColor(note) {
  const name = note.replace(/\d/, '');
  const oct = parseInt(note.slice(-1));
  return `hsl(${NOTE_HUE[name] ?? 0}, 80%, ${OCT_LIGHTNESS[oct] ?? 50}%)`;
}

function swatchStyle(note) {
  return { background: noteColor(note), color: parseInt(note.slice(-1)) <= 3 ? '#fff' : '#111' };
}

function makeGrid() {
  return Array.from({ length: COLS }, () =>
    Array.from({ length: ROWS }, (_, row) => ({ active: false, note: ROW_NOTES[row] }))
  );
}

function playNote(ctx, freq, stepSecs) {
  const now = ctx.currentTime;
  const dur = Math.min(stepSecs * 0.8, 0.45);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.start(now);
  osc.stop(now + dur + 0.05);
}

function loadProjects() {
  try { return JSON.parse(localStorage.getItem('smg-projects')) || []; }
  catch { return []; }
}

function saveProjects(list) {
  localStorage.setItem('smg-projects', JSON.stringify(list));
}

export default function SongMakerGrid() {
  const [grid, setGrid] = useState(makeGrid);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCol, setCurrentCol] = useState(-1);
  const [tempo, setTempo] = useState(120);
  const [menu, setMenu] = useState(null);

  const [projects, setProjects] = useState(loadProjects);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showProjects, setShowProjects] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const gridRef = useRef(grid);
  const tempoRef = useRef(tempo);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragValueRef = useRef(true);
  const saveRef = useRef(null);
  const projectsRef = useRef(null);

  useEffect(() => { gridRef.current = grid; }, [grid]);
  useEffect(() => { tempoRef.current = tempo; }, [tempo]);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    const stop = () => { isDraggingRef.current = false; };
    window.addEventListener('pointerup', stop);
    return () => window.removeEventListener('pointerup', stop);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handler(e) {
      if (showSave && saveRef.current && !saveRef.current.contains(e.target)) setShowSave(false);
      if (showProjects && projectsRef.current && !projectsRef.current.contains(e.target)) setShowProjects(false);
      if (menu) setMenu(null);
    }
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, [showSave, showProjects, menu]);

  function getCtx() {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    return audioCtxRef.current;
  }

  function startSequencer() {
    const ctx = getCtx();
    let col = 0;
    function step() {
      setCurrentCol(col);
      const stepMs = 60000 / tempoRef.current / 2;
      gridRef.current[col].forEach(cell => {
        if (cell.active) playNote(ctx, NOTE_FREQ[cell.note], stepMs / 1000);
      });
      col = (col + 1) % COLS;
      timerRef.current = setTimeout(step, stepMs);
    }
    step();
    setIsPlaying(true);
  }

  function stopSequencer() {
    clearTimeout(timerRef.current);
    setCurrentCol(-1);
    setIsPlaying(false);
  }

  function applyCell(col, row, value) {
    setGrid(prev => {
      if (prev[col][row].active === value) return prev;
      const next = prev.map(c => c.map(cell => ({ ...cell })));
      next[col][row].active = value;
      return next;
    });
  }

  function handlePointerDown(col, row, e) {
    if (e.button === 2) return;
    e.preventDefault();
    const placing = !grid[col][row].active;
    isDraggingRef.current = true;
    dragValueRef.current = placing;
    applyCell(col, row, placing);
  }

  function handlePointerEnter(col, row) {
    if (!isDraggingRef.current) return;
    applyCell(col, row, dragValueRef.current);
  }

  function handleRightClick(col, row, e) {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 165);
    const y = Math.min(e.clientY, window.innerHeight - 330);
    setMenu({ col, row, x, y });
  }

  function pickPitch(note) {
    const { col, row } = menu;
    setGrid(prev => {
      const next = prev.map(c => c.map(cell => ({ ...cell })));
      next[col][row].note = note;
      next[col][row].active = true;
      return next;
    });
    playNote(getCtx(), NOTE_FREQ[note], 0.3);
    setMenu(null);
  }

  function confirmSave() {
    const name = saveName.trim() || `Song ${projects.length + 1}`;
    const project = { id: Date.now().toString(), name, grid, tempo, savedAt: new Date().toISOString() };
    const updated = [project, ...projects];
    setProjects(updated);
    saveProjects(updated);
    setSaveName('');
    setShowSave(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  }

  function loadProject(project) {
    stopSequencer();
    setGrid(project.grid);
    setTempo(project.tempo);
    setShowProjects(false);
  }

  function deleteProject(id, e) {
    e.stopPropagation();
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    saveProjects(updated);
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="smg-wrapper">
      {/* Grid */}
      <div className="smg-grid-area">
        <div className="smg-row-labels">
          {ROW_NOTES.map((note, row) => (
            <div key={row} className="smg-row-label" style={{ color: noteColor(note) }}>{note}</div>
          ))}
        </div>

        <div className="smg-grid" onContextMenu={e => e.preventDefault()}>
          {Array.from({ length: COLS }, (_, col) => (
            <div key={col} className={`smg-col${currentCol === col ? ' smg-col-active' : ''}`}>
              {Array.from({ length: ROWS }, (_, row) => {
                const cell = grid[col][row];
                const isCustomNote = cell.active && cell.note !== ROW_NOTES[row];
                return (
                  <div
                    key={row}
                    className={`smg-cell${cell.active ? ' smg-cell-on' : ''}${currentCol === col && cell.active ? ' smg-cell-playing' : ''}`}
                    style={cell.active ? { '--cell-color': noteColor(cell.note) } : {}}
                    onPointerDown={e => handlePointerDown(col, row, e)}
                    onPointerEnter={() => handlePointerEnter(col, row)}
                    onContextMenu={e => handleRightClick(col, row, e)}
                    title={cell.active ? `${cell.note} — right-click to change pitch` : 'Click or drag to place note'}
                  >
                    {isCustomNote && <span className="smg-cell-label">{cell.note}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="smg-controls">
        <button className="smg-play-btn" onClick={() => isPlaying ? stopSequencer() : startSequencer()}>
          {isPlaying ? '⏹ Stop' : '▶ Play'}
        </button>

        <div className="smg-tempo-row">
          <span className="smg-tempo-label">Tempo</span>
          <input
            type="range" min={60} max={200} value={tempo}
            onChange={e => setTempo(Number(e.target.value))}
            className="smg-tempo-slider"
          />
          <span className="smg-tempo-value">{tempo}</span>
        </div>

        <button className="smg-clear-btn" onClick={() => { stopSequencer(); setGrid(makeGrid()); }}>
          Clear
        </button>

        {/* Save button + popover */}
        <div className="smg-popover-anchor" ref={saveRef}>
          <button
            className={`smg-save-btn${savedFlash ? ' smg-save-flash' : ''}`}
            onClick={() => { setShowSave(v => !v); setShowProjects(false); }}
          >
            {savedFlash ? '✅ Saved!' : '💾 Save'}
          </button>
          {showSave && (
            <div className="smg-popover smg-save-popover">
              <p className="smg-popover-title">Save project</p>
              <input
                className="smg-save-input"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmSave()}
                placeholder={`Song ${projects.length + 1}`}
                autoFocus
                maxLength={40}
              />
              <button className="smg-save-confirm-btn" onClick={confirmSave}>Save</button>
            </div>
          )}
        </div>

        {/* Projects dropdown */}
        <div className="smg-popover-anchor" ref={projectsRef}>
          <button
            className="smg-projects-btn"
            onClick={() => { setShowProjects(v => !v); setShowSave(false); }}
          >
            📂 {projects.length > 0 ? `Projects (${projects.length})` : 'Projects'} ▾
          </button>
          {showProjects && (
            <div className="smg-popover smg-projects-popover">
              <p className="smg-popover-title">My Projects</p>
              {projects.length === 0 ? (
                <p className="smg-projects-empty">No saved projects yet</p>
              ) : (
                <div className="smg-projects-list">
                  {projects.map(p => (
                    <div key={p.id} className="smg-project-row" onClick={() => loadProject(p)}>
                      <div className="smg-project-info">
                        <span className="smg-project-name">{p.name}</span>
                        <span className="smg-project-date">{formatDate(p.savedAt)}</span>
                      </div>
                      <button
                        className="smg-project-delete"
                        onClick={e => deleteProject(p.id, e)}
                        title="Delete"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right-click pitch picker */}
      {menu && (
        <div
          className="smg-pitch-menu"
          style={{ top: menu.y, left: menu.x }}
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="smg-pitch-menu-title">Choose pitch</div>
          <div className="smg-pitch-list">
            {PITCH_OPTIONS.map(note => (
              <button
                key={note}
                className={`smg-pitch-option${grid[menu.col][menu.row].note === note ? ' smg-pitch-selected' : ''}`}
                style={swatchStyle(note)}
                onClick={() => pickPitch(note)}
              >{note}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
