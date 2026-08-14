import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

type NoteRow = {
  id: string;
  title: string;
  content: string;
  important: number;
  created_at: string;
  updated_at: string;
  category: string;
};

type Request =
  | { id: number; type: "list" }
  | { id: number; type: "upsert"; note: NoteRow }
  | { id: number; type: "delete"; noteId: string }
  | { id: number; type: "clear" };

let db: any = null;
let sqlite3: any = null;

async function init() {
  if (db) return;
  sqlite3 = await sqlite3InitModule();
  if (sqlite3.oo1?.OpfsDb) {
    db = new sqlite3.oo1.OpfsDb("/minhas-anotacoes.sqlite3", "c");
  } else if (sqlite3.oo1?.JsStorageDb) {
    db = new sqlite3.oo1.JsStorageDb("local");
  } else {
    db = new sqlite3.oo1.DB("/minhas-anotacoes.sqlite3", "c");
  }
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      important INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Geral'
    );
    CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_important ON notes(important DESC);
  `);
}

function reply(id: number, payload: unknown) {
  self.postMessage({ id, ok: true, payload });
}

function fail(id: number, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  self.postMessage({ id, ok: false, error: message });
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const request = event.data;
  try {
    await init();
    if (request.type === "list") {
      const rows = db.exec({
        sql: "SELECT id, title, content, important, created_at, updated_at, category FROM notes ORDER BY important DESC, updated_at DESC",
        rowMode: "object",
        returnValue: "resultRows",
      }) as NoteRow[];
      reply(request.id, rows);
      return;
    }

    if (request.type === "upsert") {
      db.exec({
        sql: `INSERT INTO notes (id, title, content, important, created_at, updated_at, category)
              VALUES ($id, $title, $content, $important, $created_at, $updated_at, $category)
              ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                content=excluded.content,
                important=excluded.important,
                updated_at=excluded.updated_at,
                category=excluded.category`,
        bind: {
          $id: request.note.id,
          $title: request.note.title,
          $content: request.note.content,
          $important: request.note.important,
          $created_at: request.note.created_at,
          $updated_at: request.note.updated_at,
          $category: request.note.category,
        },
      });
      reply(request.id, null);
      return;
    }

    if (request.type === "delete") {
      db.exec({ sql: "DELETE FROM notes WHERE id = $id", bind: { $id: request.noteId } });
      reply(request.id, null);
      return;
    }

    db.exec("DELETE FROM notes");
    reply(request.id, null);
  } catch (error) {
    fail(request.id, error);
  }
};
