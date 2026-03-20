const path = require('path');
const { app, BrowserWindow, ipcMain, Menu } = require('electron');

// Database will be loaded after app is ready
let db;

console.log("MAIN PROCESS STARTING");

// Initialize database
function initDatabase() {
  if (db) return db;
  
  const Database = require('better-sqlite3');
  const dbPath = path.join(app.getPath('userData'), 'tracker.db');
  console.log("DB Path:", dbPath);
  db = new Database(dbPath);
  
  // Create entries table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,
      bleeding INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date)`).run();
  
  // Create ring_events table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS ring_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      event_type TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  
  db.prepare(`CREATE INDEX IF NOT EXISTS idx_ring_events_date ON ring_events(date)`).run();
  
  return db;
}

// SAVE entry
ipcMain.handle('save-entry', (event, entry) => {
  try {
    const database = initDatabase();
    
    const stmt = database.prepare(`
      INSERT OR REPLACE INTO entries (date, bleeding, notes, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    const result = stmt.run(entry.date, entry.bleeding, entry.notes);
    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error("Save error:", error);
    return { success: false, error: error.message };
  }
});

// GET entries (all or date range)
ipcMain.handle('get-entries', (event, options = {}) => {
  try {
    const database = initDatabase();
    let query = `SELECT * FROM entries`;
    const params = [];
    
    if (options.startDate && options.endDate) {
      query += ` WHERE date >= ? AND date <= ?`;
      params.push(options.startDate, options.endDate);
    }
    
    query += ` ORDER BY date DESC`;
    
    const entries = database.prepare(query).all(...params);
    return entries;
  } catch (error) {
    console.error("Get entries error:", error);
    return [];
  }
});

// SAVE ring event (insert or remove)
ipcMain.handle('save-ring-event', (event, ringEvent) => {
  try {
    const database = initDatabase();
    
    // First, remove any existing event on this date
    database.prepare(`DELETE FROM ring_events WHERE date = ? AND event_type = ?`)
      .run(ringEvent.date, ringEvent.event_type);
    
    const stmt = database.prepare(`
      INSERT INTO ring_events (date, event_type, notes)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(ringEvent.date, ringEvent.event_type, ringEvent.notes || '');
    return { success: true, id: result.lastInsertRowid };
  } catch (error) {
    console.error("Save ring event error:", error);
    return { success: false, error: error.message };
  }
});

// GET ring events
ipcMain.handle('get-ring-events', (event, options = {}) => {
  try {
    const database = initDatabase();
    let query = `SELECT * FROM ring_events`;
    const params = [];
    
    if (options.startDate && options.endDate) {
      query += ` WHERE date >= ? AND date <= ?`;
      params.push(options.startDate, options.endDate);
    }
    
    query += ` ORDER BY date DESC`;
    
    const events = database.prepare(query).all(...params);
    return events;
  } catch (error) {
    console.error("Get ring events error:", error);
    return [];
  }
});

// GET ring event by date
ipcMain.handle('get-ring-event-by-date', (event, date) => {
  try {
    const database = initDatabase();
    const event = database.prepare(`SELECT * FROM ring_events WHERE date = ?`).get(date);
    return event || null;
  } catch (error) {
    console.error("Get ring event error:", error);
    return null;
  }
});

// DELETE ring event
ipcMain.handle('delete-ring-event', (event, date, eventType) => {
  try {
    const database = initDatabase();
    database.prepare(`DELETE FROM ring_events WHERE date = ? AND event_type = ?`).run(date, eventType);
    return { success: true };
  } catch (error) {
    console.error("Delete ring event error:", error);
    return { success: false, error: error.message };
  }
});

// GET statistics
ipcMain.handle('get-statistics', () => {
  try {
    const database = initDatabase();
    
    const entries = database.prepare(`SELECT * FROM entries WHERE bleeding > 0 ORDER BY date ASC`).all();
    const ringEvents = database.prepare(`SELECT * FROM ring_events ORDER BY date ASC`).all();
    
    if (entries.length === 0 && ringEvents.length === 0) {
      return {
        totalBleedingDays: 0,
        averageIntensity: 0,
        longestBleedingStreak: 0,
        shortestCycle: null,
        longestCycle: null,
        averageCycleLength: null,
        totalEntries: 0,
        ringInsertions: 0,
        ringRemovals: 0,
        currentRingDay: null
      };
    }

    // Calculate bleeding streaks
    let currentStreak = 0;
    let longestStreak = 0;
    
    for (let i = 0; i < entries.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = new Date(entries[i-1].date);
        const currDate = new Date(entries[i].date);
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Get cycle lengths
    const cycles = [];
    let lastBleedingDate = null;
    
    for (const entry of entries) {
      if (lastBleedingDate === null) {
        lastBleedingDate = entry.date;
      } else {
        const prevDate = new Date(lastBleedingDate);
        const currDate = new Date(entry.date);
        const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 3) {
          cycles.push(diffDays);
          lastBleedingDate = entry.date;
        }
      }
    }

    // Calculate average intensity
    const totalIntensity = entries.reduce((sum, e) => sum + e.bleeding, 0);
    const averageIntensity = entries.length > 0 ? (totalIntensity / entries.length).toFixed(1) : 0;
    
    // Count ring events
    const insertions = ringEvents.filter(e => e.event_type === 'insert').length;
    const removals = ringEvents.filter(e => e.event_type === 'remove').length;
    
    // Find current ring (most recent insertion without removal)
    let currentRingDay = null;
    const sortedEvents = [...ringEvents].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    for (const event of sortedEvents) {
      if (event.event_type === 'insert') {
        // Check if there's a removal after this insertion
        const insertDate = new Date(event.date);
        const removal = ringEvents.find(e => 
          e.event_type === 'remove' && new Date(e.date) > insertDate
        );
        
        if (!removal) {
          // Ring is still in
          const today = new Date();
          const daysSinceInsert = Math.floor((today - insertDate) / (1000 * 60 * 60 * 24));
          currentRingDay = {
            insertedDate: event.date,
            daysSinceInsert: daysSinceInsert,
            daysUntilRemoval: Math.max(0, 21 - daysSinceInsert)
          };
        }
      }
    }

    return {
      totalBleedingDays: entries.length,
      averageIntensity: parseFloat(averageIntensity),
      longestBleedingStreak: longestStreak,
      shortestCycle: cycles.length > 0 ? Math.min(...cycles) : null,
      longestCycle: cycles.length > 0 ? Math.max(...cycles) : null,
      averageCycleLength: cycles.length > 0 ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : null,
      totalEntries: database.prepare(`SELECT COUNT(*) as count FROM entries`).get().count,
      ringInsertions: insertions,
      ringRemovals: removals,
      currentRingDay: currentRingDay
    };
  } catch (error) {
    console.error("Get statistics error:", error);
    return null;
  }
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Create application menu
const createMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    minWidth: 700,
    minHeight: 650,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  createMenu();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
