import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "./styles";
import { AntDesign } from "@expo/vector-icons";

interface NoChatProps {
  onSuggestionPress?: (suggestion: string) => void;
}

const NoChat: React.FC<NoChatProps> = ({ onSuggestionPress }) => {
  const suggestions = [
    "How can I reproduce the keyboard view issue?",
    "What's the difference between KeyboardStickyView and OverKeyboardView?",
    "Show me an example of keyboard handling in React Native",
  ];

  const handleSuggestionPress = (suggestion: string) => {
    if (onSuggestionPress) {
      onSuggestionPress(suggestion);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.imageContainer}>
          <AntDesign name="message1" size={100} color="#007AFF" />
        </View>
        <Text style={styles.title}>No Messages Yet</Text>
        <Text style={styles.subtitle}>
          Start a conversation to test the keyboard view behavior
        </Text>

        <View style={styles.suggestionContainer}>
          <Text style={styles.suggestionTitle}>Try asking:</Text>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestion}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default NoChat; 