use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

fn get_db_path() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let mut dir = PathBuf::from(home);
    dir.push(".config");
    dir.push("mavis");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir.push("mavis.db");
    dir
}

pub fn get_connection() -> Result<Connection> {
    let db_path = get_db_path();
    let conn = Connection::open(db_path)?;
    // Enable Write-Ahead Logging for high concurrent read performance
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;")?;
    init_schema(&conn)?;
    Ok(conn)
}

pub fn init_schema(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS user_profile (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            tool_calls TEXT,
            tool_call_id TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
            message_id UNINDEXED,
            session_id UNINDEXED,
            content,
            tokenize = 'trigram'
        );
        ",
    )?;
    Ok(())
}

fn now_millis() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

pub fn set_profile_key(key: &str, value: &str) -> Result<()> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT INTO user_profile (key, value, updated_at) VALUES (?1, ?2, ?3)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
        params![key, value, now_millis()],
    )?;
    Ok(())
}

pub fn get_profile_map() -> Result<std::collections::HashMap<String, String>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT key, value FROM user_profile")?;
    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;

    let mut map = std::collections::HashMap::new();
    for r in rows {
        if let Ok((k, v)) = r {
            map.insert(k, v);
        }
    }
    Ok(map)
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct FtsSearchResult {
    pub message_id: String,
    pub session_id: String,
    pub snippet: String,
    pub rank: f64,
}

pub fn search_messages(query: &str, limit: usize) -> Result<Vec<FtsSearchResult>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT message_id, session_id, snippet(messages_fts, 2, '<b>', '</b>', '...', 15), rank 
         FROM messages_fts 
         WHERE messages_fts MATCH ?1 
         ORDER BY rank 
         LIMIT ?2",
    )?;

    let rows = stmt.query_map(params![query, limit as i64], |row| {
        Ok(FtsSearchResult {
            message_id: row.get(0)?,
            session_id: row.get(1)?,
            snippet: row.get(2)?,
            rank: row.get(3)?,
        })
    })?;

    let mut results = Vec::new();
    for r in rows {
        if let Ok(res) = r {
            results.push(res);
        }
    }
    Ok(results)
}

pub fn save_message(
    id: &str,
    session_id: &str,
    role: &str,
    content: &str,
    tool_calls: Option<&str>,
    tool_call_id: Option<&str>,
) -> Result<()> {
    let conn = get_connection()?;
    let now = now_millis();
    conn.execute(
        "INSERT INTO messages (id, session_id, role, content, tool_calls, tool_call_id, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
         ON CONFLICT(id) DO UPDATE SET content=excluded.content",
        params![id, session_id, role, content, tool_calls, tool_call_id, now],
    )?;

    // Index message into FTS5 virtual table
    if !content.is_empty() {
        let _ = conn.execute(
            "INSERT INTO messages_fts (message_id, session_id, content) VALUES (?1, ?2, ?3)",
            params![id, session_id, content],
        );
    }
    Ok(())
}
