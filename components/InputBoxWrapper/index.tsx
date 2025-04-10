import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";

interface InputBoxContainerProps {
  children: React.ReactNode;
}

const InputBoxContainer: React.FC<InputBoxContainerProps> = ({ children }) => {
  const { width } = useWindowDimensions();

  const getContainerStyle = () => {
    if (width <= 768) {
      return styles.containerSmall;
    }
    return styles.containerLarge;
  };

  return (
    <KeyboardStickyView style={[styles.containerTextInputWrapper, getContainerStyle()]}>
      <View style={styles.inputContainer}>{children}</View>
    </KeyboardStickyView>
  );
};

const styles = StyleSheet.create({
  containerTextInputWrapper: {
    justifyContent: "center",
    paddingTop: 0,
    bottom: 0,
    width: "100%",
    position: "absolute",
  },
  containerSmall: {
    paddingTop: 10,
  },
  containerLarge: {
    paddingTop: 0,
  },
  inputContainer: {
    width: "100%",
  },
});

export default InputBoxContainer; 