import { useGraphContext } from '../context/GraphContext';

export const useGraphData = () => {
  const {
    graphData,
    selectedNode,
    searchQuery,
    activeFilters,
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
    setSelectedNode,
    setSearchQuery,
    searchGraph,
    toggleFilter,
    clearFilters,
    addNodeAndRelationships
  };
};
export default useGraphData;
