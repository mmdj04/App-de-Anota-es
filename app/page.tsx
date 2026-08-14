"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CirclePlus, Clock3, FileText, Pin, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type Note = { id: string; title: string; content: string; important: boolean; createdAt: string; category: string };

const initialNotes: Note[] = [
  { id: "1", title: "Remédio", content: "Tomar o remédio depois do almoço.", important: true, createdAt: "2026-08-13T12:00:00", category: "Saúde" },
  { id: "2", title: "Consulta", content: "Consulta médica na próxima terça-feira às 10h.", important: true, createdAt: "2026-08-12T10:30:00", category: "Saúde" },
  { id: "3", title: "Coisas de casa", content: "Comprar café, leite e pão.", important: false, createdAt: "2026-08-11T18:00:00", category: "Casa" },
];

function loadNotes(): Note[] {
  if (typeof window === "undefined") return initialNotes;
  try { return JSON.parse(localStorage.getItem("minhas-anotacoes") || "null") ?? initialNotes; } catch { return initialNotes; }
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [editing, setEditing] = useState<Note | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Geral");

  useEffect(() => localStorage.setItem("minhas-anotacoes", JSON.stringify(notes)), [notes]);
  const categories = useMemo(() => ["Todas", ...Array.from(new Set(notes.map((n) => n.category)))], [notes]);
  const filtered = notes.filter((n) => `${n.title} ${n.content} ${n.category}`.toLowerCase().includes(query.toLowerCase()) && (activeCategory === "Todas" || n.category === activeCategory)).sort((a, b) => Number(b.important) - Number(a.important));

  function openNew() { setEditing(null); setTitle(""); setContent(""); setCategory("Geral"); setIsComposerOpen(true); }
  function closeComposer() { setIsComposerOpen(false); setEditing(null); setTitle(""); setContent(""); setCategory("Geral"); }
  function openEdit(note: Note) { setEditing(note); setTitle(note.title); setContent(note.content); setCategory(note.category); setIsComposerOpen(true); }
  function saveNote() {
    if (!title.trim() && !content.trim()) return;
    const next: Note = { id: editing?.id ?? crypto.randomUUID(), title: title.trim() || "Sem título", content: content.trim(), important: editing?.important ?? false, createdAt: editing?.createdAt ?? new Date().toISOString(), category: category.trim() || "Geral" };
    setNotes((current) => editing ? current.map((n) => n.id === editing.id ? next : n) : [next, ...current]);
    closeComposer();
  }
  function toggleImportant(id: string) { setNotes((current) => current.map((n) => n.id === id ? { ...n, important: !n.important } : n)); }
  function deleteNote(id: string) { if (window.confirm("Excluir esta anotação?")) setNotes((current) => current.filter((n) => n.id !== id)); }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b pb-5">
          <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FileText className="h-5 w-5" /></div><div><p className="text-lg font-semibold tracking-tight">Minhas Anotações</p><p className="text-sm text-muted-foreground">Tudo o que é importante fica aqui.</p></div></div>
          <Button size="lg" onClick={openNew}><CirclePlus className="mr-2 h-5 w-5" />Nova anotação</Button>
        </header>
        <section className="py-7 sm:py-9"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">O que você precisa lembrar?</h1><p className="mt-2 max-w-2xl text-base text-muted-foreground">Escreva uma coisa importante, um compromisso ou qualquer informação que você não quer esquecer.</p><div className="mt-6 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" /><Input className="pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Procurar uma anotação..." aria-label="Procurar uma anotação" /></div><Button variant="outline" size="lg" onClick={openNew}><FileText className="mr-2 h-5 w-5" />Escrever</Button></div></section>
        <div className="flex flex-wrap gap-2 border-b pb-4">{categories.map((item) => <Button key={item} variant={activeCategory === item ? "default" : "outline"} onClick={() => setActiveCategory(item)}>{item}</Button>)}</div>
        <section className="flex-1 py-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Suas anotações</h2><span className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? "anotação" : "anotações"}</span></div>{filtered.length === 0 ? <Card><CardContent className="flex min-h-48 flex-col items-center justify-center text-center"><FileText className="mb-3 h-10 w-10 text-muted-foreground" /><p className="font-medium">Nenhuma anotação encontrada</p><p className="mt-1 text-sm text-muted-foreground">Tente outra busca ou escreva uma nova anotação.</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{filtered.map((note) => <Card key={note.id} className="overflow-hidden"><CardContent className="p-0"><div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{note.category}</span>{note.important && <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Importante</span>}</div><button onClick={() => openEdit(note)} className="text-left text-xl font-semibold tracking-tight hover:underline">{note.title}</button></div><button onClick={() => toggleImportant(note.id)} className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label={note.important ? "Desmarcar como importante" : "Marcar como importante"}>{note.important ? <Pin className="h-5 w-5 fill-current text-primary" /> : <Pin className="h-5 w-5" />}</button></div><p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-foreground/85">{note.content}</p><div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{formatDate(note.createdAt)}</span><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEdit(note)} aria-label="Editar"><FileText className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button></div></div></div></CardContent></Card>)}</div>}</section>
        <footer className="flex items-center gap-2 border-t py-5 text-xs text-muted-foreground"><Check className="h-4 w-4" />Suas anotações ficam salvas neste dispositivo.</footer>
      </div>
      {isComposerOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"><div className="w-full max-w-2xl rounded-t-2xl border bg-background p-5 shadow-2xl sm:rounded-2xl sm:p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">{editing ? "Editar anotação" : "Nova anotação"}</h2><p className="mt-1 text-sm text-muted-foreground">Escreva com suas próprias palavras.</p></div><Button variant="ghost" size="icon" onClick={closeComposer} aria-label="Fechar"><X className="h-5 w-5" /></Button></div><div className="mt-6 grid gap-4"><div><label className="mb-2 block text-sm font-medium">Título</label><Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Remédio da manhã" /></div><div><label className="mb-2 block text-sm font-medium">Anotação</label><Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Escreva aqui o que precisa lembrar..." className="min-h-40" /></div><div><label className="mb-2 block text-sm font-medium">Categoria</label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex.: Saúde, Casa, Compras" /></div></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" size="lg" onClick={closeComposer}>Cancelar</Button><Button size="lg" onClick={saveNote}>Salvar anotação</Button></div></div></div>}
    </main>
  );
}
