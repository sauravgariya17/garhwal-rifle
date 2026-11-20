import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  COY_KEYS,
  COY_LABELS,
  INITIAL_PARADE_SHEET,
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_LEAVES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUTOMATIONS,
  INITIAL_LOGS
} from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'db.json');
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============================================================================
// DATABASE INITIALIZATION & PERSISTENCE
// ============================================================================

function createDefaultDb() {
  return {
    users: JSON.parse(JSON.stringify(INITIAL_USERS)),
    companies: JSON.parse(JSON.stringify(INITIAL_COMPANIES)),
    paradeSheet: JSON.parse(JSON.stringify(INITIAL_PARADE_SHEET)),
    leaves: JSON.parse(JSON.stringify(INITIAL_LEAVES)),
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
    automations: JSON.parse(JSON.stringify(INITIAL_AUTOMATIONS)),
    activityLogs: JSON.parse(JSON.stringify(INITIAL_LOGS)),
    paradeSignInfo: {
      signed: false,
      signedBy: null,
      signedAt: null,
      remarks: 'Awaiting Adjutant / CO Daily Countersignature'
    }
  };
}

let db = createDefaultDb();

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.users && parsed.companies && parsed.paradeSheet && parsed.leaves) {
        db = { ...createDefaultDb(), ...parsed };
        return;
      }
    }
  } catch (err) {
    console.error('Error loading db.json, using default seed data:', err.message);
  }
  db = createDefaultDb();
  saveDb();
}

function saveDb() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err.message);
  }
}

loadDb();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTimeNow() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTimeNow() {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = String(now.getDate()).padStart(2, '0');
  const m = months[now.getMonth()];
  const y = now.getFullYear();
  return `${d} ${m} ${y}, ${formatTimeNow()}`;
}

function addActivityLog(htmlText, actor = 'System') {
  db.activityLogs.unshift({
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    text: htmlText,
    actor,
    time: formatTimeNow()
  });
  if (db.activityLogs.length > 25) {
    db.activityLogs = db.activityLogs.slice(0, 25);
  }
}

function addNotification({ targetRole, type, leaveId = null, title, message }) {
  db.notifications.unshift({
    id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    targetRole,
    type,
    leaveId,
    title,
    message,
    time: formatTimeNow(),
    read: false
  });
  if (db.notifications.length > 40) {
    db.notifications = db.notifications.slice(0, 40);
  }
}

function findUserByIdentifier(identifier) {
  const clean = String(identifier || '').trim().toLowerCase();
  if (['adjutant', 'adjutant_co', 'co', 'admin', 'adjutant / co'].includes(clean)) {
    return db.users.find((u) => u.role === 'ADJUTANT_CO');
  }
  if (['sa_itcell', 'sa', 'itcell', 'it_cell', 'sa / it cell'].includes(clean)) {
    return db.users.find((u) => u.role === 'SA_IT_CELL');
  }
  if (['coy_clerk', 'clerk', 'company_clerk', 'company clerk'].includes(clean)) {
    return db.users.find((u) => u.role === 'COMPANY_CLERK');
  }
  return db.users.find((u) => u.username.toLowerCase() === clean);
}

function checkLockState(user) {
  if (!user) return { locked: false, remainingSeconds: 0 };
  if (user.lockUntil && Date.now() < user.lockUntil) {
    const remainingSeconds = Math.max(1, Math.ceil((user.lockUntil - Date.now()) / 1000));
    return { locked: true, remainingSeconds };
  }
  if (user.lockUntil && Date.now() >= user.lockUntil) {
    user.lockUntil = null;
    user.failedAttempts = 0;
    saveDb();
  }
  return { locked: false, remainingSeconds: 0 };
}

function sanitizeUser(user) {
  const lockState = checkLockState(user);
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    rankTitle: user.rankTitle,
    unitTitle: user.unitTitle,
    accessLabel: user.accessLabel,
    assignedCoy: user.assignedCoy,
    permissions: user.permissions,
    failedAttempts: user.failedAttempts || 0,
    locked: lockState.locked,
    remainingSeconds: lockState.remainingSeconds,
    lockUntil: user.lockUntil
  };
}

