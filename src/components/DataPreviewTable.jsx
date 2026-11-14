import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function DataPreviewTable({ parsedResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  if (!parsedResult || !parsedResult.rows || parsedResult.rows.length === 0) return null;

  const { rows, headers, totalRows, delimiter } = parsedResult;
  const totalPages = Math.ceil(rows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRows = rows.slice(startIndex, startIndex + pageSize);

  return (
    <div className="preview-container">
      <div className="preview-header">
        <button
          type="button"
          className="btn-toggle-preview"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          {isOpen ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          <span>{isOpen ? 'Hide Normalized Dataset Preview' : `Inspect Normalized Data Table (${totalRows} observations)`}</span>
        </button>
        <span className="text-xs text-civic-slate">
          Autodetected Delimiter: <code>{delimiter === '\t' ? 'TAB' : delimiter}</code>
        </span>
      </div>

      {isOpen && (
        <div className="preview-content">
          <div className="table-responsive">
            <table className="civic-table table-compact" aria-label="Normalized Dataset Rows">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  {headers.map((h, idx) => (
                    <th key={idx} scope="col">
                      {h.original}
                      {h.unit && <span className="th-unit">({h.unit})</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((r, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="text-xs text-civic-slate">{r._rowIndex}</td>
                    {headers.map((h, colIdx) => {
                      const val = r[h.canonical];
                      const isMissing = val === null || val === undefined;
                      return (
                        <td key={colIdx} className={isMissing ? 'cell-missing' : ''}>
                          {isMissing ? <span className="missing-tag">NULL</span> : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <span className="text-xs text-civic-slate">
              Showing {startIndex + 1}–{Math.min(startIndex + pageSize, totalRows)} of {totalRows}
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn-page"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span className="page-indicator">Page {currentPage} of {totalPages}</span>
              <button
                type="button"
                className="btn-page"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
