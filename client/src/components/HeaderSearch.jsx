// src/components/HeaderSearch.jsx
import React from 'react';
import { IconSearch, IconFilter } from './Icons';

export default function HeaderSearch({ searchQuery, setSearchQuery, placeholder = "Search Posts, People, anything" }) {
  return (
    <header className="top-header">
      <div className="search-container">
        <IconSearch style={{ width: '18px', height: '18px', color: '#94a3b8' }} />
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="button" title="Filter" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          <IconFilter style={{ width: '18px', height: '18px' }} />
        </button>
      </div>
    </header>
  );
}
