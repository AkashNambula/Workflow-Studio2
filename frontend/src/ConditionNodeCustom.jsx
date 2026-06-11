import { Handle, Position } from 'reactflow';

// 🟢 FIXED: Removed unused '{ data }' variable from signature block
const ConditionNodeCustom = () => {
  return (
    <div style={{
      background: '#1e1e2f',
      color: '#fff',
      padding: '14px 20px',
      borderRadius: '10px',
      border: '2px solid #a855f7',
      minWidth: '180px',
      textAlign: 'center',
      fontFamily: 'sans-serif',
      boxShadow: '0 4px 15px rgba(168, 85, 247, 0.25)'
    }}>
      {/* Top Input Connection Pin */}
      <Handle type="target" position={Position.Top} style={{ background: '#a855f7', width: '8px', height: '8px' }} />
      
      <div style={{ fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
        🔀 Employee Validation
      </div>

      {/* Dual Source Handles Routing Junctions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '11px', fontWeight: '700' }}>
        
        {/* 🟢 TRUE BRANCH HANDLE (LEFT SIDE BOTTOM) */}
        <div style={{ color: '#10b981', position: 'relative', left: '-6px' }}>
          True Step
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="true_branch" 
            style={{ left: '25%', background: '#10b981', width: '10px', height: '10px' }} 
          />
        </div>

        {/* 🔴 FALSE BRANCH HANDLE (RIGHT SIDE BOTTOM) */}
        <div style={{ color: '#ef4444', position: 'relative', right: '-6px' }}>
          False Step
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="false_branch" 
            style={{ left: '75%', background: '#ef4444', width: '10px', height: '10px' }} 
          />
        </div>

      </div>
    </div>
  );
};

export default ConditionNodeCustom;