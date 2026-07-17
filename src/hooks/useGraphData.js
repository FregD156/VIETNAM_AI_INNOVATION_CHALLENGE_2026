import { useGraphContext } from '../context/GraphContext';

export const useGraphData = () => {
  const {
    graphData,
    selectedNode,
    searchQuery,
    setSelectedNode,
    setSearchQuery,
    searchGraph,
    addNodeAndRelationships
  } = useGraphContext();

  return {
    graphData,
    selectedNode,
    searchQuery,
    setSelectedNode,
    setSearchQuery,
    searchGraph,
    addNodeAndRelationships
  };
};
export default useGraphData;
