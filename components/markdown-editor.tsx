"use client";

import { useEffect, useRef, useState } from "react";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { basicSetup } from "codemirror";
import { Button } from "@/components/ui/button";
import { Bold, CheckSquare, Code2, Eye, Heading2, Italic, Link, List, ListOrdered, Minus, Pencil, Quote } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const completions = [
  { label: "Título 1", type: "keyword", apply: "# " },
  { label: "Título 2", type: "keyword", apply: "## " },
  { label: "Título 3", type: "keyword", apply: "### " },
  { label: "Negrito", type: "text", apply: "****" },
  { label: "Itálico", type: "text", apply: "**" },
  { label: "Lista", type: "keyword", apply: "- " },
  { label: "Lista numerada", type: "keyword", apply: "1. " },
  { label: "Tarefa", type: "keyword", apply: "- [ ] " },
  { label: "Citação", type: "text", apply: "> " },
  { label: "Código", type: "text", apply: "``" },
];

function markdownCompletion(context: CompletionContext) {
  const before = context.matchBefore(/(?:^|\s)([#>*`\-]|\d+\.)?\w*$/);
  if (!before || (!context.explicit && before.text.trim() === "")) return null;
  return { from: before.from + (before.text.match(/^\s/) ? 1 : 0), options: completions, validFor: /^\w*$/ };
}

export function MarkdownEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const valueRef = useRef(value);
  const [preview, setPreview] = useState(false);

  valueRef.current = value;

  useEffect(() => {
    if (!containerRef.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown({ base: markdownLanguage }),
        autocompletion({ override: [markdownCompletion], activateOnTyping: true, maxRenderedOptions: 12 }),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": { backgroundColor: "transparent", color: "hsl(var(--foreground))", minHeight: "280px" },
          ".cm-content": { padding: "16px 2px 28px", fontFamily: "var(--font-geist-mono), ui-monospace", fontSize: "14px", lineHeight: "1.8", caretColor: "hsl(var(--primary))" },
          ".cm-gutters": { display: "none" },
          ".cm-scroller": { fontFamily: "inherit" },
          ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "transparent" },
          ".cm-selectionBackground, ::selection": { backgroundColor: "hsl(var(--primary) / .15)" },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const next = update.state.doc.toString();
            valueRef.current = next;
            onChange(next);
          }
        }),
      ],
    });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [onChange]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || value === valueRef.current) return;
    valueRef.current = value;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  function insert(text: string) {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({ changes: { from, to, insert: text } });
    view.focus();
  }

  function wrap(prefix: string, suffix = prefix) {
    const view = viewRef.current;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to) || "texto";
    const replacement = `${prefix}${selected}${suffix}`;
    view.dispatch({ changes: { from, to, insert: replacement }, selection: { anchor: from + replacement.length } });
    view.focus();
  }

  const tool = (label: string, icon: React.ReactNode, action: () => void) => <Button type="button" variant="ghost" size="icon" className="h-9 w-9" title={label} aria-label={label} onClick={action}>{icon}</Button>;

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
        {tool("Título", <Heading2 className="h-4 w-4" />, () => insert("## "))}
        {tool("Negrito", <Bold className="h-4 w-4" />, () => wrap("**"))}
        {tool("Itálico", <Italic className="h-4 w-4" />, () => wrap("*"))}
        {tool("Link", <Link className="h-4 w-4" />, () => wrap("[", "](https://)"))}
        {tool("Lista", <List className="h-4 w-4" />, () => insert("- "))}
        {tool("Lista numerada", <ListOrdered className="h-4 w-4" />, () => insert("1. "))}
        {tool("Tarefa", <CheckSquare className="h-4 w-4" />, () => insert("- [ ] "))}
        {tool("Citação", <Quote className="h-4 w-4" />, () => insert("> "))}
        {tool("Código", <Code2 className="h-4 w-4" />, () => wrap("`"))}
        {tool("Separador", <Minus className="h-4 w-4" />, () => insert("\n---\n"))}
        <div className="ml-auto flex items-center gap-1 rounded-lg border bg-background p-1">
          <Button type="button" size="sm" variant={!preview ? "secondary" : "ghost"} onClick={() => setPreview(false)}><Pencil className="mr-2 h-4 w-4" />Editar</Button>
          <Button type="button" size="sm" variant={preview ? "secondary" : "ghost"} onClick={() => setPreview(true)}><Eye className="mr-2 h-4 w-4" />Pré-visualizar</Button>
        </div>
      </div>
      {preview ? (
        <article className="prose prose-neutral max-w-none p-5 text-sm prose-headings:font-semibold prose-a:text-primary prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-pre:bg-muted">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || "Comece a escrever sua anotação…"}</ReactMarkdown>
        </article>
      ) : (
        <div ref={containerRef} className="px-3" aria-label="Editor de Markdown" />
      )}
    </div>
  );
}
