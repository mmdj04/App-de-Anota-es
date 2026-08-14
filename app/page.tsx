"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock3, FileText, Pin, Plus, Search, Trash2, X, Database, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownEditor } from "@/components/markdown-editor";
import { deleteNote as deleteFromDb, listNotes, saveNote as saveToDb, type Note } from "@/lib/notes-db";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [editing, setEditing] = useState<Note | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Geral");
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setNotes(await listNotes());
      setOffline(false);
    } catch {
      setOffline(true);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refresh]);

  const categories = useMemo(() => ["Todas", ...Array.from(new Set(notes.map((note) => note.category)))], [notes]);
  const filtered = useMemo(() => notes.filter((note) => {
    const matchesQuery = `${note.title} ${note.content} ${note.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (activeCategory === "Todas" || note.category === activeCategory);
  }), [notes, query, activeCategory]);

  function openNew() {
    setEditing(null); setTitle(""); setContent(""); setCategory("Geral"); setOpen(true);
  }

  function openEdit(note: Note) {
    setEditing(note); setTitle(note.title); setContent(note.content); setCategory(note.category); setOpen(true);
  }

  function close() {
    setOpen(false); setEditing(null); setTitle(""); setContent(""); setCategory("Geral");
  }

  async function save() {
    if (!title.trim() && !content.trim()) return;
    const now = new Date().toISOString();
    const note: Note = {
      id: editing?.id ?? crypto.randomUUID(),
      title: title.trim() || "Sem título",
      content: content.trim(),
      important: editing?.important ?? false,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
      category: category.trim() || "Geral",
    };
    await saveToDb(note);
    setNotes((current) => editing ? current.map((item) => item.id === note.id ? note : item) : [note, ...current]);
    close();
  }

  async function toggleImportant(note: Note) {
    const updated = { ...note, important: !note.important, updatedAt: new Date().toISOString() };
    await saveToDb(updated);
    setNotes((current) => current.map((item) => item.id === note.id ? updated : item).sort((a, b) => Number(b.important) - Number(a.important) || b.updatedAt.localeCompare(a.updatedAt)));
  }

  async function remove(note: Note) {
    if (!window.confirm("Excluir esta anotação?")) return;
    await deleteFromDb(note.id);
    setNotes((current) => current.filter((item) => item.id !== note.id));
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-lg font-semibold tracking-tight">Minhas Anotações</p>
            <p className="text-sm text-muted-foreground">Tudo o que é importante fica aqui.</p>
          </div>
          <Button size="lg" onClick={openNew}><Plus className="mr-2 h-5 w-5" />Nova anotação</Button>
        </header>

        <section className="py-7 sm:py-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">O que você precisa lembrar?</h1>
              <p className="mt-2 max-w-2xl text-base text-muted-foreground">Escreva compromissos, informações importantes ou qualquer coisa que você não quer esquecer.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {offline ? <WifiOff className="h-4 w-4" /> : <Database className="h-4 w-4" />}
              {offline ? "Modo offline" : ready ? "Salvo no dispositivo" : "Preparando armazenamento…"}
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" /><Input className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Procurar uma anotação…" aria-label="Procurar uma anotação" /></div>
            <Button variant="outline" size="lg" onClick={openNew}>Escrever</Button>
          </div>
        </section>

        {categories.length > 1 && <div className="flex flex-wrap gap-2 border-b pb-4">{categories.map((item) => <Button key={item} variant={activeCategory === item ? "default" : "outline"} onClick={() => setActiveCategory(item)}>{item}</Button>)}</div>}

        <section className="flex-1 py-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Suas anotações</h2><span className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "anotação" : "anotações"}</span></div>
          {!ready ? <Card><CardContent className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">Carregando suas anotações…</CardContent></Card> : filtered.length === 0 ? <Card><CardContent className="flex min-h-56 flex-col items-center justify-center text-center"><FileText className="mb-3 h-10 w-10 text-muted-foreground" /><p className="font-medium">Nenhuma anotação ainda</p><p className="mt-1 text-sm text-muted-foreground">Crie sua primeira anotação. Ela ficará salva no dispositivo.</p><Button className="mt-5" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Criar primeira anotação</Button></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{filtered.map((note) => <Card key={note.id} className="overflow-hidden"><CardContent className="p-0"><div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{note.category}</span>{note.important && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Importante</span>}</div><button onClick={() => openEdit(note)} className="text-left text-xl font-semibold tracking-tight hover:underline">{note.title}</button></div><button onClick={() => toggleImportant(note)} className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={note.important ? "Desmarcar como importante" : "Marcar como importante"}>{note.important ? <Pin className="h-5 w-5 fill-current text-primary" /> : <Pin className="h-5 w-5" />}</button></div><p className="mt-4 line-clamp-5 whitespace-pre-wrap text-[15px] leading-7 text-foreground/85">{note.content}</p><div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{formatDate(note.updatedAt)}</span><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(note)} aria-label="Editar"><FileText className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => remove(note)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button></div></div></div></CardContent></Card>)}</div>}
        </section>

        <footer className="flex items-center gap-2 border-t py-5 text-xs text-muted-foreground"><Check className="h-4 w-4" />Seus dados ficam armazenados localmente no dispositivo.</footer>
      </div>

      {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"><div className="max-h-[96vh] w-full overflow-y-auto rounded-t-2xl border bg-background p-5 shadow-2xl sm:max-w-4xl sm:rounded-2xl sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">{editing ? "Editar anotação" : "Nova anotação"}</h2><p className="mt-1 text-sm text-muted-foreground">Use Markdown para deixar a anotação organizada.</p></div><Button variant="ghost" size="icon" onClick={close} aria-label="Fechar"><X className="h-5 w-5" /></Button></div><div className="mt-5 grid gap-4"><div><label htmlFor="note-title" className="mb-2 block text-sm font-medium">Título</label><Input id="note-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Consulta médica" /></div><div><label className="mb-2 block text-sm font-medium">Anotação</label><MarkdownEditor value={content} onChange={setContent} /></div><div><label htmlFor="note-category" className="mb-2 block text-sm font-medium">Categoria</label><Input id="note-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Ex.: Saúde, Casa, Compras" /></div></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" size="lg" onClick={close}>Cancelar</Button><Button size="lg" onClick={save}>Salvar anotação</Button></div></div></div>}
    </main>
  );
}
