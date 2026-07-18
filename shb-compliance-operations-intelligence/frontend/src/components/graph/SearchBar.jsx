import React, { useState, useEffect, useRef } from 'react';
import { LuSearch, LuX, LuSlidersHorizontal, LuCheck } from 'react-icons/lu';
import { useGraphData } from '../../hooks/useGraphData';
import './SearchBar.css';

export const SearchBar = () => {
  const { searchQuery, searchGraph } = useGraphData();
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleChange = (e) => {
    searchGraph(e.target.value);
  };

  const handleClear = () => {
    searchGraph('');
  };

  const applyQuickFilter = (filterTag) => {
    if (searchQuery === filterTag) {
      searchGraph(''); // Nhấp lại để tắt lọc
    } else {
      searchGraph(filterTag);
    }
    setShowFilterDropdown(false); // Đóng dropdown sau khi chọn
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filters = [
    { label: 'Tất cả tài liệu', value: '' },
    { label: 'Quy định từ NHNN', value: ':nhnn' },
    { label: 'Quy chế nội bộ SHB', value: ':shb' },
    { label: 'Điều khoản: Còn hiệu lực', value: ':active' },
    { label: 'Điều khoản: Hết hiệu lực', value: ':expired' }
  ];

  const getActiveFilterLabel = () => {
    const matched = filters.find(f => f.value !== '' && searchQuery === f.value);
    return matched ? matched.label : null;
  };

  // Kiểm tra xem có bộ lọc hệ thống nào đang active không
  const isFilterActive = searchQuery.startsWith(':');

  return (
    <div className="graph-toolbar-floating panel" ref={dropdownRef}>
      <div className="graph-search-input-wrapper">
        <LuSearch className="graph-search-icon" />
        <input
          type="text"
          className="graph-search-input-field"
          value={searchQuery.startsWith(':') ? '' : searchQuery} // Ẩn tag hệ thống khỏi ô gõ chữ thường
          onChange={handleChange}
          placeholder={isFilterActive ? `Đang lọc: ${getActiveFilterLabel()}` : "Tra cứu điều khoản..."}
        />
        {searchQuery && (
          <button className="btn-graph-clear" onClick={handleClear} title="Xóa bộ lọc">
            <LuX />
          </button>
        )}
      </div>

      <div className="graph-divider-vertical"></div>

      {/* Filter Icon Button (Tròn, nháy sáng cam khi đang có bộ lọc active) */}
      <button 
        className={`btn-filter-dropdown-trigger ${isFilterActive ? 'active-filter' : ''}`}
        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
        title="Lọc nhanh thực thể"
      >
        <LuSlidersHorizontal />
        {isFilterActive && <span className="active-filter-badge-dot"></span>}
      </button>

      {/* Quick Filters Dropdown Popover */}
      {showFilterDropdown && (
        <div className="filters-dropdown-popover panel signature-reveal">
          <div className="dropdown-header">
            <span className="dropdown-title">Bộ lọc đồ thị</span>
          </div>
          <div className="dropdown-options-list">
            {filters.map((f, idx) => {
              const isActive = (f.value === '' && searchQuery === '') || (f.value !== '' && searchQuery === f.value);
              return (
                <div 
                  key={idx}
                  className={`dropdown-option-item ${isActive ? 'selected' : ''}`}
                  onClick={() => applyQuickFilter(f.value)}
                >
                  <span className="option-label">{f.label}</span>
                  {isActive && <LuCheck className="check-icon-dropdown" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
