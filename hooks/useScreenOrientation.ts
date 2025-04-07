import { useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Dimensions } from 'react-native';

type Orientation = 'portrait' | 'landscape';

export function useScreenOrientation() {
  const [orientation, setOrientation] = useState<Orientation>(
    getOrientation()
  );

  function getOrientation(): Orientation {
    const { width, height } = Dimensions.get('window');
    return height > width ? 'portrait' : 'landscape';
  }

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }) => {
        const newOrientation = window.height > window.width 
          ? 'portrait' 
          : 'landscape';
        setOrientation(newOrientation);
      }
    );

    return () => subscription.remove();
  }, []);

  async function lockOrientation(orientationLock: ScreenOrientation.OrientationLock) {
    await ScreenOrientation.lockAsync(orientationLock);
  }

  async function unlockOrientation() {
    await ScreenOrientation.unlockAsync();
  }

  return { 
    orientation,
    lockOrientation,
    unlockOrientation
  };
} 