import React, { useState } from "react";
import {
  Button,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  TouchableOpacity,
} from "react-native-gesture-handler";
import { KeyboardStickyView, OverKeyboardView } from "react-native-keyboard-controller";

export default function OverKeyboardViewExample() {
  const [isShow, setShow] = useState(false);

  return (
    <View style={styles.container}>
      {/* TextInput wrapped in KeyboardStickyView */}
      <KeyboardStickyView style={[styles.keyboardStickyView, {paddingBottom: 100}]}>
        <TextInput style={styles.input} testID="over_keyboard_view.input" />
        <Button
        testID="over_keyboard_view.show"
        title="Show"
        onPress={() => setShow(true)}
      />
      <View>
      <OverKeyboardView visible={isShow}>
        <GestureHandlerRootView style={styles.fullScreen}>
          <TouchableWithoutFeedback
            style={styles.fullScreen}
            testID="over_keyboard_view.background"
            onPress={() => setShow(false)}
          >
            <View style={styles.overlayContainer}>
              <TouchableOpacity
                testID="over_keyboard_view.content"
                onPress={() => setShow(false)}
              >
                <View style={styles.background} />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </GestureHandlerRootView>
      </OverKeyboardView>
      </View>
      </KeyboardStickyView>
      
      {/* Button outside of KeyboardStickyView */}
   
      
      {/* OverKeyboardView outside of KeyboardStickyView but in same parent */}
   
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  keyboardStickyView: {
    width: '100%',
    paddingTop: 0,
    position: 'absolute',
    bottom: 0,
  },
  fullScreen: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "green",
  },
  background: {
    width: 200,
    height: 200,
    backgroundColor: "blue",
  },
  input: {
    backgroundColor: "yellow",
    width: 200,
    height: 50,
    alignSelf: "center",
    marginTop: 150,
  },
});