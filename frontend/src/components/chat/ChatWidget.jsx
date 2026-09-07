import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MessageCircleMore, ChevronDown, ChevronUp } from 'lucide-react';
import ChatHeader from './ChatHeader';
import QuickActions from './QuickActions';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

export default function ChatWidget() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [conversationId, setConversationId] = useState(() => localStorage.getItem('chatConversationId') || '');
  const bottomRef = useRef(null);

  const role = useMemo(() => {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    return (stored.role || 'Viewer').toString();
  }, []);

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const safeOffsetRight = 24;

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleQuickAction = (action) => {
    setShowQuickActions(false);
    const normalized = action.toLowerCase();
    if (normalized === 'create workflow') {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Create Workflow', isUser: true }, { id: Date.now() + 1, text: 'Open the workflow builder and build your workflow from the canvas.', isUser: false }]);
      navigate('/dashboard');
      return;
    }

    if (normalized === 'saved workflows') {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Open Saved Workflows', isUser: true }]);
      navigate('/saved-workflows');
      return;
    }

    if (normalized === 'execution history') {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Open Execution History', isUser: true }]);
      navigate('/execution-history');
      return;
    }

    if (normalized === 'recent runs') {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Open Recent Runs', isUser: true }]);
      navigate('/admin-dashboard');
      return;
    }

    if (normalized === 'change password') {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Change Password', isUser: true }, { id: Date.now() + 1, text: 'Use the account menu and choose Change Password to update your credentials.', isUser: false }]);
      navigate('/dashboard');
      return;
    }

    if (normalized === 'account settings') {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Open Account Settings', isUser: true }]);
      navigate('/dashboard');
      return;
    }

    if (normalized === 'help') {
      setMessages((prev) => [...prev, { id: Date.now(), text: 'Help', isUser: true }, { id: Date.now() + 1, text: 'You can ask about workflow creation, saved workflows, execution history, recent runs, or account settings.', isUser: false }]);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = { id: Date.now(), text: trimmed, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const lower = trimmed.toLowerCase();
    const greetingKeywords = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetingKeywords.some((keyword) => lower.includes(keyword))) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: `Hello! I can help with workflow creation, saved workflows, execution history, recent runs, and account settings. Try asking: “How do I create a workflow?”, “Open Saved Workflows”, “Change Password”, or “Execution History”.`, isUser: false }]);
      setIsTyping(false);
      return;
    }

    if (lower.includes('open saved workflows')) {
      navigate('/saved-workflows');
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: 'Opening Saved Workflows.', isUser: false }]);
      setIsTyping(false);
      return;
    }

    if (lower.includes('open execution history')) {
      navigate('/execution-history');
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: 'Opening Execution History.', isUser: false }]);
      setIsTyping(false);
      return;
    }

    if (lower.includes('open account settings')) {
      navigate('/dashboard');
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: 'Opening the account area from the dashboard.', isUser: false }]);
      setIsTyping(false);
      return;
    }

    if (lower.includes('open recent runs')) {
      navigate('/admin-dashboard');
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: 'Opening Recent Runs.', isUser: false }]);
      setIsTyping(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://127.0.0.1:8000/api/chat', {
        message: trimmed,
        conversation_id: conversationId || undefined
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!conversationId) {
        const nextConversationId = `chat-${Date.now()}`;
        setConversationId(nextConversationId);
        localStorage.setItem('chatConversationId', nextConversationId);
      }

      const payload = response.data || {};
      if (payload.navigation_route) {
        navigate(payload.navigation_route);
      }
      setMessages((prev) => [...prev, { id: Date.now() + 2, text: payload.reply || 'The assistant is ready to help.', isUser: false }]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: Date.now() + 2, text: "I'm having trouble connecting to the assistant.\nYou can still use the quick actions below.", isUser: false }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div style={{ position: 'fixed', right: safeOffsetRight, bottom: 24, zIndex: 1000 }}>
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
            setShowQuickActions(false);
          }}
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            border: '1px solid #2a2a31',
            background: 'linear-gradient(135deg, #1a1a22, #0f0f12)',
            color: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 12px 28px rgba(0,0,0,0.28)'
          }}
        >
          <MessageCircleMore size={20} color="#a855f7" />
        </button>
      )}

      {isOpen && (
        <div style={{
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
          height: isMinimized ? 56 : 520,
          borderRadius: 18,
          overflow: 'hidden',
          background: '#0d0d11',
          border: '1px solid #2a2a31',
          boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'height 0.25s ease'
        }}>
          <ChatHeader isOpen={isOpen} isMinimized={isMinimized} onToggle={() => setIsMinimized((value) => !value)} title={`Hello ${roleLabel}`} />

          {!isMinimized && (
            <>
              <div style={{ flex: 1, padding: 18, overflowY: 'auto', background: '#101017', display: 'flex', flexDirection: 'column' }}>
                {messages.length === 0 ? (
                  <div style={{ display: 'grid', gap: 14, color: '#e5e7eb' }}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>Hello {roleLabel}</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>Ask me anything about Workflow Studio.</div>
                    </div>

                    <div style={{ padding: '14px 16px', borderRadius: 16, background: '#111116', border: '1px solid #2a2a31' }}>
                      <div style={{ display: 'grid', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#cbd5e1' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />Create Workflow</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#cbd5e1' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />Change Password</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#cbd5e1' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', display: 'inline-block' }} />Execution History</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={() => setShowQuickActions((value) => !value)}
                        style={{
                          padding: '10px 16px',
                          borderRadius: 999,
                          border: '1px solid #2a2a31',
                          background: 'rgba(168,85,247,0.08)',
                          color: '#f8fafc',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer'
                        }}
                      >
                        {showQuickActions ? 'Less' : 'More'}
                        {showQuickActions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    <div style={{ maxHeight: showQuickActions ? 380 : 0, overflow: 'hidden', transition: 'max-height 0.28s ease', opacity: showQuickActions ? 1 : 0 }}>
                      <div style={{ marginTop: 12 }}>
                        <QuickActions onSelect={handleQuickAction} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <ChatMessage key={message.id} message={message.text} isUser={message.isUser} />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={bottomRef} />
                  </>
                )}
              </div>

              <div style={{ padding: 12, borderTop: '1px solid #2a2a31', background: '#111116' }}>
                {messages.length > 0 && <QuickActions onSelect={handleQuickAction} />}
                <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={isTyping} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
