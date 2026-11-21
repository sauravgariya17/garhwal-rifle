// ============================================================================
// THE GARHWAL RIFLES — SEED DATA & INITIAL COMPANY / PARADE STATE
// ============================================================================

export const COY_KEYS = ['A', 'B', 'C', 'D', 'SP', 'HQ'];

export const COY_LABELS = {
  A: 'A COY',
  B: 'B COY',
  C: 'C COY',
  D: 'D COY',
  SP: 'SP COY',
  HQ: 'HQ COY'
};

function makeRow(key, label, dataObj) {
  const row = { key, label, coys: {} };
  COY_KEYS.forEach((c) => {
    const vals = (dataObj && dataObj[c]) || [0, 0, 0];
    row.coys[c] = {
      offr: Number(vals[0]) || 0,
      jco: Number(vals[1]) || 0,
      or: Number(vals[2]) || 0
    };
  });
  return row;
}

// Exact 33 Rows from Parade State Sheet
export const INITIAL_PARADE_SHEET = [
  makeRow('POSTED', 'POSTED', {
    A: [2, 7, 100],
    B: [2, 7, 104],
    C: [2, 8, 109],
    D: [2, 7, 105],
    SP: [3, 16, 126],
    HQ: [4, 20, 183]
  }),
  makeRow('LVE', 'LVE', {
    A: [0, 1, 22],
    B: [1, 1, 29],
    C: [1, 1, 11],
    D: [0, 1, 14],
    SP: [1, 3, 26],
    HQ: [2, 8, 37]
  }),
  makeRow('MH', 'MH', {
    A: [0, 0, 4],
    C: [0, 0, 2],
    SP: [0, 0, 1]
  }),
  makeRow('SICK_LVE', 'SICK LVE', {}),
  makeRow('TD_WKSP', 'TD/210 FD/3 CORPS WKSP', {
    A: [0, 0, 1],
    B: [0, 0, 2],
    C: [0, 0, 1],
    D: [0, 0, 2],
    SP: [0, 0, 4],
    HQ: [0, 1, 6]
  }),
  makeRow('CHAKBAMA', 'CHAKBAMA', {
    A: [0, 1, 10],
    B: [0, 1, 6],
    C: [0, 2, 8],
    D: [0, 0, 6],
    SP: [0, 0, 13],
    HQ: [0, 0, 11]
  }),
  makeRow('DIMAPUR', '220 T.C/TC GD DIMAPUR', {
    A: [0, 0, 1],
    B: [0, 0, 1],
    C: [0, 1, 6],
    D: [0, 0, 2],
    SP: [0, 1, 0],
    HQ: [0, 0, 3]
  }),
  makeRow('JAG_BR', 'JAG BR', {
    C: [0, 0, 1]
  }),
  makeRow('LMS_TRANSIT', 'LMS TRANSIT', {}),
  makeRow('LEIMAKHONG_DIV', 'LEIMAKHONG DIV', {
    A: [0, 0, 2],
    B: [0, 0, 1]
  }),
  makeRow('GOC_HOUSE', 'GOC HOUSE LIEMAKHONG', {
    A: [0, 0, 1],
    HQ: [0, 0, 1]
  }),
  makeRow('EC', 'EC', {
    A: [0, 0, 1],
    D: [0, 0, 1],
    SP: [0, 0, 1]
  }),
  makeRow('QRF_1', 'QRF -1 (D) COY', {
    A: [0, 0, 4],
    B: [0, 0, 6],
    C: [0, 0, 5],
    D: [2, 3, 53],
    SP: [1, 2, 12],
    HQ: [0, 2, 27]
  }),
  makeRow('TA_165', '165 TA', {}),
  makeRow('MTN_BDE_59', '59 MTN BDE', {
    A: [0, 0, 1],
    D: [0, 0, 2],
    HQ: [0, 0, 1]
  }),
  makeRow('CDR_QRT', 'CDR QRT BISHNUPUR', {
    A: [0, 1, 1],
    B: [0, 0, 4],
    C: [0, 0, 3],
    D: [0, 0, 3],
    SP: [0, 0, 1],
    HQ: [0, 0, 2]
  }),
  makeRow('QRF_2', 'QRF -2 ( C ) COY', {
    A: [0, 3, 27],
    B: [1, 3, 17],
    C: [1, 3, 48],
    D: [0, 0, 1],
    SP: [0, 2, 16],
    HQ: [0, 2, 22]
  }),
  makeRow('GARH_ATT_16', '16 GARH RIF ATT', {
    A: [0, 0, 2],
    B: [0, 0, 2],
    D: [0, 0, 2],
    SP: [0, 0, 1]
  }),
  makeRow('CADRE_REL', 'CADRE RELIEVERS', {
    C: [0, 0, 2]
  }),
  makeRow('GRRC_1_9', '1/9 GRRC', {
    A: [0, 0, 2],
    B: [0, 0, 3],
    C: [0, 0, 3],
    D: [0, 0, 1]
  }),
  makeRow('ATT_GRRC_INSTR', 'ATT GRRC/NODE INSTR', {
    B: [0, 0, 3],
    C: [0, 0, 2],
    D: [0, 0, 1],
    SP: [0, 0, 2]
  }),
  makeRow('DEPOT_DRILL', 'DEPOT DRILL', {}),
  makeRow('MAIN_COURSE', 'MAIN COURSE', {
    A: [0, 1, 3],
    C: [0, 0, 1],
    D: [0, 0, 2],
    SP: [0, 0, 1],
    HQ: [0, 0, 1]
  }),
  makeRow('PRE_COURSE', 'PRE COURSE', {
    D: [0, 0, 3],
    SP: [0, 1, 1],
    HQ: [0, 0, 1]
  }),
  makeRow('MED_COMP', 'MED COMP TREATMENT', {
    B: [0, 0, 2],
    D: [0, 0, 1],
    HQ: [0, 1, 0]
  }),
  makeRow('BUDDY', 'BUDDY', {
    A: [0, 0, 3],
    D: [0, 0, 1]
  }),
  makeRow('ESM_GUARD', 'ESM COLONY GUARD', {}),
  makeRow('ATT_OUT_REC', 'ATT OUT( BY RECORDS)', {
    A: [0, 0, 1],
    HQ: [0, 0, 2]
  }),
  makeRow('DWARKA_GD', 'DWARKA VILL GD', {}),
  makeRow('MR_II_I', 'MR-II, MR-I', {
    A: [0, 0, 2],
    B: [0, 0, 2],
    C: [0, 0, 2],
    D: [0, 0, 1],
    SP: [0, 0, 2],
    HQ: [0, 0, 1]
  }),
  makeRow('BHAIRAV_BN', 'BHAIRAV BN', {
    A: [0, 0, 2],
    B: [0, 0, 1],
    C: [0, 1, 0],
    D: [0, 0, 3],
    SP: [0, 0, 1],
    HQ: [0, 0, 4]
  }),
  makeRow('SENAPATI_QRT', 'SENAPATI QRT', {}),
  makeRow('IMA_TRG', 'IMA OFFR TRG', {
    SP: [0, 0, 2]
  })
];