function calculateDaysInclusive(fromDate, toDate) {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

// Compute AI Tactical Insights & Leave Advisory for 19 Garhwal Rifles
function computeAiInsights() {
  const postedRow = db.paradeSheet.find((r) => r.key === 'POSTED') || db.paradeSheet[0];
  const lveRow = db.paradeSheet.find((r) => r.key === 'LVE') || db.paradeSheet[1];
  const absentRows = db.paradeSheet.filter((r) => r.key !== 'POSTED');

  const coyAnalysis = COY_KEYS.map((c) => {
    const p = postedRow.coys[c] || { offr: 0, jco: 0, or: 0 };
    const l = lveRow.coys[c] || { offr: 0, jco: 0, or: 0 };
    let absTotal = 0;
    absentRows.forEach((r) => {
      const cell = r.coys[c] || { offr: 0, jco: 0, or: 0 };
      absTotal += (Number(cell.offr) || 0) + (Number(cell.jco) || 0) + (Number(cell.or) || 0);
    });
    const postedTotal = (Number(p.offr) || 0) + (Number(p.jco) || 0) + (Number(p.or) || 0);
    const presentTotal = Math.max(0, postedTotal - absTotal);
    const lveTotal = (Number(l.offr) || 0) + (Number(l.jco) || 0) + (Number(l.or) || 0);
    const orLeavePct = p.or > 0 ? Number(((l.or / p.or) * 100).toFixed(1)) : 0;
    const presentPct = postedTotal > 0 ? Math.round((presentTotal / postedTotal) * 100) : 0;

    let riskLevel = 'OPTIMAL';
    let recommendation = `${COY_LABELS[c]} leave ratio (${orLeavePct}%) is within standard regimental ceiling.`;
    if (orLeavePct >= 25) {
      riskLevel = 'HIGH_LEAVE_LOAD';
      recommendation = `${COY_LABELS[c]} OR Leave is at ${orLeavePct}% (${l.or}/${p.or}). Restrict new non-emergency leaves.`;
    } else if (orLeavePct >= 20) {
      riskLevel = 'MODERATE_LOAD';
      recommendation = `${COY_LABELS[c]} OR Leave is at ${orLeavePct}%. Review pending applications carefully.`;
    }

    return {
      coyKey: c,
      coyLabel: COY_LABELS[c],
      postedTotal,
      presentTotal,
      lveTotal,
      orLeavePct,
      presentPct,
      riskLevel,
      recommendation
    };
  });

  const pendingLeaves = db.leaves.filter((l) => l.status === 'PENDING_ADJUTANT');
  const activeLeaves = db.leaves.filter((l) => l.status === 'APPROVED');

  const leaveAdvisories = {};
  db.leaves.forEach((lve) => {
    const coyInfo = coyAnalysis.find((c) => c.coyKey === lve.coyKey) || coyAnalysis[0];
    const isUrgent = /marriage|medical|hospital|death|emergency|surgery|mother|father|sister/i.test(lve.reason || '');
    if (coyInfo.orLeavePct >= 25 && !isUrgent) {
      leaveAdvisories[lve.id] = {
        badge: 'CAUTION · HIGH COY QUOTA',
        tone: 'attention',
        note: `AI Guardrail: ${coyInfo.coyLabel} is at ${coyInfo.orLeavePct}% OR leave. Recommend deferring or shortening duration unless urgent.`
      };
    } else if (coyInfo.orLeavePct >= 25 && isUrgent) {
      leaveAdvisories[lve.id] = {
        badge: 'PRIORITY COMPASSIONATE',
        tone: 'on-track',
        note: `AI Assessment: Although ${coyInfo.coyLabel} leave is ${coyInfo.orLeavePct}%, reason indicates high-priority family/medical ground. Recommend Adjutant approval.`
      };
    } else {
      leaveAdvisories[lve.id] = {
        badge: 'AI RECOMMENDED',
        tone: 'on-track',
        note: `AI Assessment: ${coyInfo.coyLabel} leave quota (${coyInfo.orLeavePct}%) is within safe threshold and dates (${lve.days} days) are valid.`
      };
    }
  });

  const totalSanctioned = db.companies.reduce((s, c) => s + (Number(c.sanctioned) || 0), 0);
  const totalPresent = db.companies.reduce((s, c) => s + (Number(c.present) || 0), 0);
  const overallReadiness = totalSanctioned > 0 ? Math.round((totalPresent / totalSanctioned) * 100) : 0;

  return {
    overallReadiness,
    pendingCount: pendingLeaves.length,
    activeAwayCount: activeLeaves.length,
    coyAnalysis,
    leaveAdvisories,
    headlineBrief: `19 Garhwal Rifles Readiness at ${overallReadiness}% across ${db.companies.length} reporting companies. ${pendingLeaves.length} leave application(s) awaiting Adjutant / CO decision.`
  };
}

// ============================================================================
// 1. AUTHENTICATION, LOCKOUT & FORGOT PASSWORD ROUTES
// ============================================================================

app.get('/api/auth/roles', (req, res) => {
  const roles = db.users.map((u) => {
    const lockState = checkLockState(u);
    return {
      username: u.username,
      role: u.role,
      displayName: u.displayName,
      rankTitle: u.rankTitle,
      accessLabel: u.accessLabel,
      assignedCoy: u.assignedCoy,
      failedAttempts: u.failedAttempts || 0,
      locked: lockState.locked,
      remainingSeconds: lockState.remainingSeconds,
      lockUntil: u.lockUntil
    };
  });
  res.json({ roles });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password, selectedCoy } = req.body;
  const user = findUserByIdentifier(username);

  if (!user) {
    return res.status(404).json({
      error: 'Module user not found. Select Adjutant / CO, SA / IT Cell, or Company Clerk.'
    });
  }

  // Check if account is currently locked due to wrong password attempts
  const lockState = checkLockState(user);
  if (lockState.locked) {
    return res.status(423).json({
      error: `SECURITY LOCKOUT: ${user.displayName} module is locked due to 3 wrong password attempts. Please wait ${lockState.remainingSeconds}s or use Forgot Password.`,
      locked: true,
      remainingSeconds: lockState.remainingSeconds,
      lockUntil: user.lockUntil,
      attemptsRemaining: 0
    });
  }

  const lockoutAuto = db.automations.find((a) => a.key === 'autoBruteForceLockout');
  const maxAttempts = lockoutAuto && !lockoutAuto.enabled ? 99 : 3;
  const LOCK_DURATION_SECONDS = 60;

  // Verify module-specific password
  if (String(password || '').trim() !== user.password) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    const attemptsRemaining = Math.max(0, maxAttempts - user.failedAttempts);

    if (user.failedAttempts >= maxAttempts) {
      user.lockUntil = Date.now() + LOCK_DURATION_SECONDS * 1000;
      addActivityLog(
        `<strong>SECURITY LOCKOUT:</strong> <strong>${user.displayName}</strong> module locked for ${LOCK_DURATION_SECONDS}s after 3 wrong password attempts.`,
        'Security Watchdog'
      );
      addNotification({
        targetRole: 'SA_IT_CELL',
        type: 'SECURITY_ALERT',
        title: `Module Locked: ${user.displayName}`,
        message: `3 failed password attempts detected on ${user.displayName} (${user.username}). Account locked for ${LOCK_DURATION_SECONDS} seconds.`
      });
      saveDb();

      return res.status(423).json({
        error: `3 consecutive wrong password attempts! ${user.displayName} module is now locked for ${LOCK_DURATION_SECONDS} seconds.`,
        locked: true,
        remainingSeconds: LOCK_DURATION_SECONDS,
        lockUntil: user.lockUntil,
        attemptsRemaining: 0
      });
    }

    saveDb();
    return res.status(401).json({
      error: `Invalid password for ${user.displayName}. Each module requires its own distinct password! (${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining before ${LOCK_DURATION_SECONDS}s time-limit lockout)`,
      locked: false,
      attemptsRemaining
    });
  }

  // Successful login
  user.failedAttempts = 0;
  user.lockUntil = null;
  if (user.role === 'COMPANY_CLERK' && selectedCoy && COY_KEYS.includes(selectedCoy)) {
    user.assignedCoy = selectedCoy;
    user.unitTitle = `${COY_LABELS[selectedCoy]} — 19 Garhwal Rifles`;
  }

  addActivityLog(
    `<strong>${user.displayName}</strong> (${user.rankTitle}) signed into 19 Garhwal Rifles Command Portal.`,
    user.displayName
  );
  saveDb();

  return res.json({
    success: true,
    user: sanitizeUser(user)
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { username } = req.body;
  const user = findUserByIdentifier(username);
  if (!user) {
    return res.status(404).json({ error: 'Account not found for password recovery.' });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.resetOtp = otp;
  saveDb();

  return res.json({
    success: true,
    username: user.username,
    displayName: user.displayName,
    securityQuestion: user.securityQuestion,
    demoOtp: otp,
    message: `Tactical 6-digit Reset Code dispatched via 19 Garhwal Rifles Signal Channel for ${user.displayName}.`
  });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { username, otp, securityAnswer, newPassword } = req.body;
  const user = findUserByIdentifier(username);
  if (!user) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  if (!newPassword || String(newPassword).trim().length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
  }

  const cleanOtp = String(otp || '').trim();
  const cleanAns = String(securityAnswer || '').trim();
  const validOtp = (user.resetOtp && cleanOtp === user.resetOtp) || cleanOtp === '1887';
  const validAns = cleanAns === user.securityAnswer || cleanAns === '1887';

  if (!validOtp && !validAns) {
    return res.status(400).json({
      error: 'Invalid Tactical Reset OTP or Regimental Raising Year (Hint: 1887 or use the displayed Signal OTP).'
    });
  }

  user.password = String(newPassword).trim();
  user.failedAttempts = 0;
  user.lockUntil = null;
  user.resetOtp = null;

  addActivityLog(
    `<strong>Password Reset &amp; Unlock:</strong> Credentials updated for <strong>${user.displayName}</strong> via Regimental Security Recovery.`,
    user.displayName
  );
  saveDb();

  return res.json({
    success: true,
    message: `Password for ${user.displayName} has been updated and any time-limit lockout cleared!`
  });
});

app.post('/api/auth/unlock-account', (req, res) => {
  const { targetUsername, actorRole } = req.body;
  if (actorRole !== 'ADJUTANT_CO' && actorRole !== 'SA_IT_CELL') {
    return res.status(403).json({ error: 'Only Adjutant / CO or SA / IT Cell can unlock accounts.' });
  }
  const user = findUserByIdentifier(targetUsername);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  user.failedAttempts = 0;
  user.lockUntil = null;
  addActivityLog(`<strong>Account Unlocked:</strong> <strong>${user.displayName}</strong> lockout cleared by ${actorRole}.`, actorRole);
  saveDb();
  return res.json({ success: true, user: sanitizeUser(user) });
});

// ============================================================================
// 2. BOOTSTRAP DATA ROUTE
// ============================================================================

app.get('/api/bootstrap', (req, res) => {
  const usersSecurityStatus = db.users.map((u) => sanitizeUser(u));
  const aiInsights = computeAiInsights();

  res.json({
    companies: db.companies,
    paradeSheet: db.paradeSheet,
    leaves: db.leaves,
    notifications: db.notifications,
    automations: db.automations,
    activityLogs: db.activityLogs,
    paradeSignInfo: db.paradeSignInfo,
    usersSecurityStatus,
    aiInsights
  });
});

// ============================================================================
// 3. LEAVE & DUTY REGISTER + ADJUTANT NOTIFICATION & APPROVAL WORKFLOW
// ============================================================================

app.post('/api/leaves', (req, res) => {
  const {
    rankName,
    serviceNo,
    rankCategory = 'OR',
    companyId,
    category = 'Leave',
    leaveType = 'Annual Leave (AL)',
    reason,
    destination = 'Uttarakhand',
    fromDate,
    toDate,
    requestedBy = 'Company Clerk',
    actorRole = 'COMPANY_CLERK'
  } = req.body;

  if (!rankName || !serviceNo || !companyId) {
    return res.status(400).json({ error: 'Rank & Name, Service No., and Company are required.' });
  }
  if (!reason || String(reason).trim().length < 5) {
    return res.status(400).json({ error: 'A valid detailed reason for leave is mandatory.' });
  }
  if (!fromDate || !toDate) {
    return res.status(400).json({ error: 'Both Leave From date and Leave Till date must be selected on the calendar.' });
  }
  if (new Date(toDate) < new Date(fromDate)) {
    return res.status(400).json({ error: 'Leave Till date cannot be earlier than Leave From date.' });
  }

  const company = db.companies.find((c) => c.id === companyId) || db.companies[0];
  const days = calculateDaysInclusive(fromDate, toDate);

  // Every leave request goes to Adjutant for acceptance first!
  const newLeave = {
    id: 'lve-' + Date.now(),
    rankName: String(rankName).trim(),
    serviceNo: String(serviceNo).trim().toUpperCase(),
    rankCategory: ['OFFR', 'JCO', 'OR'].includes(rankCategory) ? rankCategory : 'OR',
    companyId: company.id,
    coyKey: company.coyKey || 'A',
    companyName: company.name,
    category,
    leaveType,
    reason: String(reason).trim(),
    destination: String(destination || 'Home Station').trim(),
    fromDate,
    toDate,
    days,
    status: 'PENDING_ADJUTANT',
    requestedBy,
    requestedAt: formatDateTimeNow(),
    approvedBy: null,
    approvedAt: null,
    adjutantRemarks: 'Notification sent to Adjutant / CO. Pending review & acceptance.'
  };

  db.leaves.unshift(newLeave);

  // Dispatch immediate notification to Adjutant / CO
  addNotification({
    targetRole: 'ADJUTANT_CO',
    type: 'LEAVE_REQUEST',
    leaveId: newLeave.id,
    title: `New Leave Request — ${newLeave.rankName} (${COY_LABELS[newLeave.coyKey] || newLeave.coyKey})`,
    message: `${requestedBy} applied for ${days} days ${leaveType} (${fromDate} to ${toDate}). Reason: "${newLeave.reason}". Awaiting Adjutant acceptance.`
  });

  addActivityLog(
    `<strong>Leave Application Submitted:</strong> <strong>${newLeave.rankName}</strong> (${newLeave.serviceNo}, ${company.name}) requested ${days} days (${fromDate} &rarr; ${toDate}). <em>Notification dispatched to Adjutant / CO.</em>`,
    requestedBy
  );

  saveDb();
  return res.status(201).json({
    success: true,
    leave: newLeave,
    message: 'Leave application submitted! Notification sent to Adjutant / CO for approval.'
  });
});

// Adjutant / CO Approval or Rejection Endpoint
app.patch('/api/leaves/:id/decision', (req, res) => {
  const { id } = req.params;
  const { decision, adjutantRemarks, actorRole } = req.body;

  if (actorRole !== 'ADJUTANT_CO') {
    return res.status(403).json({
      error: 'Access Denied: Only the Adjutant / CO has command authority to approve or reject leave applications.'
    });
  }

  const leave = db.leaves.find((l) => l.id === id);
  if (!leave) {
    return res.status(404).json({ error: 'Leave record not found.' });
  }
  if (leave.status !== 'PENDING_ADJUTANT') {
    return res.status(400).json({ error: `This leave request is already marked as ${leave.status}.` });
  }

  const company = db.companies.find((c) => c.id === leave.companyId);
  const autoSync = db.automations.find((a) => a.key === 'autoSyncParadeOnApproval');
  const shouldSyncParade = !autoSync || autoSync.enabled;

  if (decision === 'APPROVED') {
    leave.status = 'APPROVED';
    leave.approvedBy = 'Adjutant / CO (19 GARH RIF)';
    leave.approvedAt = formatDateTimeNow();
    leave.adjutantRemarks = adjutantRemarks
      ? String(adjutantRemarks).trim()
      : 'Approved by Adjutant / CO 19 Garhwal Rifles. Leave certificate & movement pass authorized.';

    // Only after Adjutant acceptance does leave get approved and deducted from Present strength!
    if (shouldSyncParade) {
      if (company && company.present > 0) {
        company.present -= 1;
        if (leave.category === 'Leave') {
          company.leave += 1;
        } else {
          company.duty += 1;
        }
      }

      // Also update Parade State Sheet row (LVE or TD_WKSP)
      const targetRowKey = leave.category === 'Leave' ? 'LVE' : 'TD_WKSP';
      const sheetRow = db.paradeSheet.find((r) => r.key === targetRowKey);
      const coyKey = leave.coyKey && COY_KEYS.includes(leave.coyKey) ? leave.coyKey : 'A';
      const rankField = leave.rankCategory === 'OFFR' ? 'offr' : leave.rankCategory === 'JCO' ? 'jco' : 'or';

      if (sheetRow && sheetRow.coys[coyKey]) {
        sheetRow.coys[coyKey][rankField] = (Number(sheetRow.coys[coyKey][rankField]) || 0) + 1;
      }
    }

    // Mark related Adjutant notifications as read & notify Company Clerk
    db.notifications.forEach((n) => {
      if (n.leaveId === leave.id && n.targetRole === 'ADJUTANT_CO') {
        n.read = true;
      }
    });

    addNotification({
      targetRole: 'COMPANY_CLERK',
      type: 'LEAVE_APPROVED',
      leaveId: leave.id,
      title: `Leave Approved by Adjutant — ${leave.rankName}`,
      message: `Adjutant / CO approved ${leave.days} days ${leave.leaveType} (${leave.fromDate} to ${leave.toDate}) for ${leave.rankName}. Parade State automatically updated.`
    });

    addActivityLog(
      `<strong>Adjutant Approved Leave:</strong> <strong>${leave.rankName}</strong> (${leave.companyName}) approved for ${leave.days} days (${leave.fromDate} &rarr; ${leave.toDate}). Parade State updated.`,
      'Adjutant / CO'
    );
  } else if (decision === 'REJECTED') {
    leave.status = 'REJECTED';
    leave.approvedBy = 'Adjutant / CO (19 GARH RIF)';
    leave.approvedAt = formatDateTimeNow();
    leave.adjutantRemarks = adjutantRemarks
      ? String(adjutantRemarks).trim()
      : 'Not approved by Adjutant / CO due to operational company commitment.';

    db.notifications.forEach((n) => {
      if (n.leaveId === leave.id && n.targetRole === 'ADJUTANT_CO') {
        n.read = true;
      }
    });

    addNotification({
      targetRole: 'COMPANY_CLERK',
      type: 'LEAVE_REJECTED',
      leaveId: leave.id,
      title: `Leave Not Approved — ${leave.rankName}`,
      message: `Adjutant / CO rejected leave request (${leave.fromDate} to ${leave.toDate}) for ${leave.rankName}. Remarks: ${leave.adjutantRemarks}`
    });

    addActivityLog(
      `<strong>Adjutant Rejected Leave:</strong> <strong>${leave.rankName}</strong> (${leave.companyName}) request declined. Remarks: ${leave.adjutantRemarks}`,
      'Adjutant / CO'
    );
  } else {
    return res.status(400).json({ error: 'Decision must be APPROVED or REJECTED.' });
  }

  saveDb();
  return res.json({
    success: true,
    leave,
    message: `Leave request ${decision === 'APPROVED' ? 'approved and synced with Parade State' : 'rejected'}.`
  });
});

// Mark Soldier Returned from Leave / Duty
app.patch('/api/leaves/:id/return', (req, res) => {
  const { id } = req.params;
  const { actorName = 'Company Clerk' } = req.body;

  const leave = db.leaves.find((l) => l.id === id);
  if (!leave) {
    return res.status(404).json({ error: 'Leave record not found.' });
  }
  if (leave.status !== 'APPROVED') {
    return res.status(400).json({ error: 'Only approved active leaves can be marked as returned.' });
  }

  leave.status = 'RETURNED';
  leave.returnedAt = formatDateTimeNow();

  const company = db.companies.find((c) => c.id === leave.companyId);
  if (company) {
    if (leave.category === 'Leave' && company.leave > 0) {
      company.leave -= 1;
      company.present += 1;
    } else if (company.duty > 0) {
      company.duty -= 1;
      company.present += 1;
    }
  }

  const targetRowKey = leave.category === 'Leave' ? 'LVE' : 'TD_WKSP';
  const sheetRow = db.paradeSheet.find((r) => r.key === targetRowKey);
  const coyKey = leave.coyKey && COY_KEYS.includes(leave.coyKey) ? leave.coyKey : 'A';
  const rankField = leave.rankCategory === 'OFFR' ? 'offr' : leave.rankCategory === 'JCO' ? 'jco' : 'or';

  if (sheetRow && sheetRow.coys[coyKey] && sheetRow.coys[coyKey][rankField] > 0) {
    sheetRow.coys[coyKey][rankField] -= 1;
  }

  addActivityLog(
    `<strong>Reported Back from Leave/Duty:</strong> <strong>${leave.rankName}</strong> rejoined <strong>${leave.companyName}</strong>.`,
    actorName
  );
  saveDb();

  return res.json({ success: true, leave });
});

app.delete('/api/leaves/:id', (req, res) => {
  const { id } = req.params;
  db.leaves = db.leaves.filter((l) => l.id !== id);
  saveDb();
  return res.json({ success: true });
});

// ============================================================================
// 4. COMPANIES DIRECTORY ROUTES (19 GARHWAL RIFLES COMPANIES)
// ============================================================================

app.post('/api/companies', (req, res) => {
  const {
    name,
    battalion = '19 Garhwal Rifles (19 GARH RIF)',
    coyKey = 'A',
    subtitle = 'Rifle Company · 19 GARH RIF',
    location,
    commander = 'Maj. Company Commander',
    sanctioned,
    present,
    leave,
    duty,
    actorRole
  } = req.body;

  if (actorRole === 'COMPANY_CLERK') {
    return res.status(403).json({ error: 'Company Clerk cannot create or delete Battalion Company formations.' });
  }

  const s = Math.max(1, Number(sanctioned) || 120);
  const p = Math.max(0, Number(present) || 0);
  const l = Math.max(0, Number(leave) || 0);
  const d = Math.max(0, Number(duty) || 0);

  const newCoy = {
    id: 'coy-' + Date.now(),
    coyKey: COY_KEYS.includes(coyKey) ? coyKey : 'A',
    name: String(name || 'New Company — 19 Garhwal Rifles').trim(),
    battalion: String(battalion).trim(),
    subtitle: String(subtitle).trim(),
    location: String(location || 'Lansdowne Sector').trim(),
    commander: String(commander).trim(),
    sanctioned: s,
    posted: p + l + d,
    present: p,
    leave: l,
    duty: d
  };

  db.companies.push(newCoy);
  addActivityLog(`Added company formation <strong>${newCoy.name}</strong> at ${newCoy.location}.`, actorRole);
  saveDb();
  return res.status(201).json({ success: true, company: newCoy });
});

app.put('/api/companies/:id', (req, res) => {
  const { id } = req.params;
  const { name, battalion, coyKey, subtitle, location, commander, sanctioned, present, leave, duty, actorRole } = req.body;

  if (actorRole === 'COMPANY_CLERK') {
    return res.status(403).json({ error: 'Company Clerk does not have permission to edit Battalion Company establishment.' });
  }

  const idx = db.companies.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Company record not found.' });
  }

  const s = Math.max(1, Number(sanctioned) || db.companies[idx].sanctioned);
  const p = Math.max(0, Number(present) || 0);
  const l = Math.max(0, Number(leave) || 0);
  const d = Math.max(0, Number(duty) || 0);

  db.companies[idx] = {
    ...db.companies[idx],
    name: String(name || db.companies[idx].name).trim(),
    battalion: String(battalion || db.companies[idx].battalion).trim(),
    coyKey: COY_KEYS.includes(coyKey) ? coyKey : db.companies[idx].coyKey,
    subtitle: String(subtitle || db.companies[idx].subtitle).trim(),
    location: String(location || db.companies[idx].location).trim(),
    commander: String(commander || db.companies[idx].commander).trim(),
    sanctioned: s,
    posted: p + l + d,
    present: p,
    leave: l,
    duty: d
  };

  addActivityLog(`Updated company strength for <strong>${db.companies[idx].name}</strong> (${p} present).`, actorRole);
  saveDb();
  return res.json({ success: true, company: db.companies[idx] });
});

app.delete('/api/companies/:id', (req, res) => {
  const { id } = req.params;
  const { actorRole } = req.query;
  if (actorRole === 'COMPANY_CLERK') {
    return res.status(403).json({ error: 'Company Clerk cannot delete company formations.' });
  }
  const target = db.companies.find((c) => c.id === id);
  db.companies = db.companies.filter((c) => c.id !== id);
  if (target) {
    addActivityLog(`Removed company formation <strong>${target.name}</strong> from directory.`, actorRole || 'Command');
  }
  saveDb();
  return res.json({ success: true });
});

// ============================================================================
// 5. PARADE STATE SHEET ROUTES
// ============================================================================

app.put('/api/parade/cell', (req, res) => {
  const { rowKey, coyKey, offr, jco, or, actorRole } = req.body;
  if (actorRole === 'COMPANY_CLERK') {
    return res.status(403).json({
      error: 'Restricted: Company Clerk cannot directly overwrite Battalion Parade Sheet cells. Submit leave/duty requests for Adjutant approval.'
    });
  }

  const row = db.paradeSheet.find((r) => r.key === rowKey);
  if (!row || !COY_KEYS.includes(coyKey)) {
    return res.status(404).json({ error: 'Parade sheet row or company key invalid.' });
  }

  row.coys[coyKey] = {
    offr: Math.max(0, Number(offr) || 0),
    jco: Math.max(0, Number(jco) || 0),
    or: Math.max(0, Number(or) || 0)
  };

  addActivityLog(
    `Updated Parade State <strong>${row.label}</strong> (${COY_LABELS[coyKey]}): OFFR ${row.coys[coyKey].offr}, JCO ${row.coys[coyKey].jco}, OR ${row.coys[coyKey].or}.`,
    actorRole
  );
  saveDb();
  return res.json({ success: true, row });
});

app.post('/api/parade/row', (req, res) => {
  const { label, actorRole } = req.body;
  if (actorRole === 'COMPANY_CLERK') {
    return res.status(403).json({ error: 'Only Adjutant / CO or SA / IT Cell can add deployment rows.' });
  }
  const cleanLabel = String(label || '').trim().toUpperCase();
  if (!cleanLabel) {
    return res.status(400).json({ error: 'Deployment row label is required.' });
  }

  const newRow = {
    key: 'CUSTOM_' + Date.now(),
    label: cleanLabel,
    coys: {
      A: { offr: 0, jco: 0, or: 0 },
      B: { offr: 0, jco: 0, or: 0 },
      C: { offr: 0, jco: 0, or: 0 },
      D: { offr: 0, jco: 0, or: 0 },
      SP: { offr: 0, jco: 0, or: 0 },
      HQ: { offr: 0, jco: 0, or: 0 }
    }
  };
  db.paradeSheet.push(newRow);
  addActivityLog(`Added new deployment row <strong>${cleanLabel}</strong> to 19 Garhwal Rifles Parade Sheet.`, actorRole);
  saveDb();
  return res.status(201).json({ success: true, row: newRow });
});

app.post('/api/parade/sign', (req, res) => {
  const { actorRole, remarks } = req.body;
  if (actorRole !== 'ADJUTANT_CO') {
    return res.status(403).json({ error: 'Only Adjutant / CO can countersign the Daily Battalion Parade State Return.' });
  }
  db.paradeSignInfo = {
    signed: true,
    signedBy: 'Col. R.S. Rawat (CO) / Maj. V.S. Bhandari (Adjutant, 19 GARH RIF)',
    signedAt: formatDateTimeNow(),
    remarks: remarks || 'Parade State verified and countersigned for 19 Garhwal Rifles.'
  };
  addActivityLog(`<strong>DAILY PARADE STATE COUNTERSIGNED</strong> by <strong>Adjutant / CO (19 GARH RIF)</strong>.`, 'Adjutant / CO');
  saveDb();
  return res.json({ success: true, paradeSignInfo: db.paradeSignInfo });
});

app.post('/api/parade/reset', (req, res) => {
  db.paradeSheet = JSON.parse(JSON.stringify(INITIAL_PARADE_SHEET));
  addActivityLog(`Restored 19 Garhwal Rifles Parade State Sheet to baseline figures.`, 'SA / IT Cell');
  saveDb();
  return res.json({ success: true, paradeSheet: db.paradeSheet });
});

// ============================================================================
// 6. AI COMMAND ASSISTANT & AUTOMATION ROUTES
// ============================================================================

app.post('/api/ai/chat', (req, res) => {
  const { prompt } = req.body;
  const q = String(prompt || '').toLowerCase();
  const insights = computeAiInsights();
  const pending = db.leaves.filter((l) => l.status === 'PENDING_ADJUTANT');
  const approved = db.leaves.filter((l) => l.status === 'APPROVED');

  let reply = '';
  let actionItems = [];

  if (q.includes('sitrep') || q.includes('report') || q.includes('morning') || q.includes('summary')) {
    const highLeaveCoys = insights.coyAnalysis.filter((c) => c.orLeavePct >= 20).map((c) => `${c.coyLabel} (${c.orLeavePct}%)`);
    reply = `[19 GARHWAL RIFLES — AI TACTICAL SITREP]\n` +
      `• Overall Formation Readiness: ${insights.overallReadiness}% across ${db.companies.length} companies.\n` +
      `• Parade Sheet Strength: 807 Posted across A, B, C, D, SP & HQ Companies.\n` +
      `• Active QRF Deployments: QRF-1 (D Coy: 117 personnel) & QRF-2 (C Coy: 146 personnel).\n` +
      `• Leave Queue: ${pending.length} pending application(s) awaiting Adjutant / CO approval; ${approved.length} active leave/duty movements.\n` +
      `• AI Leave Quota Watch: ${highLeaveCoys.length ? highLeaveCoys.join(', ') + ' are above 20% OR leave.' : 'All companies within 20% leave norm.'}`;
    actionItems = [
      `Review ${pending.length} pending leave applications in Adjutant Approval Queue`,
      'Verify QRF-1 & QRF-2 relief rotation schedule',
      'Countersign today’s Parade State Sheet'
    ];
  } else if (q.includes('leave') || q.includes('quota') || q.includes('pending') || q.includes('approve')) {
    const pendingNames = pending.map((p) => `${p.rankName} (${COY_LABELS[p.coyKey]}: ${p.days}d from ${p.fromDate} to ${p.toDate} — Reason: ${p.reason})`).join('\n  - ');
    reply = `[AI LEAVE & QUOTA AUDIT — 19 GARH RIF]\n` +
      `• Pending Adjutant Approvals (${pending.length}):\n  - ${pendingNames || 'None pending'}\n` +
      `• Company OR Leave Percentages:\n  ` +
      insights.coyAnalysis.map((c) => `${c.coyLabel}: ${c.orLeavePct}% (${c.riskLevel})`).join(' | ');
    actionItems = [
      'Prioritize compassionate/marriage leave for Rfn. Ankit Singh Negi (A COY)',
      'Monitor B COY (27.9% OR leave) before granting non-urgent casual leaves'
    ];
  } else if (q.includes('qrf') || q.includes('deploy') || q.includes('company') || q.includes('coy')) {
    reply = `[19 GARHWAL RIFLES — COMPANY DEPLOYMENT ANALYSIS]\n` +
      `• Alpha Coy (A COY): Forward Sector & Chakbama Detachment (10 ORs, 1 JCO).\n` +
      `• Bravo Coy (B COY): Bishnupur Sector & QRF-2 Support (21 personnel).\n` +
      `• Charlie Coy (C COY): Primary QRF-2 Wing (52 from C Coy, 146 total Bn attachment).\n` +
      `• Delta Coy (D COY): Primary QRF-1 Wing (58 from D Coy, 117 total Bn attachment).\n` +
      `• Support Coy (SP COY) & HQ Coy: Heavy Weapons, Mortar, Signals & Main HQ administration.`;
    actionItems = [
      'Maintain minimum 75% combat availability in Ghatak Platoon',
      'Cross-check Chakbama detachment ration & winter gear state'
    ];
  } else {
    reply = `[GARHWAL TACTICAL AI ADVISOR — 19 GARH RIF]\n` +
      `I have analyzed the live Battalion database (${db.companies.length} companies, ${db.leaves.length} leave/duty records, 33 Parade State rows).\n` +
      `• Current Readiness: ${insights.overallReadiness}%\n` +
      `• Pending Adjutant Approvals: ${pending.length}\n` +
      `• Active Automations: ${db.automations.filter((a) => a.enabled).length} of ${db.automations.length} rules active.\n` +
      `Ask me to "Generate Morning SitRep", "Audit Company Leave Quotas", or "Analyze QRF Deployments".`;
    actionItems = [
      'Run Automated Morning Roll Call check',
      'Inspect Pending Leave Approvals Queue'
    ];
  }

  return res.json({
    success: true,
    reply,
    actionItems,
    timestamp: formatTimeNow()
  });
});

app.post('/api/automations/toggle', (req, res) => {
  const { id, actorRole } = req.body;
  if (actorRole === 'COMPANY_CLERK') {
    return res.status(403).json({ error: 'Only Adjutant / CO or SA / IT Cell can modify automation rules.' });
  }
  const rule = db.automations.find((a) => a.id === id);
  if (!rule) {
    return res.status(404).json({ error: 'Automation rule not found.' });
  }
  rule.enabled = !rule.enabled;
  rule.lastTriggered = rule.enabled ? `Enabled at ${formatTimeNow()}` : `Paused at ${formatTimeNow()}`;
  addActivityLog(
    `<strong>Automation ${rule.enabled ? 'Enabled' : 'Paused'}:</strong> ${rule.name}.`,
    actorRole
  );
  saveDb();
  return res.json({ success: true, automation: rule });
});

app.post('/api/automations/run-rollcall', (req, res) => {
  const { actorName = 'SA / IT Cell' } = req.body;
  const insights = computeAiInsights();
  const pendingCount = db.leaves.filter((l) => l.status === 'PENDING_ADJUTANT').length;

  db.automations.forEach((a) => {
    if (a.enabled) a.lastTriggered = `Executed at ${formatTimeNow()}`;
  });

  addActivityLog(
    `<strong>Automated Roll Call &amp; AI Audit Executed:</strong> Verified ${db.companies.length} Companies of 19 Garhwal Rifles (${insights.overallReadiness}% readiness, ${pendingCount} leaves queued for Adjutant).`,
    actorName
  );

  addNotification({
    targetRole: 'ADJUTANT_CO',
    type: 'AI_ALERT',
    title: `Automated 06:00 HRS Roll Call Completed (${insights.overallReadiness}% Readiness)`,
    message: `All ${db.companies.length} companies of 19 Garhwal Rifles verified. ${pendingCount} leave requests awaiting your approval.`
  });

  saveDb();
  return res.json({
    success: true,
    message: `Automated Roll Call & Leave Audit completed across ${db.companies.length} companies!`
  });
});

// ============================================================================
// 7. NOTIFICATIONS, LOGS & DEMO RESET
// ============================================================================

app.post('/api/notifications/read', (req, res) => {
  const { id, role } = req.body;
  if (id) {
    const n = db.notifications.find((item) => item.id === id);
    if (n) n.read = true;
  } else if (role) {
    db.notifications.forEach((n) => {
      if (n.targetRole === role || n.targetRole === 'ALL') n.read = true;
    });
  }
  saveDb();
  return res.json({ success: true });
});

app.post('/api/logs/clear', (req, res) => {
  db.activityLogs = [];
  saveDb();
  return res.json({ success: true });
});

app.post('/api/reset-demo', (req, res) => {
  db = createDefaultDb();
  saveDb();
  return res.json({
    success: true,
    message: 'Restored 19 Garhwal Rifles default companies, parade sheet, leave queue, and module passwords.'
  });
});

// ============================================================================
// 8. STATIC ASSETS & REACT FRONTEND SERVING
// ============================================================================

app.use('/assets', express.static(path.join(ROOT_DIR, 'assets')));

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`====================================================================`);
  console.log(` 19 GARHWAL RIFLES — EXPRESS BACKEND & COMMAND API SERVER`);
  console.log(` Listening on http://localhost:${PORT}`);
  console.log(`====================================================================`);
});
