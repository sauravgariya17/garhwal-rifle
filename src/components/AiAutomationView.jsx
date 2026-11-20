import React, { useState } from 'react';
import { api } from '../api';

const QUICK_AI_PROMPTS = [
  'Generate Morning SitRep for CO 19 Garhwal Rifles',
  'Audit Company Leave Quotas & Pending Adjutant Approvals',
  'Analyze QRF-1 (D Coy) & QRF-2 (C Coy) Deployment Impact'
];

export default function AiAutomationView({
  user,
  automations,
  aiInsights,
  usersSecurityStatus,
  onToggleAutomation,
  onRunRollCall,
  onUnlockAccount,
  showToast
}) {
  const isClerk = user.role === 'COMPANY_CLERK';
  const canManageAuto = user.permissions?.canManageAutomations && !isClerk;
  const canManageSec = user.permissions?.canManageSecurity && !isClerk;

  const [promptInput, setPromptInput] = useState('');
  const [aiHistory, setAiHistory] = useState([
    {
      id: 'init-msg',
      role: 'ai',
      text:
        aiInsights?.headlineBrief ||
        'Garhwal Tactical AI online. Connected to 19 Garhwal Rifles live database. Select a tactical prompt below or ask any question about company readiness, leave quotas, or QRF deployments.',
      actionItems: [
        'Inspect pending leave applications in Adjutant Approval Queue',
        'Review Bravo Company (B COY) OR leave percentage (27.9%)'
      ],
      time: 'Live'
    }
  ]);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleSendPrompt = async (textToUse) => {
    const q = (textToUse ?? promptInput).trim();
    if (!q) return;
    setPromptInput('');
    const userMsg = {
      id: 'u-' + Date.now(),
      role: 'user',
      text: q,
      time: 'Just now'
    };
    setAiHistory((prev) => [...prev, userMsg]);
    setLoadingAi(true);

    try {
      const res = await api.askAi(q);
      setAiHistory((prev) => [
        ...prev,
        {
          id: 'ai-' + Date.now(),
          role: 'ai',
          text: res.reply,
          actionItems: res.actionItems || [],
          time: res.timestamp || 'Now'
        }
      ]);
    } catch (err) {
      showToast(err.message || 'AI analysis failed');
    } finally {
      setLoadingAi(false);
    }
  };

  const coyAnalysis = aiInsights?.coyAnalysis || [];

  return (
    <section className="view-section active">
      <div className="page-header">
        <div>
          <h2 className="page-title">The Garhwal Rifles &mdash; AI &amp; Automation Command Center</h2>
          <p className="page-subtitle">
            Tactical AI SitRep generator, automated Parade State synchronization, leave quota guardrails, and module security watchdog.
          </p>
        </div>
        <div className="page-header-actions">
          {canManageAuto && (
            <button type="button" onClick={onRunRollCall} className="btn-primary">
              <span>&#9889; Trigger Automated 06:00 HRS Roll Call</span>
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          TOP SPLIT: INTERACTIVE TACTICAL AI ADVISOR + LIVE COY QUOTA MATRIX
          ==================================================================== */}
      <div className="overview-split-grid">
        {/* Left: Interactive Garhwal Tactical AI Chat & SitRep Generator */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div>
              <h2 className="panel-card-title">&#10024; Garhwal Tactical AI Advisor</h2>
              <p className="panel-card-subtitle">
                Live operational intelligence over 19 Garhwal Rifles companies, parade sheet &amp; leave queue
              </p>
            </div>
            <span className="status-badge on-track">AI Engine Online</span>
          </div>

          <div className="ai-quick-prompts">
            {QUICK_AI_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="helper-chip"
                onClick={() => handleSendPrompt(p)}
                disabled={loadingAi}
              >
                &#9889; {p}
              </button>
            ))}
          </div>

          <div className="ai-chat-window">
            {aiHistory.map((msg) => (
              <div key={msg.id} className={`ai-msg-bubble ${msg.role}`}>
                <div className="ai-msg-header">
                  <strong>
                    {msg.role === 'ai' ? '★ GARHWAL TACTICAL AI (19 GARH RIF)' : `▸ ${user.displayName}`}
                  </strong>
                  <span>{msg.time}</span>
                </div>
                <pre className="ai-msg-text">{msg.text}</pre>
                {msg.actionItems && msg.actionItems.length > 0 && (
                  <div className="ai-action-list">
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--gold-dark)' }}>
                      RECOMMENDED COMMAND ACTIONS:
                    </div>
                    {msg.actionItems.map((act, i) => (
                      <div key={i} className="ai-action-item">
                        &#10003; {act}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="ai-input-row"
          >
            <input
              type="text"
              className="form-input"
              placeholder="Ask Garhwal AI (e.g. 'Generate Morning SitRep', 'Check leave quota', 'Analyze QRF')..."
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
            />
            <button type="submit" className="btn-primary" disabled={loadingAi}>
              {loadingAi ? 'Analyzing...' : 'Ask AI →'}
            </button>
          </form>
        </div>

        {/* Right: AI Company Leave Quota & Readiness Matrix */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div>
              <h2 className="panel-card-title">AI Company Leave &amp; Readiness Audit</h2>
              <p className="panel-card-subtitle">
                Automated evaluation of A, B, C, D, SP &amp; HQ Companies (19 Garhwal Rifles)
              </p>
            </div>
          </div>

          <div className="ai-coy-matrix">
            {coyAnalysis.map((c) => {
              const badgeCls =
                c.riskLevel === 'HIGH_LEAVE_LOAD'
                  ? 'critical'
                  : c.riskLevel === 'MODERATE_LOAD'
                  ? 'attention'
                  : 'on-track';
              return (
                <div key={c.coyKey} className="ai-coy-card">
                  <div className="ai-coy-top">
                    <strong>{c.coyLabel} — 19 Garhwal Rifles</strong>
                    <span className={`status-badge ${badgeCls}`}>
                      OR Leave: {c.orLeavePct}%
                    </span>
                  </div>
                  <div className="ai-coy-stats">
                    <span>Posted: <strong>{c.postedTotal}</strong></span>
                    <span>Present on HQ Parade: <strong>{c.presentTotal} ({c.presentPct}%)</strong></span>
                    <span>On Leave: <strong>{c.lveTotal}</strong></span>
                  </div>
                  <div className="ai-coy-rec">{c.recommendation}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================
          LOWER ROW: AUTOMATION RULES ENGINE + MODULE SECURITY WATCHDOG
          ==================================================================== */}
      <div className="overview-advanced-grid" style={{ marginTop: '20px' }}>
        <div className="panel-card">
          <div className="panel-card-header">
            <div>
              <h2 className="panel-card-title">&#9881; Active Command Automations</h2>
              <p className="panel-card-subtitle">
                {canManageAuto
                  ? 'Toggle real-time backend automation rules for 19 Garhwal Rifles'
                  : 'Read-Only for Company Clerk (Managed by Adjutant / CO & SA / IT Cell)'}
              </p>
            </div>
          </div>

          <div className="automation-rules-list">
            {automations.map((rule) => (
              <div key={rule.id} className="automation-rule-card">
                <div className="auto-rule-info">
                  <div className="auto-rule-title-row">
                    <strong>{rule.name}</strong>
                    <span className="coy-code-chip">{rule.category}</span>
                  </div>
                  <p className="auto-rule-desc">{rule.description}</p>
                  <span className="auto-rule-meta">Status: {rule.lastTriggered}</span>
                </div>
                <div>
                  <button
                    type="button"
                    disabled={!canManageAuto}
                    onClick={() => onToggleAutomation(rule.id)}
                    className={`auto-toggle-btn ${rule.enabled ? 'on' : 'off'}`}
                  >
                    {rule.enabled ? '● ACTIVE' : '○ PAUSED'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module Security & Lockout Monitor (Restricted to Adjutant / CO & SA / IT Cell) */}
        <div className="panel-card">
          <div className="panel-card-header">
            <div>
              <h2 className="panel-card-title">&#128274; Module Security &amp; Lockout Watchdog</h2>
              <p className="panel-card-subtitle">
                Monitors 3-attempt wrong password time-limit lockouts across all modules
              </p>
            </div>
          </div>

          {!canManageSec ? (
            <div className="rbac-notice-strip">
              &#128274; <strong>Restricted Security Console:</strong> Module password audit and lockout override controls are accessible only to <strong>Adjutant / CO</strong> and <strong>SA / IT Cell</strong>.
            </div>
          ) : (
            <div className="security-users-list">
              {(usersSecurityStatus || []).map((u) => (
                <div key={u.id} className="security-user-card">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>
                      {u.displayName} <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>({u.username})</span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      {u.rankTitle} &middot; Failed Attempts: <strong>{u.failedAttempts} / 3</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {u.locked ? (
                      <>
                        <span className="status-badge critical">
                          &#128274; Locked ({u.remainingSeconds}s)
                        </span>
                        <button
                          type="button"
                          className="row-action-btn"
                          onClick={() => onUnlockAccount(u.username)}
                        >
                          Unlock Now
                        </button>
                      </>
                    ) : (
                      <span className="status-badge on-track">&#10003; Secure &amp; Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
