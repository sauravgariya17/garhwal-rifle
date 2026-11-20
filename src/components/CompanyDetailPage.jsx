import React, { useState } from 'react';
import {
  COY_LABELS,
  formatNumber,
  formatPrettyDate,
  getReadinessPct,
  getReadinessStatus,
  computeParadeSheetSummary
} from '../utils/paradeCalc';

export default function CompanyDetailPage({
  user,
  company,
  paradeSheet,
  leaves,
  onBack,
  onOpenApplyLeaveForCompany,
  onAdjutantDecision,
  onMarkReturned,
  onUpdateCompany,
  showToast
}) {
  const isAdjutant = user.role === 'ADJUTANT_CO';
  const isClerk = user.role === 'COMPANY_CLERK';
  const canEditCoy = user.permissions?.canManageCompanies && !isClerk;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'parade' | 'leaves'
  const [editOpen, setEditOpen] = useState(false);
  const [commander, setCommander] = useState(company.commander || '');
  const [location, setLocation] = useState(company.location || '');
  const [sanctioned, setSanctioned] = useState(company.sanctioned || 120);
  const [present, setPresent] = useState(company.present || 80);
  const [leaveCount, setLeaveCount] = useState(company.leave || 15);
  const [dutyCount, setDutyCount] = useState(company.duty || 10);

  if (!company) return null;

  const coyKey = company.coyKey || 'A';
  const coyLabel = COY_LABELS[coyKey] || coyKey;
  const pct = getReadinessPct(company);
  const st = getReadinessStatus(company);
  const away = (Number(company.leave) || 0) + (Number(company.duty) || 0);
  const vacancy = Math.max(0, (Number(company.sanctioned) || 0) - (Number(company.posted) || 0));

  // Extract Parade Sheet stats for this specific Company wing
  const { coyStats } = computeParadeSheetSummary(paradeSheet);
  const sheetCoy = coyStats[coyKey] || {
    posted: { offr: 2, jco: 7, or: 100 },
    lve: { offr: 0, jco: 1, or: 20 },
    absent: { offr: 0, jco: 3, or: 50 },
    present: { offr: 2, jco: 4, or: 50 },
    outEmp: { offr: 0, jco: 2, or: 30 },
    coyPostedTotal: company.posted,
    coyPresentTotal: company.present,
    presentPct: pct,
    lvePctStr: '18.0'
  };

  // Active Parade Sheet detail rows where this company has non-zero entries (plus POSTED & LVE)
  const companyParadeRows = (paradeSheet || []).filter((r) => {
    if (r.key === 'POSTED' || r.key === 'LVE') return true;
    const cell = r.coys && r.coys[coyKey];
    if (!cell) return false;
    return (Number(cell.offr) || 0) + (Number(cell.jco) || 0) + (Number(cell.or) || 0) > 0;
  });

  // Leaves belonging to this company
  const companyLeaves = (leaves || []).filter(
    (l) => l.companyId === company.id || l.coyKey === coyKey
  );

  const platoons = company.platoons || [
    { name: 'No. 1 Rifle Platoon', cdr: 'Sub. Platoon Cdr', str: Math.round(company.posted / 3), post: 'Forward Post 1' },
    { name: 'No. 2 Rifle Platoon', cdr: 'Nb. Sub. Platoon Cdr', str: Math.round(company.posted / 3), post: 'Forward Post 2' },
    { name: 'No. 3 Rifle Platoon', cdr: 'Nb. Sub. Platoon Cdr', str: Math.round(company.posted / 3), post: 'Reserve Base' }
  ];

  const logistics = company.logistics || {
    weapons: 98,
    comms: 96,
    winterGear: 97,
    rationsDays: 45
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    await onUpdateCompany(company.id, {
      ...company,
      commander,
      location,
      sanctioned: Number(sanctioned) || 120,
      present: Number(present) || 0,
      leave: Number(leaveCount) || 0,
      duty: Number(dutyCount) || 0
    });
    setEditOpen(false);
    showToast(`Updated ${company.name}`);
  };

  return (
    <section className="view-section active animate-slide-up">
      {/* TOP BACK NAVIGATION BAR */}
      <div className="coy-detail-topbar">
        <button type="button" onClick={onBack} className="btn-back-directory">
          <span>&larr; Back to Company Directory</span>
        </button>

        <div className="coy-detail-top-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => onOpenApplyLeaveForCompany(company)}
          >
            + Apply Leave for {coyLabel} Soldier
          </button>
          {canEditCoy && (
            <button type="button" className="btn-secondary" onClick={() => setEditOpen(true)}>
              &#9998; Edit Company Record
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={() => window.print()}>
            &#128438; Print Company Dossier
          </button>
        </div>
      </div>

      {/* COMPANY HERO HEADER BANNER */}
      <div className="coy-detail-hero">
        <div className="coy-detail-hero-left">
          <div className="coy-emblem-large">{coyKey}</div>
          <div>
            <div className="coy-hero-badges">
              <span className="command-badge-gold">&#9733; {company.battalion || 'THE GARHWAL RIFLES'}</span>
              <span className="coy-code-chip">{coyLabel} WING</span>
              <span className={`status-badge ${st.cls}`}>
                {st.label} ({pct}% Readiness)
              </span>
            </div>
            <h2 className="coy-detail-title">{company.name}</h2>
            <p className="coy-detail-brief">
              {company.roleBrief ||
                'Operational Rifle Company of The Garhwal Rifles deployed for sector domination, tactical patrolling, and rapid response operations.'}
            </p>
          </div>
        </div>

        <div className="coy-detail-hero-meta">
          <div className="hero-meta-row">
            <span>COMPANY COMMANDER (OC):</span>
            <strong>{company.commander || 'Maj. OC'}</strong>
          </div>
          <div className="hero-meta-row">
            <span>SECOND-IN-COMMAND (2IC):</span>
            <strong>{company.secondInCommand || 'Capt. Coy 2IC'}</strong>
          </div>
          <div className="hero-meta-row">
            <span>SECTOR / LOCATION:</span>
            <strong>{company.location}</strong>
          </div>
          <div className="hero-meta-row">
            <span>SENIOR JCO &amp; CHM:</span>
            <strong>
              {company.companyJco || 'Sub. Coy JCO'} &middot; {company.chm || 'CHM'}
            </strong>
          </div>
        </div>
      </div>

      {/* 4 COMPANY KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Sanctioned Establishment</span>
            <span className="kpi-icon-box">&#9733;</span>
          </div>
          <div className="kpi-value">{formatNumber(company.sanctioned)}</div>
          <div className="kpi-subtext">
            Authorized strength &middot; Vacancy: <strong>{vacancy}</strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Posted Strength</span>
            <span className="kpi-icon-box">&#9638;</span>
          </div>
          <div className="kpi-value">{formatNumber(company.posted)}</div>
          <div className="kpi-subtext">
            Sheet Wing ({coyLabel}):{' '}
            <strong>
              {sheetCoy.posted.offr} OFFR &middot; {sheetCoy.posted.jco} JCO &middot; {sheetCoy.posted.or} OR
            </strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Present on Parade</span>
            <span className="kpi-icon-box">&#10003;</span>
          </div>
          <div className="kpi-value">{formatNumber(company.present)}</div>
          <div className="kpi-subtext">
            <strong>{pct}%</strong> of sanctioned establishment present
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">On Leave / Out Duty</span>
            <span className="kpi-icon-box">&#9873;</span>
          </div>
          <div className="kpi-value">{formatNumber(away)}</div>
          <div className="kpi-subtext">
            <strong>{company.leave}</strong> on Leave &middot; <strong>{company.duty}</strong> on Duty / QRF
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS INSIDE COMPANY PAGE (SLIDING SEGMENTED SWITCHER) */}
      <div
        className="ph-segmented-pill-bar"
        style={{
          '--seg-count': 3,
          '--active-idx': activeTab === 'overview' ? 0 : activeTab === 'parade' ? 1 : 2
        }}
      >
        <div className="ph-segmented-pill-thumb" aria-hidden="true" />
        <button
          type="button"
          className={`ph-segmented-pill-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="ph-seg-idx">01</span>
          <span>Platoons, Command &amp; Logistics</span>
        </button>
        <button
          type="button"
          className={`ph-segmented-pill-btn ${activeTab === 'parade' ? 'active' : ''}`}
          onClick={() => setActiveTab('parade')}
        >
          <span className="ph-seg-idx">02</span>
          <span>{coyLabel} Parade Breakdown ({companyParadeRows.length})</span>
        </button>
        <button
          type="button"
          className={`ph-segmented-pill-btn ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          <span className="ph-seg-idx">03</span>
          <span>Company Leave Roster ({companyLeaves.length})</span>
        </button>
      </div>

      {/* TAB 1: PLATOONS, COMMAND APPOINTMENTS & COMBAT LOGISTICS */}
      {activeTab === 'overview' && (
        <div className="overview-split-grid">
          {/* Left: Platoon Structure & Key Appointments */}
          <div className="panel-card">
            <div className="panel-card-header">
              <div>
                <h3 className="panel-card-title">Platoon Organization &amp; Forward Posts</h3>
                <p className="panel-card-subtitle">Tactical sub-units operating under {company.name}</p>
              </div>
            </div>

            <div className="platoon-cards-list">
              {platoons.map((pl, idx) => (
                <div key={idx} className="platoon-item-card">
                  <div className="platoon-item-top">
                    <strong>{pl.name}</strong>
                    <span className="status-badge on-track">Strength: {pl.str}</span>
                  </div>
                  <div className="platoon-item-meta">
                    <span>
                      Platoon Cdr: <strong>{pl.cdr}</strong>
                    </span>
                    <span>
                      Deployment Post: <strong>{pl.post}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-warm)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold-dark)', marginBottom: '10px' }}>
                COMPANY COMMAND &amp; NCO APPOINTMENTS
              </div>
              <div className="appointments-grid">
                <div className="appt-box">
                  <span>Company Commander (OC)</span>
                  <strong>{company.commander || 'Maj. OC'}</strong>
                </div>
                <div className="appt-box">
                  <span>Company 2IC</span>
                  <strong>{company.secondInCommand || 'Capt. 2IC'}</strong>
                </div>
                <div className="appt-box">
                  <span>Company Senior JCO</span>
                  <strong>{company.companyJco || 'Sub. Senior JCO'}</strong>
                </div>
                <div className="appt-box">
                  <span>Coy Havildar Major (CHM)</span>
                  <strong>{company.chm || 'Hav. CHM'}</strong>
                </div>
                <div className="appt-box">
                  <span>Coy QM Havildar (CQMH)</span>
                  <strong>{company.cqmh || 'Hav. CQMH'}</strong>
                </div>
                <div className="appt-box">
                  <span>Formation Heritage</span>
                  <strong>{company.established || 'The Garhwal Rifles'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Weapons, Equipment & Logistics Readiness + Quick Leave Summary */}
          <div className="panel-card">
            <div className="panel-card-header">
              <div>
                <h3 className="panel-card-title">Combat Equipment &amp; Logistics State</h3>
                <p className="panel-card-subtitle">Ordnance, arms, signals &amp; high-altitude stocking</p>
              </div>
              <span className="status-badge on-track">Combat Ready</span>
            </div>

            <div className="unit-strength-list">
              <div className="unit-strength-item">
                <div>
                  <div className="unit-strength-name">Small Arms &amp; Crew Weapons (SIG 716 / LMG / Mortar)</div>
                  <div className="unit-strength-loc">Kote Verification &amp; Daily Armoury Inspection</div>
                </div>
                <div className="unit-strength-meter">
                  <div className="unit-bar-bg">
                    <div className="unit-bar-fill" style={{ width: `${logistics.weapons}%` }}></div>
                  </div>
                  <span className="unit-bar-pct">{logistics.weapons}%</span>
                </div>
              </div>

              <div className="unit-strength-item">
                <div>
                  <div className="unit-strength-name">Tactical Radio &amp; Signal Communications</div>
                  <div className="unit-strength-loc">VHF / HF Encrypted Sets &amp; Field Telephones</div>
                </div>
                <div className="unit-strength-meter">
                  <div className="unit-bar-bg">
                    <div className="unit-bar-fill" style={{ width: `${logistics.comms}%` }}></div>
                  </div>
                  <span className="unit-bar-pct">{logistics.comms}%</span>
                </div>
              </div>

              <div className="unit-strength-item">
                <div>
                  <div className="unit-strength-name">Extreme Cold Climate &amp; High-Altitude Kit</div>
                  <div className="unit-strength-loc">Special Clothing &amp; Mountaineering Equipment</div>
                </div>
                <div className="unit-strength-meter">
                  <div className="unit-bar-bg">
                    <div className="unit-bar-fill" style={{ width: `${logistics.winterGear}%` }}></div>
                  </div>
                  <span className="unit-bar-pct">{logistics.winterGear}%</span>
                </div>
              </div>

              <div className="unit-strength-item">
                <div>
                  <div className="unit-strength-name">Forward Reserve Ration &amp; FOL Stocking</div>
                  <div className="unit-strength-loc">Authorized reserve days held at company store</div>
                </div>
                <span className="status-badge on-track">{logistics.rationsDays} Days Held</span>
              </div>
            </div>

            {/* Quick Company Leave Snapshot Box */}
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-cream-soft)', border: '1px solid var(--border-warm-strong)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '15px' }}>{coyLabel} Active Leave &amp; Approval Summary</strong>
                <button
                  type="button"
                  className="panel-link-btn"
                  onClick={() => setActiveTab('leaves')}
                >
                  Open Roster &rarr;
                </button>
              </div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-body)' }}>
                • Pending Adjutant Approval:{' '}
                <strong>{companyLeaves.filter((l) => l.status === 'PENDING_ADJUTANT').length}</strong>
                <br />• Approved Active Leaves / Detachments:{' '}
                <strong>{companyLeaves.filter((l) => l.status === 'APPROVED').length}</strong>
                <br />• Parade Sheet OR Leave Percentage: <strong>{sheetCoy.lvePctStr}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY PARADE STATE SHEET BREAKDOWN */}
      {activeTab === 'parade' && (
        <div className="table-card">
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-warm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>
                {coyLabel} &mdash; Detailed Parade State Distribution (OFFR / JCO / OR)
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
                Exact figures extracted from the Battalion Parade State Return Sheet for {company.name}
              </p>
            </div>
            <span className="status-badge on-track">
              HQ Parade Present: {sheetCoy.coyPresentTotal} / {sheetCoy.coyPostedTotal} ({sheetCoy.presentPct}%)
            </span>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PARTICULARS / DEPLOYMENT DETAIL</th>
                  <th>OFFICERS (OFFR)</th>
                  <th>JCOs</th>
                  <th>OTHER RANKS (OR)</th>
                  <th>DETAIL TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {companyParadeRows.map((r) => {
                  const cell = (r.coys && r.coys[coyKey]) || { offr: 0, jco: 0, or: 0 };
                  const tot = (Number(cell.offr) || 0) + (Number(cell.jco) || 0) + (Number(cell.or) || 0);
                  return (
                    <tr key={r.key}>
                      <td style={{ fontWeight: 700 }}>{r.label}</td>
                      <td className="cell-num">{cell.offr}</td>
                      <td className="cell-num">{cell.jco}</td>
                      <td className="cell-num">{cell.or}</td>
                      <td className="cell-num">{tot}</td>
                    </tr>
                  );
                })}
                <tr style={{ backgroundColor: '#f9ebeb', fontWeight: 700 }}>
                  <td>TOTAL ABSENT / OUT DEPLOYED</td>
                  <td>{sheetCoy.absent.offr}</td>
                  <td>{sheetCoy.absent.jco}</td>
                  <td>{sheetCoy.absent.or}</td>
                  <td>{sheetCoy.absent.offr + sheetCoy.absent.jco + sheetCoy.absent.or}</td>
                </tr>
                <tr style={{ backgroundColor: '#e6f2e9', fontWeight: 700 }}>
                  <td>PRESENT ON BATTALION HQ PARADE</td>
                  <td>{sheetCoy.present.offr}</td>
                  <td>{sheetCoy.present.jco}</td>
                  <td>{sheetCoy.present.or}</td>
                  <td>{sheetCoy.coyPresentTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: COMPANY LEAVE & DUTY PERSONNEL ROSTER */}
      {activeTab === 'leaves' && (
        <div className="table-card">
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-warm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700 }}>
                {company.name} &mdash; Leave &amp; Movement Roster
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
                Soldiers of this company currently on leave, temporary duty, or awaiting Adjutant / CO approval
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => onOpenApplyLeaveForCompany(company)}
            >
              + Apply Leave for {coyLabel}
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SOLDIER &amp; RANK</th>
                  <th>LEAVE / DUTY TYPE</th>
                  <th>MANDATORY REASON &amp; DESTINATION</th>
                  <th>CALENDAR DATES (FROM &rarr; TILL)</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {companyLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No leave or duty records logged for this company.
                    </td>
                  </tr>
                ) : (
                  companyLeaves.map((m) => {
                    const isPending = m.status === 'PENDING_ADJUTANT';
                    const isApproved = m.status === 'APPROVED';
                    const badgeCls = isApproved
                      ? 'on-track'
                      : isPending
                      ? 'attention'
                      : 'critical';

                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="cell-unit-primary">{m.rankName}</div>
                          <div className="cell-unit-sub">
                            {m.serviceNo} &middot; {m.rankCategory}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>{m.leaveType || m.category}</td>
                        <td>
                          <div>&ldquo;{m.reason}&rdquo;</div>
                          <div className="cell-unit-sub">Destination: {m.destination}</div>
                        </td>
                        <td>
                          <strong>{formatPrettyDate(m.fromDate)}</strong> &rarr;{' '}
                          <strong>{formatPrettyDate(m.toDate)}</strong> ({m.days}d)
                        </td>
                        <td>
                          <span className={`status-badge ${badgeCls}`}>
                            {isPending
                              ? '⏳ Pending Adjutant'
                              : isApproved
                              ? '✓ Approved by Adjutant'
                              : m.status}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            {isPending && isAdjutant && (
                              <>
                                <button
                                  type="button"
                                  className="btn-approve-sm"
                                  onClick={() =>
                                    onAdjutantDecision(
                                      m,
                                      'APPROVED',
                                      `Approved by Adjutant / CO from ${company.name} page.`
                                    )
                                  }
                                >
                                  &#10003; Approve
                                </button>
                                <button
                                  type="button"
                                  className="btn-reject-sm"
                                  onClick={() =>
                                    onAdjutantDecision(
                                      m,
                                      'REJECTED',
                                      'Not approved by Adjutant / CO.'
                                    )
                                  }
                                >
                                  &#10005; Reject
                                </button>
                              </>
                            )}
                            {isPending && !isAdjutant && (
                              <span className="awaiting-adjutant-pill">Awaiting Adjutant</span>
                            )}
                            {isApproved && (
                              <button
                                type="button"
                                className="row-action-btn"
                                onClick={() => onMarkReturned(m.id)}
                              >
                                &#8617; Mark Returned
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
      )}

      {/* EDIT COMPANY MODAL */}
      {editOpen && (
        <div className="modal-backdrop open" onClick={() => setEditOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit {company.name}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setEditOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Company Commander (OC)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={commander}
                      onChange={(e) => setCommander(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sector / Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Sanctioned Strength</label>
                    <input
                      type="number"
                      className="form-input"
                      value={sanctioned}
                      onChange={(e) => setSanctioned(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Present Strength</label>
                    <input
                      type="number"
                      className="form-input"
                      value={present}
                      onChange={(e) => setPresent(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">On Leave</label>
                    <input
                      type="number"
                      className="form-input"
                      value={leaveCount}
                      onChange={(e) => setLeaveCount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">On Duty / QRF</label>
                    <input
                      type="number"
                      className="form-input"
                      value={dutyCount}
                      onChange={(e) => setDutyCount(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
