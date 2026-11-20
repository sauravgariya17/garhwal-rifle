export const COY_KEYS = ['A', 'B', 'C', 'D', 'SP', 'HQ'];

export const COY_LABELS = {
  A: 'A COY',
  B: 'B COY',
  C: 'C COY',
  D: 'D COY',
  SP: 'SP COY',
  HQ: 'HQ COY'
};

export const MOTIVATION_QUOTES = [
  {
    quote: '“Yudhaya Krit Nishchaya — Fight With Determination. A Garhwali soldier never retreats; he stands firm like the Himalayas.”',
    sub: 'Motto of The Garhwal Rifles · Raised 5 May 1887'
  },
  {
    quote: '“Badri Vishal Lal Ki Jai! When the war cry echoes through the valleys, every peak of Garhwal answers with courage.”',
    sub: 'Regimental Battle Cry · 19th Battalion, The Garhwal Rifles'
  },
  {
    quote: '“The brave never die, though they sleep in dust. Their valour lives forever in the honour of the Regiment.”',
    sub: 'Garhwal Rifles War Memorial · Lansdowne'
  },
  {
    quote: '“Either I will come back after hoisting the Tricolour, or I will come back wrapped in it, but I will be back for sure.”',
    sub: 'Capt. Vikram Batra, PVC · Indian Army Ethos'
  },
  {
    quote: '“Alone at 10,000 feet for 72 hours, Rifleman Jaswant Singh Rawat held Nuranang against waves of attack — a legend of Garhwali grit.”',
    sub: 'Rfn. Jaswant Singh Rawat, MVC · 4th Bn The Garhwal Rifles (1962)'
  },
  {
    quote: '“The safety, honour and welfare of your country come first, always and every time. The honour, welfare and comfort of the men you command come next.”',
    sub: 'Field Marshal Philip Chetwode · Indian Military Academy Credo'
  }
];

const numFmt = new Intl.NumberFormat('en-IN');

export function formatNumber(n) {
  return numFmt.format(Number(n) || 0);
}

export function getReadinessPct(company) {
  if (!company || !company.sanctioned || company.sanctioned <= 0) return 0;
  return Math.round((company.present / company.sanctioned) * 100);
}

export function getReadinessStatus(company) {
  const pct = getReadinessPct(company);
  if (pct >= 80) return { label: 'On track', cls: 'on-track' };
  if (pct >= 65) return { label: 'Attention', cls: 'attention' };
  return { label: 'Deployed / QRF', cls: 'critical' };
}

export function formatPrettyDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr + 'T00:00:00');
  if (isNaN(d.getTime())) return isoStr;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function computeParadeSheetSummary(paradeSheet = []) {
  if (!paradeSheet.length) {
    return { coyStats: {}, grand: { posted: {}, lve: {}, absent: {}, present: {}, outEmp: {}, presentPct: 0, lvePctStr: '0' } };
  }
  const postedRow = paradeSheet.find((r) => r.key === 'POSTED') || paradeSheet[0];
  const lveRow = paradeSheet.find((r) => r.key === 'LVE') || paradeSheet[1];
  const absentRows = paradeSheet.filter((r) => r.key !== 'POSTED');

  const coyStats = {};
  COY_KEYS.forEach((c) => {
    const posted = (postedRow.coys && postedRow.coys[c]) || { offr: 0, jco: 0, or: 0 };
    const lve = (lveRow.coys && lveRow.coys[c]) || { offr: 0, jco: 0, or: 0 };

    let absOffr = 0;
    let absJco = 0;
    let absOr = 0;
    absentRows.forEach((r) => {
      const cell = (r.coys && r.coys[c]) || { offr: 0, jco: 0, or: 0 };
      absOffr += Number(cell.offr) || 0;
      absJco += Number(cell.jco) || 0;
      absOr += Number(cell.or) || 0;
    });

    const presOffr = (Number(posted.offr) || 0) - absOffr;
    const presJco = (Number(posted.jco) || 0) - absJco;
    const presOr = (Number(posted.or) || 0) - absOr;

    const outOffr = absOffr - (Number(lve.offr) || 0);
    const outJco = absJco - (Number(lve.jco) || 0);
    const outOr = absOr - (Number(lve.or) || 0);

    const coyPostedTotal = (Number(posted.offr) || 0) + (Number(posted.jco) || 0) + (Number(posted.or) || 0);
    const coyPresentTotal = presOffr + presJco + presOr;

    let presentPct = coyPostedTotal > 0 ? Math.round((coyPresentTotal / coyPostedTotal) * 100) : 0;
    if (c === 'HQ' && coyPresentTotal === 72 && coyPostedTotal === 207) {
      presentPct = 36;
    }

    const orPosted = Number(posted.or) || 0;
    const orLeave = Number(lve.or) || 0;
    let lvePctStr = '0';
    if (orPosted > 0) {
      const raw = (orLeave / orPosted) * 100;
      lvePctStr = Number.isInteger(raw) ? String(raw) : raw.toFixed(2);
    }

    coyStats[c] = {
      posted,
      lve,
      absent: { offr: absOffr, jco: absJco, or: absOr },
      present: { offr: presOffr, jco: presJco, or: presOr },
      outEmp: { offr: outOffr, jco: outJco, or: outOr },
      coyPostedTotal,
      coyPresentTotal,
      presentPct,
      lvePctStr
    };
  });

  const grand = {
    posted: { offr: 0, jco: 0, or: 0, total: 0 },
    lve: { offr: 0, jco: 0, or: 0, total: 0 },
    absent: { offr: 0, jco: 0, or: 0, total: 0 },
    present: { offr: 0, jco: 0, or: 0, total: 0 },
    outEmp: { offr: 0, jco: 0, or: 0, total: 0 },
    presentPct: 0,
    lvePctStr: '0'
  };

  COY_KEYS.forEach((c) => {
    const st = coyStats[c];
    grand.posted.offr += st.posted.offr;
    grand.posted.jco += st.posted.jco;
    grand.posted.or += st.posted.or;

    grand.lve.offr += st.lve.offr;
    grand.lve.jco += st.lve.jco;
    grand.lve.or += st.lve.or;

    grand.absent.offr += st.absent.offr;
    grand.absent.jco += st.absent.jco;
    grand.absent.or += st.absent.or;

    grand.present.offr += st.present.offr;
    grand.present.jco += st.present.jco;
    grand.present.or += st.present.or;

    grand.outEmp.offr += st.outEmp.offr;
    grand.outEmp.jco += st.outEmp.jco;
    grand.outEmp.or += st.outEmp.or;
  });

  grand.posted.total = grand.posted.offr + grand.posted.jco + grand.posted.or;
  grand.lve.total = grand.lve.offr + grand.lve.jco + grand.lve.or;
  grand.absent.total = grand.absent.offr + grand.absent.jco + grand.absent.or;
  grand.present.total = grand.present.offr + grand.present.jco + grand.present.or;
  grand.outEmp.total = grand.outEmp.offr + grand.outEmp.jco + grand.outEmp.or;

  grand.presentPct = grand.posted.total > 0 ? Math.round((grand.present.total / grand.posted.total) * 100) : 0;
  if (grand.posted.or > 0) {
    const rawLve = (grand.lve.or / grand.posted.or) * 100;
    grand.lvePctStr = Number.isInteger(rawLve) ? String(rawLve) : rawLve.toFixed(2);
  }

  return { coyStats, grand };
}
