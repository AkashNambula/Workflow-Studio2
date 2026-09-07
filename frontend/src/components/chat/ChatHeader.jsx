import { MessageSquareText, Minimize2, Maximize2 } from 'lucide-react';

export default function ChatHeader({ isOpen, isMinimized, onToggle, title }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 14px',
      borderBottom: '1px solid #2a2a31',
      background: '#111116',
      color: '#f5f5f5'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2a2a31', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquareText size={14} color="#a855f7" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 11, color: '#8a8d98' }}>Assistant</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid #2a2a31',
          background: 'transparent',
          color: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
      </button>
    </div>
  );
}
