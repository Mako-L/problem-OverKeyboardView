import React from "react";
import { View, StyleSheet, ScrollView, useWindowDimensions, Dimensions } from "react-native";

interface NoChatWrapperProps {
  children: React.ReactNode;
}

const NoChatWrapper: React.FC<NoChatWrapperProps> = ({ children }) => {
  const { width: screenWidth } = useWindowDimensions();

  const getContainerMaxWidth = () => {
    if (screenWidth >= 1408) return 840; // 1344px
    if (screenWidth >= 1216) return 720; // 1152px
    if (screenWidth >= 1024) return 600; // 960px
    return "100%";
  };

  const getChatContainerStyle = () => {
    const baseStyle = {
      padding: 0,
      paddingTop: 0,
      paddingBottom: 0,
    };

    if (screenWidth <= 768) {
      return {
        ...baseStyle,
        padding: 0,
        paddingTop: 0,
        paddingBottom: 0,
      };
    }

    return baseStyle;
  };

  return (
    <View style={styles.chatWrapper}>
      <ScrollView style={[styles.container, { maxWidth: getContainerMaxWidth() }, getChatContainerStyle()]}>
        <View style={styles.chatContainer}>{children}</View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  chatWrapper: {
    flex: 1,
    width: "100%",
    height: Dimensions.get("window").height,
    justifyContent: "center",
    overflow: "hidden",
  },
  container: {
    flexGrow: 1,
    width: "100%",
    marginHorizontal: "auto",
    position: "relative",
  },
  chatContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});

export default NoChatWrapper; 