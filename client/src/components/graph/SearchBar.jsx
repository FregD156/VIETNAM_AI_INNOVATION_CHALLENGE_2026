import React from 'react';
import { LuSearch, LuX } from 'react-icons/lu';
import { useGraphData } from '../../hooks/useGraphData';
import './SearchBar.css';

export const SearchBar = () => {
  const { searchQuery, searchGraph } = useGraphData();

  const handleChange = (e) => {
    searchGraph(e.target.value);
  };

  const handleClear = () => {
    searchGraph('');
  };

  return (
    <div className="graph-search-bar">
      <LuSearch className="search-icon" />
      
      <input
        type="text"
        className="graph-search-input"
        value={searchQuery}
        onChange={handleChange}
        placeholder="Tìm kiếm mã luật, điều khoản, nội dung..."
      />

      {searchQuery && (
        <button className="btn-clear-search" onClick={handleClear} title="Xóa bộ lọc">
          <LuX size={14} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