// Companies of The Garhwal Rifles (with rich dossier data for the dedicated Inside Company Page)
export const INITIAL_COMPANIES = [
  {
    id: 'coy-a',
    coyKey: 'A',
    name: 'Alpha Company (A COY) — 19 Garhwal Rifles',
    battalion: '19 Garhwal Rifles',
    subtitle: 'Assault Rifle Company · Forward Sector',
    location: 'Leimakhong Forward Sector',
    commander: 'Maj. V.S. Bhandari',
    secondInCommand: 'Capt. A.S. Negi',
    companyJco: 'Sub. H.S. Bisht',
    chm: 'CHM Vikram Singh Rawat',
    cqmh: 'CQMH Pradeep Singh',
    established: 'Raised with 19 GARH RIF (Lansdowne)',
    roleBrief: 'Primary forward rifle company responsible for high-altitude ridge dominance, Chakbama detachment security, and long-range perimeter patrolling.',
    platoons: [
      { name: 'No. 1 Rifle Platoon', cdr: 'Sub. H.S. Bisht', str: 34, post: 'Ridge Line Alpha-1' },
      { name: 'No. 2 Rifle Platoon', cdr: 'Nb. Sub. R.S. Panwar', str: 36, post: 'Chakbama Outpost' },
      { name: 'No. 3 Rifle Platoon', cdr: 'Nb. Sub. M.S. Gusain', str: 39, post: 'Forward Base Leimakhong' }
    ],
    logistics: { weapons: 98, comms: 96, winterGear: 100, rationsDays: 45 },
    sanctioned: 120,
    posted: 109,
    present: 74,
    leave: 23,
    duty: 12
  },
  {
    id: 'coy-b',
    coyKey: 'B',
    name: 'Bravo Company (B COY) — 19 Garhwal Rifles',
    battalion: '19 Garhwal Rifles',
    subtitle: 'Rifle Company · Bishnupur Sector',
    location: 'Bishnupur Tactical Base',
    commander: 'Maj. A.K. Rawat',
    secondInCommand: 'Capt. S.S. Chauhan',
    companyJco: 'Sub. K.S. Kandari',
    chm: 'CHM Suraj Singh Panwar',
    cqmh: 'CQMH Dinesh Bartwal',
    established: 'Raised with 19 GARH RIF (Lansdowne)',
    roleBrief: 'Tactical rifle wing guarding Bishnupur sector lines of communication and providing reserve strike elements for QRF-2 operations.',
    platoons: [
      { name: 'No. 4 Rifle Platoon', cdr: 'Sub. K.S. Kandari', str: 37, post: 'Bishnupur North Gate' },
      { name: 'No. 5 Rifle Platoon', cdr: 'Nb. Sub. D.S. Sajwan', str: 38, post: 'Sector Highway Grid' },
      { name: 'No. 6 Rifle Platoon', cdr: 'Nb. Sub. T.S. Rawat', str: 38, post: 'QRF Reserve Stand-by' }
    ],
    logistics: { weapons: 97, comms: 95, winterGear: 94, rationsDays: 40 },
    sanctioned: 120,
    posted: 113,
    present: 71,
    leave: 31,
    duty: 11
  },
  {
    id: 'coy-c',
    coyKey: 'C',
    name: 'Charlie Company (C COY) — 19 Garhwal Rifles',
    battalion: '19 Garhwal Rifles',
    subtitle: 'Rifle & QRF-2 Mobile Wing',
    location: 'Chakbama / QRF-2 Sector',
    commander: 'Maj. D.S. Gusain',
    secondInCommand: 'Capt. R.K. Thapliyal',
    companyJco: 'Sub. B.S.Butola',
    chm: 'CHM Mohan Singh',
    cqmh: 'CQMH Sanjay Singh Bisht',
    established: 'Raised with 19 GARH RIF (Lansdowne)',
    roleBrief: 'Lead Quick Reaction Force (QRF-2) company specializing in rapid mechanized insertion, convoy escort, and counter-infiltration sweeps.',
    platoons: [
      { name: 'No. 7 QRF Platoon', cdr: 'Sub. B.S. Butola', str: 40, post: 'QRF-2 Mobile Column A' },
      { name: 'No. 8 QRF Platoon', cdr: 'Nb. Sub. P.S. Negi', str: 39, post: 'QRF-2 Mobile Column B' },
      { name: 'No. 9 Rifle Platoon', cdr: 'Nb. Sub. V.S. Rawat', str: 40, post: 'Chakbama Tactical Node' }
    ],
    logistics: { weapons: 99, comms: 98, winterGear: 97, rationsDays: 50 },
    sanctioned: 125,
    posted: 119,
    present: 92,
    leave: 13,
    duty: 14
  },
  {
    id: 'coy-d',
    coyKey: 'D',
    name: 'Delta Company (D COY) — 19 Garhwal Rifles',
    battalion: '19 Garhwal Rifles',
    subtitle: 'Rifle & QRF-1 Strike Wing',
    location: 'Senapati / QRF-1 Detachment',
    commander: 'Maj. R.P. Chauhan',
    secondInCommand: 'Capt. N.S. Bisht',
    companyJco: 'Sub. G.S. Bhandari',
    chm: 'CHM Kuldeep Singh',
    cqmh: 'CQMH Naveen Rawat',
    established: 'Raised with 19 GARH RIF (Lansdowne)',
    roleBrief: 'Designated QRF-1 forward deployment wing conducting high-readiness area domination and night ambush patrols in Senapati sector.',
    platoons: [
      { name: 'No. 10 QRF-1 Platoon', cdr: 'Sub. G.S. Bhandari', str: 38, post: 'Senapati Forward Grid' },
      { name: 'No. 11 QRF-1 Platoon', cdr: 'Nb. Sub. A.S. Panwar', str: 38, post: 'Mobile Strike Group' },
      { name: 'No. 12 Rifle Platoon', cdr: 'Nb. Sub. S.S. Gusain', str: 38, post: '59 Mtn Bde Escort' }
    ],
    logistics: { weapons: 100, comms: 97, winterGear: 96, rationsDays: 42 },
    sanctioned: 120,
    posted: 114,
    present: 84,
    leave: 15,
    duty: 15
  },
  {
    id: 'coy-sp',
    coyKey: 'SP',
    name: 'Support Company (SP COY) — 19 Garhwal Rifles',
    battalion: '19 Garhwal Rifles',
    subtitle: 'Heavy Weapons, 81mm Mortar & ATGM Wing',
    location: 'Main Fire Support Base',
    commander: 'Maj. S.S. Negi',
    secondInCommand: 'Capt. P.S. Rawat',
    companyJco: 'Sub. Maj. K.S. Bartwal',
    chm: 'CHM Rajendra Singh',
    cqmh: 'CQMH Harish Kandari',
    established: 'Fire Support & Heavy Weapons Wing',
    roleBrief: 'Provides battalion-level heavy fire support including 81mm Mortar Platoon, Anti-Tank Guided Missile (ATGM) Detachment, Medium Machine Gun (MMG) section, and Assault Pioneers.',
    platoons: [
      { name: '81mm Mortar Platoon', cdr: 'Sub. J.S. Rawat', str: 48, post: 'Fire Support Base Alpha' },
      { name: 'ATGM & Anti-Tank Wing', cdr: 'Nb. Sub. K.S. Bartwal', str: 46, post: 'High Ground Defilade' },
      { name: 'Assault Pioneer & Sniper Pl', cdr: 'Nb. Sub. H.S. Negi', str: 51, post: 'Tactical Recon Base' }
    ],
    logistics: { weapons: 99, comms: 98, winterGear: 98, rationsDays: 48 },
    sanctioned: 155,
    posted: 145,
    present: 98,
    leave: 30,
    duty: 17
  },
  {
    id: 'coy-hq',
    coyKey: 'HQ',
    name: 'Headquarters Company (HQ COY) — 19 Garhwal Rifles',
    battalion: '19 Garhwal Rifles',
    subtitle: 'Command, Signals, MT, Medical & QM Wing',
    location: 'Battalion Command HQ',
    commander: 'Lt. Col. H.S. Rawat',
    secondInCommand: 'Maj. V.K.Dimri',
    companyJco: 'Sub. Maj. R.S. Negi',
    chm: 'BHM Devendra Singh',
    cqmh: 'BQMH Anil Sajwan',
    established: 'Battalion Command & Logistics Nerve Centre',
    roleBrief: 'Manages Battalion Headquarters administration, Signals & Cyber Communications, Mechanical Transport (MT) fleet, Regimental Medical Inspection (MI) Room, and Quartermaster ordinance stores.',
    platoons: [
      { name: 'Signal & IT Platoon', cdr: 'Sub. (IT) D.S. Negi', str: 52, post: 'Command Signal Exchange' },
      { name: 'Mechanical Transport (MT) Pl', cdr: 'Sub. M.S. Chauhan', str: 78, post: 'Battalion MT Park' },
      { name: 'QM, Medical & Admin Wing', cdr: 'Nb. Sub. S.P. Dimri', str: 77, post: 'Main Quartermaster Complex' }
    ],
    logistics: { weapons: 96, comms: 100, winterGear: 99, rationsDays: 60 },
    sanctioned: 215,
    posted: 207,
    present: 140,
    leave: 47,
    duty: 20
  },
  {
    id: 'coy-ghatak',
    coyKey: 'A',
    name: 'Ghatak Platoon (Commando Coy) — 19 Garhwal Rifles',
    battalion: '19 Garhwal Rifles',
    subtitle: 'Special Heliborne & Mountain Assault Wing',
    location: 'High Altitude Recon Post',
    commander: 'Capt. R.S. Panwar',
    secondInCommand: 'Sub. V.S. Gusain',
    companyJco: 'Sub. V.S. Gusain',
    chm: 'Hav. (Cdo) Rohit Rawat',
    cqmh: 'Hav. (Cdo) Sandeep Negi',
    established: 'Elite Commando Spearhead',
    roleBrief: 'Specially trained mountain warfare and close-quarter battle commando platoon capable of deep reconnaissance, raid operations, and cliff assault.',
    platoons: [
      { name: 'Assault Team Alpha', cdr: 'Sub. V.S. Gusain', str: 20, post: 'Recon Ridge North' },
      { name: 'Sniper & Demolition Team Bravo', cdr: 'Nb. Sub. A.K. Bisht', str: 20, post: 'Forward Helipad Base' }
    ],
    logistics: { weapons: 100, comms: 100, winterGear: 100, rationsDays: 45 },
    sanctioned: 42,
    posted: 40,
    present: 36,
    leave: 2,
    duty: 2
  },
  {
    id: 'coy-16gr',
    coyKey: 'SP',
    name: 'Attached Rifle Company — 16 Garhwal Rifles',
    battalion: '16 Garhwal Rifles (16 GARH RIF)',
    subtitle: 'Sister Formation Tactical Attachment',
    location: 'Dimapur / Transit Sector',
    commander: 'Maj. K.S. Bisht',
    secondInCommand: 'Capt. D.S. Rawat',
    companyJco: 'Sub. N.S. Panwar',
    chm: 'CHM Mukesh Bhandari',
    cqmh: 'CQMH Ramesh Negi',
    established: '16th Battalion, The Garhwal Rifles',
    roleBrief: 'Attached company from sister battalion 16 Garhwal Rifles providing joint sector reinforcement, transit security at Dimapur, and inter-battalion training exchange.',
    platoons: [
      { name: '16 GR Detachment Platoon 1', cdr: 'Sub. N.S. Panwar', str: 52, post: 'Dimapur Transit Camp' },
      { name: '16 GR Detachment Platoon 2', cdr: 'Nb. Sub. R.K. Sajwan', str: 52, post: 'Joint Sector Reserve' }
    ],
    logistics: { weapons: 97, comms: 96, winterGear: 95, rationsDays: 38 },
    sanctioned: 110,
    posted: 104,
    present: 91,
    leave: 7,
    duty: 6
  },
  {
    id: 'coy-grrc',
    coyKey: 'HQ',
    name: 'Training Company — 1/9 GRRC Lansdowne',
    battalion: 'The Garhwal Rifles Regimental Centre',
    subtitle: 'Recruit & Young Soldiers Training Wing',
    location: 'Lansdowne, Uttarakhand',
    commander: 'Lt. Col. M.S. Bartwal',
    secondInCommand: 'Maj. S.K. Rawat',
    companyJco: 'Sub. Maj. H.S. Gusain',
    chm: 'CHM (Instr) B.S. Negi',
    cqmh: 'CQMH P.S. Bhandari',
    established: 'Lansdowne Regimental Centre (Est. 1887)',
    roleBrief: 'Premier instructional company at The Garhwal Rifles Regimental Centre (Lansdowne) shaping Agniveers and Riflemen in musketry, fieldcraft, and Garhwali martial traditions.',
    platoons: [
      { name: 'Drill & Weapons Wing', cdr: 'Sub. H.S. Gusain', str: 88, post: 'Parade Ground Lansdowne' },
      { name: 'Fieldcraft & Battle Obstacle Wing', cdr: 'Nb. Sub. K.S. Rawat', str: 86, post: 'Kalagarh Tactical Range' }
    ],
    logistics: { weapons: 98, comms: 99, winterGear: 100, rationsDays: 60 },
    sanctioned: 180,
    posted: 174,
    present: 158,
    leave: 10,
    duty: 6
  }
];

