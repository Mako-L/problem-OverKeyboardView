import React, { useState } from "react";
import {
  Button,
  Text,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  TouchableOpacity,
} from "react-native-gesture-handler";
import { KeyboardStickyView, OverKeyboardView, KeyboardProvider} from "react-native-keyboard-controller";

export default function OverKeyboardViewExample() {
  const [isShow, setShow] = useState(false);

  return (
    <View style={styles.container}>
    
      {/* TextInput wrapped in KeyboardStickyView */}
       <GestureHandlerRootView style={styles.fullScreen}>
      <View>
      <OverKeyboardView visible={isShow}>
    
          <TouchableWithoutFeedback
            style={styles.fullScreen}
            testID="over_keyboard_view.background"
            onPress={() => {
              console.log("hide")
              setShow(false)
            }}
          >
            <View style={styles.overlayContainer}>
              <TouchableOpacity
                testID="over_keyboard_view.content"
                onPress={() => {
                  console.log("hide")
                  setShow(false)
                }}
              >
                <View style={styles.background} />
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
     
      </OverKeyboardView>
      </View>
                
      <KeyboardStickyView style={[styles.keyboardStickyView, {paddingBottom: 100}]}>
        <TextInput style={styles.input} testID="over_keyboard_view.input" />
        <TouchableOpacity
        testID="over_keyboard_view.show"
                
        onPress={() =>{
          console.log("show")
          setShow(true)
        }}
      >
        <Text>Show</Text>
      </TouchableOpacity>
      </KeyboardStickyView>
      </GestureHandlerRootView>
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