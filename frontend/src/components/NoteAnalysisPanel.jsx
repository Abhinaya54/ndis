import { FileText, Download } from 'lucide-react';

const NoteAnalysisPanel = ({ analysis, noteId, onDownload }) => {
  if (!analysis) return null;

  return (
    <div style={{
      marginTop: '24px',
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          <FileText size={18} />
          Note Analysis
        </h3>
        {onDownload && (
          <button
            onClick={onDownload}
            style={{
              padding: '6px 12px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            Download Report
          </button>
        )}
      </div>

      {analysis.summary && (
        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#374151' }}>Summary</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>{analysis.summary}</p>
        </div>
      )}

      {analysis.keywords && analysis.keywords.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151' }}>Keywords</h4>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {analysis.keywords.map((kw, i) => (
              <span key={i} style={{
                padding: '4px 10px',
                backgroundColor: '#eef2ff',
                color: '#4338ca',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {analysis.sentiment && (
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#374151' }}>Sentiment</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>{analysis.sentiment}</p>
        </div>
      )}
    </div>
  );
};

export default NoteAnalysisPanel;
