import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderRadius: 18,
    padding: 12,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#E9E9EB",
    borderRadius: 18,
    padding: 12,
  },
  userMessageText: {
    color: "white",
    fontSize: 16,
  },
  botMessageText: {
    color: "black",
    fontSize: 16,
  },
  timeText: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
    alignSelf: "flex-end",
  },
}); 