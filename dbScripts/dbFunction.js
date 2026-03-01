const fs = require('fs');
const path = require('path');

// Empty database for new users (clean slate)
const EMPTY_DB = { nodes: [], links: [] };

// "Home" database path (public space)
const HOME_DB = process.env.HOME_DB || "./data/datasets/home.json";

/**
 * Read database from file
 * Creates empty database if file doesn't exist (for new users)
 * For "home", creates with starter data if missing
 */
function readDb(dbPath) {
    try {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // Special case: "home" database
        if (dbPath === HOME_DB && !fs.existsSync(dbPath)) {
            // Create home with starter data (meow/woof)
            const homeDb = {
                nodes: [
                    { id: "meow" },
                    { id: "woof" }
                ],
                links: [
                    { source: "woof", target: "meow", value: 1 }
                ]
            };
            fs.writeFileSync(dbPath, JSON.stringify(homeDb, null, 2));
            return JSON.parse(JSON.stringify(homeDb));
        }
        
        // New user: create empty database
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify(EMPTY_DB, null, 2));
            console.log(`Created empty database at ${dbPath}`);
            return JSON.parse(JSON.stringify(EMPTY_DB));
        }
        
        const data = fs.readFileSync(dbPath, 'utf8');
        
        if (data.trim().length === 0) {
            fs.writeFileSync(dbPath, JSON.stringify(EMPTY_DB, null, 2));
            return JSON.parse(JSON.stringify(EMPTY_DB));
        }
        
        return JSON.parse(data);
        
    } catch (err) {
        console.error(`readDb failed for ${dbPath}:`, err);
        return JSON.parse(JSON.stringify(EMPTY_DB));
    }
}

/**
 * Write a single node to database
 */
function writeDb(obj, dbPath) {
    if (!obj || !dbPath) {
        console.error('writeDb failed: missing obj or dbPath');
        return false;
    }
    
    try {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        let database;
        
        if (!fs.existsSync(dbPath) || fs.readFileSync(dbPath, 'utf8').trim().length === 0) {
            database = JSON.parse(JSON.stringify(EMPTY_DB));
        } else {
            const data = fs.readFileSync(dbPath, 'utf8');
            database = JSON.parse(data);
            if (!database.nodes) database.nodes = [];
            if (!database.links) database.links = [];
        }
        
        // Add node (avoid duplicates)
        const existingIndex = database.nodes.findIndex(n => n.id === obj.id);
        if (existingIndex >= 0) {
            database.nodes[existingIndex] = { id: obj.id, ...obj };
        } else {
            database.nodes.push({ id: obj.id, ...obj });
        }
        
        // Add link if provided
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
        
        fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
        return true;
        
    } catch (err) {
        console.error(`writeDb failed for ${dbPath}:`, err);
        return false;
    }
}

/**
 * Update database with bulk data
 */
function updateJSONFile(userData, dbPath) {
    try {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        let database;
        if (!fs.existsSync(dbPath) || fs.readFileSync(dbPath, 'utf8').trim().length === 0) {
            database = JSON.parse(JSON.stringify(EMPTY_DB));
        } else {
            const data = fs.readFileSync(dbPath, 'utf8');
            database = data.trim().length > 0 ? JSON.parse(data) : JSON.parse(JSON.stringify(EMPTY_DB));
        }
        
        if (!database.nodes) database.nodes = [];
        if (!database.links) database.links = [];
        
        const { nodes, links } = userData || {};
        
        if (nodes && Array.isArray(nodes)) {
            nodes.forEach(node => {
                const exists = database.nodes.some(n => n.id === node.id);
                if (!exists) database.nodes.push(node);
            });
        }
        
        if (links && Array.isArray(links)) {
            links.forEach(link => {
                const exists = database.links.some(l => 
                    l.source === link.source && l.target === link.target
                );
                if (!exists) database.links.push(link);
            });
        }
        
        fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
        return true;
        
    } catch (err) {
        console.error(`updateJSONFile failed for ${dbPath}:`, err);
        return false;
    }
}

module.exports = { readDb, writeDb, updateJSONFile, EMPTY_DB, HOME_DB };