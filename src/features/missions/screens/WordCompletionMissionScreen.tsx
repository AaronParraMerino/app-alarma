import React from 'react';
import { WordCompletionScreen } from './WordCompletionScreen';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MissionsStackParamList } from '../navigation/MissionsNavigator';

//
type RouteType = RouteProp<
  MissionsStackParamList,
  'WordCompletionMission'
>;

export default function WordCompletionMissionScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();

  const difficulty = route.params.difficulty;

  return (
    <WordCompletionScreen
      difficulty={difficulty}
      onMissionComplete={() => {
        navigation.goBack();
      }}
    />
  );
}