import React from "react";
import { View, Text, FlatList } from "react-native";
import { styles } from "./styles";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatProps {
  messages: Message[];
}

const Chat: React.FC<ChatProps> = ({ messages }) => {
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    
    return (
      <View style={[styles.messageContainer, isUser ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" }]}>
        <View style={isUser ? styles.userMessage : styles.botMessage}>
          <Text style={isUser ? styles.userMessageText : styles.botMessageText}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timeText}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
    </View>
  );
};

export default Chat; 