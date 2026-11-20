import React, { useState, useEffect } from 'react';
import { COY_LABELS, formatPrettyDate } from '../utils/paradeCalc';

const QUICK_REASONS = [
  'Sister marriage ceremony at ancestral village & urgent domestic family responsibility.',
  'Parents medical checkup & treatment at Military Hospital Dehradun.',
  'Urgent house repair and agricultural land registration work in Garhwal.',
  'Annual family visit & child school admission documentation.'
];

export default function LeaveDutyView({
  user,
  companies,
  leaves,
  aiInsights,
  externalModalOpen,
  setExternalModalOpen,
  preselectedCompanyId,
  onApplyLeave,
  onAdjutantDecision,
  onMarkReturned,
  onDeleteLeave
}) {
  const isAdjutant = user.role === 'ADJUTANT_CO';
  const isClerk = user.role === 'COMPANY_CLERK';

  const [subTab, setSubTab] = useState('register'); // 'register' | 'calendar'
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Calendar Month State (Default Nov 2026)
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(10); // 0-indexed: 10 = November, 11 = December

  // Apply Leave Modal State
  const [applyOpen, setApplyOpen] = useState(false);
  const [rankName, setRankName] = useState('');
  const [serviceNo, setServiceNo] = useState('');
  const [rankCategory, setRankCategory] = useState('OR');
  const [companyId, setCompanyId] = useState('');
  const [category, setCategory] = useState('Leave');
  const [leaveType, setLeaveType] = useState('Annual Leave (AL)');
  const [destination, setDestination] = useState('Chamoli, Uttarakhand');
  const [fromDate, setFromDate] = useState('2026-11-21');
  const [toDate, setToDate] = useState('2026-12-02');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  // Adjutant Decision Modal (with optional remarks)
  const [decisionTarget, setDecisionTarget] = useState(null);
  const [decisionType, setDecisionType] = useState('APPROVED');
  const [adjutantRemarks, setAdjutantRemarks] = useState('');

  // Official Leave Pass / Certificate Modal
  const [passTarget, setPassTarget] = useState(null);

  const availableCompanies = isClerk
    ? companies.filter((c) => c.coyKey === user.assignedCoy)
    : companies;

  useEffect(() => {
    if (availableCompanies.length > 0 && !companyId) {
      setCompanyId(availableCompanies[0].id);
    }
  }, [availableCompanies, companyId]);

  useEffect(() => {
    if (externalModalOpen) {
      handleOpenApplyModal();
      setExternalModalOpen(false);
    }
  }, [externalModalOpen]);

  const handleOpenApplyModal = () => {
    setRankName('');
    setServiceNo('GR-4');
    setRankCategory('OR');
    if (preselectedCompanyId && availableCompanies.some((c) => c.id === preselectedCompanyId)) {
      setCompanyId(preselectedCompanyId);
    } else if (availableCompanies.length > 0) {
      setCompanyId(availableCompanies[0].id);
    }
    setCategory('Leave');
    setLeaveType('Annual Leave (AL)');
    setDestination('Chamoli, Uttarakhand');
    setFromDate('2026-11-21');
    setToDate('2026-11-30');
    setReason('');
    setFormError('');
    setApplyOpen(true);
  };

  // Compute inclusive days and intermediate calendar dates for the modal preview
  const computeRangeDays = (startStr, endStr) => {
    const s = new Date(startStr + 'T00:00:00');
    const e = new Date(endStr + 'T00:00:00');
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return [];
    const list = [];
    const cur = new Date(s);
    while (cur <= e && list.length < 45) {
      list.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return list;
  };

  const previewDateList = computeRangeDays(fromDate, toDate);
  const previewDaysCount = previewDateList.length;

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!rankName.trim() || !serviceNo.trim()) {
      setFormError('Please enter Soldier Rank & Name and Service Number.');
      return;
    }
    if (!fromDate || !toDate || previewDaysCount <= 0) {
      setFormError('Please select valid Leave From and Leave Till dates on the calendar.');
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setFormError('Reason for Leave is mandatory! Please enter the detailed reason before applying.');
      return;
    }

    try {
      await onApplyLeave({
        rankName: rankName.trim(),
        serviceNo: serviceNo.trim(),
        rankCategory,
        companyId,
        category,
        leaveType,
        destination: destination.trim(),
        fromDate,
        toDate,
        reason: reason.trim(),
        requestedBy: isClerk
          ? `Company Clerk (${COY_LABELS[user.assignedCoy]} · 19 GARH RIF)`
          : user.displayName
      });
      setApplyOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to submit leave request.');
    }
  };

  const openDecisionModal = (leaveItem, type) => {
    setDecisionTarget(leaveItem);
    setDecisionType(type);
    setAdjutantRemarks(
      type === 'APPROVED'
        ? 'Sanctioned by Adjutant / CO 19 Garhwal Rifles. Leave pass & railway warrant authorized.'
        : 'Not approved due to operational company deployment / leave quota limit.'
    );
  };

  const handleConfirmDecision = async (e) => {
    e.preventDefault();
    if (!decisionTarget) return;
    await onAdjutantDecision(decisionTarget, decisionType, adjutantRemarks);
    setDecisionTarget(null);
  };

  // Scope leaves for Company Clerk
  const baseLeaves = isClerk
    ? leaves.filter((l) => l.coyKey === user.assignedCoy)
    : leaves;

  const filtered = baseLeaves.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchQuery =
      !q ||
      m.rankName.toLowerCase().includes(q) ||
      m.serviceNo.toLowerCase().includes(q) ||
      (m.companyName || '').toLowerCase().includes(q) ||
      (m.reason || '').toLowerCase().includes(q) ||
      (m.destination || '').toLowerCase().includes(q);
    if (!matchQuery) return false;
    if (catFilter !== 'all' && m.category !== catFilter) return false;
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = baseLeaves.filter((l) => l.status === 'PENDING_ADJUTANT').length;
  const approvedCount = baseLeaves.filter((l) => l.status === 'APPROVED').length;
  const advisories = (aiInsights && aiInsights.leaveAdvisories) || {};

  // Build Calendar Grid for Selected Month (calYear, calMonth)
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); // 0=Sun..6=Sat
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push({ empty: true, key: `empty-${i}` });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const matchingLeaves = baseLeaves.filter((l) => {
      if (l.status === 'REJECTED') return false;
      return l.fromDate <= iso && l.toDate >= iso;
    });
    calendarCells.push({
      empty: false,
      day,
      iso,
      leaves: matchingLeaves
    });
  }

  return (
    <section className="view-section active">
      <div className="page-header">
        <div>
          <h2 className="page-title">The Garhwal Rifles &mdash; Leave &amp; Duty Register</h2>
          <p className="page-subtitle">
            Mandatory reason &amp; calendar dates (From &rarr; Till) required. Every leave application sends a notification to the <strong>Adjutant / CO</strong> and is approved only after Adjutant acceptance.
          </p>
        </div>
        <div className="page-header-actions">
          <div
            className="ph-segmented-pill-bar compact"
            style={{
              '--seg-count': 2,
              '--active-idx': subTab === 'register' ? 0 : 1
            }}
          >
            <div className="ph-segmented-pill-thumb" aria-hidden="true" />
            <button
              type="button"
              className={`ph-segmented-pill-btn ${subTab === 'register' ? 'active' : ''}`}
              onClick={() => setSubTab('register')}
            >
              <span className="ph-seg-idx">01</span>
              <span>Register Queue ({baseLeaves.length})</span>
            </button>
            <button
              type="button"
              className={`ph-segmented-pill-btn ${subTab === 'calendar' ? 'active' : ''}`}
              onClick={() => setSubTab('calendar')}
            >
              <span className="ph-seg-idx">02</span>
              <span>Visual Leave Calendar</span>
            </button>
          </div>

          <button type="button" onClick={handleOpenApplyModal} className="btn-primary ph-pill-btn">
            <span>+ Apply for Leave / Duty</span>
            <span className="ph-cta-arrow">&rarr;</span>
          </button>
        </div>
      </div>

      {/* Workflow Explanation & Status Summary Strip */}
      <div className="leave-workflow-strip">
        <div className="leave-wf-item">
          <span className="wf-badge gold">1. APPLY WITH REASON &amp; CALENDAR</span>
          <span>Clerk enters soldier details, mandatory reason, From date &amp; Till date.</span>
        </div>
        <span className="hierarchy-arrow">&rarr;</span>
        <div className="leave-wf-item">
          <span className="wf-badge attention">
            2. ADJUTANT NOTIFICATION ({pendingCount} PENDING)
          </span>
          <span>Instant alert sent to Adjutant / CO. Parade count is held until accepted.</span>
        </div>
        <span className="hierarchy-arrow">&rarr;</span>
        <div className="leave-wf-item">
          <span className="wf-badge green">
            3. APPROVED &amp; PARADE SYNCED ({approvedCount} ACTIVE)
          </span>
          <span>Once Adjutant accepts, leave is approved &amp; synced with 19 GARH RIF Parade Sheet.</span>
        </div>
      </div>

      {subTab === 'register' ? (
        <>
          {/* Filter & Search Toolbar */}
          <div className="directory-toolbar">
            <div className="toolbar-left">
              <div className="search-box">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search army no, rank, name, company, or reason..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Approval Statuses</option>
                <option value="PENDING_ADJUTANT">&#9203; Pending Adjutant Approval ({pendingCount})</option>
                <option value="APPROVED">&#10003; Approved by Adjutant ({approvedCount})</option>
                <option value="REJECTED">&#10005; Rejected by Adjutant</option>
                <option value="RETURNED">&#8617; Returned to Unit</option>
              </select>

              <select
                className="filter-select"
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Leave">Leave (AL / CL / Sick)</option>
                <option value="Duty / other">Duty / QRF / Course / TD</option>
              </select>
            </div>
            <div className="toolbar-right">
              <span>{filtered.length} records</span>
            </div>
          </div>

          {/* Leave & Duty Table */}
          <div className="table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PERSONNEL</th>
                    <th>COMPANY (19 GARH RIF)</th>
                    <th>LEAVE TYPE &amp; REASON</th>
                    <th>CALENDAR DATES (FROM &rarr; TILL)</th>
                    <th>APPROVAL STATUS</th>
                    <th style={{ textAlign: 'right' }}>COMMAND / CLERK ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No matching leave or duty records found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m) => {
                      const isPending = m.status === 'PENDING_ADJUTANT';
                      const isApproved = m.status === 'APPROVED';
                      const isRejected = m.status === 'REJECTED';
                      const isReturned = m.status === 'RETURNED';
                      const adv = advisories[m.id];

                      let badgeCls = 'attention';
                      let statusLabel = 'Pending Adjutant Approval';
                      if (isApproved) {
                        badgeCls = 'on-track';
                        statusLabel = 'Approved by Adjutant';
                      } else if (isRejected) {
                        badgeCls = 'critical';
                        statusLabel = 'Rejected by Adjutant';
                      } else if (isReturned) {
                        badgeCls = 'on-track';
                        statusLabel = 'Returned to Unit';
                      }

                      return (
                        <tr key={m.id} className={isPending ? 'row-pending-highlight' : ''}>
                          <td>
                            <div className="cell-unit-primary">{m.rankName}</div>
                            <div className="cell-unit-sub">
                              {m.serviceNo} &middot; <span className="coy-code-chip">{m.rankCategory || 'OR'}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{m.companyName}</div>
                            <div className="cell-unit-sub">Filed by: {m.requestedBy || 'Company Clerk'}</div>
                          </td>
                          <td style={{ maxWidth: '340px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                              {m.leaveType || m.category} &mdash; <span style={{ color: 'var(--gold-dark)' }}>{m.destination}</span>
                            </div>
                            <div style={{ fontSize: '13.5px', color: 'var(--text-body)', marginTop: '3px' }}>
                              <strong>Reason:</strong> &ldquo;{m.reason}&rdquo;
                            </div>
                            {adv && isPending && (
                              <div style={{ marginTop: '5px', fontSize: '12px', color: 'var(--status-present)', fontWeight: 700 }}>
                                &#10024; {adv.badge}: {adv.note}
                              </div>
                            )}
                            {m.adjutantRemarks && !isPending && (
                              <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                <strong>Adjutant Order:</strong> {m.adjutantRemarks}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="calendar-range-badge">
                              <div>
                                <span className="cal-lbl">FROM:</span> <strong>{formatPrettyDate(m.fromDate)}</strong>
                              </div>
                              <div>
                                <span className="cal-lbl">TILL:</span> <strong>{formatPrettyDate(m.toDate)}</strong>
                              </div>
                              <div className="cal-days-tag">&#128197; {m.days} Days Total</div>
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${badgeCls}`}>
                              {isPending && '⏳ '}
                              {isApproved && '✓ '}
                              {isRejected && '✕ '}
                              {statusLabel}
                            </span>
                            {m.approvedBy && (
                              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                By {m.approvedBy}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="row-actions">
                              {/* ADJUTANT / CO EXCLUSIVE APPROVAL BUTTONS */}
                              {isPending && isAdjutant && (
                                <>
                                  <button
                                    type="button"
                                    className="btn-approve-sm"
                                    onClick={() => openDecisionModal(m, 'APPROVED')}
                                  >
                                    &#10003; Accept &amp; Approve
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-reject-sm"
                                    onClick={() => openDecisionModal(m, 'REJECTED')}
                                  >
                                    &#10005; Reject
                                  </button>
                                </>
                              )}

                              {/* NON-ADJUTANT SEES WAITING NOTICE */}
                              {isPending && !isAdjutant && (
                                <span className="awaiting-adjutant-pill">
                                  &#128276; Sent to Adjutant / CO
                                </span>
                              )}

                              {/* ONCE APPROVED: VIEW LEAVE PASS & MARK RETURNED */}
                              {isApproved && (
                                <>
                                  <button
                                    type="button"
                                    className="row-action-btn"
                                    onClick={() => setPassTarget(m)}
                                  >
                                    &#128220; Leave Pass
                                  </button>
                                  <button
                                    type="button"
                                    className="row-action-btn"
                                    onClick={() => onMarkReturned(m.id)}
                                  >
                                    &#8617; Mark Returned
                                  </button>
                                </>
                              )}

                              {(isAdjutant || (isClerk && isPending)) && (
                                <button
                                  type="button"
                                  className="row-action-btn delete"
                                  onClick={() => onDeleteLeave(m.id)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ==================================================================
           INTERACTIVE VISUAL MONTHLY LEAVE CALENDAR (FROM DATE -> TILL DATE)
           ================================================================== */
        <div className="panel-card">
          <div className="panel-card-header">
            <div>
              <h2 className="panel-card-title">
                &#128197; 19 Garhwal Rifles &mdash; Visual Leave &amp; Movement Calendar ({monthNames[calMonth]} {calYear})
              </h2>
              <p className="panel-card-subtitle">
                Displays when each soldier departs on leave and till what date they remain away. Click any soldier chip to inspect or approve.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((y) => y - 1);
                  } else {
                    setCalMonth((m) => m - 1);
                  }
                }}
              >
                &larr; Prev Month
              </button>
              <strong style={{ fontSize: '16px', minWidth: '140px', textAlign: 'center' }}>
                {monthNames[calMonth]} {calYear}
              </strong>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((y) => y + 1);
                  } else {
                    setCalMonth((m) => m + 1);
                  }
                }}
              >
                Next Month &rarr;
              </button>
            </div>
          </div>

          <div className="parade-legend" style={{ marginBottom: '14px' }}>
            <span className="legend-item">
              <span className="legend-dot present"></span>Approved Leave (Active)
            </span>
            <span className="legend-item">
              <span className="legend-dot leave"></span>Pending Adjutant Approval
            </span>
            <span className="legend-item">
              <span className="legend-dot duty"></span>Returned / Completed
            </span>
          </div>

          <div className="leave-calendar-grid">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
              <div key={d} className="cal-weekday-header">
                {d}
              </div>
            ))}

            {calendarCells.map((cell) =>
              cell.empty ? (
                <div key={cell.key} className="cal-day-cell empty" />
              ) : (
                <div
                  key={cell.iso}
                  className={`cal-day-cell ${cell.iso === '2026-11-20' ? 'today' : ''}`}
                >
                  <div className="cal-day-number">
                    <span>{cell.day}</span>
                    {cell.iso === '2026-11-20' && <span className="today-tag">TODAY</span>}
                  </div>
                  <div className="cal-day-events">
                    {cell.leaves.map((l) => {
                      const isStart = l.fromDate === cell.iso;
                      const isEnd = l.toDate === cell.iso;
                      const cls =
                        l.status === 'PENDING_ADJUTANT'
                          ? 'pending'
                          : l.status === 'APPROVED'
                          ? 'approved'
                          : 'returned';
                      return (
                        <div
                          key={l.id}
                          className={`cal-event-chip ${cls}`}
                          title={`${l.rankName} (${COY_LABELS[l.coyKey]}): ${l.fromDate} to ${l.toDate} — Reason: ${l.reason}`}
                          onClick={() => {
                            if (l.status === 'PENDING_ADJUTANT' && isAdjutant) {
                              openDecisionModal(l, 'APPROVED');
                            } else {
                              setPassTarget(l);
                            }
                          }}
                        >
                          {isStart && '▶ '}
                          {l.rankName.split(' ').slice(0, 2).join(' ')} ({COY_LABELS[l.coyKey]})
                          {isEnd && ' ◀'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 1: APPLY FOR LEAVE / DUTY (MANDATORY REASON + CALENDAR PICKERS)
          ==================================================================== */}
      {applyOpen && (
        <div className="modal-backdrop open" onClick={() => setApplyOpen(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">&#128197; Apply Soldier Leave / Duty (19 Garhwal Rifles)</h3>
              <button type="button" className="modal-close-btn" onClick={() => setApplyOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitLeave}>
              <div className="modal-body">
                <div className="signal-flash-box">
                  <strong>&#128276; Approval Protocol:</strong> Submitting this form dispatches an immediate notification to the <strong>Adjutant / CO (19 Garhwal Rifles)</strong>. The soldier&rsquo;s leave will only be approved and deducted from Company Present strength after the Adjutant accepts it.
                </div>

                {formError && <div className="auth-error visible">{formError}</div>}

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Rank &amp; Soldier Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Rfn. Ankit Singh Negi"
                      value={rankName}
                      onChange={(e) => setRankName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Service Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. GR-435812"
                      value={serviceNo}
                      onChange={(e) => setServiceNo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rank Category (Parade Sheet)</label>
                    <select
                      className="form-input"
                      value={rankCategory}
                      onChange={(e) => setRankCategory(e.target.value)}
                    >
                      <option value="OR">OR (Other Ranks / Rifleman / Hav)</option>
                      <option value="JCO">JCO (Nb Sub / Sub / Sub Maj)</option>
                      <option value="OFFR">OFFR (Commissioned Officer)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Company (19 Garhwal Rifles) *</label>
                    <select
                      className="form-input"
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                      required
                    >
                      {availableCompanies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Movement Category &amp; Type *</label>
                    <select
                      className="form-input"
                      value={leaveType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLeaveType(val);
                        setCategory(val.includes('Leave') ? 'Leave' : 'Duty / other');
                      }}
                    >
                      <option value="Annual Leave (AL)">Annual Leave (AL)</option>
                      <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Temporary Duty (TD)">Temporary Duty (TD)</option>
                      <option value="Course / Detachment">Course / Detachment</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Leave Station / Destination *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Chamoli, Uttarakhand"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* CALENDAR PICKERS: WHEN TO LEAVE & TILL THAT DATE */}
                <div className="calendar-picker-box">
                  <div className="calendar-picker-header">
                    <span>&#128197; SELECT LEAVE CALENDAR DATES (WHEN TO LEAVE &amp; TILL WHEN)</span>
                    <span className="status-badge on-track">
                      {previewDaysCount > 0 ? `${previewDaysCount} Days Inclusive` : 'Invalid Date Range'}
                    </span>
                  </div>

                  <div className="form-row-2" style={{ marginTop: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">When to Leave (From Date) *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Leave Till (Return Date) *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={toDate}
                        min={fromDate}
                        onChange={(e) => setToDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Visual Day-by-Day Calendar Strip Preview */}
                  {previewDateList.length > 0 && (
                    <div className="mini-calendar-strip">
                      <div className="mini-cal-title">
                        Visual Calendar Timeline ({formatPrettyDate(fromDate)} &rarr; {formatPrettyDate(toDate)}):
                      </div>
                      <div className="mini-cal-days-row">
                        {previewDateList.map((dStr, idx) => {
                          const dayNum = dStr.slice(8, 10);
                          const monNum = dStr.slice(5, 7);
                          const isFirst = idx === 0;
                          const isLast = idx === previewDateList.length - 1;
                          return (
                            <div
                              key={dStr}
                              className={`mini-cal-day ${isFirst ? 'start' : ''} ${isLast ? 'end' : ''}`}
                              title={formatPrettyDate(dStr)}
                            >
                              <span className="m-day">{dayNum}/{monNum}</span>
                              <span className="m-tag">{isFirst ? 'DEP' : isLast ? 'RET' : `D${idx + 1}`}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* MANDATORY REASON FOR LEAVE */}
                <div className="form-group">
                  <label className="form-label">
                    Detailed Reason for Leave (Mandatory for Adjutant / CO Verification) *
                  </label>
                  <textarea
                    rows="3"
                    className="form-input"
                    placeholder="Enter complete reason for leave (e.g., Sister marriage ceremony at Chamoli, medical treatment, urgent domestic work)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                  <div className="quick-reason-pills">
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Quick Reason Templates:
                    </span>
                    {QUICK_REASONS.map((qr, i) => (
                      <button
                        key={i}
                        type="button"
                        className="helper-chip"
                        onClick={() => setReason(qr)}
                      >
                        + {qr.slice(0, 34)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setApplyOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  &#128276; Submit Application &amp; Notify Adjutant / CO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: ADJUTANT / CO LEAVE APPROVAL / REJECTION CONFIRMATION
          ==================================================================== */}
      {decisionTarget && (
        <div className="modal-backdrop open" onClick={() => setDecisionTarget(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {decisionType === 'APPROVED'
                  ? '✓ Adjutant Command Approval — Sanction Leave'
                  : '✕ Adjutant Command Decision — Reject Leave'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setDecisionTarget(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleConfirmDecision}>
              <div className="modal-body">
                <div style={{ padding: '12px', background: 'var(--bg-cream-soft)', borderRadius: '6px', border: '1px solid var(--border-warm-strong)' }}>
                  <div style={{ fontSize: '17px', fontWeight: 700 }}>
                    {decisionTarget.rankName} ({decisionTarget.serviceNo})
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {decisionTarget.companyName} &middot; {decisionTarget.leaveType}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '14px' }}>
                    <strong>Calendar Period:</strong> {formatPrettyDate(decisionTarget.fromDate)} &rarr;{' '}
                    {formatPrettyDate(decisionTarget.toDate)} (<strong>{decisionTarget.days} Days</strong>)
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '14px' }}>
                    <strong>Submitted Reason:</strong> &ldquo;{decisionTarget.reason}&rdquo;
                  </div>
                </div>

                {decisionType === 'APPROVED' && (
                  <div className="signal-flash-box">
                    <strong>Automatic Parade State Sync:</strong> Approving this leave will immediately deduct <strong>1 {decisionTarget.rankCategory}</strong> from Present strength of <strong>{decisionTarget.companyName}</strong>, increment the <strong>LVE</strong> row in the 19 Garhwal Rifles Parade Sheet, and notify the Company Clerk.
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Adjutant / CO Order Remarks</label>
                  <textarea
                    rows="2"
                    className="form-input"
                    value={adjutantRemarks}
                    onChange={(e) => setAdjutantRemarks(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setDecisionTarget(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={decisionType === 'APPROVED' ? 'btn-approve' : 'btn-reject'}
                >
                  {decisionType === 'APPROVED'
                    ? '✓ Confirm Adjutant Acceptance & Approve Leave'
                    : '✕ Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: OFFICIAL 19 GARHWAL RIFLES LEAVE PASS / CERTIFICATE
          ==================================================================== */}
      {passTarget && (
        <div className="modal-backdrop open" onClick={() => setPassTarget(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">&#128220; 19 Garhwal Rifles &mdash; Official Leave Certificate</h3>
              <button type="button" className="modal-close-btn" onClick={() => setPassTarget(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="leave-pass-certificate">
                <div className="pass-header">
                  <div className="gr-emblem sm">19 GR</div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.1em' }}>
                      19TH BATTALION, THE GARHWAL RIFLES (19 GARH RIF)
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--gold-dark)', fontWeight: 700 }}>
                      MOVEMENT &amp; LEAVE SANCTION CERTIFICATE &middot; INDIAN ARMY
                    </div>
                  </div>
                </div>

                <div className="pass-grid">
                  <div>
                    <span className="pass-lbl">RANK &amp; NAME:</span>
                    <strong>{passTarget.rankName}</strong>
                  </div>
                  <div>
                    <span className="pass-lbl">SERVICE NO:</span>
                    <strong>{passTarget.serviceNo} ({passTarget.rankCategory})</strong>
                  </div>
                  <div>
                    <span className="pass-lbl">COMPANY:</span>
                    <strong>{passTarget.companyName}</strong>
                  </div>
                  <div>
                    <span className="pass-lbl">LEAVE TYPE:</span>
                    <strong>{passTarget.leaveType}</strong>
                  </div>
                  <div>
                    <span className="pass-lbl">LEAVE FROM (DEPARTURE):</span>
                    <strong>{formatPrettyDate(passTarget.fromDate)}</strong>
                  </div>
                  <div>
                    <span className="pass-lbl">LEAVE TILL (RETURN):</span>
                    <strong>{formatPrettyDate(passTarget.toDate)} ({passTarget.days} Days)</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span className="pass-lbl">DESTINATION:</span>
                    <strong>{passTarget.destination}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span className="pass-lbl">SANCTIONED REASON:</span>
                    <strong>&ldquo;{passTarget.reason}&rdquo;</strong>
                  </div>
                </div>

                <div className="pass-stamp-footer">
                  <div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>APPROVAL STATUS</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--status-present)' }}>
                      {passTarget.status === 'APPROVED'
                        ? '✓ SANCTIONED BY ADJUTANT / CO (19 GARH RIF)'
                        : passTarget.status}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {passTarget.adjutantRemarks}
                    </div>
                  </div>
                  <div className="digital-seal-box">
                    ADJUTANT / CO<br />
                    19 GARHWAL RIFLES
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setPassTarget(null)}>
                Close
              </button>
              <button type="button" className="btn-primary" onClick={() => window.print()}>
                &#128438; Print Leave Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
