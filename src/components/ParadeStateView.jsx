import React, { useState } from 'react';
import { COY_KEYS, COY_LABELS, computeParadeSheetSummary } from '../utils/paradeCalc';

export default function ParadeStateView({
  user,
  paradeSheet,
  paradeSignInfo,
  onUpdateCell,
  onAddRow,
  onSignParadeState,
  onResetSheet,
  showToast
}) {
  const isAdjutant = user.role === 'ADJUTANT_CO';
  const isClerk = user.role === 'COMPANY_CLERK';
  const canEdit = user.permissions?.canEditParadeSheet && !isClerk;

  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [activeRowKey, setActiveRowKey] = useState('');
  const [activeRowLabel, setActiveRowLabel] = useState('');
  const [activeCoyKey, setActiveCoyKey] = useState('A');
  const [offrVal, setOffrVal] = useState(0);
  const [jcoVal, setJcoVal] = useState(0);
  const [orVal, setOrVal] = useState(0);

  const [rowModalOpen, setRowModalOpen] = useState(false);
  const [newRowLabel, setNewRowLabel] = useState('');

  const { coyStats, grand } = computeParadeSheetSummary(paradeSheet);

  const handleCellClick = (row, coyKey) => {
    if (!canEdit) {
      showToast(
        'Read-Only for Company Clerk: Submit soldier leave requests to Adjutant / CO to automatically update the LVE row.'
      );
      return;
    }
    const cell = (row.coys && row.coys[coyKey]) || { offr: 0, jco: 0, or: 0 };
    setActiveRowKey(row.key);
    setActiveRowLabel(row.label);
    setActiveCoyKey(coyKey);
    setOffrVal(cell.offr);
    setJcoVal(cell.jco);
    setOrVal(cell.or);
    setCellModalOpen(true);
  };

  const handleSaveCell = async (e) => {
    e.preventDefault();
    await onUpdateCell({
      rowKey: activeRowKey,
      coyKey: activeCoyKey,
      offr: Number(offrVal) || 0,
      jco: Number(jcoVal) || 0,
      or: Number(orVal) || 0
    });
    setCellModalOpen(false);
  };

  const handleSaveNewRow = async (e) => {
    e.preventDefault();
    if (!newRowLabel.trim()) return;
    await onAddRow(newRowLabel.trim().toUpperCase());
    setNewRowLabel('');
    setRowModalOpen(false);
  };

  const handleExportCsv = () => {
    const lines = [];
    lines.push('19 GARHWAL RIFLES (19 GARH RIF) — PARADE STATE RETURN SHEET');
    lines.push(
      [
        'PARTICULARS',
        'A COY OFFR', 'A COY JCO', 'A COY OR',
        'B COY OFFR', 'B COY JCO', 'B COY OR',
        'C COY OFFR', 'C COY JCO', 'C COY OR',
        'D COY OFFR', 'D COY JCO', 'D COY OR',
        'SP COY OFFR', 'SP COY JCO', 'SP COY OR',
        'HQ COY OFFR', 'HQ COY JCO', 'HQ COY OR',
        'TOTAL OFFR', 'TOTAL JCO', 'TOTAL OR', 'GRAND TOTAL'
      ].join(',')
    );

    paradeSheet.forEach((r) => {
      let tO = 0,
        tJ = 0,
        tR = 0;
      const cols = [`"${r.label}"`];
      COY_KEYS.forEach((c) => {
        const cell = (r.coys && r.coys[c]) || { offr: 0, jco: 0, or: 0 };
        tO += cell.offr;
        tJ += cell.jco;
        tR += cell.or;
        cols.push(cell.offr || '', cell.jco || '', cell.or || '');
      });
      cols.push(tO, tJ, tR, tO + tJ + tR);
      lines.push(cols.join(','));
    });

    const absCols = ['"ABSENT"'];
    COY_KEYS.forEach((c) =>
      absCols.push(coyStats[c]?.absent.offr || 0, coyStats[c]?.absent.jco || 0, coyStats[c]?.absent.or || 0)
    );
    absCols.push(grand.absent.offr, grand.absent.jco, grand.absent.or, grand.absent.total);
    lines.push(absCols.join(','));

    const presCols = ['"PRESENT"'];
    COY_KEYS.forEach((c) =>
      presCols.push(coyStats[c]?.present.offr || 0, coyStats[c]?.present.jco || 0, coyStats[c]?.present.or || 0)
    );
    presCols.push(grand.present.offr, grand.present.jco, grand.present.or, grand.present.total);
    lines.push(presCols.join(','));

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '19-garhwal-rifles-parade-state.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Exported 19 Garhwal Rifles Parade State Sheet to CSV');
  };

  const fmtCell = (val, showZero) => {
    const n = Number(val) || 0;
    if (n === 0 && !showZero) return '';
    return String(n);
  };

  return (
    <section className="view-section active">
      <div className="page-header">
        <div>
          <h2 className="page-title">The Garhwal Rifles &mdash; Parade State Return Sheet</h2>
          <p className="page-subtitle">
            Complete Company-wise Parade State (A COY, B COY, C COY, D COY, SP COY, HQ COY &amp; TOTAL STR).{' '}
            {canEdit
              ? 'Click any cell to edit values; totals and percentages recalculate automatically.'
              : `Read-Only Company Clerk View (${COY_LABELS[user.assignedCoy]} highlighted). Approved leaves sync into the LVE row automatically.`}
          </p>
        </div>
        <div className="page-header-actions">
          {canEdit && (
            <button type="button" onClick={() => setRowModalOpen(true)} className="btn-secondary">
              <span>+ Add Deployment / Detail Row</span>
            </button>
          )}
          <button type="button" onClick={handleExportCsv} className="btn-secondary">
            <span>&#8681; Export Excel / CSV</span>
          </button>
          <button type="button" onClick={() => window.print()} className="btn-secondary">
            <span>&#128438; Print Sheet</span>
          </button>
          {isAdjutant && !paradeSignInfo?.signed && (
            <button type="button" onClick={onSignParadeState} className="btn-primary">
              <span>&#9998; Countersign Return as Adjutant / CO</span>
            </button>
          )}
        </div>
      </div>

      {/* Adjutant Digital Signature Verification Strip */}
      <div className="parade-sign-strip">
        <div>
          <strong>COMMAND AUTHORIZATION STATUS:</strong>{' '}
          {paradeSignInfo?.signed ? (
            <span style={{ color: 'var(--status-present)', fontWeight: 700 }}>
              &#10003; Digitally Countersigned by {paradeSignInfo.signedBy} on {paradeSignInfo.signedAt}
            </span>
          ) : (
            <span style={{ color: '#8f5b0d', fontWeight: 700 }}>
              &#9203; Compiled by SA / IT Cell &mdash; Awaiting Adjutant / CO Daily Countersignature
            </span>
          )}
        </div>
        <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
          UNIT: 19TH BATTALION, THE GARHWAL RIFLES (19 GARH RIF)
        </span>
      </div>

      {/* 6 Company Summary Cards above the Sheet */}
      <div className="coy-cards-grid">
        {COY_KEYS.map((c) => {
          const st = coyStats[c];
          if (!st) return null;
          const lveTotal = st.lve.offr + st.lve.jco + st.lve.or;
          const outTotal = st.outEmp.offr + st.outEmp.jco + st.outEmp.or;
          const isClerkCoy = isClerk && user.assignedCoy === c;

          return (
            <div
              key={c}
              className="coy-mini-card"
              style={
                isClerkCoy
                  ? { borderColor: 'var(--gold-primary)', boxShadow: '0 0 0 2px var(--gold-primary)' }
                  : undefined
              }
            >
              <div className="coy-mini-title">
                <span>
                  {COY_LABELS[c]} {isClerkCoy ? '(Your Coy)' : ''}
                </span>
                <span className="status-badge on-track">{st.presentPct}% Pres</span>
              </div>
              <div className="coy-mini-stats">
                <div>
                  Posted: <strong>{st.coyPostedTotal}</strong>
                </div>
                <div>
                  Present: <strong>{st.coyPresentTotal}</strong>
                </div>
                <div>
                  Leave: <strong>{lveTotal}</strong>
                </div>
                <div>
                  Out Emp: <strong>{outTotal}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EXACT PARADE STATE SHEET TABLE */}
      <div className="parade-sheet-wrapper">
        <table className="parade-sheet-table">
          <thead>
            <tr className="sheet-title-row">
              <th colSpan="23">19 GARHWAL RIFLES &mdash; PARADE STATE AS ON 20 NOV 26</th>
            </tr>
            <tr className="sheet-coy-row">
              <th rowSpan="2" className="sheet-label-cell">
                PARTICULARS / DETAIL
              </th>
              {COY_KEYS.map((c) => (
                <th
                  key={c}
                  colSpan="3"
                  className="coy-start"
                  style={isClerk && user.assignedCoy === c ? { backgroundColor: '#faecd4' } : undefined}
                >
                  {COY_LABELS[c]} (19 GR)
                </th>
              ))}
              <th colSpan="4" className="coy-start total-str-col">
                TOTAL STR
              </th>
            </tr>
            <tr className="sheet-rank-row">
              {COY_KEYS.map((c) => (
                <React.Fragment key={c}>
                  <th className="coy-start">OFFR</th>
                  <th>JCO</th>
                  <th>OR</th>
                </React.Fragment>
              ))}
              <th className="coy-start total-str-col">OFFR</th>
              <th className="total-str-col">JCO</th>
              <th className="total-str-col">OR</th>
              <th className="grand-total-col">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {paradeSheet.map((row) => {
              const isPosted = row.key === 'POSTED';
              const isLve = row.key === 'LVE';
              const rowCls = isPosted ? 'row-posted' : isLve ? 'row-lve' : '';

              let rowTotOffr = 0;
              let rowTotJco = 0;
              let rowTotOr = 0;

              return (
                <tr key={row.key} className={rowCls}>
                  <td className="sheet-label-cell">{row.label}</td>
                  {COY_KEYS.map((c) => {
                    const cell = (row.coys && row.coys[c]) || { offr: 0, jco: 0, or: 0 };
                    const o = Number(cell.offr) || 0;
                    const j = Number(cell.jco) || 0;
                    const r = Number(cell.or) || 0;
                    rowTotOffr += o;
                    rowTotJco += j;
                    rowTotOr += r;
                    const showZero = isPosted;

                    return (
                      <React.Fragment key={c}>
                        <td
                          className={`coy-start editable-cell ${o ? 'has-val' : ''}`}
                          onClick={() => handleCellClick(row, c)}
                          title={canEdit ? `Click to edit ${row.label} (${COY_LABELS[c]})` : 'Read-only'}
                        >
                          {fmtCell(o, showZero)}
                        </td>
                        <td
                          className={`editable-cell ${j ? 'has-val' : ''}`}
                          onClick={() => handleCellClick(row, c)}
                          title={canEdit ? `Click to edit ${row.label} (${COY_LABELS[c]})` : 'Read-only'}
                        >
                          {fmtCell(j, showZero)}
                        </td>
                        <td
                          className={`editable-cell ${r ? 'has-val' : ''}`}
                          onClick={() => handleCellClick(row, c)}
                          title={canEdit ? `Click to edit ${row.label} (${COY_LABELS[c]})` : 'Read-only'}
                        >
                          {fmtCell(r, showZero)}
                        </td>
                      </React.Fragment>
                    );
                  })}
                  <td className="coy-start total-str-col">{rowTotOffr}</td>
                  <td className="total-str-col">{rowTotJco}</td>
                  <td className="total-str-col">{rowTotOr}</td>
                  <td className="grand-total-col">{rowTotOffr + rowTotJco + rowTotOr}</td>
                </tr>
              );
            })}

            {/* 6 Summary Rows */}
            <tr className="row-summary-absent">
              <td className="sheet-label-cell">ABSENT</td>
              {COY_KEYS.map((c) => (
                <React.Fragment key={c}>
                  <td className="coy-start">{coyStats[c]?.absent.offr ?? 0}</td>
                  <td>{coyStats[c]?.absent.jco ?? 0}</td>
                  <td>{coyStats[c]?.absent.or ?? 0}</td>
                </React.Fragment>
              ))}
              <td className="coy-start total-str-col">{grand.absent.offr}</td>
              <td className="total-str-col">{grand.absent.jco}</td>
              <td className="total-str-col">{grand.absent.or}</td>
              <td className="grand-total-col">{grand.absent.total}</td>
            </tr>

            <tr className="row-summary-present">
              <td className="sheet-label-cell">PRESENT</td>
              {COY_KEYS.map((c) => {
                const p = coyStats[c]?.present || { offr: 0, jco: 0, or: 0 };
                const offrDisp = c === 'D' && p.offr === 0 ? '' : p.offr;
                return (
                  <React.Fragment key={c}>
                    <td className="coy-start">{offrDisp}</td>
                    <td>{p.jco}</td>
                    <td>{p.or}</td>
                  </React.Fragment>
                );
              })}
              <td className="coy-start total-str-col">{grand.present.offr}</td>
              <td className="total-str-col">{grand.present.jco}</td>
              <td className="total-str-col">{grand.present.or}</td>
              <td className="grand-total-col">{grand.present.total}</td>
            </tr>

            <tr className="row-summary-outemp">
              <td className="sheet-label-cell">OUT EMP</td>
              {COY_KEYS.map((c) => (
                <React.Fragment key={c}>
                  <td className="coy-start">{coyStats[c]?.outEmp.offr ?? 0}</td>
                  <td>{coyStats[c]?.outEmp.jco ?? 0}</td>
                  <td>{coyStats[c]?.outEmp.or ?? 0}</td>
                </React.Fragment>
              ))}
              <td className="coy-start total-str-col">{grand.outEmp.offr}</td>
              <td className="total-str-col">{grand.outEmp.jco}</td>
              <td className="total-str-col">{grand.outEmp.or}</td>
              <td className="grand-total-col">{grand.outEmp.total}</td>
            </tr>

            <tr className="row-summary-total">
              <td className="sheet-label-cell">TOTAL</td>
              {COY_KEYS.map((c) => (
                <td key={c} colSpan="3" className="coy-start">
                  {coyStats[c]?.coyPresentTotal ?? 0}
                </td>
              ))}
              <td colSpan="3" className="coy-start total-str-col">
                {grand.present.total}
              </td>
              <td className="grand-total-col">{grand.outEmp.total}</td>
            </tr>

            <tr className="row-summary-pct">
              <td className="sheet-label-cell">PRESENT %</td>
              {COY_KEYS.map((c) => (
                <td key={c} colSpan="3" className="coy-start">
                  {coyStats[c]?.presentPct ?? 0}
                </td>
              ))}
              <td colSpan="3" className="coy-start total-str-col">
                {grand.presentPct}
              </td>
              <td className="grand-total-col"></td>
            </tr>

            <tr className="row-summary-pct">
              <td className="sheet-label-cell">LVE PERCENT %</td>
              {COY_KEYS.map((c) => (
                <td key={c} colSpan="3" className="coy-start">
                  {coyStats[c]?.lvePctStr ?? '0'}
                </td>
              ))}
              <td colSpan="3" className="coy-start total-str-col">
                {grand.lvePctStr}
              </td>
              <td className="grand-total-col"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="table-footer-note">
        <span>
          Note: When the Adjutant / CO approves a soldier&rsquo;s leave in the Leave &amp; Duty Register, the corresponding Company&rsquo;s LVE row in this sheet increments automatically.
        </span>
        {canEdit && (
          <button type="button" onClick={onResetSheet} className="row-action-btn">
            &#8635; Reset Sheet to Baseline Figures
          </button>
        )}
      </div>

      {/* Cell Edit Modal */}
      {cellModalOpen && (
        <div className="modal-backdrop open" onClick={() => setCellModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Update 19 GARH RIF Parade Sheet Entry</h3>
              <button type="button" className="modal-close-btn" onClick={() => setCellModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveCell}>
              <div className="modal-body">
                <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border-warm)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>
                    {activeRowLabel} &mdash; {COY_LABELS[activeCoyKey]} (19 Garhwal Rifles)
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Enter OFFR, JCO, and OR counts for this company and detail row.
                  </div>
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">OFFR</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={offrVal}
                      onChange={(e) => setOffrVal(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">JCO</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={jcoVal}
                      onChange={(e) => setJcoVal(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">OR</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={orVal}
                      onChange={(e) => setOrVal(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setCellModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Deployment Row Modal */}
      {rowModalOpen && (
        <div className="modal-backdrop open" onClick={() => setRowModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Duty / Deployment Row</h3>
              <button type="button" className="modal-close-btn" onClick={() => setRowModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveNewRow}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Detail / Deployment Name (Uppercase)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. WINTER PATROL DETACHMENT"
                    value={newRowLabel}
                    onChange={(e) => setNewRowLabel(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setRowModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Row to Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
