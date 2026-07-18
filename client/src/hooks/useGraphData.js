import { useGraphContext } from '../context/GraphContext';

export const useGraphData = () => {
  const {
    graphData,
    selectedNode,
    searchQuery,
    activeFilters,
    viewMode,
    setViewMode,
    activeDocId,
    setActiveDocId,
    setSelectedNode,
    setSearchQuery,
    searchGraph,
    toggleFilter,
    clearFilters,
    addNodeAndRelationships
  } = useGraphContext();

  return {
    graphData,
    selectedNode,
    searchQuery,
    activeFilters,
    viewMode,
    setViewMode,
    activeDocId,
    setActiveDocId,
    setSelectedNode,
    setSearchQuery,
    searchGraph,
    toggleFilter,
    clearFilters,
    addNodeAndRelationships
  };
};
export default useGraphData;
