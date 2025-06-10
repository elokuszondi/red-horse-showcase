
export const formatChatTimestamp = (timestamp: Date): string => {
  const chatDate = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Reset time to midnight for accurate date comparison
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayMidnight = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  const chatMidnight = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());
  
  if (chatMidnight.getTime() === todayMidnight.getTime()) {
    return `Today ${chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (chatMidnight.getTime() === yesterdayMidnight.getTime()) {
    return `Yesterday ${chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    const isThisYear = chatDate.getFullYear() === now.getFullYear();
    const dateOptions: Intl.DateTimeFormatOptions = isThisYear 
      ? { month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
    
    return `${chatDate.toLocaleDateString([], dateOptions)} ${chatDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
};

export const formatMessageTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
