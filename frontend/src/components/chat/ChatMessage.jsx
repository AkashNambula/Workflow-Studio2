import { Bot, User } from 'lucide-react';

function formatMessage(text) {
  const lines = (text || '').split(/\n/);
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={`${index}-break`} style={{ height: 6 }} />;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      return <div key={index} style={{ marginBottom: 6, color: '#e2e8f0', lineHeight: 1.45 }}>{trimmed}</div>;
    }

    if (/^[-*]\s/.test(trimmed)) {
      return <div key={index} style={{ marginBottom: 4, color: '#e2e8f0', lineHeight: 1.45 }}>{trimmed}</div>;
    }

    return <div key={index} style={{ marginBottom: 4, color: '#e2e8f0', lineHeight: 1.45 }}>{trimmed}</div>;
  });
}

export default function ChatMessage({ message, isUser }) {
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{
        display: 'flex',
        gap: 8,
        maxWidth: '85%',
        alignItems: 'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isUser ? '#4f46e5' : '#2a2a31',
          color: '#f5f5f5',
          flexShrink: 0
        }}>
          {isUser ? <User size={14} /> : <Bot size={14} />}
        </div>
        <div style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: isUser ? '#3b3b46' : '#15151a',
          color: '#f5f5f5',
          border: isUser ? '1px solid #4f46e5' : '1px solid #2a2a31',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          whiteSpace: 'pre-wrap'
        }}>
          {formatMessage(message)}
        </div>
      </div>
    </div>
  );
}
