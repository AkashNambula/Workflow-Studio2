import { SendHorizontal } from 'lucide-react';

export default function ChatInput({ value, onChange, onSend, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSend();
          }
        }}
        placeholder="Ask about workflows, history, and account settings"
        disabled={disabled}
        style={{
          flex: 1,
          padding: '10px 12px',
          borderRadius: 999,
          border: '1px solid #2a2a31',
          background: '#0f0f12',
          color: '#f5f5f5',
          outline: 'none'
        }}
      />
      <button
        onClick={onSend}
        disabled={disabled}
        style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          border: 'none',
          background: disabled ? '#2a2a31' : '#4f46e5',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <SendHorizontal size={16} />
      </button>
    </div>
  );
}
