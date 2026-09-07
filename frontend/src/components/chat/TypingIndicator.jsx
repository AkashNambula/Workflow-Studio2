export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2a2a31', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a855f7', animation: 'chatPulse 1.2s infinite ease-in-out' }} />
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a855f7', animation: 'chatPulse 1.2s infinite ease-in-out 0.2s' }} />
          <span style={{ width: 5, height: '5px', borderRadius: '50%', background: '#a855f7', animation: 'chatPulse 1.2s infinite ease-in-out 0.4s' }} />
        </div>
      </div>
      <div style={{ padding: '10px 12px', borderRadius: 12, background: '#15151a', color: '#cbd5e1', border: '1px solid #2a2a31', fontSize: 13 }}>
        Assistant is preparing an answer...
      </div>
    </div>
  );
}
