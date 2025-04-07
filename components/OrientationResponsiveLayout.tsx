import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useScreenOrientation } from '@/hooks/useScreenOrientation';
import { ThemedText } from './ThemedText';

type OrientationResponsiveLayoutProps = {
  portraitContent?: React.ReactNode;
  landscapeContent?: React.ReactNode;
  children?: React.ReactNode;
};

export function OrientationResponsiveLayout({
  portraitContent,
  landscapeContent,
  children
}: OrientationResponsiveLayoutProps) {
  const { orientation } = useScreenOrientation();
  
  return (
    <View style={[
      styles.container,
      orientation === 'landscape' ? styles.landscapeContainer : styles.portraitContainer,
    ]}>
      <ThemedText style={styles.orientationText}>
        Current orientation: {orientation}
      </ThemedText>
      
      {/* If specific content is provided for the current orientation, show it */}
      {orientation === 'portrait' && portraitContent}
      {orientation === 'landscape' && landscapeContent}
      
      {/* Otherwise show the default children */}
      {!((orientation === 'portrait' && portraitContent) || 
         (orientation === 'landscape' && landscapeContent)) && children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  portraitContainer: {
    // Portrait-specific styles
    paddingHorizontal: 20,
  },
  landscapeContainer: {
    // Landscape-specific styles
    paddingHorizontal: 50,
    flexDirection: 'row',
  },
  orientationText: {
    marginBottom: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 