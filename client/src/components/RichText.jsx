import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const ALLOWED_TAGS = new Set([
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'div',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a',
    'blockquote', 'code', 'pre', 'small', 'sub', 'sup',
]);
const ALLOWED_ATTRS_BY_TAG = {
    a: ['href', 'title'],
};

const sanitizeHTML = (html) => {
    if (!html || typeof window === 'undefined') return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const walk = (node) => {
        for (const el of Array.from(node.children)) {
            const tag = el.tagName.toLowerCase();
            if (!ALLOWED_TAGS.has(tag)) {
                const parent = el.parentNode;
                while (el.firstChild) parent.insertBefore(el.firstChild, el);
                parent.removeChild(el);
                continue;
            }
            const allowed = ALLOWED_ATTRS_BY_TAG[tag] || [];
            for (const attr of Array.from(el.attributes)) {
                const name = attr.name.toLowerCase();
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

export const RichTextEditor = ({ value, onChange, placeholder, minHeight = '140px', style }) => {
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

    const handlePaste = (e) => {
        e.preventDefault();
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');
        const insert = html
            ? sanitizeHTML(html)
            : (text || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
        document.execCommand('insertHTML', false, insert);
    };

    const handleInput = () => {
        if (!ref.current) return;
        const html = ref.current.innerHTML;
        lastInternal.current = html;
        onChange(html);
    };

    return (
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
    );
};
