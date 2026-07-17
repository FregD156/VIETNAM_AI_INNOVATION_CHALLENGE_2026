import { useChatContext } from '../context/ChatContext';

export const useChatStream = () => {
  const {
    chatHistory,
    isStreaming,
    activeConversationId,
    sendMessage,
    clearChat,
    setActiveConversationId
  } = useChatContext();

  return {
    chatHistory,
    isStreaming,
    activeConversationId,
    sendMessage,
    clearChat,
    setActiveConversationId
  };
};
export default useChatStream;
