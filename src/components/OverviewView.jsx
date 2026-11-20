import React, { useState } from 'react';
import {
  COY_LABELS,
  formatNumber,
  formatPrettyDate,
  getReadinessPct,
  computeParadeSheetSummary
} from '../utils/paradeCalc';

const WORKFLOW_CATEGORIES = [
  {
    key: 'rollcall',
    label: 'Roll Call',
    headline: 'Verify company strength & morning parade state',
    cells: [
      {
        num: '01',
        title: 'Company Directory & Dossiers',
        desc: 'Inspect Alpha, Bravo, Charlie, Delta, Support, and HQ Companies with full platoon & NCO breakdowns.',
        targetView: 'directory',
        bgImage: 'assets/login-hero.jpg'
      },
      {
        num: '02',
        title: '33-Row Battalion Parade Return',
        desc: 'Live OFFR, JCO, and OR tabulation across all 6 companies, QRF-1, QRF-2, and Chakbama detachments.',
        targetView: 'parade',
        bgImage: 'assets/dashboard-banner.jpg'
      },
      {
        num: '03',
        title: 'Leave & Movement Calendar',
        desc: 'Mandatory leave reason filing with interactive From-Date and Till-Date visual calendar scheduling.',
        targetView: 'movements',
        bgImage: 'assets/login-hero.jpg'
      },
      {
        num: '04',
        title: 'Garhwal Tactical AI SitRep',
        desc: 'Automated 25% company leave cap guardrails, morning roll-call watchdogs, and CO SitRep generation.',
        targetView: 'ai',
        bgImage: 'assets/dashboard-banner.jpg'
      }
    ]
  },
  {
    key: 'leave',
    label: 'Leave Sanction',
    headline: 'Adjutant command notification & sanction pipeline',
    cells: [
      {
        num: '01',
        title: 'Company Clerk Leave Filing',
        desc: 'Company clerks submit soldier leave requests with mandatory reason and departure/return calendar dates.',
        targetView: 'movements',
        bgImage: 'assets/dashboard-banner.jpg'
      },
      {
        num: '02',
        title: 'Adjutant / CO Approval Queue',
        desc: 'Instant notification dispatched to Adjutant / CO. Present strength is held until Adjutant acceptance.',
        targetView: 'movements',
        bgImage: 'assets/login-hero.jpg'
      },
      {
        num: '03',
        title: 'Auto-Sync Parade LVE Row',
        desc: 'Upon Adjutant approval, the company’s LVE row in the Parade State Sheet increments automatically.',
        targetView: 'parade',
        bgImage: 'assets/dashboard-banner.jpg'
      },
      {
        num: '04',
        title: 'Official Leave Certificate',
        desc: 'Generates a printable regimental movement pass and leave sanction certificate with digital seal.',
        targetView: 'movements',
        bgImage: 'assets/login-hero.jpg'
      }
    ]
  },
  {
    key: 'parade',
    label: 'Parade Return',
    headline: 'Real-time OFFR, JCO & OR accountability across wings',
    cells: [
      {
        num: '01',
        title: 'Rifle & Support Company Grid',
        desc: 'Live strength across A COY, B COY, C COY, D COY, SP COY, and HQ COY with automatic totals.',
        targetView: 'parade',
        bgImage: 'assets/login-hero.jpg'
      },
      {
        num: '02',
        title: 'QRF-1 & QRF-2 Detachments',
        desc: 'Track 117 personnel in QRF-1 (D Coy) and 146 personnel in QRF-2 (C Coy) forward deployments.',
        targetView: 'parade',
        bgImage: 'assets/dashboard-banner.jpg'
      },
      {
        num: '03',
        title: 'Adjutant Daily Countersignature',
        desc: 'Exclusive digital countersignature stamp by Adjutant / CO authorizing the daily Parade State.',
        targetView: 'parade',
        bgImage: 'assets/login-hero.jpg'
      },
      {
        num: '04',
        title: 'One-Click Excel / CSV Export',
        desc: 'Export complete Battalion Parade State sheets and company strength returns for brigade headquarters.',
        targetView: 'parade',
        bgImage: 'assets/dashboard-banner.jpg'
      }
    ]
  },
  {
    key: 'ai',
    label: 'Tactical AI',
    headline: 'Automated readiness guardrails & security shield',
    cells: [
      {
        num: '01',
        title: 'AI Leave Quota Analyzer',
        desc: 'Flags companies exceeding the 25% OR leave ceiling while prioritizing compassionate grounds.',
        targetView: 'ai',
        bgImage: 'assets/dashboard-banner.jpg'
      },
      {
        num: '02',
        title: '3-Attempt Time-Limit Lockout',
        desc: 'Automatic 60-second security lockout after 3 wrong password attempts on any module account.',
        targetView: 'ai',
        bgImage: 'assets/login-hero.jpg'
      },
      {
        num: '03',
        title: '06:00 HRS Roll Call Watchdog',
        desc: 'Automated daily strength verification across all reporting companies of The Garhwal Rifles.',
        targetView: 'ai',
        bgImage: 'assets/dashboard-banner.jpg'
      },
      {
        num: '04',
        title: 'Interactive CO SitRep Chat',
        desc: 'Natural-language tactical assistant generating instant situation reports from live unit data.',
        targetView: 'ai',
        bgImage: 'assets/login-hero.jpg'
      }
    ]
  }
];

