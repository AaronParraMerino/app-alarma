// src/features/history/screens/MissionHistoryScreen.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors } from '../../../shared/theme/colors';
import { Layout } from '../../../shared/theme/layout';

import { useMissionHistory } from '../hooks/useMissionHistory';
import { HistoryFilterChips } from '../components/HistoryFilterChips';
import { HistorySummaryCards } from '../components/HistorySummaryCards';
import { DifficultyStatsCard } from '../components/DifficultyStatsCard';
import { MissionTypeStatsCard } from '../components/MissionTypeStatsCard';
import { MissionHistoryCard } from '../components/MissionHistoryCard';
import { EmptyHistoryState } from '../components/EmptyHistoryState';

type Props = NativeStackScreenProps<any, 'MissionHistory'>;

const CARD_BG = '#12161F';
const TEXT_SIZE = 14;
const TEXT_WEIGHT = '700' as const;
const CARD_MIN_HEIGHT = 64;

export default function MissionHistoryScreen({ navigation, route }: Props) {
  const userId: string = route.params?.userId ?? '';

  const {
    registros,
    loading,
    error,
    filtroActivo,
    resumen,
    porDificultad,
    porTipo,
    setFiltro,
    refetch,
  } = useMissionHistory(userId);

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor={Colors.bg} barStyle="light-content" />

      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.75}
          >
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              Historial de misiones
            </Text>
          </View>

          <View style={styles.headerRightSpace} />
        </View>

        <View style={styles.filtersWrap}>
          <HistoryFilterChips filtroActivo={filtroActivo} onSelect={setFiltro} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : error ? (
          <View style={styles.statusCard}>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity
              onPress={refetch}
              style={styles.retryBtn}
              activeOpacity={0.75}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <HistorySummaryCards resumen={resumen} />

            <DifficultyStatsCard
              stats={porDificultad}
              total={resumen.total}
            />

            <MissionTypeStatsCard porTipo={porTipo} />

            <Text style={styles.sectionLabel}>RECIENTES</Text>

            {registros.length === 0 ? (
              <EmptyHistoryState />
            ) : (
              registros.map((item) => (
                <MissionHistoryCard key={String(item.id)} item={item} />
              ))
            )}

            <View style={styles.bottomSpace} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  page: {
    flex: 1,
    width: '100%',
    maxWidth: Layout.maxWideContentWidth,
    alignSelf: 'center',
  },

  header: {
    width: '100%',
    minHeight: CARD_MIN_HEIGHT,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 6,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 92,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backArrow: {
    color: Colors.text,
    fontSize: 38,
    fontWeight: '400',
    lineHeight: 38,
    marginRight: 4,
    marginTop: -2,
  },

  backText: {
    color: Colors.text,
    fontSize: TEXT_SIZE,
    fontWeight: TEXT_WEIGHT,
  },

  titleWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    width: '100%',
    textAlign: 'center',
    color: Colors.text,
    fontSize: TEXT_SIZE,
    fontWeight: TEXT_WEIGHT,
  },

  headerRightSpace: {
    width: 92,
  },

  filtersWrap: {
    width: '100%',
    height: 46,
    maxHeight: 46,
    overflow: 'hidden',
    marginBottom: 10,
  },

  scroll: {
    paddingBottom: 110,
  },

  sectionLabel: {
    fontSize: TEXT_SIZE,
    fontWeight: TEXT_WEIGHT,
    color: Colors.textSecondary,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 8,
  },

  loadingWrap: {
    minHeight: CARD_MIN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Layout.screenPadding,
    marginTop: 18,
    paddingVertical: 12,
  },

  loadingText: {
    color: Colors.textSecondary,
    fontSize: TEXT_SIZE,
    fontWeight: TEXT_WEIGHT,
    marginTop: 10,
    textAlign: 'center',
  },

  statusCard: {
    minHeight: CARD_MIN_HEIGHT,
    backgroundColor: CARD_BG,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Layout.screenPadding,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorText: {
    color: Colors.danger,
    fontSize: TEXT_SIZE,
    fontWeight: TEXT_WEIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },

  retryBtn: {
    minHeight: CARD_MIN_HEIGHT,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 20,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryText: {
    color: Colors.text,
    fontSize: TEXT_SIZE,
    fontWeight: TEXT_WEIGHT,
    textAlign: 'center',
  },

  bottomSpace: {
    height: 24,
  },
});