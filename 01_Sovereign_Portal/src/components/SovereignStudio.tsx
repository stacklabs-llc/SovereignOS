import React, { useState, useEffect } from 'react';
import { 
  Database, Search, Plus, Edit2, Trash2, Settings, 
  ArrowLeft, ArrowRight, Save, X, RefreshCw, AlertCircle, CheckCircle2 
} from 'lucide-react';

const axios = {
  get: async <T,>(url: string, config?: any): Promise<{ data: T }> => {
    let finalUrl = url;
    if (config?.params) {
      const search = new URLSearchParams();
      Object.entries(config.params).forEach(([key, val]) => {
        search.append(key, String(val));
      });
      finalUrl += `?${search.toString()}`;
    }
    const res = await fetch(finalUrl);
    if (!res.ok) throw new Error(await res.text() || res.statusText);
    const data = await res.json();
    return { data };
  },
  post: async (url: string, data: any): Promise<any> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text() || res.statusText);
    return res;
  },
  put: async (url: string, data: any): Promise<any> => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text() || res.statusText);
    return res;
  },
  delete: async (url: string): Promise<any> => {
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text() || res.statusText);
    return res;
  }
};

interface TableColumn {
  name: string;
  type: string;
  pk: boolean;
}

interface TableDataResponse {
  columns: TableColumn[];
  rows: any[];
  total: number;
}

interface SystemProperty {
  name: string;
  value: string;
  description: string;
}

