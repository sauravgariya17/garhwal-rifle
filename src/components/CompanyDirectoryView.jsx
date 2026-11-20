import React, { useState } from 'react';
import { COY_KEYS, COY_LABELS, formatNumber, getReadinessPct, getReadinessStatus } from '../utils/paradeCalc';

export default function CompanyDirectoryView({
  user,
  companies,
  onAddCompany,
  onUpdateCompany,
  onDeleteCompany,
  onInspectCompany,
  showToast
}) {
  const isClerk = user.role === 'COMPANY_CLERK';
  const canManage = user.permissions?.canManageCompanies && !isClerk;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [coyFilter, setCoyFilter] = useState(isClerk ? user.assignedCoy : 'all');
  const [sortBy, setSortBy] = useState('default');

  // Add / Edit Company Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [name, setName] = useState('');
  const [battalion, setBattalion] = useState('19 Garhwal Rifles (19 GARH RIF)');
  const [coyKey, setCoyKey] = useState('A');
  const [subtitle, setSubtitle] = useState('Rifle Company · 19 GARH RIF');
  const [location, setLocation] = useState('');
  const [commander, setCommander] = useState('');
  const [sanctioned, setSanctioned] = useState(120);
  const [present, setPresent] = useState(90);
  const [leave, setLeave] = useState(18);
  const [duty, setDuty] = useState(12);

  // Scope companies for Company Clerk
  const baseCompanies = isClerk
    ? companies.filter((c) => c.coyKey === user.assignedCoy)
    : companies;

  const filtered = baseCompanies
    .filter((c) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        (c.commander || '').toLowerCase().includes(q) ||
        (c.battalion || '').toLowerCase().includes(q);
      if (!matchSearch) return false;

      if (!isClerk && coyFilter !== 'all' && c.coyKey !== coyFilter) return false;

      if (statusFilter !== 'all') {
        const st = getReadinessStatus(c);
        if (st.label !== statusFilter) return false;
      }
      return true;
    })
    .slice();

  if (sortBy === 'name-asc') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'sanctioned-desc') {
    filtered.sort((a, b) => b.sanctioned - a.sanctioned);
  } else if (sortBy === 'present-desc') {
    filtered.sort((a, b) => b.present - a.present);
  } else if (sortBy === 'readiness-desc') {
    filtered.sort((a, b) => getReadinessPct(b) - getReadinessPct(a));
  }

  const openAddModal = () => {
    setEditId('');
    setName('');
    setBattalion('19 Garhwal Rifles (19 GARH RIF)');
    setCoyKey('A');
    setSubtitle('Rifle Company · 19 GARH RIF');
    setLocation('Lansdowne / Forward Sector');
    setCommander('Maj. G.S. Rawat');
    setSanctioned(120);
    setPresent(92);
    setLeave(16);
    setDuty(10);
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditId(c.id);
    setName(c.name);
    setBattalion(c.battalion || '19 Garhwal Rifles (19 GARH RIF)');
    setCoyKey(c.coyKey || 'A');
    setSubtitle(c.subtitle || 'Rifle Company · 19 GARH RIF');
    setLocation(c.location);
    setCommander(c.commander || 'Maj. Company Commander');
    setSanctioned(c.sanctioned);
    setPresent(c.present);
    setLeave(c.leave);
    setDuty(c.duty);
    setModalOpen(true);
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    const payload = {
      name,
      battalion,
      coyKey,
      subtitle,
      location,
      commander,
      sanctioned: Number(sanctioned) || 120,
      present: Number(present) || 0,
      leave: Number(leave) || 0,
      duty: Number(duty) || 0
    };
    if (editId) {
      await onUpdateCompany(editId, payload);
    } else {
      await onAddCompany(payload);
    }
    setModalOpen(false);
  };

  const handleExportCsv = () => {
    const headers = [
      'Company Name',
      'Battalion / Regiment',
      'Coy Code',
      'Commanding Officer (OC)',
      'Location',
      'Sanctioned',
      'Posted',
      'Present',
      'Leave',
      'Duty / QRF',
      'Away',
      'Readiness %',
      'Status'
    ];
    const rows = filtered.map((c) => {
      const away = (Number(c.leave) || 0) + (Number(c.duty) || 0);
      const pct = getReadinessPct(c);
      const st = getReadinessStatus(c).label;
      return [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${(c.battalion || '19 Garhwal Rifles').replace(/"/g, '""')}"`,
        c.coyKey || 'A',
        `"${(c.commander || '').replace(/"/g, '""')}"`,
        `"${c.location.replace(/"/g, '""')}"`,
        c.sanctioned,
        c.posted,
        c.present,
        c.leave,
        c.duty,
        away,
        `${pct}%`,
        st
      ].join(',');
    });

    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '19-garhwal-rifles-company-directory.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Exported 19 Garhwal Rifles Company Directory to CSV');
  };

  const previewAway = (Number(leave) || 0) + (Number(duty) || 0);
  const previewPosted = (Number(present) || 0) + previewAway;
  const previewPct = sanctioned > 0 ? Math.round(((Number(present) || 0) / Number(sanctioned)) * 100) : 0;

  return (
    <section className="view-section active">
      <div className="page-header">
        <div>
          <h2 className="page-title">The Garhwal Rifles &mdash; Company Directory</h2>
          <p className="page-subtitle">
            Click any company below to open its full dedicated <strong>Inside Company Command Page</strong> (Platoons, Parade Breakdown, Leave Roster &amp; Logistics).
          </p>
        </div>
        <div className="page-header-actions">
          <button type="button" onClick={handleExportCsv} className="btn-secondary">
            <span>&#8681; Export Company CSV</span>
          </button>
          {canManage && (
            <button type="button" onClick={openAddModal} className="btn-primary">
              <span>+ Add Company Formation</span>
            </button>
          )}
        </div>
      </div>

      {/* Indian Army Regimental Hierarchy & Company Structure Banner */}
      <div className="hierarchy-info-banner">
        <div className="hierarchy-col">
          <span className="hierarchy-label">REGIMENT</span>
          <strong className="hierarchy-val">The Garhwal Rifles (Lansdowne, Est. 1887)</strong>
        </div>
        <span className="hierarchy-arrow">&rarr;</span>
        <div className="hierarchy-col">
          <span className="hierarchy-label">FORMATIONS</span>
          <strong className="hierarchy-val">19 Garhwal Rifles &middot; 16 Garhwal Rifles &middot; 1/9 GRRC</strong>
        </div>
        <span className="hierarchy-arrow">&rarr;</span>
        <div className="hierarchy-col">
          <span className="hierarchy-label">OPERATIONAL SUB-UNITS (COMPANIES)</span>
          <strong className="hierarchy-val">
            A COY &middot; B COY &middot; C COY &middot; D COY &middot; SP COY &middot; HQ COY &middot; Ghatak Platoon
          </strong>
        </div>
      </div>

      {isClerk && (
        <div className="rbac-notice-strip">
          &#128274; <strong>Company Clerk Restricted View:</strong> You are viewing records for your assigned company desk ({COY_LABELS[user.assignedCoy]}). Adding, editing, or deleting Battalion companies requires <strong>Adjutant / CO</strong> or <strong>SA / IT Cell</strong> clearance.
        </div>
      )}

      {/* Search & Filter Toolbar */}
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
              placeholder="Search company, OC, or sector..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!isClerk && (
            <select
              className="filter-select"
              value={coyFilter}
              onChange={(e) => setCoyFilter(e.target.value)}
            >
              <option value="all">All 19 GARH RIF Companies</option>
              {COY_KEYS.map((k) => (
                <option key={k} value={k}>
                  {COY_LABELS[k]} Wing
                </option>
              ))}
            </select>
          )}

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All readiness states</option>
            <option value="On track">On track (&ge;80%)</option>
            <option value="Attention">Attention (65&ndash;79%)</option>
            <option value="Deployed / QRF">Deployed / QRF (&lt;65%)</option>
          </select>

          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="default">Default order</option>
            <option value="name-asc">Company Name (A &rarr; Z)</option>
            <option value="sanctioned-desc">Sanctioned (High &rarr; Low)</option>
            <option value="present-desc">Present (High &rarr; Low)</option>
            <option value="readiness-desc">Readiness % (High &rarr; Low)</option>
          </select>
        </div>

        <div className="toolbar-right">
          <span>
            {filtered.length} {filtered.length === 1 ? 'company' : 'companies'}
          </span>
        </div>
      </div>

      {/* Company Directory Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>IDX</th>
                <th>COMPANY / FORMATION</th>
                <th>COMPANY COMMANDER (OC)</th>
                <th>SECTOR / LOCATION</th>
                <th>SANCTIONED</th>
                <th>PRESENT</th>
                <th>ON LEAVE / DUTY</th>
                <th>READINESS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No matching companies found.
                  </td>
                </tr>
              ) : (
                filtered.map((c, idx) => {
                  const away = (Number(c.leave) || 0) + (Number(c.duty) || 0);
                  const pct = getReadinessPct(c);
                  const st = getReadinessStatus(c);
                  return (
                    <tr key={c.id} className="clickable-coy-row" onClick={() => onInspectCompany(c)}>
                      <td className="ph-table-mono-idx t-num">{String(idx + 1).padStart(2, '0')}</td>
                      <td>
                        <div className="cell-unit-primary">
                          {c.name} <span className="ph-cta-arrow" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>&#8599;</span>
                        </div>
                        <div className="cell-unit-sub">
                          <span className="ph-tag-pill sm">#{COY_LABELS[c.coyKey] || c.coyKey}</span> &middot;{' '}
                          {c.battalion || 'The Garhwal Rifles'} &middot; {c.subtitle}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.commander || 'Maj. OC'}</td>
                      <td>{c.location}</td>
                      <td className="cell-num t-num">{formatNumber(c.sanctioned)}</td>
                      <td className="cell-num t-num">{formatNumber(c.present)}</td>
                      <td className="cell-num t-num">
                        {formatNumber(away)}{' '}
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                          ({c.leave} Lve / {c.duty} Duty)
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${st.cls} t-num`}>
                          {st.label} ({pct}%)
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="row-actions">
                          <button type="button" className="row-action-btn primary-row-btn" onClick={() => onInspectCompany(c)}>
                            <span>Open Page</span>
                            <span className="ph-cta-arrow">&rarr;</span>
                          </button>
                          {canManage && (
                            <>
                              <button type="button" className="row-action-btn" onClick={() => openEditModal(c)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="row-action-btn delete"
                                onClick={() => onDeleteCompany(c.id)}
                              >
                                Delete
                              </button>
                            </>
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

      {/* Add / Edit Company Modal */}
      {modalOpen && (
        <div className="modal-backdrop open" onClick={() => setModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editId ? 'Edit 19 Garhwal Rifles Company Record' : 'Add New Company Formation'}
              </h3>
              <button type="button" className="modal-close-btn" onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveCompany}>
              <div className="modal-body">
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Echo Company — 19 Garhwal Rifles"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Parent Battalion / Regiment</label>
                    <input
                      type="text"
                      className="form-input"
                      value={battalion}
                      onChange={(e) => setBattalion(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Parade Sheet Wing</label>
                    <select className="form-input" value={coyKey} onChange={(e) => setCoyKey(e.target.value)}>
                      {COY_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {COY_LABELS[k]}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    <label className="form-label">Sanctioned Establishment</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={sanctioned}
                      onChange={(e) => setSanctioned(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Computed Posted Strength</label>
                    <input type="number" className="form-input" value={previewPosted} disabled />
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Present</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={present}
                      onChange={(e) => setPresent(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">On Leave</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={leave}
                      onChange={(e) => setLeave(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duty / QRF / Other</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={duty}
                      onChange={(e) => setDuty(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-computed-preview">
                  <span>
                    Away: {previewAway} &middot; Readiness: {previewPct}%
                  </span>
                  <span className={`status-badge ${previewPosted <= sanctioned ? 'on-track' : 'attention'}`}>
                    Posted: {previewPosted} / {sanctioned}
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Company Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
