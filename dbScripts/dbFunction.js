const fs = require('fs');
const path = require('path');

// Default starter database - ensures graph always has 2 nodes to link
const DEFAULT_DB = {
  nodes: [
    { id: "meowwww" },
    { id: "wooooof" }
  ],
  links: [
    { source: "wooooof", "target": "meowwww", value: 1 }
  ]
};

// For backward compatibility with old scripts
const DEFAULT_PATH = './datasets/testdb.json';

/**
 * Read database from file
 * If file doesn't exist, creates it with DEFAULT_DB (for new users)
 */
function readDb(dbName = DEFAULT_PATH) {
    try {
        // Ensure directory exists
        const dir = path.dirname(dbName);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Create with default data if file doesn't exist
        if (!fs.existsSync(dbName)) {
            fs.writeFileSync(dbName, JSON.stringify(DEFAULT_DB, null, 2));
            console.log(`Created new database at ${dbName} with default nodes`);
            return JSON.parse(JSON.stringify(DEFAULT_DB)); // Deep copy
        }
        
        const data = fs.readFileSync(dbName, 'utf8');
        
        // Handle empty file
        if (data.trim().length === 0) {
            fs.writeFileSync(dbName, JSON.stringify(DEFAULT_DB, null, 2));
            return JSON.parse(JSON.stringify(DEFAULT_DB));
        }
        
        const parsed = JSON.parse(data);
        
        // Ensure minimum structure (in case file was corrupted)
        if (!parsed.nodes || parsed.nodes.length < 2) {
            console.log(`Database ${dbName} has insufficient nodes, resetting to default`);
            fs.writeFileSync(dbName, JSON.stringify(DEFAULT_DB, null, 2));
            return JSON.parse(JSON.stringify(DEFAULT_DB));
        }
        
        return parsed;
        
    } catch (err) {
        console.error(`readDb failed for ${dbName}:`, err);
        // Return default on error so app doesn't crash
        return JSON.parse(JSON.stringify(DEFAULT_DB));
    }
}

/**
 * Write a single node to database
 * Creates file with DEFAULT_DB if it doesn't exist
 */
function writeDb(obj, dbName = DEFAULT_PATH) {
    if (!obj) {
        console.error('writeDb failed: missing obj');
        return false;
    }
    
    try {
        // Ensure directory exists
        const dir = path.dirname(dbName);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        let database;
        
        // Initialize with default if file missing/empty
        if (!fs.existsSync(dbName) || fs.readFileSync(dbName, 'utf8').trim().length === 0) {
            database = JSON.parse(JSON.stringify(DEFAULT_DB));
        } else {
            const data = fs.readFileSync(dbName, 'utf8');
            database = JSON.parse(data);
            
            // Ensure structure
            if (!database.nodes) database.nodes = [];
            if (!database.links) database.links = [];
        }
        
        // Add node (avoid duplicates by id)
        const existingIndex = database.nodes.findIndex(n => n.id === obj.id);
        if (existingIndex >= 0) {
            database.nodes[existingIndex] = { id: obj.id, ...obj };
        } else {
            database.nodes.push({ id: obj.id, ...obj });
        }
        
        // Add link if source and target provided
        if (obj.source && obj.target) {
            const linkExists = database.links.some(l => 
                l.source === obj.source && l.target === obj.target
            );
            if (!linkExists) {
                database.links.push({
                    source: obj.source,
                    target: obj.target,
                    value: obj.value || 1
                });
            }
        }
        
        fs.writeFileSync(dbName, JSON.stringify(database, null, 2));
        return true;
        
    } catch (err) {
        console.error(`writeDb failed for ${dbName}:`, err);
        return false;
    }
}

/**
 * Update database with bulk data
 * Merges with existing data, preserves defaults if file missing
 */
function updateJSONFile(userData, url = DEFAULT_PATH) {
    try {
        // Ensure directory exists
        const dir = path.dirname(url);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Start with default or existing
        let database;
        if (!fs.existsSync(url) || fs.readFileSync(url, 'utf8').trim().length === 0) {
            database = JSON.parse(JSON.stringify(DEFAULT_DB));
        } else {
            const data = fs.readFileSync(url, 'utf8');
            database = JSON.parse(data);
        }
        
        // Ensure structure
        if (!database.nodes) database.nodes = [];
        if (!database.links) database.links = [];
        
        const { nodes, links } = userData || {};
        
        // Merge nodes (avoid duplicates)
        if (nodes && Array.isArray(nodes)) {
            nodes.forEach(node => {
                const exists = database.nodes.some(n => n.id === node.id);
                if (!exists) {
                    database.nodes.push(node);
                }
            });
        }
        
        // Merge links (avoid duplicates)
        if (links && Array.isArray(links)) {
            links.forEach(link => {
                const exists = database.links.some(l => 
                    l.source === link.source && l.target === link.target
                );
                if (!exists) {
                    database.links.push(link);
                }
            });
        }
        
        fs.writeFileSync(url, JSON.stringify(database, null, 2));
        return true;
        
    } catch (err) {
        console.error(`updateJSONFile failed for ${url}:`, err);
        return false;
    }
}

module.exports = { readDb, writeDb, updateJSONFile, DEFAULT_DB };