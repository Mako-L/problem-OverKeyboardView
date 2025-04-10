import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView, DrawerLayout } from 'react-native-gesture-handler';

import MainScreenDemo from '@/components/MainScreenDemo';

export default function ChatScreen() {
  const drawerRef = useRef<DrawerLayout>(null);
  
  const openLeftDrawer = () => {
    drawerRef.current?.openDrawer();
  };
  
  const renderDrawerContent = () => {
    return (
      <View style={styles.drawerContent}>
        {/* Drawer content would go here */}
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={250}
        drawerPosition="left"
        drawerType="front"
        drawerBackgroundColor="#f8f8f8"
        renderNavigationView={renderDrawerContent}
      >
        <MainScreenDemo openLeftDrawer={openLeftDrawer} />
      </DrawerLayout>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
}); 