// Separate company clerk credentials; each clerk is assigned to one company desk.
export const INITIAL_USERS = [
  {
    id: 'user-adjutant',
    username: 'adjutant',
    password: 'Adjutant@19GR',
    role: 'ADJUTANT_CO',
    displayName: 'Adjutant / CO',
    rankTitle: 'Col. R.S. Rawat (CO) / Maj. V.S. Bhandari (Adjutant)',
    unitTitle: 'The Garhwal Rifles · Command HQ',
    accessLabel: 'Command & Leave Approval Authority',
    assignedCoy: 'ALL',
    securityQuestion: 'What is the Raising Year of The Garhwal Rifles at Lansdowne?',
    securityAnswer: '1887',
    failedAttempts: 0,
    lockUntil: null,
    resetOtp: null,
    permissions: {
      canViewAllCompanies: true,
      canApproveLeave: true,
      canEditParadeSheet: true,
      canManageCompanies: true,
      canSignParadeState: true,
      canManageAutomations: true,
      canManageSecurity: true,
      canApplyLeave: true
    }
  },
  {
    id: 'user-sa',
    username: 'sa_itcell',
    password: 'ITCell@1887',
    role: 'SA_IT_CELL',
    displayName: 'SA / IT Cell',
    rankTitle: 'Sub. (IT) D.S. Negi — Signal & IT Cell',
    unitTitle: 'The Garhwal Rifles · IT & Parade Cell',
    accessLabel: 'System Admin, Parade Compilation & AI Cell',
    assignedCoy: 'ALL',
    securityQuestion: 'What is the Raising Year of The Garhwal Rifles at Lansdowne?',
    securityAnswer: '1887',
    failedAttempts: 0,
    lockUntil: null,
    resetOtp: null,
    permissions: {
      canViewAllCompanies: true,
      canApproveLeave: false,
      canEditParadeSheet: true,
      canManageCompanies: true,
      canSignParadeState: false,
      canManageAutomations: true,
      canManageSecurity: true,
      canApplyLeave: true
    }
  },
  {
    id: 'user-clerk-A', username: 'coy_clerk_a', password: 'AClerk@19GR', role: 'COMPANY_CLERK', displayName: 'A COY Clerk', rankTitle: 'Company Office Clerk', unitTitle: 'A COY — 19 Garhwal Rifles', accessLabel: 'Company Clerk Desk (Restricted Access)', assignedCoy: 'A', securityQuestion: 'What is the Raising Year of The Garhwal Rifles at Lansdowne?', securityAnswer: '1887', failedAttempts: 0, lockUntil: null, resetOtp: null, permissions: { canViewAllCompanies: false, canApproveLeave: false, canEditParadeSheet: false, canManageCompanies: false, canSignParadeState: false, canManageAutomations: false, canManageSecurity: false, canApplyLeave: true }
  },
  ...['B', 'C', 'D', 'SP', 'HQ'].map((coy) => ({
    id: `user-clerk-${coy}`, username: `coy_clerk_${coy.toLowerCase()}`,
    password: { B: 'BClerk@19GR', C: 'CClerk@19GR', D: 'DClerk@19GR', SP: 'SPClerk@19GR', HQ: 'HQClerk@19GR' }[coy],
    role: 'COMPANY_CLERK', displayName: `${coy} COY Clerk`, rankTitle: 'Company Office Clerk',
    unitTitle: `${COY_LABELS[coy]} — 19 Garhwal Rifles`, accessLabel: 'Company Clerk Desk (Restricted Access)', assignedCoy: coy,
    securityQuestion: 'What is the Raising Year of The Garhwal Rifles at Lansdowne?', securityAnswer: '1887',
    failedAttempts: 0, lockUntil: null, resetOtp: null,
    permissions: { canViewAllCompanies: false, canApproveLeave: false, canEditParadeSheet: false, canManageCompanies: false, canSignParadeState: false, canManageAutomations: false, canManageSecurity: false, canApplyLeave: true }
  }))
];

