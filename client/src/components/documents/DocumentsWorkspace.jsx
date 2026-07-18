import React, { useState } from 'react';
import { LuFolderOpen, LuSearch, LuBookOpen, LuCheck, LuX, LuChevronRight, LuSlidersHorizontal, LuFileText } from 'react-icons/lu';
import { useGraphData } from '../../hooks/useGraphData';
import NodeDetailSidebar from '../graph/NodeDetailSidebar';
import './DocumentsWorkspace.css';

export const DocumentsWorkspace = () => {
  const { graphData, selectedNode, setSelectedNode } = useGraphData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'expired'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'Luật' | 'NHNN' | 'SHB'

  // Parse markdown in nghiêng *text* thành JSX em
  const parseItalic = (textStr) => {
    if (!textStr) return '';
    const italicParts = textStr.split(/\*([^*]+)\*/g);
    if (italicParts.length === 1) return textStr;
    
    return italicParts.map((part, index) => {
      if (index % 2 === 1) {
        return <em key={`i-${index}`} className="legal-italic-text">{part}</em>;
      }
      return part;
    });
  };

  // Parse markdown in đậm và in nghiêng inline
  const parseInlineMarkdown = (textStr) => {
    if (!textStr) return '';
    const boldParts = textStr.split(/\*\*([^*]+)\*\*/g);
    
    return boldParts.flatMap((boldPart, bIdx) => {
      if (bIdx % 2 === 1) {
        return [<strong key={`b-${bIdx}`} className="legal-bold-text">{parseItalic(boldPart)}</strong>];
      }
      return parseItalic(boldPart);
    });
  };

  // Trích xuất danh sách nodes từ CSDL Đồ thị
  const allNodes = graphData?.nodes || [];
  
  // 1. Tính toán số liệu thống kê (KPIs) với bộ lọc tương thích ngôn ngữ
  const totalDocs = allNodes.filter(n => n.type === 'documentNode').length;
  const clauses = allNodes.filter(n => n.type === 'clauseNode');
  const totalClauses = clauses.length;
  
  const activeClausesCount = clauses.filter(c => {
    const status = c.data.status || '';
    return status === 'active' || status === 'Còn hiệu lực' || status === 'Còn hiệu lực một phần';
  }).length;
  
  const expiredClausesCount = clauses.filter(c => {
    const status = c.data.status || '';
    return status === 'expired' || status === 'Hết hiệu lực' || status === 'Đã hết hiệu lực';
  }).length;

  // 2. Lọc danh sách tài liệu và điều khoản hiển thị
  const filteredClauses = clauses.filter(c => {
    // Lọc theo từ khóa tìm kiếm
    const titleMatch = (c.data.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const textMatch = (c.data.content || c.data.text || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchSearch = titleMatch || textMatch;

    // Lọc theo trạng thái hiệu lực (tương thích cả active/expired và Còn hiệu lực/Hết hiệu lực)
    const status = c.data.status || '';
    const isNodeActive = status === 'active' || status === 'Còn hiệu lực' || status === 'Còn hiệu lực một phần';
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && isNodeActive) || 
      (statusFilter === 'expired' && !isNodeActive);

    // Lọc theo loại văn bản ban hành (Luật | NHNN | SHB)
    const docType = c.data.docType || 'SHB';
    const matchType = typeFilter === 'all' || docType === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="documents-workspace-layout-wrapper">
      <div className="documents-workspace">
        {/* Header */}
        <header className="documents-header">
          <div className="header-left">
            <div className="header-icon-box">
              <LuFolderOpen />
            </div>
            <div className="header-text">
              <h1 className="documents-main-title">Kho Lưu Trữ Pháp Quy SHB</h1>
              <p className="documents-sub-title">Quản lý tập trung và thống kê số liệu toàn bộ văn bản quy định của Quốc hội, NHNN và SHB</p>
            </div>
          </div>
        </header>

        <div className="documents-body">
          {/* KPI Dashboard Cards Grid */}
          <section className="documents-kpi-grid">
            <div className="kpi-card panel card-doc">
              <div className="kpi-card-inner">
                <div className="kpi-info">
                  <span className="kpi-label">Tổng số Văn bản gốc</span>
                  <span className="kpi-number monospace">{totalDocs}</span>
                </div>
                <div className="kpi-icon-wrapper">
                  <LuFileText />
                </div>
              </div>
            </div>

            <div className="kpi-card panel card-clause">
              <div className="kpi-card-inner">
                <div className="kpi-info">
                  <span className="kpi-label">Tổng số Điều khoản</span>
                  <span className="kpi-number monospace">{totalClauses}</span>
                </div>
                <div className="kpi-icon-wrapper">
                  <LuBookOpen />
                </div>
              </div>
            </div>

            <div className="kpi-card panel card-active">
              <div className="kpi-card-inner">
                <div className="kpi-info">
                  <span className="kpi-label">Còn hiệu lực</span>
                  <span className="kpi-number monospace text-active">{activeClausesCount}</span>
                </div>
                <div className="kpi-icon-wrapper color-active">
                  <LuCheck />
                </div>
              </div>
            </div>

            <div className="kpi-card panel card-expired">
              <div className="kpi-card-inner">
                <div className="kpi-info">
                  <span className="kpi-label">Đã hết hiệu lực</span>
                  <span className="kpi-number monospace text-expired">{expiredClausesCount}</span>
                </div>
                <div className="kpi-icon-wrapper color-expired">
                  <LuX />
                </div>
              </div>
            </div>
          </section>

          {/* Search and Filters Section */}
          <section className="documents-toolbar-panel panel">
            <div className="toolbar-search-wrapper">
              <LuSearch className="toolbar-search-icon" />
              <input 
                type="text" 
                className="toolbar-search-input"
                placeholder="Tìm kiếm nhanh điều khoản, nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="toolbar-filters-group">
              <div className="filter-select-wrapper">
                <LuSlidersHorizontal className="filter-icon" />
                <select 
                  className="filter-dropdown-select has-icon"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tất cả hiệu lực</option>
                  <option value="active">Còn hiệu lực</option>
                  <option value="expired">Hết hiệu lực</option>
                </select>
              </div>

              <div className="filter-select-wrapper">
                <select 
                  className="filter-dropdown-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Tất cả nguồn ban hành</option>
                  <option value="Luật">Luật (Quốc hội)</option>
                  <option value="NHNN">Văn bản Ngân hàng Nhà nước</option>
                  <option value="SHB">Văn bản Nội bộ SHB</option>
                </select>
              </div>
            </div>
          </section>

          {/* Main Documents/Clauses Table List */}
          <section className="documents-table-panel panel">
            <div className="table-container">
              <table className="documents-data-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Mã Điều khoản</th>
                    <th style={{ width: '45%' }}>Nội dung tóm lược</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClauses.length > 0 ? (
                    filteredClauses.map((clause) => {
                      const docType = clause.data.docType || 'SHB';
                      const tagClass = docType === 'Luật' ? 'law' : (docType === 'NHNN' ? 'nhnn' : 'shb');
                      const status = clause.data.status || '';
                      const isActive = status === 'active' || status === 'Còn hiệu lực' || status === 'Còn hiệu lực một phần';
                      
                      return (
                        <tr 
                          key={clause.id} 
                          className={`table-row-interactive ${selectedNode?.id === clause.id ? 'row-selected' : ''}`}
                          onClick={() => setSelectedNode(clause)}
                        >
                          <td className="cell-code">
                            <div className="code-badge-wrapper">
                              <span className={`cell-source-tag ${tagClass}`}>
                                {docType}
                              </span>
                              <span className="code-id monospace">{clause.id}</span>
                            </div>
                            <span className="code-title">{clause.data.title}</span>
                          </td>
                          <td className="cell-text">
                            <p className="clause-text-truncate">{parseInlineMarkdown(clause.data.content || clause.data.text)}</p>
                          </td>
                          <td className="cell-status" style={{ textAlign: 'center' }}>
                            <span className={`detail-status-pill ${isActive ? 'active' : 'expired'}`}>
                              {status || 'Còn hiệu lực'}
                            </span>
                          </td>
                          <td className="cell-action" style={{ textAlign: 'center' }}>
                            <button 
                              className="btn-table-action interactive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNode(clause);
                              }}
                            >
                              <span>Chi tiết</span>
                              <LuChevronRight />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="table-empty-row">
                        Không tìm thấy tài liệu điều khoản nào khớp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Hiển thị chi tiết trích lục ở bên phải nếu được chọn */}
      {selectedNode && <NodeDetailSidebar />}
    </div>
  );
};

export default DocumentsWorkspace;
