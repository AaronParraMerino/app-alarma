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
import { useFocusEffect } from '@react-navigation/native';

import { Layout } from '../../../shared/theme/layout';
import { useAppTheme } from '../../../shared/theme/useAppTheme';
import { useTranslation } from '../../../shared/i18n/useTranslation';

import { useMissionHistory } from '../hooks/useMissionHistory';
import { HistoryFilterChips } from '../components/HistoryFilterChips';
import { HistorySummaryCards } from '../components/HistorySummaryCards';
import { DifficultyStatsCard } from '../components/DifficultyStatsCard';
import { MissionTypeStatsCard } from '../components/MissionTypeStatsCard';
import { MissionHistoryCard } from '../components/MissionHistoryCard';
import { EmptyHistoryState } from '../components/EmptyHistoryState';

type Props = NativeStackScreenProps<
  any,
  'MissionHistory'
>;

const TEXT_SIZE = 14;
const TEXT_WEIGHT = '700' as const;
const CARD_MIN_HEIGHT = 64;

export default function MissionHistoryScreen({
  navigation,
  route,
}: Props) {
  const {
    colors,
    statusBarStyle,
  } = useAppTheme();

  const {
    language,
  } = useTranslation();

  const isSpanish = language === 'es';

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

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [
      refetch,
    ]),
  );

  return (
    <SafeAreaView
      style={[
        styles.safe,
        {
          backgroundColor: colors.bg,
        },
      ]}
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
      <StatusBar
        backgroundColor={colors.bg}
        barStyle={statusBarStyle}
      />

      <View style={styles.page}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.backArrow,
                {
                  color: colors.text,
                },
              ]}
            >
              ‹
            </Text>

            <Text
              style={[
                styles.backText,
                {
                  color: colors.text,
                },
              ]}
            >
              {isSpanish ? 'Volver' : 'Back'}
            </Text>
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.82}
            >
              {isSpanish
                ? 'Historial de misiones'
                : 'Mission history'}
            </Text>
          </View>

          <View style={styles.headerRightSpace} />
        </View>

        <View style={styles.filtersWrap}>
          <HistoryFilterChips
            filtroActivo={filtroActivo}
            onSelect={setFiltro}
          />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator
              color={colors.primary}
              size="small"
            />

            <Text
              style={[
                styles.loadingText,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {isSpanish
                ? 'Cargando historial...'
                : 'Loading history...'}
            </Text>
          </View>
        ) : error ? (
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.errorText,
                {
                  color: colors.danger,
                },
              ]}
            >
              {error}
            </Text>

            <TouchableOpacity
              onPress={refetch}
              style={[
                styles.retryBtn,
                {
                  backgroundColor: colors.bgElevated,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.retryText,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {isSpanish
                  ? 'Reintentar'
                  : 'Try again'}
              </Text>
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

            <Text
              style={[
                styles.sectionLabel,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {isSpanish
                ? 'RECIENTES'
                : 'RECENT'}
            </Text>

            {registros.length === 0 ? (
              <EmptyHistoryState />
            ) : (
              registros.map((item) => (
                <MissionHistoryCard
                  key={String(item.id)}
                  item={item}
                />
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
    fontSize: 38,
    fontWeight: '400',
    lineHeight: 38,
    marginRight: 4,
    marginTop: -2,
  },

  backText: {
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
    fontSize: TEXT_SIZE,
    fontWeight: TEXT_WEIGHT,
    marginTop: 10,
    textAlign: 'center',
  },

  statusCard: {
    minHeight: CARD_MIN_HEIGHT,
    borderRadius: Layout.cardRadius,
    borderWidth: 1,
    marginHorizontal: Layout.screenPadding,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorText: {
    fontSize: TEXT_SIZE,
    fontWeight: TEXT_WEIGHT,
    textAlign: 'center',
    lineHeight: 20,
  },

  retryBtn: {
    minHeight: CARD_MIN_HEIGHT,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 20,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  retryText: {
    fontSize: TEXT_SIZE,
    fontWeight: TEXT_WEIGHT,
    textAlign: 'center',
  },

  bottomSpace: {
    height: 24,
  },
});
