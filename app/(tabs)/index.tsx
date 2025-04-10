import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Button,
  Text,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
  FlatList,
  Image,
  Animated,
  ActivityIndicator,
} from "react-native";
import {
  GestureHandlerRootView,
  TouchableOpacity,
  DrawerLayout,
  Swipeable,
} from "react-native-gesture-handler";
import { KeyboardStickyView, OverKeyboardView, KeyboardProvider} from "react-native-keyboard-controller";
import { AntDesign } from "@expo/vector-icons";

// Define a list of icons to use from AntDesign
const iconNames = [
  'stepforward', 'stepbackward', 'forward', 'caretright', 'caretleft', 
  'caretdown', 'caretup', 'rightcircle', 'leftcircle', 'upcircle', 'downcircle', 
  'delete', 'star', 'plus', 'heart', 'close', 'check', 'calendar', 'home', 
  'setting', 'mail', 'lock', 'user', 'phone', 'camera', 'search', 'bars'
];

// Define item type
type Item = {
  id: string;
  title: string;
  description: string;
};

// Generate large dataset for slow rendering
const generateItems = (count: number): Item[] => {
  return Array(count).fill(0).map((_, index) => ({
    id: `item-${index}`,
    title: `Item ${index}`,
    description: `This is a description for item ${index} that is intentionally verbose to use more memory and slow down rendering performance.`
  }));
};

// Generate a large number of button configurations to make rendering heavy
const generateButtons = (count: number) => {
  return Array(count).fill(0).map((_, index) => ({
    id: `button-${index}`,
    title: `Button ${index}`,
    color: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
    size: 20 + Math.floor(Math.random() * 30),
    shadowRadius: 5 + Math.floor(Math.random() * 10),
    elevation: 5 + Math.floor(Math.random() * 15),
    borderRadius: 5 + Math.floor(Math.random() * 20),
    padding: 10 + Math.floor(Math.random() * 15),
    icon: iconNames[Math.floor(Math.random() * iconNames.length)] // Random icon from the list
  }));
};

