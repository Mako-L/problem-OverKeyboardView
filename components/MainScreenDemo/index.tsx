import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Dimensions, FlatList, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./styles";
import { AntDesign } from "@expo/vector-icons";
import Chat, { Message } from "../Chat";
import NoChat from "../NoChat";
import ChatWrapper from "../ChatWrapper";
import NoChatWrapper from "../NoChatWrapper";
import InputBox from "../InputBox";
import InputBoxContainer from "../InputBoxWrapper";
import { OverKeyboardView, KeyboardStickyView } from "react-native-keyboard-controller";

interface MainScreenDemoProps {
  openLeftDrawer?: () => void;
}

// Mock network states
type NetworkStatus = 'idle' | 'loading' | 'success' | 'error';

// Generate some buttons for the popup
const generateButtons = (count: number) => {
  return Array(count).fill(0).map((_, index) => ({
    id: `button-${index}`,
    title: `Button ${index}`,
    color: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
  }));
};

// Simulate a mock server request with random response time
const mockServerRequest = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Simulate random network delay between 200-800ms
    const delay = 200 + Math.random() * 600;
    
    setTimeout(() => {
      // 10% chance of error to simulate network issues
      if (Math.random() < 0.1) {
        reject(new Error("Mock server error"));
      } else {
        resolve({ timestamp: new Date(), status: "ok" });
      }
    }, delay);
  });
};

const MainScreenDemo: React.FC<MainScreenDemoProps> = ({ openLeftDrawer }) => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isShow, setShow] = useState(false);
  const [buttons] = useState(generateButtons(10));
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('idle');
  const [lastNetworkResponse, setLastNetworkResponse] = useState<Date | null>(null);
  const [networkErrorCount, setNetworkErrorCount] = useState(0);
  const [networkSuccessCount, setNetworkSuccessCount] = useState(0);
  
  // Set up periodic mock server requests
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    // Only start the interval if we should be loading
    if (shouldLoad) {
      console.log("Starting mock server requests");
      
      intervalId = setInterval(() => {
        setNetworkStatus('loading');
        
        mockServerRequest()
          .then(response => {
            setNetworkStatus('success');
            setLastNetworkResponse(new Date());
            setNetworkSuccessCount(prev => prev + 1);
            
            // Every 5th successful request, add a system message
            if (networkSuccessCount % 5 === 0) {
              const systemMessage: Message = {
                id: `msg-${Date.now()}-system`,
                text: `Network sync complete. Processed ${networkSuccessCount} requests.`,
                sender: "bot",
                timestamp: new Date(),
              };
              setMessages(prevMessages => [...prevMessages, systemMessage]);
            }
          })
          .catch(error => {
            console.error("Mock server error:", error);
            setNetworkStatus('error');
            setNetworkErrorCount(prev => prev + 1);
            
            // Add an error message when errors occur
            if (networkErrorCount < 3) { // Limit error messages
              const errorMessage: Message = {
                id: `msg-${Date.now()}-error`,
                text: `Network error occurred: ${error.message}`,
                sender: "bot",
                timestamp: new Date(),
              };
              setMessages(prevMessages => [...prevMessages, errorMessage]);
            }
          });
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log("Stopped mock server requests");
      }
    };
  }, [shouldLoad, networkSuccessCount, networkErrorCount]);

  const handleSendMessage = (text: string) => {
    // Create a new message from the user
    const newUserMessage: Message = {
      id: `msg-${Date.now()}-user`,
      text,
      sender: "user",
      timestamp: new Date(),
    };

    // Add the user message
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    
    // Set the load state to true so we show the chat and start network requests
    setShouldLoad(true);
    
    // Add a "bot" response after a delay
    setTimeout(() => {
      const botMessage: Message = {
        id: `msg-${Date.now()}-bot`,
        text: `You said: "${text}". This is a simulated response to test keyboard behavior.`,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages([...updatedMessages, botMessage]);
    }, 1000);
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const renderButton = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.buttonContainer, { backgroundColor: item.color }]}
      onPress={() => {
        setShow(false);
        handleSendMessage(`Clicked ${item.title}`);
      }}
    >
      <Text style={styles.buttonText}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {openLeftDrawer && (
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={openLeftDrawer}
          >
            <AntDesign name="menufold" size={24} color="#000" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Keyboard Demo</Text>
        
        {/* Network status indicator */}
        <View style={styles.headerButton}>
          {networkStatus === 'loading' && (
            <ActivityIndicator size="small" color="#007AFF" />
          )}
          {networkStatus === 'success' && (
            <AntDesign name="checkcircle" size={18} color="green" />
          )}
          {networkStatus === 'error' && (
            <AntDesign name="exclamationcircle" size={18} color="red" />
          )}
        </View>
      </View>
      
      {/* Network status banner */}
      {shouldLoad && (
        <View style={{
          padding: 5,
          backgroundColor: networkStatus === 'error' ? '#ffdddd' : '#f0f0f0',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <Text style={{ fontSize: 12 }}>
            Status: {networkStatus} | Success: {networkSuccessCount} | Errors: {networkErrorCount}
          </Text>
          {lastNetworkResponse && (
            <Text style={{ fontSize: 12 }}>
              Last: {lastNetworkResponse.toLocaleTimeString()}
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.imageContainer}>
        <AntDesign name="questioncircleo" size={200} color="#e1e1e1" style={styles.backgroundImage} />
      </View>

      <View style={{ display: messages.length !== 0 && shouldLoad ? "flex" : "none", flex: 1 }}>
        <ChatWrapper>
          <Chat messages={messages} />
        </ChatWrapper>
      </View>
      
      <View style={{ display: messages.length !== 0 && shouldLoad ? "none" : "flex", flex: 1 }}>
        <NoChatWrapper>
          <NoChat onSuggestionPress={handleSuggestionPress} />
        </NoChatWrapper>
      </View>
      
      <View>
        <OverKeyboardView visible={isShow}>
          <TouchableWithoutFeedback
            style={styles.fullScreen}
            testID="over_keyboard_view.background"
            onPressIn={() => {
              console.log("hide");
              setShow(false);
            }}
          >
            <View style={styles.overlayContainer}>
              <TouchableOpacity
                testID="over_keyboard_view.content"
                onPress={() => {
                  console.log("hide");
                  setShow(false);
                }}
              >
                <View style={styles.background} />
                <TouchableOpacity 
                  style={styles.drawerButton}
                  onPress={openLeftDrawer}
                >
                  <AntDesign name="bars" size={24} color="#333" />
                  <Text>Open Drawer</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={styles.complexButtonsWrapper}>
                <FlatList
                  data={buttons}
                  renderItem={renderButton}
                  keyExtractor={(item) => item.id}
                  numColumns={3}
                  style={{ maxHeight: Dimensions.get('window').height * 0.3 }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </OverKeyboardView>
      </View>
      
      <KeyboardStickyView style={{ width: '100%', paddingTop: 0, position: 'absolute', bottom: 0 }}>
        <InputBox onSendMessage={handleSendMessage} />
        <TouchableWithoutFeedback onPressIn={() => {
          console.log("show");
          setShow(true);
        }}>
          <View style={styles.button}>
            <AntDesign name="upcircle" size={24} color="white" style={styles.buttonIcon} />
            <Text style={{ color: 'white' }}>Show Overlay</Text>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardStickyView>
    </View>
  );
};

export default MainScreenDemo; 