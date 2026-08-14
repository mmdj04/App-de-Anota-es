export type Note = {
  id: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
  updatedAt: string;
  category: string;
};

type NotePayload = {
  id: string;
  title: string;
  content: string;
  important: number;
  created_at: string;
  updated_at: string;
  category: string;
};

type WorkerRequest =
  | { id: number; type: "list" }
  | { id: number; type: "upsert"; note: NotePayload }
  | { id: number; type: "delete"; noteId: string }
  | { id: number; type: "clear" };

type WorkerCommand =
  | { type: "list" }
  | { type: "upsert"; note: NotePayload }
  | { type: "delete"; noteId: string }
  | { type: "clear" };

type WorkerResponse = { id: number; ok: true; payload: unknown } | { id: number; ok: false; error: string };

type PendingRequest<T> = {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, PendingRequest<unknown>>();

function getWorker() {
  if (typeof window === "undefined") throw new Error("Banco de dados disponível apenas no navegador.");
  if (!worker) {
    worker = new Worker(new URL("../app/db-worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const request = pending.get(event.data.id);
      if (!request) return;
      pending.delete(event.data.id);
      if (event.data.ok) request.resolve(event.data.payload);
      else request.reject(new Error(event.data.error));
    };
  }
  return worker;
}

function call<T>(request: WorkerCommand): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, {
      resolve: resolve as (value: unknown | PromiseLike<unknown>) => void,
      reject,
    });
    const workerRequest: WorkerRequest = { ...request, id };
    getWorker().postMessage(workerRequest);
  });
}

export async function listNotes(): Promise<Note[]> {
  const rows = await call<Array<Record<string, string | number>>>({ type: "list" });
  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    important: Number(row.important) === 1,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    category: String(row.category),
  }));
}

export function saveNote(note: Note) {
  return call({
    type: "upsert",
    note: {
      id: note.id,
      title: note.title,
      content: note.content,
      important: note.important ? 1 : 0,
      created_at: note.createdAt,
      updated_at: note.updatedAt,
      category: note.category,
    },
  });
}

export function deleteNote(id: string) {
  return call({ type: "delete", noteId: id });
}

export function clearNotes() {
  return call({ type: "clear" });
}
