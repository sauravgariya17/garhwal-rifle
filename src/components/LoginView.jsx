import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { COY_KEYS, COY_LABELS, MOTIVATION_QUOTES } from '../utils/paradeCalc';

const MODULE_ROLES = [
  {
    index: 0,
    username: 'adjutant',
    role: 'ADJUTANT_CO',
    displayName: 'Adjutant / CO',
    code: '01',
    clearance: 'LEVEL-1 SUPREME COMMAND',
    accent: 'saffron',
    summary:
      'Full regimental & company oversight, exclusive soldier leave approval authority, and daily Parade State countersignature.',
    capabilities: ['All Companies Oversight', 'Leave Approval Authority', 'Parade Countersignature']
  },
  {
    index: 1,
    username: 'sa_itcell',
    role: 'SA_IT_CELL',
    displayName: 'SA / IT Cell',
    code: '02',
    clearance: 'LEVEL-2 SYSTEM & AI ADMIN',
    accent: 'gold',
    summary:
      'Parade State return compilation, company strength directory maintenance, AI automation rules, and security lockout recovery.',
    capabilities: ['Parade Sheet Compilation', 'AI & Automations Control', 'Security Lockout Reset']
  },
  {
    index: 2,
    username: 'coy_clerk',
    role: 'COMPANY_CLERK',
    displayName: 'Company Clerk',
    code: '03',
    clearance: 'LEVEL-3 COMPANY OPERATIONS',
    accent: 'emerald',
    summary:
      'Company-level office desk for daily roll call reporting and filing soldier leave applications with mandatory reason & calendar dates.',
    capabilities: ['Assigned Company Desk', 'Leave Filing to Adjutant', 'Return Movement Logging']
  }
];