export const INITIAL_LEAVES = [
  {
    id: 'lve-101',
    rankName: 'Rfn. Ankit Singh Negi',
    serviceNo: 'GR-438910',
    rankCategory: 'OR',
    companyId: 'coy-a',
    coyKey: 'A',
    companyName: 'Alpha Company (A COY) — 19 Garhwal Rifles',
    category: 'Leave',
    leaveType: 'Annual Leave (AL)',
    reason: 'Sister marriage ceremony at Chamoli and urgent domestic family responsibility at ancestral village.',
    destination: 'Chamoli, Uttarakhand',
    fromDate: '2026-11-21',
    toDate: '2026-12-04',
    days: 14,
    status: 'PENDING_ADJUTANT',
    requestedBy: 'Company Clerk (A COY)',
    requestedAt: '20 Nov 2026, 08:15 AM',
    approvedBy: null,
    approvedAt: null,
    adjutantRemarks: 'Awaiting Adjutant / CO review and sanction.'
  },
  {
    id: 'lve-102',
    rankName: 'Nk. Vikram Singh Rawat',
    serviceNo: 'GR-425118',
    rankCategory: 'OR',
    companyId: 'coy-b',
    coyKey: 'B',
    companyName: 'Bravo Company (B COY) — 19 Garhwal Rifles',
    category: 'Leave',
    leaveType: 'Casual Leave (CL)',
    reason: 'Father medical checkup at Military Hospital Dehradun & pension documentation.',
    destination: 'Dehradun, Uttarakhand',
    fromDate: '2026-11-22',
    toDate: '2026-11-29',
    days: 8,
    status: 'PENDING_ADJUTANT',
    requestedBy: 'Company Clerk (B COY)',
    requestedAt: '20 Nov 2026, 09:05 AM',
    approvedBy: null,
    approvedAt: null,
    adjutantRemarks: 'Forwarded by OC B Coy for Adjutant approval.'
  },
  {
    id: 'lve-103',
    rankName: 'Sub. Maj. H.S. Bisht',
    serviceNo: 'GR-104821',
    rankCategory: 'JCO',
    companyId: 'coy-a',
    coyKey: 'A',
    companyName: 'Alpha Company (A COY) — 19 Garhwal Rifles',
    category: 'Duty / other',
    leaveType: 'Temporary Duty (TD)',
    reason: 'Commanding CHAKBAMA forward post winter stocking and perimeter inspection detail.',
    destination: 'Chakbama Forward Post',
    fromDate: '2026-11-12',
    toDate: '2026-11-24',
    days: 13,
    status: 'APPROVED',
    requestedBy: 'Company Clerk (A COY)',
    requestedAt: '11 Nov 2026, 05:30 PM',
    approvedBy: 'Adjutant / CO (Garhwal Rifles)',
    approvedAt: '11 Nov 2026, 06:10 PM',
    adjutantRemarks: 'Sanctioned. Detail reflected in Chakbama Parade State row.'
  },
  {
    id: 'lve-104',
    rankName: 'Hav. Suraj Singh Panwar',
    serviceNo: 'GR-418920',
    rankCategory: 'OR',
    companyId: 'coy-b',
    coyKey: 'B',
    companyName: 'Bravo Company (B COY) — 19 Garhwal Rifles',
    category: 'Leave',
    leaveType: 'Casual Leave (CL)',
    reason: '14 Days Casual Leave for house construction completion after monsoon damage in Rudraprayag.',
    destination: 'Rudraprayag, Uttarakhand',
    fromDate: '2026-11-13',
    toDate: '2026-11-26',
    days: 14,
    status: 'APPROVED',
    requestedBy: 'Company Clerk (B COY)',
    requestedAt: '12 Nov 2026, 10:00 AM',
    approvedBy: 'Adjutant / CO (Garhwal Rifles)',
    approvedAt: '12 Nov 2026, 11:30 AM',
    adjutantRemarks: 'Approved by Adjutant. Railway warrant issued.'
  },
  {
    id: 'lve-105',
    rankName: 'Nk. Pradeep Kandari',
    serviceNo: 'GR-429104',
    rankCategory: 'OR',
    companyId: 'coy-c',
    coyKey: 'C',
    companyName: 'Charlie Company (C COY) — 19 Garhwal Rifles',
    category: 'Duty / other',
    leaveType: 'Course / Detachment',
    reason: 'QRF-2 (C) COY mobile tactical patrol and quick reaction readiness deployment.',
    destination: 'QRF-2 Sector Grid',
    fromDate: '2026-11-10',
    toDate: '2026-12-05',
    days: 26,
    status: 'APPROVED',
    requestedBy: 'Company Clerk (C COY)',
    requestedAt: '09 Nov 2026, 04:00 PM',
    approvedBy: 'Adjutant / CO (Garhwal Rifles)',
    approvedAt: '09 Nov 2026, 05:00 PM',
    adjutantRemarks: 'Operational deployment order signed.'
  },
  {
    id: 'lve-106',
    rankName: 'Rfn. Deepak Sajwan',
    serviceNo: 'GR-439027',
    rankCategory: 'OR',
    companyId: 'coy-hq',
    coyKey: 'HQ',
    companyName: 'Headquarters Company (HQ COY) — 19 Garhwal Rifles',
    category: 'Leave',
    leaveType: 'Casual Leave (CL)',
    reason: '10 Days CL to attend child naming ceremony at Tehri Garhwal.',
    destination: 'Tehri Garhwal, Uttarakhand',
    fromDate: '2026-11-15',
    toDate: '2026-11-24',
    days: 10,
    status: 'APPROVED',
    requestedBy: 'Company Clerk (HQ COY)',
    requestedAt: '14 Nov 2026, 09:20 AM',
    approvedBy: 'Adjutant / CO (Garhwal Rifles)',
    approvedAt: '14 Nov 2026, 11:00 AM',
    adjutantRemarks: 'Approved.'
  },
  {
    id: 'lve-107',
    rankName: 'Nb. Sub. K.S. Bartwal',
    serviceNo: 'GR-208411',
    rankCategory: 'JCO',
    companyId: 'coy-sp',
    coyKey: 'SP',
    companyName: 'Support Company (SP COY) — 19 Garhwal Rifles',
    category: 'Leave',
    leaveType: 'Annual Leave (AL)',
    reason: 'Personal land registration work at Pauri Garhwal.',
    destination: 'Pauri Garhwal, Uttarakhand',
    fromDate: '2026-11-23',
    toDate: '2026-12-07',
    days: 15,
    status: 'PENDING_ADJUTANT',
    requestedBy: 'Company Clerk (SP COY)',
    requestedAt: '20 Nov 2026, 10:30 AM',
    approvedBy: null,
    approvedAt: null,
    adjutantRemarks: 'Pending Adjutant confirmation due to mortar firing exercise.'
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    targetRole: 'ADJUTANT_CO',
    type: 'LEAVE_REQUEST',
    leaveId: 'lve-101',
    title: 'Leave Approval Required — Rfn. Ankit Singh Negi (A COY)',
    message: 'Company Clerk (A COY) submitted 14 Days Annual Leave (21 Nov – 04 Dec 2026). Reason: Sister marriage ceremony at Chamoli.',
    time: '10 mins ago',
    read: false
  },
  {
    id: 'notif-2',
    targetRole: 'ADJUTANT_CO',
    type: 'LEAVE_REQUEST',
    leaveId: 'lve-102',
    title: 'Leave Approval Required — Nk. Vikram Singh Rawat (B COY)',
    message: 'Company Clerk (B COY) submitted 8 Days Casual Leave (22 Nov – 29 Nov 2026). Reason: Father medical checkup at MH Dehradun.',
    time: '35 mins ago',
    read: false
  },
  {
    id: 'notif-3',
    targetRole: 'ADJUTANT_CO',
    type: 'LEAVE_REQUEST',
    leaveId: 'lve-107',
    title: 'Leave Approval Required — Nb. Sub. K.S. Bartwal (SP COY)',
    message: 'Company Clerk (SP COY) submitted 15 Days Annual Leave (23 Nov – 07 Dec 2026). Reason: Land registration at Pauri Garhwal.',
    time: '1 hr ago',
    read: false
  },
  {
    id: 'notif-4',
    targetRole: 'COMPANY_CLERK',
    type: 'LEAVE_APPROVED',
    leaveId: 'lve-104',
    title: 'Adjutant Approved Leave — Hav. Suraj Singh Panwar',
    message: 'Adjutant / CO approved 14 Days CL (13 Nov – 26 Nov 2026). Parade State updated automatically.',
    time: 'Yesterday',
    read: false
  },
  {
    id: 'notif-5',
    targetRole: 'SA_IT_CELL',
    type: 'AI_ALERT',
    leaveId: null,
    title: 'AI Quota Watchdog: B COY OR Leave at 27.88%',
    message: 'Automated Parade Analyzer detected B COY OR Leave exceeds the 25% norm (29 of 104 ORs on leave). Advisory sent to Adjutant.',
    time: 'Today, 06:30 AM',
    read: false
  }
];

