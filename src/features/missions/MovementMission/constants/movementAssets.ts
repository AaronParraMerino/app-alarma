import { ImageSourcePropType } from 'react-native';
import { MovementType } from '../types/movement.types';

export const MOVEMENT_IMAGES: Record<MovementType, ImageSourcePropType> = {
  shake: require('../../../../../assets/movement/shake.webp'),
  walk: require('../../../../../assets/movement/walk.webp'),
  rotate: require('../../../../../assets/movement/rotate.webp'),
  tilt: require('../../../../../assets/movement/tilt.webp'),
};