export default function LoginView({ onLoginSuccess, showToast }) {
  const [selectedRole, setSelectedRole] = useState(MODULE_ROLES[0]);
  const [username, setUsername] = useState(MODULE_ROLES[0].username);
  // Password is never pre-filled or displayed on screen
  const [password, setPassword] = useState('');
  const [selectedCoy, setSelectedCoy] = useState('A');
  const [showPassword, setShowPassword] = useState(false);

  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteAnimState, setQuoteAnimState] = useState('idle');
  const [roleAnimState, setRoleAnimState] = useState('idle');

  const [serverRoles, setServerRoles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [lockMap, setLockMap] = useState({});
  const [nowTs, setNowTs] = useState(Date.now());
  const [shakeCard, setShakeCard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Forgot Password Modal State
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotUser, setForgotUser] = useState('adjutant');
  const [forgotStep, setForgotStep] = useState(1);
  const [signalOtp, setSignalOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [secAnswer, setSecAnswer] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');

  const passwordInputRef = useRef(null);
  const roleTabRefs = useRef([]);

  const fetchRolesStatus = async () => {
    try {
      const res = await api.getRoles();
      if (res && res.roles) {
        setServerRoles(res.roles);
        const locks = {};
        res.roles.forEach((r) => {
          if (r.locked && r.lockUntil) {
            locks[r.username] = r.lockUntil;
          }
        });
        setLockMap((prev) => ({ ...prev, ...locks }));
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchRolesStatus();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTs(Date.now());
    }, 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const qTimer = setInterval(() => {
      triggerQuoteChange((quoteIdx + 1) % MOTIVATION_QUOTES.length);
    }, 8500);
    return () => clearInterval(qTimer);
  }, [quoteIdx]);

  const triggerQuoteChange = (nextIndex) => {
    setQuoteAnimState('exiting');
    setTimeout(() => {
      setQuoteIdx(nextIndex);
      setQuoteAnimState('idle');
    }, 180);
  };

  const handleNextQuote = () => {
    triggerQuoteChange((quoteIdx + 1) % MOTIVATION_QUOTES.length);
  };

  const handleSelectModule = (mod, focusPassword = false) => {
    if (mod.username === selectedRole.username) return;
    setRoleAnimState('switching');
    setTimeout(() => setRoleAnimState('idle'), 200);

    setSelectedRole(mod);
    setUsername(mod.username);
    setPassword('');
    setErrorMsg('');

    const srv = serverRoles.find((r) => r.username === mod.username);
    if (srv) {
      setAttemptsLeft(Math.max(0, 3 - (srv.failedAttempts || 0)));
    } else {
      setAttemptsLeft(3);
    }

    if (focusPassword && passwordInputRef.current) {
      setTimeout(() => passwordInputRef.current?.focus(), 60);
    }
  };

  const handleRoleKeyDown = (e, idx) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (idx + 1) % MODULE_ROLES.length;
      handleSelectModule(MODULE_ROLES[nextIdx]);
      roleTabRefs.current[nextIdx]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (idx - 1 + MODULE_ROLES.length) % MODULE_ROLES.length;
      handleSelectModule(MODULE_ROLES[prevIdx]);
      roleTabRefs.current[prevIdx]?.focus();
    }
  };

  const currentLockUntil = lockMap[username];
  const remainingLockSec =
    currentLockUntil && currentLockUntil > nowTs
      ? Math.ceil((currentLockUntil - nowTs) / 1000)
      : 0;
  const isCurrentlyLocked = remainingLockSec > 0;

  const triggerShake = () => {
    setShakeCard(true);
    setTimeout(() => setShakeCard(false), 460);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (isCurrentlyLocked) {
      triggerShake();
      return;
    }
    if (!username.trim() || !password.trim()) {
      setErrorMsg(`Authentication requires the confidential password for ${selectedRole.displayName}.`);
      triggerShake();
      passwordInputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.login({
        username: username.trim(),
        password: password.trim(),
        selectedCoy
      });
      if (res && res.user) {
        onLoginSuccess(res.user);
      }
    } catch (err) {
      triggerShake();
      const data = err.data || {};
      setErrorMsg(err.message || 'Authentication failed.');
      if (typeof data.attemptsRemaining === 'number') {
        setAttemptsLeft(data.attemptsRemaining);
      }
      if (data.locked) {
        const until = data.lockUntil || Date.now() + (data.remainingSeconds || 60) * 1000;
        setLockMap((prev) => ({ ...prev, [username]: until }));
      }
      fetchRolesStatus();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenForgot = () => {
    setForgotUser(username || 'adjutant');
    setForgotStep(1);
    setSignalOtp('');
    setOtpInput('');
    setSecAnswer('');
    setNewPasswordInput('');
    setForgotMsg('');
    setForgotError('');
    setForgotOpen(true);
  };

  const handleRequestOtp = async () => {
    setForgotError('');
    try {
      const res = await api.forgotPassword({ username: forgotUser });
      setSignalOtp(res.demoOtp || '');
      setForgotMsg(res.message);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Could not generate Tactical Reset OTP.');
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');
    try {
      const res = await api.resetPassword({
        username: forgotUser,
        otp: otpInput,
        securityAnswer: secAnswer,
        newPassword: newPasswordInput
      });
      setLockMap((prev) => {
        const next = { ...prev };
        delete next[forgotUser];
        return next;
      });
      setAttemptsLeft(3);
      setErrorMsg('');
      setPassword('');
      await fetchRolesStatus();
      setForgotOpen(false);
      showToast(res.message || 'Password updated and module unlocked!');
    } catch (err) {
      setForgotError(err.message || 'Password reset failed.');
    }
  };

  const currentQuote = MOTIVATION_QUOTES[quoteIdx % MOTIVATION_QUOTES.length];

  return (
    <div className="ps-login-page">
      {/* Patriotic Tricolour Top Hairline */}
      <div className="ps-tricolour-top" aria-hidden="true">
        <span className="saffron" />
        <span className="white" />
        <span className="green" />
      </div>

      {/* Top Floating Brand Header (Phenomenon Style) */}
      <header className="ps-login-topbar">
        <div className="ps-brand-lockup">
          <div className="ps-brand-badge">GR</div>
          <div>
            <span className="ps-brand-name">THE GARHWAL RIFLES</span>
            <span className="ps-brand-tag">INDIAN ARMY &middot; INFANTRY REGIMENT</span>
          </div>
        </div>

        <div className="ps-topbar-actions">
          <span className="ps-reddot-pill">
            <i className="ps-saffron-dot" />
            <span>LANSDOWNE &middot; EST. 05 MAY 1887</span>
          </span>
          <button
            type="button"
            onClick={handleOpenForgot}
            className="ps-top-white-cta"
          >
            <span>PASSWORD RECOVERY</span>
            <span className="ps-chevron">&rsaquo;</span>
          </button>
        </div>
      </header>

      {/* Main Phenomenon-Style Split Hero Grid on Deep Obsidian (#090A0C) */}
      <div className="ps-login-grid">
        {/* LEFT COLUMN: MASSIVE EDITORIAL HEADLINE, SHOWREEL CARD & IN-NUMBERS BENTO */}
        <div className="ps-login-left">
          <div className="ps-eyebrow-row">
            <span className="ps-eyebrow-text">REGIMENTAL COMMAND &amp; PARADE PORTAL</span>
            <span className="ps-reddot-pill">
              <i className="ps-saffron-dot" />
              <span>BADRI VISHAL LAL KI JAI</span>
            </span>
          </div>

          <h1 className="ps-giant-headline">
            Command, strength, and parade readiness for{' '}
            <span className="ps-text-saffron">The Garhwal Rifles.</span>
          </h1>

          {/* Two Signature Phenomenon Buttons (Solid Saffron + Dark Bordered) */}
          <div className="ps-hero-btn-row">
            <button
              type="button"
              onClick={() => passwordInputRef.current?.focus()}
              className="ps-btn-saffron"
            >
              <span>SIGN IN TO PORTAL</span>
              <span className="ps-chevron">&rsaquo;</span>
            </button>
            <button
              type="button"
              onClick={handleNextQuote}
              className="ps-btn-dark-outline"
            >
              <span>REGIMENTAL ETHOS</span>
              <span className="ps-chevron">&rsaquo;</span>
            </button>
          </div>

          {/* 2-Column Editorial Showcase Block (Matching Video 00:01 - 00:04) */}
          <div className="ps-editorial-showcase-split">
            {/* Left Visual Card with Emerald-Tinted Military Backdrop & Glass Pill */}
            <div className="ps-showreel-card">
              <div className="ps-showreel-overlay" />
              <div className="ps-showreel-top-tags">
                <span className="ps-glass-tag">#GARHWAL-RIFLES</span>
                <span className="ps-glass-tag">#YUDHAYA-KRIT-NISHCHAYA</span>
              </div>

              <div className="ps-showreel-center-pill" onClick={handleNextQuote}>
                <span>ETHOS {String(quoteIdx + 1).padStart(2, '0')}/06</span>
                <span className="ps-chevron">&rsaquo;</span>
              </div>

              <div className={`ps-showreel-quote-box ${quoteAnimState === 'exiting' ? 'fading' : ''}`}>
                <p className="ps-showreel-quote">{currentQuote.quote}</p>
                <span className="ps-showreel-cite">{currentQuote.sub}</span>
              </div>
            </div>

            {/* Right Editorial Copy + 3-Column Recognition Grid + In Numbers 2x2 */}
            <div className="ps-editorial-right-col">
              <p className="ps-editorial-lead">
                One regiment. A proud legacy. A shared commitment to serve with courage, discipline, and resolve.
              </p>

              <div className="ps-hairline-label">
                RECOGNIZED FOR VALOR, DISCIPLINE, AND BATTLEFIELD PRECISION // 1887
              </div>

              {/* 3-Column Recognition Hairline Grid */}
              <div className="ps-recognition-3col">
                <div className="ps-rec-cell">
                  <div className="ps-rec-badge">VC &middot; AC</div>
                  <div className="ps-rec-text">03 Victoria Cross &amp; 01 Ashoka Chakra</div>
                </div>
                <div className="ps-rec-cell">
                  <div className="ps-rec-badge">MVC</div>
                  <div className="ps-rec-text">14 Maha Vir Chakra Gallantry Honours</div>
                </div>
                <div className="ps-rec-cell">
                  <div className="ps-rec-badge">6 COYS</div>
                  <div className="ps-rec-text">A, B, C, D, SP &amp; HQ Operational Wings</div>
                </div>
              </div>

              <div className="ps-hairline-label" style={{ marginTop: '22px' }}>
                THE GARHWAL RIFLES IN NUMBERS
              </div>

              {/* 2x2 Phenomenon Numbers Grid */}
              <div className="ps-numbers-2x2">
                <div className="ps-num-cell">
                  <div className="ps-big-num t-num">807</div>
                  <div className="ps-num-caption">Posted Battalion Parade State strength across 6 companies</div>
                </div>
                <div className="ps-num-cell">
                  <div className="ps-big-num t-num">1887</div>
                  <div className="ps-num-caption">Raised on 5 May 1887 at Lansdowne, Uttarakhand</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-CRAFT COMMAND AUTHENTICATION CARD */}
        <div className="ps-login-right">
          <div className={`ps-auth-card ${shakeCard ? 'is-shaking' : ''}`}>
            <div className="ps-tricolour-card-bar" aria-hidden="true">
              <span className="saffron" />
              <span className="white" />
              <span className="green" />
            </div>

            <div className="ps-auth-card-top">
              <div className="ps-clearance-tag">
                <i className={`ps-led ${selectedRole.accent}`} />
                <span className="t-num">{selectedRole.clearance}</span>
              </div>
              {isCurrentlyLocked ? (
                <span className="ps-shield-tag locked t-num">
                  &#128274; LOCKED 00:{String(remainingLockSec).padStart(2, '0')}
                </span>
              ) : (
                <span className="ps-shield-tag ready t-num">
                  {attemptsLeft}/3 SHIELD
                </span>
              )}
            </div>

            <div className="ps-auth-header">
              <span className="ps-auth-eyebrow">COMMAND GATEWAY // MODULE {selectedRole.code}</span>
              <h2 className="ps-auth-title">Authorize Command Access</h2>
              <p className="ps-auth-sub">
                Select your role module below and enter your confidential password.
              </p>
            </div>

            {/* Tactile Segmented Role Toggle */}
            <div className="ps-role-selector-wrap">
              <div
                className="ps-role-track"
                role="tablist"
                aria-label="Command Module Role Selector"
                style={{ '--active-idx': selectedRole.index }}
              >
                <div className="ps-role-thumb" aria-hidden="true" />
                {MODULE_ROLES.map((mod, idx) => {
                  const isSelected = selectedRole.username === mod.username;
                  const modLockUntil = lockMap[mod.username];
                  const modLockSec =
                    modLockUntil && modLockUntil > nowTs ? Math.ceil((modLockUntil - nowTs) / 1000) : 0;

                  return (
                    <button
                      key={mod.username}
                      ref={(el) => (roleTabRefs.current[idx] = el)}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => handleSelectModule(mod, true)}
                      onKeyDown={(e) => handleRoleKeyDown(e, idx)}
                      className={`ps-role-btn ${isSelected ? 'active' : ''}`}
                    >
                      <span>{mod.displayName}</span>
                      {modLockSec > 0 && <span className="t-num">&#128274;</span>}
                    </button>
                  );
                })}
              </div>

              <div className={`ps-role-summary-box ${roleAnimState === 'switching' ? 'fading' : ''}`}>
                <p>{selectedRole.summary}</p>
                <div className="ps-role-chips">
                  {selectedRole.capabilities.map((c, i) => (
                    <span key={i} className="ps-cap-pill">
                      #{c.toUpperCase().replace(/\s+/g, '-')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* LOCKOUT ALERT */}
            {isCurrentlyLocked && (
              <div className="gr-lockout-alert" role="alert" style={{ margin: '0 0 14px' }}>
                <div className="gr-lockout-top">
                  <span>&#9888; TIME-LIMIT SECURITY LOCKOUT</span>
                  <span className="gr-lockout-clock t-num">
                    00:{String(remainingLockSec).padStart(2, '0')}
                  </span>
                </div>
                <p className="gr-lockout-desc">
                  3 wrong password attempts recorded for <strong>{selectedRole.displayName}</strong>. Wait{' '}
                  <strong className="t-num">{remainingLockSec}s</strong> or use{' '}
                  <button type="button" onClick={handleOpenForgot} className="gr-inline-recover-btn">
                    Forgot Password
                  </button>.
                </p>
                <div className="gr-lockout-bar-track">
                  <div
                    className="gr-lockout-bar-fill"
                    style={{ width: `${Math.min(100, (remainingLockSec / 60) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* ERROR ALERT */}
            {errorMsg && !isCurrentlyLocked && (
              <div className="ps-auth-error" role="alert">
                <div>{errorMsg}</div>
                <div className="t-num" style={{ marginTop: '3px', fontSize: '11.5px', opacity: 0.85 }}>
                  Attempts remaining before 60s lockout: <strong>{attemptsLeft} / 3</strong>
                </div>
              </div>
            )}

            {/* SIGN IN FORM */}
            <form onSubmit={handleLoginSubmit} className="ps-auth-form" noValidate>
              <div className={selectedRole.role === 'COMPANY_CLERK' ? 'gr-form-split' : ''}>
                <div className="ps-field">
                  <label htmlFor="usernameInput">MODULE USERNAME</label>
                  <input
                    type="text"
                    id="usernameInput"
                    className="ps-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    disabled={isCurrentlyLocked}
                    required
                  />
                </div>

                {selectedRole.role === 'COMPANY_CLERK' && (
                  <div className="ps-field">
                    <label htmlFor="coyDeskSelect">COMPANY DESK</label>
                    <select
                      id="coyDeskSelect"
                      className="ps-input"
                      value={selectedCoy}
                      onChange={(e) => setSelectedCoy(e.target.value)}
                      disabled={isCurrentlyLocked}
                    >
                      {COY_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {COY_LABELS[k]} &mdash; Garhwal Rifles
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="ps-field">
                <div className="ps-field-label-row">
                  <label htmlFor="passwordInput">CONFIDENTIAL PASSWORD</label>
                  <button type="button" onClick={handleOpenForgot} className="ps-forgot-link">
                    Forgot Password?
                  </button>
                </div>
                <div className="ps-pwd-wrap">
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    id="passwordInput"
                    className="ps-input"
                    placeholder={`Enter ${selectedRole.displayName} password`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isCurrentlyLocked}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="ps-pwd-toggle"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="ps-btn-saffron full"
                disabled={isCurrentlyLocked || submitting}
              >
                <span>
                  {isCurrentlyLocked
                    ? `LOCKED — WAIT ${remainingLockSec}S`
                    : submitting
                    ? 'AUTHENTICATING...'
                    : `ENTER AS ${selectedRole.displayName.toUpperCase()}`}
                </span>
                <span className="ps-chevron">&rsaquo;</span>
              </button>
            </form>

            <div className="ps-auth-footer">
              <span>3-ATTEMPT TIME-LIMIT SHIELD</span>
              <span>&middot;</span>
              <span>AES-256 ENCRYPTED</span>
            </div>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {forgotOpen && (
        <div className="modal-backdrop open" onClick={() => setForgotOpen(false)}>
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">&#128273; Regimental Password Recovery &amp; Unlock</h3>
              <button type="button" className="modal-close-btn" onClick={() => setForgotOpen(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Module Account to Recover / Unlock</label>
                <select
                  className="form-input"
                  value={forgotUser}
                  onChange={(e) => {
                    setForgotUser(e.target.value);
                    setForgotStep(1);
                    setSignalOtp('');
                  }}
                >
                  {MODULE_ROLES.map((m) => (
                    <option key={m.username} value={m.username}>
                      {m.displayName} (Username: {m.username})
                    </option>
                  ))}
                </select>
              </div>

              {forgotStep === 1 ? (
                <div className="forgot-step-box">
                  <p style={{ fontSize: '14px', color: 'var(--text-body)', marginBottom: '12px' }}>
                    Dispatch a 6-digit Tactical Verification OTP via the Garhwal Rifles Signal Channel to reset your module password and clear any active 60-second time-limit lockout.
                  </p>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="ps-btn-saffron full"
                  >
                    <span>DISPATCH TACTICAL RESET OTP</span>
                    <span className="ps-chevron">&rsaquo;</span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleResetPasswordSubmit}
                  style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
                >
                  <div className="signal-flash-box">
                    <div style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--gold-dark)' }}>
                      &#9889; GARHWAL RIFLES SIGNAL FLASH (ONE-TIME RECOVERY CODE)
                    </div>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                      {forgotMsg} Verification OTP:{' '}
                      <strong className="t-num" style={{ fontSize: '18px', color: 'var(--status-present)' }}>
                        {signalOtp}
                      </strong>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label className="form-label">Enter 6-Digit Signal OTP *</label>
                      <input
                        type="text"
                        className="form-input t-num"
                        placeholder="6-digit OTP"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Regimental Raising Year *</label>
                      <input
                        type="text"
                        className="form-input t-num"
                        value={secAnswer}
                        onChange={(e) => setSecAnswer(e.target.value)}
                        placeholder="e.g. 1887"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password for Selected Module *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Enter new confidential password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      required
                    />
                  </div>

                  {forgotError && <div className="auth-error visible">{forgotError}</div>}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                    <button type="button" className="btn-secondary" onClick={() => setForgotOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="ps-btn-saffron">
                      <span>UPDATE PASSWORD &amp; UNLOCK</span>
                      <span className="ps-chevron">&rsaquo;</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
