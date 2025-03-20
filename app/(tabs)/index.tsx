import { Image, StyleSheet, Platform, View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import React, { useRef, useState, useCallback } from 'react';
import { KeyboardProvider, OverKeyboardView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [showKeyboardView, setShowKeyboardView] = useState(false);
  const [inputText, setInputText] = useState('');
  const [modalContent, setModalContent] = useState('');
  const insets = useSafeAreaInsets();
  
  const handleSubmit = useCallback(() => {
    if (inputText.trim() === '') return;
    
    // Process the input text here
    console.log('Submitted:', inputText);
    setInputText('');
  }, [inputText]);
  
  const handleModalSubmit = useCallback(() => {
    if (modalContent.trim() === '') return;
    
    // Process the modal content here
    console.log('Modal submitted:', modalContent);
    setModalContent('');
    setShowKeyboardView(false);
  }, [modalContent]);

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Main content goes here */}
      <View style={styles.content}>
        <ThemedText>Home Screen Content</ThemedText>
      </View>
      
      {/* Semi-transparent overlay for modal */}
      {showKeyboardView && (
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => setShowKeyboardView(false)}
        />
      )}
      
      {/* Sticky input at bottom */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom || 16 }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.mainInput}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSubmit}
            disabled={inputText.trim() === ''}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={inputText.trim() === '' ? '#ccc' : 'white'} 
            />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.modalButton}
          onPress={() => setShowKeyboardView(true)}
        >
          <ThemedText style={styles.buttonText}>Open Modal</ThemedText>
        </TouchableOpacity>
      </View>
      
      {/* OverKeyboardView for modal content */}
      <KeyboardProvider>
        <OverKeyboardView visible={showKeyboardView} style={styles.keyboardViewContainer}>
          <View 
            style={styles.keyboardContent} 
            onStartShouldSetResponder={() => true}
            onResponderGrant={(e) => e.stopPropagation()}
          >
            <ThemedText style={styles.modalTitle}>Additional Information</ThemedText>
            
            <TextInput
              style={styles.modalTextInput}
              placeholder="Enter additional details here..."
              multiline
              value={modalContent}
              onChangeText={setModalContent}
              autoFocus={showKeyboardView}
            />
            
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => setShowKeyboardView(false)}
              >
                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.submitButton]}
                onPress={handleModalSubmit}
                disabled={modalContent.trim() === ''}
              >
                <ThemedText style={styles.buttonText}>Submit</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </OverKeyboardView>
      </KeyboardProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80, // Space for the input container
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
    zIndex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mainInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    backgroundColor: '#2196F3',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  modalButton: {
    backgroundColor: '#673AB7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2,
  },
  keyboardViewContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  keyboardContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: 14,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  submitButton: {
    backgroundColor: '#2196F3',
  },
});
