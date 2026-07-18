import React from 'react';
import { LuBookOpen } from 'react-icons/lu';
import './CitationTag.css';

export const CitationTag = ({ id, label, onClick }) => {
  return (
    <button 
      className="citation-tag" 
      onClick={() => onClick(id)}
      title="Click để xem văn bản pháp quy gốc"
    >
      <LuBookOpen size={10} />
      <span>{label}</span>
    </button>
  );
};

export default CitationTag;