export const INITIAL_AUTOMATIONS = [
  {
    id: 'auto-sync-parade',
    key: 'autoSyncParadeOnApproval',
    name: 'Auto-Sync Parade State on Adjutant Leave Approval',
    description: 'Automatically increments Company LVE count in Parade State Sheet and deducts Present strength only after Adjutant / CO approves a leave request.',
    enabled: true,
    category: 'Parade Sync',
    lastTriggered: 'Today, 08:00 AM'
  },
  {
    id: 'auto-quota-guard',
    key: 'autoLeaveQuotaGuard',
    name: 'AI 25% Company Leave Cap Guardrail',
    description: 'Automatically attaches a High-Quota Warning on leave requests when a Company’s OR leave exceeds 25% of posted strength.',
    enabled: true,
    category: 'AI Policy Guard',
    lastTriggered: 'Today, 09:05 AM'
  },
  {
    id: 'auto-lockout-shield',
    key: 'autoBruteForceLockout',
    name: '3-Attempt Wrong Password Time-Limit Lockout (60s)',
    description: 'Locks any module account for 60 seconds after 3 wrong password attempts and dispatches a security alert to SA / IT Cell & Adjutant.',
    enabled: true,
    category: 'Cyber Security',
    lastTriggered: 'Active 24x7'
  },
  {
    id: 'auto-return-reminder',
    key: 'autoReturnWatchdog',
    name: 'Automated Leave Expiry & Return Watchdog',
    description: 'Scans active leaves daily at 06:00 HRS and flags personnel due to report back within 72 hours.',
    enabled: true,
    category: 'Roll Call Automation',
    lastTriggered: 'Today, 06:00 AM'
  }
];

export const INITIAL_LOGS = [
  {
    id: 'log-1',
    text: '<strong>THE GARHWAL RIFLES PARADE STATE</strong> compiled across A, B, C, D, SP &amp; HQ COY (807 Posted, 184 Present on HQ Parade, 159 LVE, 464 Out Emp).',
    actor: 'SA / IT Cell',
    time: '06:30 AM'
  },
  {
    id: 'log-2',
    text: '<strong>3 Pending Leave Requests</strong> queued for <strong>Adjutant / CO</strong> approval (Rfn. Ankit Singh Negi, Nk. Vikram Singh Rawat, Nb. Sub. K.S. Bartwal).',
    actor: 'Company Clerk',
    time: '09:10 AM'
  },
  {
    id: 'log-3',
    text: '<strong>QRF -2 (C) COY</strong> &amp; <strong>QRF -1 (D) COY</strong> tactical deployment verified (146 and 117 personnel deployed).',
    actor: 'Adjutant / CO',
    time: '06:24 AM'
  },
  {
    id: 'log-4',
    text: '<strong>AI Readiness Engine</strong> flagged Bravo Company (B COY) leave quota at 27.88% — cautious approval recommended.',
    actor: 'Garhwal Tactical AI',
    time: '06:15 AM'
  }
];
