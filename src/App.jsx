import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import {
  COY_KEYS,
  COY_LABELS
} from './utils/paradeCalc';
import LoginView from './components/LoginView';
import OverviewView from './components/OverviewView';
import CompanyDirectoryView from './components/CompanyDirectoryView';
import CompanyDetailPage from './components/CompanyDetailPage';
import ParadeStateView from './components/ParadeStateView';
import LeaveDutyView from './components/LeaveDutyView';
import AiAutomationView from './components/AiAutomationView';

const SESSION_KEY = 'gr_react_session_v4';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [currentView, setCurrentView] = useState('overview');
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [preselectedLeaveCoyId, setPreselectedLeaveCoyId] = useState(null);

  const [companies, setCompanies] = useState([]);
  const [paradeSheet, setParadeSheet] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [paradeSignInfo, setParadeSignInfo] = useState(null);
  const [usersSecurityStatus, setUsersSecurityStatus] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [externalLeaveModalOpen, setExternalLeaveModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message) => {
    const id = 't-' + Date.now() + '-' + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3400);
  }, []);

  const loadBootstrap = useCallback(async () => {
    try {
      const data = await api.getBootstrap();
      setCompanies(data.companies || []);
      setParadeSheet(data.paradeSheet || []);
      setLeaves(data.leaves || []);
      setNotifications(data.notifications || []);
      setAutomations(data.automations || []);
      setActivityLogs(data.activityLogs || []);
      setParadeSignInfo(data.paradeSignInfo || null);
      setUsersSecurityStatus(data.usersSecurityStatus || []);
      setAiInsights(data.aiInsights || null);
    } catch (err) {
      console.error('Failed to load bootstrap data:', err);
    }
  }, []);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const saveUserSession = (u) => {
    setUser(u);
    try {
      if (u) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(u));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore
    }
  };

  const handleLoginSuccess = async (loggedInUser) => {
    saveUserSession(loggedInUser);
    setCurrentView('overview');
    await loadBootstrap();
    showToast(`Jai Badri Vishal! Signed in as ${loggedInUser.displayName}`);
  };

  const handleSignOut = () => {
    saveUserSession(null);
    setNotifOpen(false);
  };

  const handleOpenCompanyPage = (company) => {
    if (!company) return;
    setSelectedCompanyId(company.id);
    setCurrentView('company-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Leave Actions
  const handleApplyLeave = async (payload) => {
    const res = await api.applyLeave({
      ...payload,
      actorRole: user.role
    });
    await loadBootstrap();
    showToast(res.message || 'Leave application sent to Adjutant / CO for approval!');
  };

  const handleAdjutantDecision = async (leaveItem, decision, remarks) => {
    try {
      const res = await api.decideLeave(leaveItem.id, {
        decision,
        adjutantRemarks: remarks,
        actorRole: user.role
      });
      await loadBootstrap();
      showToast(res.message || `Leave ${decision.toLowerCase()}!`);
    } catch (err) {
      showToast(err.message || 'Could not process Adjutant decision');
    }
  };

  const handleMarkReturned = async (leaveId) => {
    try {
      await api.markLeaveReturned(leaveId, { actorName: user.displayName });
      await loadBootstrap();
      showToast('Soldier marked returned to unit & Parade State updated');
    } catch (err) {
      showToast(err.message || 'Failed to mark returned');
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    try {
      await api.deleteLeave(leaveId);
      await loadBootstrap();
      showToast('Removed leave / duty entry');
    } catch (err) {
      showToast(err.message || 'Could not delete record');
    }
  };

  // Company Directory Actions
  const handleAddCompany = async (payload) => {
    try {
      await api.addCompany({ ...payload, actorRole: user.role });
      await loadBootstrap();
      showToast(`Added ${payload.name} to Company Directory`);
    } catch (err) {
      showToast(err.message || 'Failed to add company');
    }
  };

  const handleUpdateCompany = async (id, payload) => {
    try {
      await api.updateCompany(id, { ...payload, actorRole: user.role });
      await loadBootstrap();
      showToast(`Updated ${payload.name}`);
    } catch (err) {
      showToast(err.message || 'Failed to update company');
    }
  };

  const handleDeleteCompany = async (id) => {
    try {
      await api.deleteCompany(id, user.role);
      await loadBootstrap();
      showToast('Removed company record from directory');
    } catch (err) {
      showToast(err.message || 'Failed to delete company');
    }
  };

  // Parade Sheet Actions
  const handleUpdateParadeCell = async (payload) => {
    try {
      await api.updateParadeCell({ ...payload, actorRole: user.role });
      await loadBootstrap();
      showToast(`Updated Parade State (${COY_LABELS[payload.coyKey]})`);
    } catch (err) {
      showToast(err.message || 'Failed to update cell');
    }
  };

  const handleAddParadeRow = async (label) => {
    try {
      await api.addParadeRow({ label, actorRole: user.role });
      await loadBootstrap();
      showToast(`Added row: ${label}`);
    } catch (err) {
      showToast(err.message || 'Failed to add row');
    }
  };

  const handleSignParadeState = async () => {
    try {
      await api.signParadeState({ actorRole: user.role });
      await loadBootstrap();
      showToast('Daily Parade State Countersigned by Adjutant / CO!');
    } catch (err) {
      showToast(err.message || 'Only Adjutant / CO can sign Parade State');
    }
  };

  const handleResetParadeSheet = async () => {
    try {
      await api.resetParadeSheet();
      await loadBootstrap();
      showToast('Restored Parade State Sheet to baseline figures');
    } catch (err) {
      showToast(err.message || 'Failed to reset sheet');
    }
  };

  // AI & Automation Actions
  const handleToggleAutomation = async (id) => {
    try {
      await api.toggleAutomation({ id, actorRole: user.role });
      await loadBootstrap();
      showToast('Updated automation rule status');
    } catch (err) {
      showToast(err.message || 'Failed to toggle automation');
    }
  };

  const handleRunRollCall = async () => {
    try {
      const res = await api.runRollCall({ actorName: user.displayName });
      await loadBootstrap();
      showToast(res.message || 'Automated Morning Roll Call verified!');
    } catch (err) {
      showToast(err.message || 'Failed to run roll call');
    }
  };

  const handleUnlockAccount = async (targetUsername) => {
    try {
      await api.unlockAccount({ targetUsername, actorRole: user.role });
      await loadBootstrap();
      showToast(`Unlocked module account: ${targetUsername}`);
    } catch (err) {
      showToast(err.message || 'Failed to unlock account');
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await api.markNotificationsRead({ role: user.role });
      await loadBootstrap();
    } catch {
      // ignore
    }
  };

  const handleClearLogs = async () => {
    await api.clearLogs();
    await loadBootstrap();
  };

  const handleResetDemo = async () => {
    const res = await api.resetDemo();
    await loadBootstrap();
    showToast(res.message || 'Restored all default Garhwal Rifles records');
  };

  if (!user) {
    return (
      <>
        <LoginView onLoginSuccess={handleLoginSuccess} showToast={showToast} />
        <div className="toast-container" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="toast">
              <span className="live-pulse-dot" />
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  const isAdjutant = user.role === 'ADJUTANT_CO';
  const isClerk = user.role === 'COMPANY_CLERK';

  const roleNotifs = notifications.filter(
    (n) => n.targetRole === user.role || n.targetRole === 'ALL' || isAdjutant
  );
  const unreadNotifsCount = roleNotifs.filter((n) => !n.read).length;

  const visibleCompaniesCount = isClerk
    ? companies.filter((c) => c.coyKey === user.assignedCoy).length
    : companies.length;

  const pendingLeavesCount = (isClerk
    ? leaves.filter((l) => l.coyKey === user.assignedCoy)
    : leaves
  ).filter((l) => l.status === 'PENDING_ADJUTANT').length;

  const activeCompanyObj =
    companies.find((c) => c.id === selectedCompanyId) || companies[0] || null;

  const NAV_ITEMS = [
    {
      key: 'overview',
      idx: '01',
      label: 'Overview',
      badge: isAdjutant && pendingLeavesCount > 0 ? `${pendingLeavesCount}` : null
    },
    {
      key: 'directory',
      idx: '02',
      label: 'Company Directory',
      badge: String(visibleCompaniesCount),
      isActiveMatch: currentView === 'directory' || currentView === 'company-detail'
    },
    {
      key: 'parade',
      idx: '03',
      label: 'Parade State',
      badge: '807'
    },
    {
      key: 'movements',
      idx: '04',
      label: 'Leave & Duty',
      badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} PEND` : String(leaves.length)
    },
    {
      key: 'ai',
      idx: '05',
      label: 'Tactical AI',
      badge: 'AI'
    }
  ];

  return (
    <div className="ps-portal-root">
      {/* PATRIOTIC TRICOLOUR TOP HAIRLINE */}
      <div className="ps-tricolour-top" aria-hidden="true">
        <span className="saffron" />
        <span className="white" />
        <span className="green" />
      </div>

      {/* ====================================================================
          PHENOMENON STUDIO FLOATING TOP NAVIGATION + PINNED TOP-RIGHT CTA
          ==================================================================== */}
      <header className="ps-floating-navbar">
        <div className="ps-nav-left" onClick={() => setCurrentView('overview')} style={{ cursor: 'pointer' }}>
          <div className="ps-brand-badge">GR</div>
          <div className="ps-nav-brand-copy">
            <span className="ps-nav-brand-title">THE GARHWAL RIFLES</span>
            <span className="ps-nav-brand-sub">
              <i className="ps-saffron-dot" /> {user.displayName.toUpperCase()}
              {isClerk ? ` · ${COY_LABELS[user.assignedCoy]}` : ' · COMMAND HQ'}
            </span>
          </div>
        </div>

        {/* Center Horizontal Module Tabs */}
        <nav className="ps-nav-tabs" aria-label="Primary Module Navigation">
          {NAV_ITEMS.map((item) => {
            const isAct = item.isActiveMatch !== undefined ? item.isActiveMatch : currentView === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setCurrentView(item.key);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`ps-nav-tab-item ${isAct ? 'active' : ''}`}
              >
                <span className="ps-tab-idx t-num">{item.idx}</span>
                <span>{item.label}</span>
                {item.badge && <span className="ps-tab-badge t-num">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Right Controls + Signature Phenomenon White Rectangular-Rounded CTA */}
        <div className="ps-nav-right">
          {isClerk && <span className="ps-dark-select">{COY_LABELS[user.assignedCoy]} DESK</span>}

          {/* Notification Bell */}
          <div className="notif-wrapper">
            <button
              type="button"
              className="ps-nav-icon-btn"
              onClick={() => setNotifOpen((prev) => !prev)}
              title="Command Notifications"
            >
              <span>ALERTS</span>
              {unreadNotifsCount > 0 && (
                <span className="ps-alert-dot-count t-num">{unreadNotifsCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="notif-dropdown-panel">
                <div className="notif-panel-header">
                  <strong>Command Notifications ({user.displayName})</strong>
                  <button type="button" onClick={handleMarkAllNotifsRead} className="forgot-pwd-link">
                    Mark all read
                  </button>
                </div>
                <div className="notif-panel-list">
                  {roleNotifs.length === 0 ? (
                    <div style={{ padding: '16px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                      No notifications for {user.displayName}.
                    </div>
                  ) : (
                    roleNotifs.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => {
                          setNotifOpen(false);
                          if (n.type.includes('LEAVE')) {
                            setCurrentView('movements');
                          } else if (n.type.includes('SECURITY') || n.type.includes('AI')) {
                            setCurrentView('ai');
                          }
                        }}
                      >
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-msg">{n.message}</div>
                        <div className="notif-item-meta">
                          <span>{n.time}</span>
                          {n.type === 'LEAVE_REQUEST' && isAdjutant && (
                            <span style={{ color: 'var(--status-present)', fontWeight: 700 }}>
                              Review &amp; Approve &rarr;
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetDemo}
            className="ps-nav-icon-btn"
            title="Restore default Garhwal Rifles records"
          >
            &#8635; RESET
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="ps-nav-icon-btn"
            title="Sign out"
          >
            EXIT &#8599;
          </button>

          {/* Signature Phenomenon Pinned Top-Right White Rectangular-Rounded Button */}
          <button
            type="button"
            className="ps-top-white-cta"
            onClick={() => {
              setPreselectedLeaveCoyId(null);
              setCurrentView('movements');
              setExternalLeaveModalOpen(true);
            }}
          >
            <span>+ APPLY LEAVE</span>
            <span className="ps-chevron">&rsaquo;</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          MAIN VIEWPORT CONTENT
          ==================================================================== */}
      <main className="ps-main-viewport">
        {currentView === 'overview' && (
          <OverviewView
            user={user}
            companies={companies}
            paradeSheet={paradeSheet}
            leaves={leaves}
            activityLogs={activityLogs}
            paradeSignInfo={paradeSignInfo}
            aiInsights={aiInsights}
            onNavigate={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onInspectCompany={handleOpenCompanyPage}
            onOpenApplyLeave={() => {
              setPreselectedLeaveCoyId(null);
              setCurrentView('movements');
              setExternalLeaveModalOpen(true);
            }}
            onAdjutantDecision={(lve, decision) =>
              handleAdjutantDecision(
                lve,
                decision,
                decision === 'APPROVED'
                  ? 'Approved by Adjutant / CO from Command Overview.'
                  : 'Not approved by Adjutant / CO.'
              )
            }
            onSignParadeState={handleSignParadeState}
            onRunRollCall={handleRunRollCall}
            onClearLogs={handleClearLogs}
          />
        )}

        {currentView !== 'overview' && (
          <div className="ps-inner-module-container">
            {currentView === 'directory' && (
              <CompanyDirectoryView
                user={user}
                companies={companies}
                onAddCompany={handleAddCompany}
                onUpdateCompany={handleUpdateCompany}
                onDeleteCompany={handleDeleteCompany}
                onInspectCompany={handleOpenCompanyPage}
                showToast={showToast}
              />
            )}

            {currentView === 'company-detail' && activeCompanyObj && (
              <CompanyDetailPage
                user={user}
                company={activeCompanyObj}
                paradeSheet={paradeSheet}
                leaves={leaves}
                onBack={() => setCurrentView('directory')}
                onOpenApplyLeaveForCompany={(coy) => {
                  setPreselectedLeaveCoyId(coy.id);
                  setCurrentView('movements');
                  setExternalLeaveModalOpen(true);
                }}
                onAdjutantDecision={handleAdjutantDecision}
                onMarkReturned={handleMarkReturned}
                onUpdateCompany={handleUpdateCompany}
                showToast={showToast}
              />
            )}

            {currentView === 'parade' && (
              <ParadeStateView
                user={user}
                paradeSheet={paradeSheet}
                paradeSignInfo={paradeSignInfo}
                onUpdateCell={handleUpdateParadeCell}
                onAddRow={handleAddParadeRow}
                onSignParadeState={handleSignParadeState}
                onResetSheet={handleResetParadeSheet}
                showToast={showToast}
              />
            )}

            {currentView === 'movements' && (
              <LeaveDutyView
                user={user}
                companies={companies}
                leaves={leaves}
                aiInsights={aiInsights}
                externalModalOpen={externalLeaveModalOpen}
                setExternalModalOpen={setExternalLeaveModalOpen}
                preselectedCompanyId={preselectedLeaveCoyId}
                onApplyLeave={handleApplyLeave}
                onAdjutantDecision={handleAdjutantDecision}
                onMarkReturned={handleMarkReturned}
                onDeleteLeave={handleDeleteLeave}
              />
            )}

            {currentView === 'ai' && (
              <AiAutomationView
                user={user}
                automations={automations}
                aiInsights={aiInsights}
                usersSecurityStatus={usersSecurityStatus}
                onToggleAutomation={handleToggleAutomation}
                onRunRollCall={handleRunRollCall}
                onUnlockAccount={handleUnlockAccount}
                showToast={showToast}
              />
            )}
          </div>
        )}
      </main>

      {/* TOAST NOTIFICATIONS */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span className="live-pulse-dot" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
