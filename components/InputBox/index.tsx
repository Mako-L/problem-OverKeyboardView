import React, { useCallback, useRef, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  useWindowDimensions,
  findNodeHandle,
  UIManager,
  Platform,
} from "react-native";
import { KeyboardController, OverKeyboardView } from "react-native-keyboard-controller";
import { styles } from "./styles";
import { AntDesign } from "@expo/vector-icons";

interface InputBoxProps {
  onSendMessage?: (text: string) => void;
}

const InputBox: React.FC<InputBoxProps> = ({ onSendMessage }) => {
  const { width: window_width } = useWindowDimensions();
  const [inputText, setInputText] = useState("");
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);

  const getContainerPadding = () => {
    if (window_width <= 768) {
      return 10;
    }
    return 20;
  };

  const measureButton = () => {
    if (buttonRef.current) {
      const handle = findNodeHandle(buttonRef.current);
      if (handle) {
        UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
          if (window_width <= 768) {
            setModalPosition({ top: pageY + height - 200, left: pageX });
          } else {
            setModalPosition({ top: pageY + height, left: pageX });
          }
        });
      }
    }
  };

  const handleButtonLayout = () => {
    setTimeout(measureButton, 100);
  };

  const handleSubmit = useCallback(() => {
    KeyboardController.dismiss();
    if (inputText.trim() === "") return;
    
    if (onSendMessage) {
      onSendMessage(inputText);
    }
    
    setInputText("");
  }, [inputText, onSendMessage]);

  return (
    <View style={[styles.containerTextInputWrapper]}>
      <View style={[styles.inputBoxContainer, styles.simpleShadow, { padding: getContainerPadding(), paddingTop: 0 }]}>
        <View style={styles.innerContainer}>
          <View style={styles.buttonLeftWrapper}>
            <TouchableOpacity
              ref={buttonRef}
              style={[styles.button, { backgroundColor: "#f5f5f5" }]}
              onPressIn={() => {
                measureButton();
                setTimeout(() => {
                  setShowUploadMenu(!showUploadMenu);
                }, 100);
              }}
              onLayout={handleButtonLayout}
            >
              <AntDesign name="paperclip" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: "#f5f5f5",
                color: "#000",
              },
            ]}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            multiline
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSubmit}
            testID="inputbox.textinput"
          />
          <View style={styles.buttonRightWrapper}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: inputText.trim() === "" ? "#f5f5f5" : "#007AFF",
                },
              ]}
              onPress={handleSubmit}
              disabled={inputText.trim() === ""}
              testID="inputbox.send"
            >
              <AntDesign
                name="arrowup"
                size={24}
                color={inputText.trim() === "" ? "#666" : "#FFF"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <OverKeyboardView visible={showUploadMenu}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowUploadMenu(false)}
          testID="inputbox.overlay"
        >
          <View style={{ flex: 1, width:'100%' }}>
          <View
            style={{
              position: "absolute",
              top: modalPosition.top,
              left: modalPosition.left,
            }}
          >
            <View style={{ 
              backgroundColor: "#fff", 
              padding: 20, 
              borderRadius: 10,
              width: 200,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}>
              <Text>Upload Menu Content</Text>
              <Text>This is where the upload menu would be!</Text>
            </View>
          </View>
          </View>
        </TouchableOpacity>
      </OverKeyboardView>
    </View>
  );
};

export default InputBox; 