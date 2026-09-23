import { useState, useEffect, useRef, useCallback } from 'react';
import { chatbotAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import styles from './Chatbot.module.css';

// ── Suggested questions per tab ───────────────────────────────────────────────
const SUGGESTIONS = {
  analytics: [
    'What does my average score mean?',
    'Which subject needs improvement?',
    'Explain the grade distribution',
    'What trends do you see in my data?',
  ],
  evaluation: [
    'How does the FAIR scoring work?',
    'What do the evaluation weights mean?',
    'Why did a student score low?',
    'How to improve evaluation accuracy?',
  ],
  subjects: [
    'How do I add a new subject?',
    'What format should the master PDF be?',
    'How do I upload student answer sheets?',
    'Can I import subjects from CSV?',
  ],
  pdf: [
    'How does OCR work?',
    'When should I force OCR?',
    'What file types are supported?',
    'Why is text extraction incomplete?',
  ],
  settings: [
    'How do I set up email reports?',
    'What is the NVIDIA API key for?',
    'How to configure Gmail app password?',
    'What does "Use Semantic" toggle do?',
  ],
  default: [
    'What is EvalAI?',
    'How do I evaluate student answer sheets?',
    'What subscription plans are available?',
    'How do I interpret scores and grades?',
  ],
};

function getSuggestions(tab) {
  return SUGGESTIONS[tab] || SUGGESTIONS.default;
}

// ── Markdown-lite renderer (bold, code, bullet lists) ─────────────────────────
function MessageText({ text }) {
  // Split on newlines, then apply inline formatting
  const lines = text.split('\n');
  return (
    <div className={styles.msgText}>
      {lines.map((line, li) => {
        // Bullet line
        if (/^[-*•]\s/.test(line.trimStart())) {
          return (
            <div key={li} className={styles.bulletLine}>
              <span className={styles.bulletDot}>·</span>
              <span>{renderInline(line.replace(/^[-*•]\s/, ''))}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(line.trimStart())) {
          return <div key={li} className={styles.bulletLine}>{renderInline(line)}</div>;
        }
        // Empty line → spacer
        if (line.trim() === '') return <div key={li} className={styles.lineSpacer} />;
        return <div key={li}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

function renderInline(text) {
  // **bold**, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
    return part;
  });
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className={styles.typingWrap}>
      <div className={styles.botAvatar}>∑</div>
      <div className={styles.typingBubble}>
        <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
      </div>
    </div>
  );
}

// ── Main Chatbot Component ────────────────────────────────────────────────────
export default function Chatbot({ activeTab, analyticsData }) {
  const { state } = useApp();
  const user = state.authUser;

  const [open,     setOpen]     = useState(false);
  const [input,    setInput]    = useState('');
  const [messages, setMessages] = useState([]);   // { role, content, id }
  const [typing,   setTyping]   = useState(false);
  const [error,    setError]    = useState('');

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const msgIdRef       = useRef(0);

  function nextId() { return ++msgIdRef.current; }

  // ── Scroll to bottom whenever messages change ─────────────────────────────
  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, open]);

  // ── Focus input when panel opens ──────────────────────────────────────────
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  // ── Welcome message on first open ────────────────────────────────────────
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id:      nextId(),
        role:    'assistant',
        content: `👋 Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! I'm your EvalAI assistant.\n\nI can help you with **evaluations**, **analytics insights**, **navigation**, and any questions about the platform.\n\nWhat would you like to know?`,
      }]);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsg = { id: nextId(), role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setError('');
    setTyping(true);

    // Build history from current messages (exclude the welcome msg for brevity)
    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-14)   // last 7 pairs
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await chatbotAPI.chat(
        trimmed,
        history,
        activeTab === 'analytics' ? analyticsData : null,
        activeTab,
      );
      setMessages(prev => [...prev, {
        id:      nextId(),
        role:    'assistant',
        content: res.reply,
      }]);
    } catch (err) {
      const errText = err.message === 'SESSION_EXPIRED'
        ? 'Your session has expired. Please log in again.'
        : err.message || 'Something went wrong. Please try again.';
      setError(errText);
      setMessages(prev => [...prev, {
        id:      nextId(),
        role:    'assistant',
        content: `⚠️ ${errText}`,
        isError: true,
      }]);
    } finally {
      setTyping(false);
    }
  }, [messages, typing, activeTab, analyticsData]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleClear() {
    setMessages([]);
    setError('');
    // Re-trigger welcome message
    setTimeout(() => {
      setMessages([{
        id:      nextId(),
        role:    'assistant',
        content: `Chat cleared. How can I help you?`,
      }]);
    }, 50);
  }

  const suggestions = getSuggestions(activeTab);

  // ── Whether analytics context is available ────────────────────────────────
  const hasAnalytics = activeTab === 'analytics' && analyticsData?.total_evaluations > 0;

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────────────── */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
        title={open ? 'Close assistant' : 'Ask EvalAI Assistant'}
      >
        {open ? (
          <span className={styles.fabClose}>✕</span>
        ) : (
          <>
            <span className={styles.fabIcon}>💬</span>
            <span className={styles.fabPulse} />
          </>
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────────────────────────────── */}
      {open && (
        <div className={styles.panel} role="dialog" aria-label="EvalAI Assistant">

          {/* Panel header */}
          <div className={styles.panelHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.headerAvatar}>∑</div>
              <div>
                <div className={styles.headerTitle}>EvalAI Assistant</div>
                <div className={styles.headerSub}>
                  <span className={styles.onlineDot} />
                  {hasAnalytics ? 'Analytics context loaded' : 'Ready to help'}
                </div>
              </div>
            </div>
            <div className={styles.headerActions}>
              <button
                className={styles.headerBtn}
                onClick={handleClear}
                title="Clear conversation"
              >
                🗑
              </button>
              <button
                className={styles.headerBtn}
                onClick={() => setOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab context badge */}
          {activeTab && activeTab !== 'default' && (
            <div className={styles.contextBadge}>
              {activeTab === 'analytics' && hasAnalytics
                ? '📊 Analytics context active — I can explain your charts'
                : `📍 Currently on: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab`}
            </div>
          )}

          {/* Messages area */}
          <div className={styles.messages}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`${styles.msgRow} ${msg.role === 'user' ? styles.userRow : styles.botRow}`}
              >
                {msg.role === 'assistant' && (
                  <div className={styles.botAvatar}>∑</div>
                )}
                <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.botBubble} ${msg.isError ? styles.errorBubble : ''}`}>
                  {msg.role === 'assistant'
                    ? <MessageText text={msg.content} />
                    : <span>{msg.content}</span>
                  }
                </div>
              </div>
            ))}

            {typing && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips — shown only when ≤ 1 messages */}
          {messages.length <= 1 && (
            <div className={styles.suggestions}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className={styles.suggestionChip}
                  onClick={() => sendMessage(s)}
                  disabled={typing}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about EvalAI…"
              rows={1}
              disabled={typing}
              maxLength={2000}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage(input)}
              disabled={typing || !input.trim()}
              aria-label="Send message"
            >
              {typing ? <span className={styles.sendSpinner} /> : '➤'}
            </button>
          </div>
          <div className={styles.inputHint}>↵ Enter to send · Shift+Enter for new line</div>
        </div>
      )}
    </>
  );
}
