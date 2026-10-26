import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import JSZip from 'jszip';
import {
  Activity, AlertCircle, ArrowDownToLine, ArrowUpRight, Check, CheckCheck,
  ChevronDown, Code2, Copy, FileCode2, FilePlus2, FileText, Folder,
  Github, Globe2, LoaderCircle, Maximize2, Monitor, MoreHorizontal,
  PanelLeftClose, RefreshCw, Search, Share2, Smartphone, Tablet,
  TerminalSquare, Trash2, X, HardDrive,
} from 'lucide-react';

const STORAGE_KEY = 'codecanvas-project-v1';
const MAIN_HTML = 'index.html';
const CORE_FILES = new Set(['index.html', 'style.css', 'script.js']);

// Only migrate the untouched original demo. If a user edited any starter file,
// the signature changes and their work is left alone.
const LEGACY_STARTER_SIGNATURES = {
  'index.html': '2907:3790277266',
  'style.css': '6555:876752809',
  'script.js': '477:2003082110',
};

function contentSignature(content) {
  let hash = 2166136261;
  for (let index = 0; index < content.length; index += 1) {
    hash = Math.imul(hash ^ content.charCodeAt(index), 16777619) >>> 0;
  }
  return `${content.length}:${hash}`;
}

const starterFiles = () => [
  {
    id: 'file-html', name: 'index.html', language: 'html',
    content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Starter project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="site-header">
    <a class="wordmark" href="#top">Studio <span>/</span> Sandbox</a>
    <nav aria-label="Main navigation">
      <a href="#examples">Examples</a>
      <a href="#about">About</a>
    </nav>
  </header>

  <main class="page" id="top">
    <section class="hero">
      <p class="eyebrow">HTML · CSS · JAVASCRIPT</p>
      <h1>A clean place<br />to start.</h1>
      <p class="hero-copy">Use these files to try an idea, test a layout, or build a small interaction.</p>
      <div class="actions">
        <button class="button-primary" id="counter-button">Click counter <span id="counter">0</span></button>
        <button class="button-secondary" id="console-button">Write to console</button>
      </div>
    </section>

    <section class="examples" id="examples" aria-label="Starter examples">
      <article><span>01</span><h2>HTML</h2><p>Structure content with semantic elements.</p></article>
      <article><span>02</span><h2>CSS</h2><p>Control spacing, color, and responsive layouts.</p></article>
      <article><span>03</span><h2>JavaScript</h2><p>Add behavior and inspect output in the console.</p></article>
    </section>
  </main>

  <footer id="about">Starter project <span>·</span> Edit any file to get started.</footer>
  <script src="script.js"></script>
</body>
</html>`,
  },
  {
    id: 'file-css', name: 'style.css', language: 'css',
    content: `:root {
  color-scheme: light;
  --ink: #202622;
  --muted: #69716b;
  --paper: #f7f8f5;
  --line: #e0e4de;
  --accent: #35734a;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 15px;
  line-height: 1.6;
}
a { color: inherit; text-decoration: none; }
button { font: inherit; cursor: pointer; }
.site-header {
  width: min(1000px, calc(100% - 48px));
  height: 72px;
  margin: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--line);
}
.wordmark { font-size: 14px; font-weight: 650; letter-spacing: -.02em; }
.wordmark span { padding: 0 5px; color: #9aa19b; font-weight: 400; }
nav { display: flex; gap: 24px; color: var(--muted); font-size: 13px; }
nav a:hover { color: var(--ink); }
.page { width: min(1000px, calc(100% - 48px)); margin: auto; }
.hero { padding: 78px 0 72px; }
.eyebrow { margin: 0 0 20px; color: var(--accent); font-size: 11px; font-weight: 650; letter-spacing: .08em; }
h1 { margin: 0; font-size: clamp(44px, 7vw, 76px); line-height: 1.03; letter-spacing: -.065em; font-weight: 620; }
.hero-copy { max-width: 440px; margin: 21px 0 0; color: var(--muted); font-size: 16px; line-height: 1.75; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
.button-primary, .button-secondary { min-height: 41px; padding: 0 14px; border: 1px solid transparent; border-radius: 6px; font-size: 13px; font-weight: 600; }
.button-primary { display: inline-flex; align-items: center; gap: 12px; color: #fff; background: #2f6240; }
.button-primary:hover { background: #244f32; }
.button-primary span { min-width: 20px; padding: 1px 5px; border-radius: 4px; background: #ffffff20; text-align: center; }
.button-secondary { color: var(--ink); background: transparent; border-color: #cfd5ce; }
.button-secondary:hover { background: #ecefea; }
.examples { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.examples article { min-height: 154px; padding: 23px 24px 24px 0; }
.examples article + article { padding-left: 24px; border-left: 1px solid var(--line); }
.examples article > span { color: #929a93; font-size: 11px; font-variant-numeric: tabular-nums; }
h2 { margin: 11px 0 5px; font-size: 17px; font-weight: 620; letter-spacing: -.025em; }
.examples p { max-width: 240px; margin: 0; color: var(--muted); font-size: 13px; line-height: 1.65; }
footer { width: min(1000px, calc(100% - 48px)); margin: 0 auto; padding: 25px 0 32px; color: #828a83; font-size: 12px; }
footer span { padding: 0 5px; }
@media (max-width: 650px) {
  .site-header, .page, footer { width: calc(100% - 32px); }
  .site-header { height: 62px; }
  nav { gap: 14px; }
  .hero { padding: 58px 0 52px; }
  .hero-copy { font-size: 15px; }
  .examples { grid-template-columns: 1fr; }
  .examples article { min-height: 0; padding: 18px 0; }
  .examples article + article { padding-left: 0; border-left: 0; border-top: 1px solid var(--line); }
}
`,
  },
  {
    id: 'file-js', name: 'script.js', language: 'javascript',
    content: `const counterButton = document.querySelector('#counter-button');
const counterValue = document.querySelector('#counter');
const consoleButton = document.querySelector('#console-button');
let count = 0;

counterButton?.addEventListener('click', () => {
  count += 1;
  counterValue.textContent = count;
});

consoleButton?.addEventListener('click', () => {
  console.log('Hello from your JavaScript file.');
});

console.info('Starter project loaded.');
`,
  },
];

function languageFromName(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'html' || ext === 'htm') return 'html';
  if (ext === 'css') return 'css';
  if (ext === 'js' || ext === 'mjs' || ext === 'cjs') return 'javascript';
  return 'plaintext';
}

function safeDecodeProject() {
  try {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const encoded = params.get('project');
    if (!encoded) return null;
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(parsed.files) || !parsed.files.some((file) => file.name === MAIN_HTML)) return null;
    const files = parsed.files
      .filter((file) => typeof file.name === 'string' && /^[a-zA-Z0-9_-][a-zA-Z0-9._-]{0,78}\.(html?|css|js|mjs|cjs)$/i.test(file.name) && typeof file.content === 'string')
      .map((file, index) => ({
        id: typeof file.id === 'string' ? file.id : `shared-${index}`,
        name: file.name.slice(0, 80),
        language: languageFromName(file.name),
        content: file.content.slice(0, 400000),
      }));
    return { files, name: typeof parsed.name === 'string' ? parsed.name.slice(0, 100) : 'Shared project' };
  } catch {
    return null;
  }
}

function loadProject() {
  const shared = safeDecodeProject();
  if (shared) return { ...shared, activeFileId: shared.files[0]?.id };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (Array.isArray(saved?.files) && saved.files.some((file) => file.name === MAIN_HTML)) {
      const files = saved.files.map((file, index) => ({
        id: file.id || `saved-${index}`,
        name: file.name,
        language: languageFromName(file.name),
        content: typeof file.content === 'string' ? file.content : '',
      }));
      const isUntouchedLegacyStarter = saved.name === 'Greenfield landing page'
        && files.length === 3
        && files.every((file) => LEGACY_STARTER_SIGNATURES[file.name] === contentSignature(file.content));
      if (isUntouchedLegacyStarter) {
        const freshFiles = starterFiles();
        return { files: freshFiles, name: 'Starter project', activeFileId: 'file-html' };
      }
      return { files, name: saved.name || 'My playground', activeFileId: saved.activeFileId || files[0]?.id };
    }
  } catch {
    // Start with the demo if browser storage is unavailable or invalid.
  }
  return { files: starterFiles(), name: 'Starter project', activeFileId: 'file-html' };
}

function escapeStyleContent(value) {
  return value.replace(/<\/style/gi, '<\\/style');
}

function escapeScriptContent(value) {
  return value.replace(/<\/script/gi, '<\\/script');
}

function buildPreviewDocument(files) {
  const entry = files.find((file) => file.name === MAIN_HTML) || files.find((file) => file.language === 'html');
  let html = entry?.content || '<main><h1>Hello, world!</h1></main>';
  if (!/<html[\s>]/i.test(html)) {
    html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${html}</body></html>`;
  }

  const cssFiles = files.filter((file) => file.language === 'css');
  const jsFiles = files.filter((file) => file.language === 'javascript');
  const virtualNames = new Set(files.map((file) => file.name));
  html = html.replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (tag, href) => {
    const clean = href.split(/[?#]/)[0].replace(/^\.\//, '');
    if (virtualNames.has(clean) && languageFromName(clean) === 'css') return '';
    return tag;
  });
  html = html.replace(/<script\b([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script\s*>/gi, (tag, before, src, after) => {
    const clean = src.split(/[?#]/)[0].replace(/^\.\//, '');
    if (virtualNames.has(clean) && languageFromName(clean) === 'javascript') return '';
    return tag;
  });

  const styleBundle = cssFiles.map((file) => `/* ${file.name} */\n${file.content}`).join('\n\n');
  const scriptBundle = jsFiles.map((file) => `\n// ---- ${file.name} ----\n${file.content}`).join('\n');
  const consoleBridge = `
<script>
(() => {
  const send = (level, args) => {
    try {
      const pretty = (value) => {
        if (value instanceof Error) return value.stack || value.message;
        if (typeof value === 'undefined') return 'undefined';
        if (typeof value === 'string') return value;
        try { return JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() + 'n' : item, 2); }
        catch { return String(value); }
      };
      parent.postMessage({ source: 'codecanvas-console', level, args: args.map(pretty), time: Date.now() }, '*');
    } catch (_) {}
  };
  const original = { log: console.log.bind(console), info: console.info.bind(console), warn: console.warn.bind(console), error: console.error.bind(console), debug: console.debug.bind(console), clear: console.clear.bind(console), table: console.table.bind(console) };
  ['log', 'info', 'warn', 'error', 'debug', 'table'].forEach((level) => {
    console[level] = (...args) => { send(level === 'table' ? 'log' : level, args); original[level](...args); };
  });
  console.clear = () => { parent.postMessage({ source: 'codecanvas-console', level: 'clear', args: [], time: Date.now() }, '*'); original.clear(); };
  window.addEventListener('error', (event) => send('error', [event.message + (event.filename ? '\\n' + event.filename + ':' + event.lineno : '')]));
  window.addEventListener('unhandledrejection', (event) => send('error', ['Unhandled promise rejection:', event.reason]));
  window.addEventListener('load', () => send('system', ['Preview ready']));
})();
</script>`;
  const styleTag = styleBundle ? `<style>\n${escapeStyleContent(styleBundle)}\n</style>` : '';
  const scriptTag = scriptBundle ? `<script>\n${escapeScriptContent(scriptBundle)}\n<\/script>` : '';

  if (/<\/head\s*>/i.test(html)) html = html.replace(/<\/head\s*>/i, `${consoleBridge}\n${styleTag}\n</head>`);
  else html = `${consoleBridge}${styleTag}${html}`;
  if (/<\/body\s*>/i.test(html)) html = html.replace(/<\/body\s*>/i, `${scriptTag}\n</body>`);
  else html += scriptTag;
  return html;
}

function IconForFile({ file }) {
  if (file.language === 'html') return <FileCode2 size={15} className="file-icon html-icon" />;
  if (file.language === 'css') return <FileCode2 size={15} className="file-icon css-icon" />;
  if (file.language === 'javascript') return <FileCode2 size={15} className="file-icon js-icon" />;
  return <FileText size={15} className="file-icon" />;
}

function App() {
  const monaco = useMonaco();
  const [project, setProject] = useState(loadProject);
  const [activeFileId, setActiveFileId] = useState(() => loadProject().activeFileId || 'file-html');
  const [saveState, setSaveState] = useState('saved');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleFilter, setConsoleFilter] = useState('all');
  const [logs, setLogs] = useState([]);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [previewFiles, setPreviewFiles] = useState(() => project.files);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const iframeRef = useRef(null);
  const fileMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  const files = project.files;
  const activeFile = files.find((file) => file.id === activeFileId) || files[0];
  const previewDocument = useMemo(() => buildPreviewDocument(previewFiles), [previewFiles, previewVersion]);
  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(sidebarSearch.toLowerCase()));

  useEffect(() => {
    if (!monaco) return;
    monaco.editor.defineTheme('github-green', {
      base: 'vs-dark', inherit: true,
      rules: [
        { token: 'comment', foreground: '8B949E', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'FF7B72' },
        { token: 'string', foreground: 'A5D6FF' },
        { token: 'number', foreground: '79C0FF' },
        { token: 'tag', foreground: '78B882' },
        { token: 'attribute.name', foreground: 'D2A8FF' },
        { token: 'attribute.value', foreground: 'A5D6FF' },
      ],
      colors: {
        'editor.background': '#0d1117', 'editor.foreground': '#e6edf3',
        'editorLineNumber.foreground': '#59636e', 'editorLineNumber.activeForeground': '#e6edf3',
        'editorCursor.foreground': '#78b882', 'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78a8', 'editor.inactiveSelectionBackground': '#264f7848',
        'editorIndentGuide.background1': '#21262d', 'editorIndentGuide.activeBackground1': '#3d444d',
        'editorWidget.background': '#161b22', 'editorWidget.border': '#30363d',
        'editorSuggestWidget.background': '#161b22', 'editorSuggestWidget.border': '#30363d',
        'editorSuggestWidget.selectedBackground': '#21262d', 'editorGutter.background': '#0d1117',
        'scrollbarSlider.background': '#6e768133', 'scrollbarSlider.hoverBackground': '#6e768155',
      },
    });
  }, [monaco]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewFiles(project.files), 300);
    return () => window.clearTimeout(timer);
  }, [project.files]);

  useEffect(() => {
    setLogs([]);
  }, [previewDocument]);

  useEffect(() => {
    setSaveState('saving');
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, activeFileId }));
        setSaveState('saved');
      } catch {
        setSaveState('local-only');
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [project, activeFileId]);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data;
      if (!data || data.source !== 'codecanvas-console') return;
      if (data.level === 'clear') { setLogs([]); return; }
      setLogs((previous) => [...previous.slice(-249), {
        id: `${data.time || Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        level: data.level || 'log', args: Array.isArray(data.args) ? data.args : [String(data.args)],
        time: data.time || Date.now(),
      }]);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setShowSidebar(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }
      if (event.key === 'Escape') { setShareOpen(false); setAddMenuOpen(false); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const closeMenu = (event) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target)) setAddMenuOpen(false);
    };
    window.addEventListener('mousedown', closeMenu);
    return () => window.removeEventListener('mousedown', closeMenu);
  }, []);

  const updateFile = useCallback((fileId, content) => {
    setProject((previous) => ({
      ...previous,
      files: previous.files.map((file) => file.id === fileId ? { ...file, content } : file),
    }));
  }, []);

  const addFile = (kind) => {
    const extension = kind === 'css' ? 'css' : 'js';
    const language = kind === 'css' ? 'css' : 'javascript';
    const stem = kind === 'css' ? 'styles' : 'script';
    let index = 2;
    let name = `${stem}-${index}.${extension}`;
    while (project.files.some((file) => file.name === name)) {
      index += 1;
      name = `${stem}-${index}.${extension}`;
    }
    const nextFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name, language,
      content: language === 'css' ? `/* ${name} — additional styles */\n\n` : `// ${name} — additional JavaScript\n\n`,
    };
    setProject((previous) => {
      const nextFiles = previous.files.map((file) => {
        if (file.name !== MAIN_HTML) return file;
        if (language === 'css') {
          const tag = `<link rel="stylesheet" href="${name}" />`;
          if (file.content.includes(`href="${name}"`)) return file;
          const content = /<\/head\s*>/i.test(file.content)
            ? file.content.replace(/<\/head\s*>/i, `  ${tag}\n</head>`)
            : `${tag}\n${file.content}`;
          return { ...file, content };
        }
        const tag = `<script src="${name}"></script>`;
        if (file.content.includes(`src="${name}"`)) return file;
        const content = /<\/body\s*>/i.test(file.content)
          ? file.content.replace(/<\/body\s*>/i, `  ${tag}\n</body>`)
          : `${file.content}\n${tag}`;
        return { ...file, content };
      });
      return { ...previous, files: [...nextFiles, nextFile] };
    });
    setActiveFileId(nextFile.id);
    setAddMenuOpen(false);
  };

  const deleteFile = (file) => {
    if (CORE_FILES.has(file.name)) return;
    setProject((previous) => ({
      ...previous,
      files: previous.files
        .filter((item) => item.id !== file.id)
        .map((item) => {
          if (item.name !== MAIN_HTML) return item;
          const escapedName = file.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const attribute = file.language === 'css' ? 'href' : 'src';
          const tagPattern = new RegExp(`<${file.language === 'css' ? 'link' : 'script'}\\b[^>]*${attribute}=[\"']${escapedName}[\"'][^>]*>(?:\\s*<\\/script\\s*>)?`, 'gi');
          return { ...item, content: item.content.replace(tagPattern, '') };
        }),
    }));
    if (activeFileId === file.id) {
      const fallback = files.find((item) => item.id !== file.id);
      if (fallback) setActiveFileId(fallback.id);
    }
  };

  const buildShareUrl = () => {
    const payload = JSON.stringify({ name: project.name, files: project.files.map(({ id, name, content }) => ({ id, name, content })) });
    const bytes = new TextEncoder().encode(payload);
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    return `${window.location.origin}${window.location.pathname}#project=${encoded}`;
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      textarea.remove();
      return success;
    }
  };

  const handleShare = () => {
    setShareOpen(true);
    setShareCopied(false);
  };

  const copyShareLink = async () => {
    const result = await copyText(buildShareUrl());
    setShareCopied(result);
  };

  const downloadProject = async () => {
    const zip = new JSZip();
    project.files.forEach((file) => zip.file(file.name, file.content));
    zip.file('README.txt', `${project.name}\n\nCreated with CodeCanvas.\n\nOpen index.html in a browser to view the project. For best results, use a local development server if your code uses module imports or fetch requests.\n`);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    const safeName = (project.name || 'codecanvas-project').trim().replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'codecanvas-project';
    anchor.download = `${safeName}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const refreshPreview = () => {
    setLogs([]);
    setPreviewFiles(project.files);
    setPreviewVersion((version) => version + 1);
  };

  const openPreviewInNewTab = () => {
    const blob = new Blob([previewDocument], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const newTab = window.open(url, '_blank');
    if (!newTab) URL.revokeObjectURL(url);
    else { newTab.opener = null; window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
  };

  const countErrors = logs.filter((log) => log.level === 'error').length;
  const visibleLogs = logs.filter((log) => consoleFilter === 'all' || (consoleFilter === 'log' && ['log', 'info', 'debug', 'system'].includes(log.level)) || log.level === consoleFilter);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <button className="icon-button mobile-sidebar-toggle" title="Toggle file explorer" onClick={() => setShowSidebar((value) => !value)}><PanelLeftClose size={16} /></button>
          <div className="brand-symbol"><Code2 size={19} strokeWidth={2.5} /></div>
          <div className="brand-copy"><span className="brand-name">codecanvas</span><span className="brand-subtitle">HTML / CSS / JS</span></div>
          <span className="topbar-divider" />
          <input aria-label="Project name" className="project-name" value={project.name} onChange={(event) => setProject((previous) => ({ ...previous, name: event.target.value }))} onFocus={(event) => event.target.select()} />
          <ChevronDown size={13} className="project-chevron" />
        </div>
        <div className="topbar-actions">
          <div className={`save-indicator ${saveState}`} title={saveState === 'local-only' ? 'Changes are in memory but could not be saved to browser storage.' : 'Autosaves to this browser'}>
            {saveState === 'saving' ? <LoaderCircle size={13} className="spin" /> : saveState === 'saved' ? <Check size={13} /> : <AlertCircle size={13} />}
            <span>{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : 'Session only'}</span>
          </div>
          <button className="top-action share-action" onClick={handleShare}><Share2 size={14} /><span>Share</span></button>
          <button className="top-action download-action" onClick={downloadProject}><ArrowDownToLine size={14} /><span>Export ZIP</span></button>
        </div>
      </header>

      <div className={`app-body ${showSidebar ? '' : 'explorer-hidden'}`}>
        {showSidebar && <aside className="sidebar">
          <div className="sidebar-heading"><span>Files</span><button className="bare-icon" title="Close explorer" onClick={() => setShowSidebar(false)}><PanelLeftClose size={14} /></button></div>
          <div className="project-tree-heading"><ChevronDown size={13} /><Folder size={14} className="folder-icon" /><span>{project.name || 'Untitled project'}</span><div className="tree-actions" ref={fileMenuRef}><button className="bare-icon" title="New file" onClick={() => setAddMenuOpen((value) => !value)}><FilePlus2 size={15} /></button>{addMenuOpen && <div className="add-menu"><div className="add-menu-label">NEW FILE</div><button onClick={() => addFile('css')}><FileCode2 size={14} className="css-icon" /> Stylesheet <span>.css</span></button><button onClick={() => addFile('js')}><FileCode2 size={14} className="js-icon" /> JavaScript <span>.js</span></button></div>}</div></div>
          <div className="file-search"><Search size={13} /><input ref={searchInputRef} placeholder="Find a file…" value={sidebarSearch} onChange={(event) => setSidebarSearch(event.target.value)} aria-label="Find a file" /><kbd>Ctrl/Cmd P</kbd></div>
          <div className="file-list">
            {filteredFiles.map((file) => <div key={file.id} className={`file-row ${activeFileId === file.id ? 'active' : ''}`}>
              <button className="file-select" onClick={() => setActiveFileId(file.id)}><IconForFile file={file} /><span>{file.name}</span></button>
              {!CORE_FILES.has(file.name) && <button className="file-delete" title={`Delete ${file.name}`} onClick={() => deleteFile(file)}><Trash2 size={12} /></button>}
            </div>)}
            {filteredFiles.length === 0 && <div className="empty-files">No matching files</div>}
          </div>
          <div className="sidebar-bottom"><div className="sidebar-bottom-icon"><HardDrive size={15} /></div><div><strong>Local drafts</strong><span>Saved in this browser.</span></div></div>
          <div className="sidebar-footer"><span>Local workspace</span><span>v1.0.0</span></div>
        </aside>}

        <main className={`workspace-area ${showSidebar ? '' : 'sidebar-hidden'} ${consoleOpen ? '' : 'console-collapsed'}`}>
          <section className="editor-pane pane">
            <div className="pane-toolbar editor-toolbar">
              <div className="pane-title"><span className="pane-title-icon"><Code2 size={14} /></span><span>Editor</span><span className="toolbar-separator">/</span><span className="muted-label">{activeFile?.language || 'plaintext'}</span></div>
              <div className="pane-actions"><span className="editor-status-text">{activeFile ? `${activeFile.content.split('\n').length} lines` : 'No file'}</span><button className="bare-icon" title="More editor actions" onClick={() => setSidebarSearch('')}><MoreHorizontal size={16} /></button></div>
            </div>
            <div className="editor-tabbar">
              {activeFile && <div className="editor-tab active"><IconForFile file={activeFile} /><span>{activeFile.name}</span></div>}
              <div className="editor-tabbar-spacer" />
              <span className="editor-tab-hint">{activeFile?.language === 'javascript' ? 'JavaScript' : activeFile?.language?.toUpperCase()}</span>
            </div>
            <div className="monaco-wrap">
              {activeFile ? <Editor
                key={activeFile.id}
                height="100%"
                language={activeFile.language}
                theme="github-green"
                value={activeFile.content}
                onChange={(value) => updateFile(activeFile.id, value ?? '')}
                options={{
                  fontSize: 14, fontFamily: "Cascadia Code, Consolas, SFMono-Regular, monospace",
                  fontLigatures: false, minimap: { enabled: false }, wordWrap: 'on', automaticLayout: true,
                  scrollBeyondLastLine: false, smoothScrolling: true, cursorSmoothCaretAnimation: 'on',
                  padding: { top: 16, bottom: 20 }, roundedSelection: true, renderLineHighlight: 'all',
                  guides: { indentation: true, bracketPairs: true }, bracketPairColorization: { enabled: true },
                  lineNumbersMinChars: 3, overviewRulerBorder: false, hideCursorInOverviewRuler: true,
                  suggest: { showWords: true }, tabSize: 2, insertSpaces: true,
                  scrollbar: { verticalScrollbarSize: 9, horizontalScrollbarSize: 9, useShadows: false },
                }}
              /> : <div className="no-file">Select a file to start editing.</div>}
            </div>
            <div className="editor-footer"><span><Github size={12} /> CodeCanvas Workspace</span><span>UTF-8 <i /> LF <i /> {activeFile?.language || 'Plain Text'}</span></div>
          </section>

          <section className="preview-pane pane">
            <div className="pane-toolbar preview-toolbar">
              <div className="pane-title"><span>Preview</span></div>
              <div className="preview-actions">
                <div className="device-switcher" role="group" aria-label="Preview device size">
                  <button className={device === 'desktop' ? 'selected' : ''} title="Desktop preview" onClick={() => setDevice('desktop')}><Monitor size={14} /></button>
                  <button className={device === 'tablet' ? 'selected' : ''} title="Tablet preview" onClick={() => setDevice('tablet')}><Tablet size={14} /></button>
                  <button className={device === 'mobile' ? 'selected' : ''} title="Mobile preview" onClick={() => setDevice('mobile')}><Smartphone size={14} /></button>
                </div>
                <button className="bare-icon" title="Refresh preview" onClick={refreshPreview}><RefreshCw size={14} /></button>
                <button className="bare-icon" title="Open preview in new tab" onClick={openPreviewInNewTab}><ArrowUpRight size={15} /></button>
              </div>
            </div>
            <div className={`preview-stage device-${device}`}>
              <div className="preview-browser">
                <div className="browser-chrome"><div className="browser-address"><Globe2 size={12} /><span>localhost:codecanvas</span></div><Maximize2 size={13} className="browser-maximize" /></div>
                <div className="preview-iframe-holder"><iframe
                  key={previewVersion}
                  ref={iframeRef}
                  title="Live website preview"
                  srcDoc={previewDocument}
                  sandbox="allow-scripts allow-forms allow-modals"
                  className="preview-iframe"
                /></div>
              </div>
              <div className="preview-caption"><span>Sandboxed preview</span><span>{device === 'desktop' ? 'Responsive · 100%' : device === 'tablet' ? 'Tablet · 768px' : 'Mobile · 390px'}</span></div>
            </div>
          </section>

          <section className={`console-pane ${consoleOpen ? 'open' : 'closed'}`}>
            <div className="console-toolbar">
              <button className={`console-tab ${consoleOpen ? 'active' : ''}`} onClick={() => setConsoleOpen((value) => !value)}><TerminalSquare size={14} /><span>Console</span>{logs.length > 0 && <span className="console-count">{logs.length}</span>}</button>
              <button className="console-tab muted-tab" onClick={() => { setConsoleOpen(true); setConsoleFilter('error'); }}><AlertCircle size={13} /><span>Problems</span>{countErrors > 0 && <span className="problem-count">{countErrors}</span>}</button>
              <div className="console-toolbar-spacer" />
              {consoleOpen && <><div className="console-filters">
                {['all', 'log', 'warn', 'error'].map((filter) => <button key={filter} className={consoleFilter === filter ? 'selected' : ''} onClick={() => setConsoleFilter(filter)}>{filter === 'all' ? 'All' : filter === 'warn' ? 'Warnings' : filter === 'error' ? 'Errors' : 'Logs'}</button>)}
              </div><button className="bare-icon console-clear" title="Clear console" onClick={() => setLogs([])}><Trash2 size={13} /></button><button className="bare-icon" title="Collapse console" onClick={() => setConsoleOpen(false)}><ChevronDown size={14} /></button></>}
              {!consoleOpen && <button className="bare-icon" title="Expand console" onClick={() => setConsoleOpen(true)}><ChevronDown size={14} className="rotate-up" /></button>}
            </div>
            {consoleOpen && <div className="console-content">
              {visibleLogs.length === 0 ? <div className="console-empty"><div className="console-empty-icon"><TerminalSquare size={16} /></div><div><span>{logs.length === 0 ? 'Your console is clear' : `No ${consoleFilter} messages`}</span><p>{logs.length === 0 ? 'Try console.log("Hello, world!") in your JavaScript file.' : 'Try another filter to see more messages.'}</p></div></div> : visibleLogs.map((log) => <div key={log.id} className={`console-line level-${log.level}`}><span className="console-line-icon">{log.level === 'error' ? <AlertCircle size={13} /> : log.level === 'warn' ? <AlertCircle size={13} /> : log.level === 'system' ? <Activity size={13} /> : <span className="log-glyph">›</span>}</span><span className="console-line-message">{log.args.join(' ')}</span><span className="console-line-time">{new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>)}
            </div>}
          </section>
        </main>
      </div>

      {shareOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShareOpen(false); }}>
        <div className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-heading">
          <div className="modal-heading"><div className="modal-icon"><Share2 size={17} /></div><button className="bare-icon modal-close" title="Close" onClick={() => setShareOpen(false)}><X size={17} /></button></div>
          <h2 id="share-heading">Share your canvas</h2><p className="modal-copy">Anyone with this link can open a snapshot of your project. Your files are encoded in the URL, so no account is needed.</p>
          <label className="share-label" htmlFor="share-url">SHAREABLE LINK</label>
          <div className="share-url-row"><input id="share-url" readOnly value={buildShareUrl()} onFocus={(event) => event.target.select()} /><button onClick={copyShareLink} className="copy-link-button">{shareCopied ? <CheckCheck size={14} /> : <Copy size={14} />}{shareCopied ? 'Copied' : 'Copy link'}</button></div>
          <div className="share-note"><AlertCircle size={14} /><span>Large projects create long links. The link contains your source code; share it only with people you trust.</span></div>
          <div className="modal-bottom"><span><Check size={14} /> Link ready</span><button className="modal-done" onClick={() => setShareOpen(false)}>Done</button></div>
        </div>
      </div>}
    </div>
  );
}

export default App;
