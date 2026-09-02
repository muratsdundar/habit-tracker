import { HStack, Text, VStack, ZStack, Spacer } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  padding,
  zIndex
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

type HabitWidgetProps = {
  pendingCount: number;
};

const HabitWidget = (props: HabitWidgetProps, environment: WidgetEnvironment) => {
  'widget';

  return (
    <ZStack
      alignment="leading"
      modifiers={[containerBackground('#09090b', 'widget')]}>

      <VStack
        alignment="leading"
        spacing={8}
        modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), padding({ all: 16 }), zIndex(3)]}>
        
        <HStack spacing={8}>
          <Text modifiers={[font({ weight: 'bold', size: 16 }), foregroundStyle('#ffffff')]}>
            HabbiT
          </Text>
          <Spacer />
          <Text modifiers={[font({ weight: 'medium', size: 14 }), foregroundStyle('#6366f1')]}>
            {props.pendingCount ?? 0} {environment.widgetFamily === 'systemSmall' ? 'Left' : 'Tasks Left'}
          </Text>
        </HStack>
        
        <Spacer />
        
        <Text modifiers={[font({ weight: 'medium', size: 14 }), foregroundStyle('#94a3b8')]}>
          Stay consistent!
        </Text>
      </VStack>
    </ZStack>
  );
};

export default createWidget('HabitWidget', HabitWidget);
