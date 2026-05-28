import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const ALLOWED_TAGS = new Set([
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'div',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a',
    'blockquote', 'code', 'pre', 'small', 'sub', 'sup', 'font',
]);
const STRIPPED_TAGS = new Set([
    'script', 'style', 'meta', 'link', 'iframe', 'object', 'embed', 'svg', 'head',
]);
const ALLOWED_ATTRS_BY_TAG = {
    a: ['href', 'title'],
    font: ['size', 'color'],
};
const ALLOWED_STYLE_PROPS = new Set([
    'font-size', 'font-weight', 'font-style', 'text-decoration', 'color', 'text-align',
]);
const SAFE_STYLE_VALUE = /^[\w#%.,\s()\-]+$/;

const sanitizeStyle = (styleStr) => {
    if (!styleStr) return '';
    const out = [];
    for (const decl of styleStr.split(';')) {
        const idx = decl.indexOf(':');
        if (idx === -1) continue;
        const prop = decl.slice(0, idx).trim().toLowerCase();
        const val = decl.slice(idx + 1).trim();
        if (!ALLOWED_STYLE_PROPS.has(prop)) continue;
        if (!SAFE_STYLE_VALUE.test(val)) continue;
        out.push(`${prop}: ${val}`);
    }
    return out.join('; ');
};

const sanitizeHTML = (html) => {
    if (!html || typeof window === 'undefined') return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const walk = (node) => {
        for (const el of Array.from(node.children)) {
            const tag = el.tagName.toLowerCase();
            if (STRIPPED_TAGS.has(tag)) {
                el.remove();
                continue;
            }
            if (!ALLOWED_TAGS.has(tag)) {
                walk(el);
                const parent = el.parentNode;
                while (el.firstChild) parent.insertBefore(el.firstChild, el);
                parent.removeChild(el);
                continue;
            }
            const allowed = ALLOWED_ATTRS_BY_TAG[tag] || [];
            for (const attr of Array.from(el.attributes)) {
                const name = attr.name.toLowerCase();
                if (name === 'style') {
                    const clean = sanitizeStyle(attr.value);
                    if (clean) el.setAttribute('style', clean);
                    else el.removeAttribute('style');
                    continue;
                }
                if (name.startsWith('on') || !allowed.includes(name)) {
                    el.removeAttribute(attr.name);
                }
            }
            if (tag === 'a') {
                const href = el.getAttribute('href') || '';
                if (/^\s*javascript:/i.test(href)) el.removeAttribute('href');
                el.setAttribute('rel', 'noopener noreferrer');
                el.setAttribute('target', '_blank');
            }
            walk(el);
        }
    };
    walk(doc.body);
    return doc.body.innerHTML;
};

const looksLikeHTML = (s) => /<[a-z][\s\S]*?>/i.test(s);

export const MenuContent = ({ text }) => {
    if (!text) return null;
    if (looksLikeHTML(text)) {
        return <div className="menu-content" dangerouslySetInnerHTML={{ __html: sanitizeHTML(text) }} />;
    }
    return <ReactMarkdown>{text}</ReactMarkdown>;
};

const tbBtn = {
    padding: '4px 10px',
    fontSize: '0.85rem',
    background: '#eee',
    color: '#333',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    minWidth: 'auto',
    boxShadow: 'none',
};
const tbSep = { width: '1px', alignSelf: 'stretch', background: '#ccc', margin: '0 4px' };

const TBtn = ({ onAction, title, children, extra }) => (
    <button
        type="button"
        title={title}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onAction}
        style={{ ...tbBtn, ...(extra || {}) }}
    >
        {children}
    </button>
);

const insertHTMLAtCaret = (editor, html) => {
    const sel = window.getSelection();
    if (!sel) return false;
    let range;
    if (sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
        range = sel.getRangeAt(0);
    } else {
        // Caret isn't inside the editor — append at the end.
        range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
    }
    range.deleteContents();
    const template = document.createElement('template');
    template.innerHTML = html;
    const frag = template.content;
    const lastNode = frag.lastChild;
    range.insertNode(frag);
    if (lastNode) {
        const after = document.createRange();
        after.setStartAfter(lastNode);
        after.collapse(true);
        sel.removeAllRanges();
        sel.addRange(after);
    }
    return true;
};