export default function OverKeyboardViewExample() {
  const [isShow, setShow] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [buttons, setButtons] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const drawerRef = useRef<DrawerLayout>(null);
  // Store all swipeable refs in a Map instead of creating hooks inside renderItem
  const swipeableRefs = useRef(new Map<string, Swipeable>());
  // Animated values for button animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Generate 500 items to slow down rendering
    setItems(generateItems(500));
    
    // Generate 100 buttons to make button grid rendering heavy
    setTimeout(() => {
      setButtons(generateButtons(100));
      setLoading(false);
      
      // Run animations
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ]).start();
    }, 1000);
  }, []);

  const closeSwipeable = useCallback((id: string) => {
    const swipeable = swipeableRefs.current.get(id);
    swipeable?.close();
  }, []);

  const renderRightActions = useCallback((id: string) => {
    return (
      <View style={styles.rightAction}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: 'red' }]}
          onPress={() => closeSwipeable(id)}
        >
          <AntDesign name="delete" size={24} color="white" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  }, []);

  const renderItem = useCallback(({ item }: { item: Item }) => {
    return (
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current.set(item.id, ref);
          } else {
            swipeableRefs.current.delete(item.id);
          }
        }}
        friction={2}
        renderRightActions={() => renderRightActions(item.id)}
      >
        <View style={styles.itemContainer}>
          <AntDesign name="filetext1" size={20} color="#666" style={styles.itemIcon} />
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
          </View>
        </View>
      </Swipeable>
    );
  }, [renderRightActions]);

  const renderDrawerContent = useCallback(() => {
    return (
      <View style={styles.drawerContainer}>
        <Text style={styles.drawerTitle}>Drawer Menu</Text>
        <TouchableOpacity style={styles.drawerItem}>
          <AntDesign name="home" size={24} color="#333" style={styles.drawerItemIcon} />
          <Text>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem}>
          <AntDesign name="user" size={24} color="#333" style={styles.drawerItemIcon} />
          <Text>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem}>
          <AntDesign name="setting" size={24} color="#333" style={styles.drawerItemIcon} />
          <Text>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.drawerItem}>
          <AntDesign name="logout" size={24} color="#333" style={styles.drawerItemIcon} />
          <Text>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }, []);
  
  const renderComplexButton = useCallback(({ item, index }: { item: any, index: number }) => {
    // Calculate a delay based on index for staggered animation effect
    const buttonOpacity = Animated.multiply(
      opacityAnim, 
      new Animated.Value(Math.min(1, 1 - (index % 10) * 0.1))
    );
    
    return (
      <Animated.View 
        style={[
          styles.complexButtonContainer,
          {
            backgroundColor: item.color,
            borderRadius: item.borderRadius,
            padding: item.padding,
            shadowRadius: item.shadowRadius,
            elevation: item.elevation,
            transform: [{ scale: scaleAnim }],
            opacity: buttonOpacity
          }
        ]}
      >
        <TouchableOpacity
          style={styles.complexButton}
          onPress={() => {
            console.log(`Button ${item.id} pressed`);
          }}
        >
          {/* Use AntDesign icon instead of custom icon placeholder */}
          <AntDesign name={item.icon} size={24} color="white" style={styles.buttonIcon} />
          <Text style={[styles.complexButtonText, { fontSize: item.size * 0.7 }]}>{item.title}</Text>
          
          {/* Add more elements to make it heavier to render */}
          <View style={styles.buttonDetails}>
            <View style={styles.buttonBadge}>
              <Text style={styles.badgeText}>{index}</Text>
            </View>
            {index % 3 === 0 && <ActivityIndicator size="small" color="#ffffff" />}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [scaleAnim, opacityAnim]);

  return (
    <GestureHandlerRootView style={styles.fullScreen}>
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={250}
        drawerPosition="left"
        drawerType="front"
        drawerBackgroundColor="#f8f8f8"
        renderNavigationView={renderDrawerContent}
      >
        <View style={styles.container}>
          {/* FlatList to make rendering slower */}
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            style={styles.list}
          />
        
          {/* TextInput wrapped in KeyboardStickyView */}
          <View>
          <OverKeyboardView visible={isShow}>
            <TouchableWithoutFeedback
              style={styles.fullScreen}
              testID="over_keyboard_view.background"
              onPressIn={() => {
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
                  <TouchableOpacity 
                    style={styles.drawerButton}
                    onPress={() => drawerRef.current?.openDrawer()}
                  >
                    <AntDesign name="bars" size={24} color="#333" />
                    <Text>Open Drawer</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                <View style={styles.complexButtonsWrapper}>
                  {loading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                  ) : (
                    <FlatList
                      data={buttons}
                      renderItem={renderComplexButton}
                      keyExtractor={item => item.id}
                      numColumns={3}
                      style={styles.buttonsGrid}
                      contentContainerStyle={styles.buttonsGridContent}
                      initialNumToRender={15}
                      maxToRenderPerBatch={10}
                      windowSize={5}
                    />
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </OverKeyboardView>
          </View>
                    
          <KeyboardStickyView style={[styles.keyboardStickyView, {paddingBottom: 100}]}>
            <TextInput style={styles.input} testID="over_keyboard_view.input" />
          <TouchableWithoutFeedback onPressIn={() => {
            console.log("show")
            setShow(true)
          }}>
            <View style={styles.button}>
              <AntDesign name="upcircle" size={24} color="white" style={styles.buttonIcon} />
              <Text>Show</Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback 
            style={styles.drawerButton}
            onPressIn={() => drawerRef.current?.openDrawer()}
          >
            <View style={styles.drawerButton}>
              <AntDesign name="bars" size={24} color="#333" />
              <Text>Open Drawer</Text>
            </View>
          </TouchableWithoutFeedback>
          </KeyboardStickyView>
        </View>
      </DrawerLayout>
    </GestureHandlerRootView>
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
    
    top:0,
    left:0,
    right:0,
    bottom:0,
  },
  input: {
    backgroundColor: "yellow",
    width: 200,
    height: 50,
    alignSelf: "center",
    marginTop: 150,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    marginRight: 10,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: 'red',
    width: '100%',
    height: 40,
    zIndex: 1000,
    //the other for zinde to make work on android that is on leve and show shadow:
    elevation: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 5,
  },
  drawerContainer: {
    flex: 1,
    padding: 20,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  drawerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerItemIcon: {
    marginRight: 10,
  },
  drawerButton: {
    backgroundColor: '#ddd',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 80,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  complexButtonsWrapper: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  buttonsGrid: {
    flex: 1,
  },
  buttonsGridContent: {
    paddingVertical: 10,
  },
  complexButtonContainer: {
    flex: 1/3,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
  },
  complexButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  complexButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  iconPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  iconInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  buttonDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 5,
    marginTop: 5,
  },
  buttonBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});