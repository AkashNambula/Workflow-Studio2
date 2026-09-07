import { FilePlus2, FolderOpen, History, Activity, KeyRound, Settings, CircleHelp } from 'lucide-react';

const actions = [
  { label: 'Create Workflow', icon: FilePlus2, action: 'create workflow' },
  { label: 'Saved Workflows', icon: FolderOpen, action: 'saved workflows' },
  { label: 'Execution History', icon: History, action: 'execution history' },
  { label: 'Recent Runs', icon: Activity, action: 'recent runs' },
  { label: 'Change Password', icon: KeyRound, action: 'change password' },
  { label: 'Account Settings', icon: Settings, action: 'account settings' },
  { label: 'Help', icon: CircleHelp, action: 'help' }
];

export default function QuickActions({ onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
      {actions.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            onClick={() => onSelect(item.action)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: 8,
              padding: '10px 10px',
              borderRadius: 10,
              background: '#15151a',
              color: '#f5f5f5',
              border: '1px solid #2a2a31',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            <Icon size={14} color="#a855f7" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