const escapeHTML = (s) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const plainTextToHTML = (text) => text
    .split(/\r?\n\r?\n+/)
    .map((para) => `<p>${escapeHTML(para).replace(/\r?\n/g, '<br>')}</p>`)
    .join('');

export const RichTextEditor = ({ value, onChange, placeholder, minHeight = '160px', style, showToolbar = true }) => {
    const ref = useRef(null);
    const lastInternal = useRef('');

    useEffect(() => {
        if (!ref.current) return;
        const v = value || '';
        if (v !== lastInternal.current) {
            ref.current.innerHTML = v;
            lastInternal.current = v;
        }
    }, [value]);

    const sync = () => {
        if (!ref.current) return;
        const html = ref.current.innerHTML;
        lastInternal.current = html;
        onChange(html);
    };

    const handleInput = () => sync();

    const handlePaste = (e) => {
        const cd = e.clipboardData || (e.nativeEvent && e.nativeEvent.clipboardData);
        if (!cd) return;
        const html = cd.getData('text/html');
        const text = cd.getData('text/plain');
        e.preventDefault();
        const payload = html ? sanitizeHTML(html) : plainTextToHTML(text || '');
        if (!payload) return;
        if (ref.current) ref.current.focus();
        insertHTMLAtCaret(ref.current, payload);
        sync();
    };

    const exec = (cmd, val = null) => {
        if (!ref.current) return;
        ref.current.focus();
        document.execCommand(cmd, false, val);
        sync();
    };

    const wrapSelectionInline = (cssProps) => {
        if (!ref.current) return;
        ref.current.focus();
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const range = sel.getRangeAt(0);
        if (!ref.current.contains(range.commonAncestorContainer)) return;
        if (range.collapsed) return;
        const span = document.createElement('span');
        Object.assign(span.style, cssProps);
        try {
            span.appendChild(range.extractContents());
            range.insertNode(span);
            const after = document.createRange();
            after.setStartAfter(span);
            after.collapse(true);
            sel.removeAllRanges();
            sel.addRange(after);
        } catch {
            return;
        }
        sync();
    };

    return (
        <div>
            {showToolbar && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px', alignItems: 'center' }}>
                    <TBtn title="Podebljano" onAction={() => exec('bold')} extra={{ fontWeight: 'bold' }}>B</TBtn>
                    <TBtn title="Kurziv" onAction={() => exec('italic')} extra={{ fontStyle: 'italic' }}>I</TBtn>
                    <TBtn title="Podcrtano" onAction={() => exec('underline')} extra={{ textDecoration: 'underline' }}>U</TBtn>
                    <span style={tbSep} />
                    <TBtn title="Veliki naslov" onAction={() => exec('formatBlock', '<h1>')}>H1</TBtn>
                    <TBtn title="Srednji naslov" onAction={() => exec('formatBlock', '<h2>')}>H2</TBtn>
                    <TBtn title="Mali naslov" onAction={() => exec('formatBlock', '<h3>')}>H3</TBtn>
                    <TBtn title="Obični odlomak" onAction={() => exec('formatBlock', '<p>')}>¶</TBtn>
                    <span style={tbSep} />
                    <TBtn title="Lista" onAction={() => exec('insertUnorderedList')}>• Lista</TBtn>
                    <TBtn title="Numerirana lista" onAction={() => exec('insertOrderedList')}>1. Lista</TBtn>
                    <span style={tbSep} />
                    <TBtn title="Smanji tekst" onAction={() => wrapSelectionInline({ fontSize: '0.85em' })}>A−</TBtn>
                    <TBtn title="Povećaj tekst" onAction={() => wrapSelectionInline({ fontSize: '1.25em' })}>A+</TBtn>
                    <span style={tbSep} />
                    <TBtn title="Ukloni formatiranje" onAction={() => exec('removeFormat')}>Tx</TBtn>
                </div>
            )}
            <div
                ref={ref}
                className="rich-editor"
                contentEditable
                suppressContentEditableWarning
                onPaste={handlePaste}
                onInput={handleInput}
                data-placeholder={placeholder || ''}
                style={{
                    width: '100%',
                    minHeight,
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: 'white',
                    marginBottom: '10px',
                    outline: 'none',
                    lineHeight: 1.5,
                    ...style,
                }}
            />
        </div>
    );
};