export default function OverviewView({
  user,
  companies,
  paradeSheet,
  leaves,
  activityLogs,
  paradeSignInfo,
  aiInsights,
  onNavigate,
  onInspectCompany,
  onOpenApplyLeave,
  onAdjutantDecision,
  onSignParadeState,
  onRunRollCall,
  onClearLogs
}) {
  const isAdjutant = user.role === 'ADJUTANT_CO';
  const isSaIt = user.role === 'SA_IT_CELL';
  const isClerk = user.role === 'COMPANY_CLERK';

  const [activeWfCat, setActiveWfCat] = useState(WORKFLOW_CATEGORIES[0]);

  const visibleCompanies = isClerk
    ? companies.filter((c) => c.coyKey === user.assignedCoy)
    : companies;

  const visibleLeaves = isClerk
    ? leaves.filter((l) => l.coyKey === user.assignedCoy)
    : leaves;

  const pendingLeaves = visibleLeaves.filter((l) => l.status === 'PENDING_ADJUTANT');
  const approvedLeaves = visibleLeaves.filter((l) => l.status === 'APPROVED');

  const totals = visibleCompanies.reduce(
    (acc, c) => {
      const away = (Number(c.leave) || 0) + (Number(c.duty) || 0);
      acc.sanctioned += Number(c.sanctioned) || 0;
      acc.posted += Number(c.posted) || 0;
      acc.present += Number(c.present) || 0;
      acc.leave += Number(c.leave) || 0;
      acc.duty += Number(c.duty) || 0;
      acc.away += away;
      return acc;
    },
    { sanctioned: 0, posted: 0, present: 0, leave: 0, duty: 0, away: 0 }
  );

  const presentPctSanctioned =
    totals.sanctioned > 0 ? Math.round((totals.present / totals.sanctioned) * 100) : 0;

  const { grand } = computeParadeSheetSummary(paradeSheet);
  const advisories = (aiInsights && aiInsights.leaveAdvisories) || {};

  // Top 4 cards for the Phenomenon "Board Deck" white section (or all if clerk)
  const featuredCards = visibleCompanies.slice(0, 4);

  return (
    <div className="ps-overview-flow">
      {/* ====================================================================
          SECTION 1: GIANT CURVED OBSIDIAN HERO & 2-COLUMN SPLIT (VIDEO 00:00–00:05)
          ==================================================================== */}
      <section className="ps-dark-hero-block">
        <div className="ps-dark-hero-inner">
          <div className="ps-eyebrow-row">
            <span className="ps-eyebrow-text">
              THE GARHWAL RIFLES &middot; COMPANY, LEAVE &amp; PARADE COMMAND
            </span>
            <span className="ps-reddot-pill">
              <i className="ps-saffron-dot" />
              <span>
                {isAdjutant && 'LEVEL-1 ADJUTANT / CO SUPREME COMMAND'}
                {isSaIt && 'LEVEL-2 SA / IT CELL TECHNICAL ADMIN'}
                {isClerk && `LEVEL-3 COMPANY CLERK · ${COY_LABELS[user.assignedCoy]}`}
              </span>
            </span>
          </div>

          <h1 className="ps-giant-headline">
            Command, strength, and parade precision for{' '}
            <span className="ps-text-saffron">The Garhwal Rifles.</span>
          </h1>

          {/* Two Signature Phenomenon Buttons (Solid Saffron + Dark Outline) */}
          <div className="ps-hero-btn-row">
            <button
              type="button"
              onClick={() => onNavigate('parade')}
              className="ps-btn-saffron"
            >
              <span>PARADE STATE SHEET</span>
              <span className="ps-chevron">&rsaquo;</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('movements')}
              className="ps-btn-dark-outline"
            >
              <span>LEAVE &amp; DUTY REGISTER ({pendingLeaves.length} PENDING)</span>
              <span className="ps-chevron">&rsaquo;</span>
            </button>
            {isAdjutant && !paradeSignInfo?.signed && (
              <button
                type="button"
                onClick={onSignParadeState}
                className="ps-btn-dark-outline"
              >
                <span>COUNTERSIGN TODAY&rsquo;S PARADE</span>
                <span className="ps-chevron">&rsaquo;</span>
              </button>
            )}
          </div>

          {/* 2-Column Split: Left Visual Showreel Card + Right Editorial & 2x2 Numbers */}
          <div className="ps-editorial-showcase-split">
            {/* Left Emerald-Tinted Rounded Visual Preview Card (Video 00:01–00:04) */}
            <div className="ps-showreel-card dashboard-preview" onClick={() => onNavigate('parade')}>
              <div className="ps-showreel-overlay" />

              <div className="ps-preview-window">
                <div className="ps-preview-top">
                  <div>
                    <div className="ps-preview-welcome">
                      WELCOME BACK, {user.displayName.toUpperCase()}
                    </div>
                    <div className="ps-preview-sub">
                      {user.rankTitle} &middot; Live Battalion &amp; Company Telemetry
                    </div>
                  </div>
                  <span className="ps-glass-tag">
                    {paradeSignInfo?.signed ? '✓ COUNTERSIGNED' : '⏳ AWAITING CO SIGN'}
                  </span>
                </div>

                <div className="ps-preview-bars">
                  {visibleCompanies.slice(0, 5).map((c) => {
                    const p = getReadinessPct(c);
                    return (
                      <div key={c.id} className="ps-preview-bar-row">
                        <span className="ps-p-name">{c.name.split('—')[0].trim()}</span>
                        <div className="ps-p-track">
                          <div className="ps-p-fill" style={{ width: `${Math.min(100, p)}%` }} />
                        </div>
                        <span className="ps-p-pct t-num">{p}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="ps-showreel-center-pill">
                <span>PARADE STATE 20/26</span>
                <span className="ps-chevron">&rsaquo;</span>
              </div>
            </div>

            {/* Right Column: Editorial Lead + 3-Col Recognition + 2x2 Numbers */}
            <div className="ps-editorial-right-col">
              <p className="ps-editorial-lead">
                We coordinate daily roll calls across Alpha, Bravo, Charlie, Delta, Support, and HQ Companies&mdash;connecting company clerks, IT cell compilation, and Adjutant leave sanctions in real time.
              </p>

              <div className="ps-hairline-label">
                RECOGNIZED FOR VALOR, DISCIPLINE, AND OPERATIONAL PRECISION // 1887
              </div>

              <div className="ps-recognition-3col">
                <div className="ps-rec-cell" onClick={() => onNavigate('parade')} style={{ cursor: 'pointer' }}>
                  <div className="ps-rec-badge">807 STR</div>
                  <div className="ps-rec-text">
                    {grand.posted.offr} OFFR &middot; {grand.posted.jco} JCO &middot; {grand.posted.or} OR Posted
                  </div>
                </div>
                <div className="ps-rec-cell" onClick={() => onNavigate('movements')} style={{ cursor: 'pointer' }}>
                  <div className="ps-rec-badge">{pendingLeaves.length} QUEUED</div>
                  <div className="ps-rec-text">
                    Leave requests routed to Adjutant / CO before approval
                  </div>
                </div>
                <div className="ps-rec-cell" onClick={() => onNavigate('ai')} style={{ cursor: 'pointer' }}>
                  <div className="ps-rec-badge">AI GUARD</div>
                  <div className="ps-rec-text">
                    Automated 25% company leave cap &amp; roll-call watchdog
                  </div>
                </div>
              </div>

              <div className="ps-hairline-label" style={{ marginTop: '24px' }}>
                THE GARHWAL RIFLES IN NUMBERS
              </div>

              <div className="ps-numbers-2x2">
                <div className="ps-num-cell">
                  <div className="ps-big-num t-num">{formatNumber(totals.sanctioned)}</div>
                  <div className="ps-num-caption">
                    Sanctioned establishment across {visibleCompanies.length} reporting companies
                  </div>
                </div>
                <div className="ps-num-cell">
                  <div className="ps-big-num t-num">{formatNumber(totals.present)}</div>
                  <div className="ps-num-caption">
                    Present on parade today ({presentPctSanctioned}% of sanctioned strength)
                  </div>
                </div>
                <div className="ps-num-cell">
                  <div className="ps-big-num t-num">{formatNumber(totals.away)}</div>
                  <div className="ps-num-caption">
                    Away on approved leave ({totals.leave}) &amp; QRF/detachment duty ({totals.duty})
                  </div>
                </div>
                <div className="ps-num-cell">
                  <div className="ps-big-num t-num">
                    {String(visibleCompanies.length).padStart(2, '0')}
                  </div>
                  <div className="ps-num-caption">
                    Active Garhwal Rifles companies reporting live readiness
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 2: PURE WHITE "BOARD-DECK" COMPANY CARDS SECTION (VIDEO 00:05–00:08)
          ==================================================================== */}
      <section className="ps-white-boarddeck-section">
        <div className="ps-white-inner">
          <div className="ps-boarddeck-header">
            <h2 className="ps-boarddeck-headline">
              Company readiness you could put
              <br />
              in a command briefing
            </h2>
            <div className="ps-boarddeck-actions">
              <button
                type="button"
                onClick={onOpenApplyLeave}
                className="ps-btn-saffron"
              >
                <span>+ APPLY SOLDIER LEAVE</span>
                <span className="ps-chevron">&rsaquo;</span>
              </button>
            </div>
          </div>

          {/* 4-Column Tall Vertical Company Cards that Invert to Black on Hover! */}
          <div className="ps-boarddeck-cards-grid">
            {featuredCards.map((c) => {
              const pct = getReadinessPct(c);
              const away = (Number(c.leave) || 0) + (Number(c.duty) || 0);
              return (
                <article
                  key={c.id}
                  className="ps-tall-coy-card"
                  onClick={() => onInspectCompany(c)}
                >
                  <div className="ps-tall-card-top">
                    <span className="ps-tall-coy-name">
                      {c.name.split('—')[0].trim()}
                    </span>
                    <span className="ps-tall-coy-tags">
                      #{COY_LABELS[c.coyKey] || c.coyKey} #19-GR
                    </span>
                  </div>

                  {/* Middle Visual Dossier Preview Box */}
                  <div className="ps-tall-card-visual">
                    <div className="ps-visual-inner-card">
                      <div className="ps-v-tag-row">
                        <span className="ps-v-badge">{c.location}</span>
                        <span className="ps-v-str t-num">{c.posted} POSTED</span>
                      </div>
                      <div className="ps-v-oc">OC: {c.commander}</div>
                      <div className="ps-v-bar-track">
                        <div className="ps-v-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <div className="ps-v-metrics t-num">
                        <span>PRES: {c.present}</span>
                        <span>LVE: {c.leave}</span>
                        <span>DUTY: {c.duty}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Big Number + Caption + Bottom-Right Square Arrow Button [→] */}
                  <div className="ps-tall-card-bottom">
                    <div>
                      <div className="ps-tall-big-metric t-num">{pct}%</div>
                      <p className="ps-tall-metric-desc">
                        {c.present} present on parade &middot; {away} away on leave/QRF
                      </p>
                    </div>
                    <span className="ps-square-arrow-btn" aria-hidden="true">
                      &rarr;
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="ps-explore-center-row">
            <button
              type="button"
              onClick={() => onNavigate('directory')}
              className="ps-explore-link-btn"
            >
              <span>EXPLORE ALL {visibleCompanies.length} COMPANIES IN DIRECTORY</span>
              <span className="ps-chevron">&rsaquo;</span>
            </button>
          </div>

          {/* ================================================================
              ADJUTANT / CO EXCLUSIVE LEAVE APPROVAL QUEUE & RECENT AUDIT LOG
              ================================================================ */}
          <div className="ps-white-command-split">
            <div className="ps-white-panel">
              <div className="ps-white-panel-head">
                <div>
                  <span className="ph-mono-index">
                    {isAdjutant
                      ? 'ADJUTANT / CO // LEAVE SANCTION DESK'
                      : 'LEAVE & DUTY APPROVAL STATUS'}
                  </span>
                  <h3 className="ps-white-panel-title">
                    Pending Adjutant Leave Approvals ({pendingLeaves.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('movements')}
                  className="ps-explore-link-btn"
                >
                  <span>FULL REGISTER &amp; CALENDAR</span>
                  <span className="ps-chevron">&rsaquo;</span>
                </button>
              </div>

              {pendingLeaves.length === 0 ? (
                <div className="empty-queue-box">
                  &#10003; All pending leave requests have been decided by the Adjutant / CO.
                </div>
              ) : (
                <div className="pending-approval-cards">
                  {pendingLeaves.map((lve) => {
                    const adv = advisories[lve.id];
                    return (
                      <div key={lve.id} className="pending-leave-card">
                        <div className="pending-leave-top">
                          <div>
                            <span className="pending-soldier-name">{lve.rankName}</span>
                            <span className="pending-soldier-meta">
                              {lve.serviceNo} &middot; {lve.rankCategory} &middot;{' '}
                              <strong>{lve.companyName}</strong>
                            </span>
                          </div>
                          <span className="pending-days-pill t-num">
                            {lve.days} DAYS // {formatPrettyDate(lve.fromDate)} &rarr;{' '}
                            {formatPrettyDate(lve.toDate)}
                          </span>
                        </div>

                        <div className="pending-reason-box">
                          <strong>Reason ({lve.leaveType}):</strong> &ldquo;{lve.reason}&rdquo;
                          <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>
                            ({lve.destination} &middot; Filed by {lve.requestedBy})
                          </span>
                        </div>

                        <div className="pending-card-footer">
                          {adv ? (
                            <span className={`status-badge ${adv.tone}`}>
                              #{adv.badge} &middot; {adv.note}
                            </span>
                          ) : (
                            <span />
                          )}

                          {isAdjutant ? (
                            <div className="adjutant-decision-btns">
                              <button
                                type="button"
                                className="btn-approve"
                                onClick={() => onAdjutantDecision(lve, 'APPROVED')}
                              >
                                &#10003; Accept &amp; Approve
                              </button>
                              <button
                                type="button"
                                className="btn-reject"
                                onClick={() => onAdjutantDecision(lve, 'REJECTED')}
                              >
                                &#10005; Reject
                              </button>
                            </div>
                          ) : (
                            <span className="awaiting-adjutant-pill">
                              &#128276; Notification Sent &mdash; Awaiting Adjutant / CO Acceptance
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="ps-white-panel">
              <div className="ps-white-panel-head">
                <div>
                  <span className="ph-mono-index">LIVE TELEMETRY // COMMAND LOG</span>
                  <h3 className="ps-white-panel-title">Recent Command &amp; Parade Activity</h3>
                </div>
                {(isAdjutant || isSaIt) && (
                  <button type="button" onClick={onClearLogs} className="ps-explore-link-btn">
                    <span>CLEAR LOG</span>
                  </button>
                )}
              </div>

              <div className="activity-list">
                {activityLogs.slice(0, 5).map((item, idx) => (
                  <div key={item.id} className="activity-item">
                    <span className="ph-log-idx t-num">{String(idx + 1).padStart(2, '0')}</span>
                    <div className="activity-text">
                      <span dangerouslySetInnerHTML={{ __html: item.text }} />
                      {item.actor && <span className="ph-log-actor">#{item.actor.toUpperCase()}</span>}
                    </div>
                    <span className="activity-time t-num">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          SECTION 3: SECOND GIANT CURVED OBSIDIAN BLOCK WITH 01–04 HOVER GRID
          (MATCHING VIDEO 00:09–00:17)
          ==================================================================== */}
      <section className="ps-dark-bottom-block">
        <div className="ps-dark-bottom-inner">
          <div className="ps-hairline-label">
            END-TO-END BATTALION &amp; COMPANY COMMAND ARCHITECTURE // GARHWAL RIFLES
          </div>

          <h2 className="ps-giant-headline" style={{ marginTop: '14px', maxWidth: '820px' }}>
            From morning roll call to Adjutant sanction.
          </h2>

          <p className="ps-dark-sublead">
            Great operational readiness doesn&rsquo;t happen by accident. We unify company offices, IT cell parade compilation, Adjutant leave approvals, and tactical AI guardrails under one roof.
          </p>

          {/* Interactive Left Category List + Right 2x2 (01, 02, 03, 04) Hover-Reveal Grid */}
          <div className="ps-services-Interactive-split">
            {/* Left Vertical Switcher Column + Saffron CTA at Bottom */}
            <div className="ps-services-left-nav">
              <div className="ps-services-cat-list">
                {WORKFLOW_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveWfCat(cat)}
                    className={`ps-service-cat-btn ${
                      activeWfCat.key === cat.key ? 'active' : ''
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="ps-services-left-cta">
                <button
                  type="button"
                  onClick={() => onNavigate('parade')}
                  className="ps-btn-saffron"
                >
                  <span>EXPLORE PARADE SHEET</span>
                  <span className="ps-chevron">&rsaquo;</span>
                </button>
              </div>
            </div>

            {/* Right 2x2 Hairline Grid (01, 02, 03, 04) with Hover Image Reveal & Square [→] Button */}
            <div className="ps-services-right-area">
              <h3 className="ps-services-area-title">{activeWfCat.headline}</h3>

              <div className="ps-hairline-2x2-grid">
                {activeWfCat.cells.map((cell) => (
                  <div
                    key={cell.num}
                    className="ps-hairline-01-cell"
                    onClick={() => onNavigate(cell.targetView)}
                  >
                    {/* Hover Visual Background Image Reveal */}
                    <div
                      className="ps-cell-hover-bg"
                      style={{ backgroundImage: `url('${cell.bgImage}')` }}
                    />

                    <div className="ps-cell-top-row">
                      <span className="ps-cell-num t-num">{cell.num}</span>
                    </div>

                    <div className="ps-cell-bottom-row">
                      <div className="ps-cell-copy">
                        <h4 className="ps-cell-title">{cell.title}</h4>
                        <p className="ps-cell-desc">{cell.desc}</p>
                      </div>
                      <span className="ps-cell-square-arrow" aria-hidden="true">
                        &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