export default function SovereignStudio() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'tables' | 'configs'>('tables');

  // Tables List State
  const [tables, setTables] = useState<string[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState<string>('sys_properties');

  // Table Data State
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [dataSearch, setDataSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Create/Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any | null>(null); // null means "Create New"
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Configuration Properties State
  const [configProps, setConfigProps] = useState<SystemProperty[]>([]);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [savingConfigs, setSavingConfigs] = useState(false);

  // Load Tables list
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await axios.get<string[]>('/api/studio/tables');
        setTables(res.data);
      } catch (err: any) {
        setError('Failed to fetch database tables: ' + err.message);
      }
    };
    fetchTables();
  }, []);

  // Load configuration properties
  const fetchConfigs = async () => {
    try {
      const res = await axios.get<SystemProperty[]>('/api/properties');
      const filtered = res.data.filter(p => p.name.startsWith('sports.landing.'));
      setConfigProps(filtered);
      
      const valuesMap: Record<string, string> = {};
      filtered.forEach(p => {
        valuesMap[p.name] = p.value;
      });
      setConfigValues(valuesMap);
    } catch (err: any) {
      setError('Failed to fetch configurations: ' + err.message);
    }
  };

  useEffect(() => {
    if (activeTab === 'configs') {
      fetchConfigs();
    }
  }, [activeTab]);

  // Load Table Data when selected table, offset changes
  const fetchTableData = async () => {
    if (!selectedTable) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<TableDataResponse>(`/api/studio/tables/${selectedTable}`, {
        params: { limit, offset }
      });
      setColumns(res.data.columns);
      setRows(res.data.rows);
      setTotalRows(res.data.total);
    } catch (err: any) {
      setError(`Failed to load data for ${selectedTable}: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tables') {
      setOffset(0);
      fetchTableData();
    }
  }, [selectedTable, activeTab]);

  useEffect(() => {
    if (activeTab === 'tables') {
      fetchTableData();
    }
  }, [offset]);

  // Handle Create / Update Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      if (editingRow) {
        // Update
        const rowId = editingRow._rowid;
        await axios.put(`/api/studio/tables/${selectedTable}/${rowId}`, formData);
        showSuccess('Record updated successfully.');
      } else {
        // Create
        await axios.post(`/api/studio/tables/${selectedTable}`, formData);
        showSuccess('Record created successfully.');
      }
      setModalOpen(false);
      fetchTableData();
    } catch (err: any) {
      setError('Database constraint error: ' + err.message);
    }
  };

  // Handle Delete Row
  const handleDeleteRow = async (rowId: number) => {
    if (!window.confirm(`Are you sure you want to delete row ID ${rowId}?`)) return;
    setError(null);
    setSuccessMsg(null);
    try {
      await axios.delete(`/api/studio/tables/${selectedTable}/${rowId}`);
      showSuccess('Record deleted successfully.');
      fetchTableData();
    } catch (err: any) {
      setError('Failed to delete record: ' + err.message);
    }
  };

  // Handle Properties configuration save
  const handleSaveConfigs = async () => {
    setSavingConfigs(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await axios.put('/api/properties', configValues);
      showSuccess('Global landing configurations saved successfully.');
    } catch (err: any) {
      setError('Failed to save configurations: ' + err.message);
    } finally {
      setSavingConfigs(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const openCreateModal = () => {
    setEditingRow(null);
    const initialData: Record<string, any> = {};
    columns.forEach(col => {
      if (col.name !== '_rowid' && col.name !== 'sys_created_on' && col.name !== 'sys_updated_on') {
        initialData[col.name] = '';
      }
    });
    setFormData(initialData);
    setModalOpen(true);
  };

  const openEditModal = (row: any) => {
    setEditingRow(row);
    const editData = { ...row };
    delete editData._rowid;
    setFormData(editData);
    setModalOpen(true);
  };

  // Filtering tables
  const filteredTables = tables.filter(t => t.toLowerCase().includes(tableSearch.toLowerCase()));

  // Local filtering rows
  const filteredRows = rows.filter(row => {
    if (!dataSearch) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(dataSearch.toLowerCase())
    );
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      color: '#fff',
      padding: '1rem',
      gap: '1rem',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Top Banner & Tab Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '8px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(56, 189, 248, 0.2))',
            border: '1px solid rgba(167, 139, 250, 0.3)'
          }}>
            <Database size={24} style={{ color: '#A78BFA' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '0.5px' }}>
              Sovereign Console & Studio
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              ServiceNow-like environment for raw CMDB tables and landing settings
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={() => setActiveTab('tables')}
            style={{
              padding: '0.4rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'tables' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
              color: activeTab === 'tables' ? '#fff' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <Database size={14} />
            <span>CMDB Tables</span>
          </button>
          <button
            onClick={() => setActiveTab('configs')}
            style={{
              padding: '0.4rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'configs' ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
              color: activeTab === 'configs' ? '#fff' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <Settings size={14} />
            <span>App Configs</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {(error || successMsg) && (
        <div style={{ flexShrink: 0 }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              color: '#FCA5A5',
              fontSize: '0.85rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              color: '#A7F3D0',
              fontSize: '0.85rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'tables' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '1rem',
          flex: 1,
          minHeight: 0
        }}>
          {/* Left Table List Explorer */}
          <div className="vm-panel-glass" style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '1rem',
            gap: '0.75rem',
            height: '100%',
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
            boxSizing: 'border-box'
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Search size={14} style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)'
              }} />
              <input
                type="text"
                placeholder="Filter tables..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingRight: '4px'
            }}>
              {filteredTables.map(tableName => (
                <button
                  key={tableName}
                  onClick={() => setSelectedTable(tableName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.6rem',
                    borderRadius: '6px',
                    border: 'none',
                    textAlign: 'left',
                    background: selectedTable === tableName ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    borderLeft: selectedTable === tableName ? '3px solid #38BDF8' : '3px solid transparent',
                    color: selectedTable === tableName ? '#38BDF8' : 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: selectedTable === tableName ? 600 : 400,
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>{tableName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Main Datatable View */}
          <div className="vm-panel-glass" style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '1.25rem',
            gap: '0.75rem',
            overflow: 'hidden',
            height: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            boxSizing: 'border-box'
          }}>
            {/* Header Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={18} style={{ color: '#38BDF8' }} />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {selectedTable}
                </h2>
                <span style={{
                  fontSize: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  {totalRows} rows
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.4)'
                  }} />
                  <input
                    type="text"
                    placeholder="Search fields..."
                    value={dataSearch}
                    onChange={e => setDataSearch(e.target.value)}
                    style={{
                      width: '180px',
                      padding: '0.45rem 0.75rem 0.45rem 1.8rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  onClick={openCreateModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'linear-gradient(90deg, #38BDF8, #0A84FF)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  <Plus size={14} />
                  <span>New Record</span>
                </button>
              </div>
            </div>

            {/* Datatable Scroll Wrapper */}
            <div style={{
              overflow: 'auto',
              flex: 1,
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.2)',
              minHeight: 0
            }}>
              {loading ? (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%',
                  minHeight: '200px',
                  gap: '12px',
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  <RefreshCw size={24} className="animate-spin" />
                  <span>Loading table rows...</span>
                </div>
              ) : (
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.8rem',
                  textAlign: 'left'
                }}>
                  <thead>
                    <tr style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10
                    }}>
                      <th style={{ padding: '0.6rem 0.8rem', width: '80px', color: 'rgba(255,255,255,0.6)', background: 'rgba(20, 24, 35, 0.95)' }}>Actions</th>
                      <th style={{ padding: '0.6rem 0.8rem', width: '70px', color: '#38BDF8', background: 'rgba(20, 24, 35, 0.95)' }}>rowid</th>
                      {columns.map(col => (
                        <th 
                          key={col.name} 
                          style={{ 
                            padding: '0.6rem 0.8rem', 
                            color: col.pk ? '#F59E0B' : '#fff',
                            whiteSpace: 'nowrap',
                            background: 'rgba(20, 24, 35, 0.95)'
                          }}
                        >
                          {col.name} {col.pk && '(PK)'}
                          <span style={{ display: 'block', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
                            {col.type}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 2} style={{
                          padding: '3rem',
                          textAlign: 'center',
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: '0.85rem'
                        }}>
                          No matching records found.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, idx) => (
                        <tr 
                          key={idx} 
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                            transition: 'background 0.15s'
                          }}
                          className="hover-row"
                        >
                          <td style={{ padding: '0.5rem 0.8rem', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => openEditModal(row)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'rgba(255,255,255,0.6)',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(row._rowid)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'rgba(239, 68, 68, 0.7)',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '4px',
                                  transition: 'all 0.15s'
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '0.5rem 0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>
                            {row._rowid}
                          </td>
                          {columns.map(col => (
                            <td 
                              key={col.name} 
                              style={{ 
                                padding: '0.5rem 0.8rem',
                                color: 'rgba(255,255,255,0.85)',
                                maxWidth: '250px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={String(row[col.name] ?? '')}
                            >
                              {row[col.name] === null ? (
                                <span style={{ color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>NULL</span>
                              ) : (
                                String(row[col.name])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '0.25rem',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                Showing {offset + 1} to {Math.min(offset + limit, totalRows)} of {totalRows} records
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  disabled={offset === 0}
                  onClick={() => setOffset(prev => Math.max(0, prev - limit))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: offset === 0 ? 'rgba(255,255,255,0.25)' : '#fff',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    cursor: offset === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  <ArrowLeft size={12} />
                  <span>Previous</span>
                </button>
                <button
                  disabled={offset + limit >= totalRows}
                  onClick={() => setOffset(prev => prev + limit)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: offset + limit >= totalRows ? 'rgba(255,255,255,0.25)' : '#fff',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '6px',
                    cursor: offset + limit >= totalRows ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  <span>Next</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Configuration Editor Panel */
        <div className="vm-panel-glass" style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          border: '1px solid rgba(255,255,255,0.08)',
          boxSizing: 'border-box',
          overflowY: 'auto',
          flex: 1
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                Landing Page Configuration Console
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0' }}>
                Quick settings to update assets, titles, and descriptions dynamically in the DB.
              </p>
            </div>
            <button
              onClick={handleSaveConfigs}
              disabled={savingConfigs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(90deg, #10B981, #059669)',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              <Save size={14} />
              <span>{savingConfigs ? 'Saving...' : 'Save Configurations'}</span>
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.5rem',
            marginTop: '0.5rem'
          }}>
            {/* Global & Card BG Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', color: '#38BDF8' }}>
                Backgrounds & Images
              </h3>
              
              {configProps.filter(p => p.name.includes('.image') || p.name.includes('.background')).map(prop => (
                <div key={prop.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                    {prop.description}
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: '6px' }}>
                      ({prop.name})
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={configValues[prop.name] ?? ''}
                      onChange={e => setConfigValues({ ...configValues, [prop.name]: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                    {configValues[prop.name] && (
                      <div style={{
                        borderRadius: '6px',
                        overflow: 'hidden',
                        height: '36px',
                        width: '72px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.2)',
                        flexShrink: 0
                      }}>
                        <img 
                          src={configValues[prop.name]} 
                          alt="preview" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Titles & Descriptions Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px', color: '#10B981' }}>
                Titles & Copy
              </h3>
              
              {configProps.filter(p => !p.name.includes('.image') && !p.name.includes('.background')).map(prop => (
                <div key={prop.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                    {prop.description}
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: '6px' }}>
                      ({prop.name})
                    </span>
                  </label>
                  {prop.name.includes('.description') ? (
                    <textarea
                      rows={2}
                      value={configValues[prop.name] ?? ''}
                      onChange={e => setConfigValues({ ...configValues, [prop.name]: e.target.value })}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.8rem',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={configValues[prop.name] ?? ''}
                      onChange={e => setConfigValues({ ...configValues, [prop.name]: e.target.value })}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Record Create/Edit Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div className="vm-panel-glass" style={{
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.8)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                {editingRow ? `Edit Record (rowid: ${editingRow._rowid})` : `New Record in ${selectedTable}`}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleFormSubmit} style={{
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              flexGrow: 1,
              padding: '1.25rem',
              gap: '1rem'
            }}>
              {columns
                .filter(col => col.name !== '_rowid' && col.name !== 'sys_created_on' && col.name !== 'sys_updated_on')
                .map(col => (
                  <div key={col.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                      {col.name} {col.pk && <span style={{ color: '#F59E0B' }}>(PK)</span>}
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>
                        [{col.type}]
                      </span>
                    </label>
                    
                    {col.name === 'description' || col.name === 'work_notes' || col.name === 'value' && String(formData[col.name]).length > 60 ? (
                      <textarea
                        rows={3}
                        value={formData[col.name] ?? ''}
                        onChange={e => setFormData({ ...formData, [col.name]: e.target.value })}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.8rem',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData[col.name] ?? ''}
                        onChange={e => setFormData({ ...formData, [col.name]: e.target.value })}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      />
                    )}
                  </div>
                ))}

              {/* Modal Footer Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '0.5rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    padding: '0.45rem 1rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(90deg, #38BDF8, #0A84FF)',
                    border: 'none',
                    color: '#fff',
                    padding: '0.45rem 1.25rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
