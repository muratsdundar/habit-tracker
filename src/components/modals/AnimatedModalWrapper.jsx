import React, { useEffect, useRef, useState } from 'react';
import { Modal, Animated, StyleSheet, Easing, TouchableWithoutFeedback, View } from 'react-native';

const CLOSE_DURATION = 150; // Must match the longest animation duration below

export default function AnimatedModalWrapper({ 
  visible, 
  onClose, 
  children, 
  align = 'flex-end', // 'center' or 'flex-end'
  overlayColor = 'rgba(0,0,0,0.5)'
}) {
  const [showModal, setShowModal] = useState(visible);
  const isMounted = useRef(true);
  const closeTimerRef = useRef(null);
  
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.8)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Track mount status to prevent setState on unmounted component
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // Clear any pending close timer on unmount — critical safety net
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (visible) {
      // Cancel any pending close timer from a previous close cycle
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      setShowModal(true);
      Animated.sequence([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(contentScale, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          })
        ])
      ]).start();
    } else {
      // Stop any in-progress open animation before starting close
      overlayOpacity.stopAnimation();
      contentOpacity.stopAnimation();
      contentScale.stopAnimation();

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: CLOSE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(contentScale, {
          toValue: 0.9,
          duration: CLOSE_DURATION,
          useNativeDriver: true,
        })
      ]).start(({ finished }) => {
        // Primary path: animation callback fires normally
        if (finished && isMounted.current) {
          setShowModal(false);
        }
      });

      // ─── SAFETY NET ─────────────────────────────────────────────────────────
      // If the .start() callback is silently dropped (interrupted render,
      // re-animation, component stress), this timer guarantees the invisible
      // RN Modal is always dismissed. Duration is animation length + 50ms buffer.
      closeTimerRef.current = setTimeout(() => {
        if (isMounted.current) {
          setShowModal(false);
        }
        closeTimerRef.current = null;
      }, CLOSE_DURATION + 50);
    }
  }, [visible]);

  if (!showModal) return null;

  const isCenter = align === 'center';

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      {/*
        Layer 1: Dimmed overlay — absolute-fill, sits behind content.
        TouchableWithoutFeedback closes the modal when tapping outside.
      */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[
          StyleSheet.absoluteFill,
          { backgroundColor: overlayColor, opacity: overlayOpacity }
        ]} />
      </TouchableWithoutFeedback>

      {/*
        Layer 2: Content positioner — absolute-fill flex container.
        - 'center': content is centered on both axes.
        - 'flex-end' (bottom-sheet): content sticks to bottom edge.
        pointerEvents="box-none" lets taps on empty space fall through to overlay Layer 1.
      */}
      <View
        style={[
          StyleSheet.absoluteFill,
          isCenter ? styles.positionerCenter : styles.positionerBottom,
        ]}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: contentOpacity,
              transform: [{ scale: contentScale }],
            },
            isCenter ? styles.contentWrapperCenter : styles.contentWrapperBottom,
          ]}
          pointerEvents="box-none"
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  positionerCenter: {
    // Center modals: place child at the visual center of the screen
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionerBottom: {
    // Bottom-sheet modals: stick content to the bottom edge
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  contentWrapper: {
    // Guard: never let content overflow the screen height
    maxHeight: '95%',
  },
  contentWrapperCenter: {
    // Center modals size to their own content width (modal card handles its own width)
    alignSelf: 'center',
    width: '100%',
  },
  contentWrapperBottom: {
    // Bottom-sheet modals fill the full width
    width: '100%',
  },
});
