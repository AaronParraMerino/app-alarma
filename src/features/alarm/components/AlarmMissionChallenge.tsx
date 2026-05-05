import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../shared/theme/colors';
import { MISSION_LABELS } from '../../missions/constants/missions';
import { generateChallenges } from '../../missions/wordCompletion/constants/wordCompletion.config';
import { WordCompletionService } from '../../missions/wordCompletion/services/WordCompletionService';
import { WordChallenge } from '../../missions/wordCompletion/types/wordCompletion.types';
import { Difficulty, MissionType } from '../types/alarm.types';

interface AlarmMissionChallengeProps {
  type: MissionType;
  difficulty: Difficulty;
  onComplete: () => void;
}

const DIFFICULTY_STEPS: Record<Difficulty, number> = {
  easy: 3,
  normal: 4,
  hard: 5,
};

const COLOR_OPTIONS = [
  { label: 'Azul', value: 'blue', color: Colors.primary },
  { label: 'Verde', value: 'green', color: Colors.success },
  { label: 'Amarillo', value: 'yellow', color: Colors.warning },
  { label: 'Rojo', value: 'red', color: Colors.danger },
];

const WRITING_PHRASES: Record<Difficulty, string> = {
  easy: 'estoy despierto',
  normal: 'voy a levantarme ahora',
  hard: 'neuro wake cumplio su trabajo',
};

function toWordDifficulty(difficulty: Difficulty): 'easy' | 'medium' | 'hard' {
  return difficulty === 'normal' ? 'medium' : difficulty;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildMathProblem(difficulty: Difficulty) {
  const max = difficulty === 'easy' ? 12 : difficulty === 'normal' ? 30 : 80;
  const a = randomInt(2, max);
  const b = randomInt(2, difficulty === 'hard' ? 20 : 12);
  const operation = difficulty === 'easy' ? '+' : difficulty === 'normal' ? '-' : 'x';
  const answer = operation === '+'
    ? a + b
    : operation === '-'
      ? a - b
      : a * b;

  return {
    question: `${a} ${operation} ${b}`,
    answer: String(answer),
  };
}

function buildSequence(difficulty: Difficulty): number[] {
  return Array.from({ length: DIFFICULTY_STEPS[difficulty] }, () => randomInt(1, 9));
}

function renderMaskedWord(challenge: WordChallenge): string {
  return challenge.word
    .split('')
    .map((letter, index) => challenge.missingIndexes.includes(index) ? '_' : letter)
    .join(' ');
}

export default function AlarmMissionChallenge({
  type,
  difficulty,
  onComplete,
}: AlarmMissionChallengeProps) {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const mathProblem = useMemo(() => buildMathProblem(difficulty), [difficulty, type]);
  const sequence = useMemo(() => buildSequence(difficulty), [difficulty, type]);
  const wordChallenge = useMemo(
    () => generateChallenges(toWordDifficulty(difficulty))[0],
    [difficulty, type],
  );
  const colorTarget = useMemo(
    () => COLOR_OPTIONS[randomInt(0, COLOR_OPTIONS.length - 1)],
    [difficulty, type],
  );
  const writingPhrase = WRITING_PHRASES[difficulty];

  const fail = () => {
    setError('Intenta otra vez');
    setAnswer('');
  };

  const checkTextAnswer = (expected: string) => {
    if (answer.trim().toLowerCase() === expected.toLowerCase()) {
      onComplete();
      return;
    }
    fail();
  };

  const handleSequencePress = (value: number) => {
    if (sequence[progress] !== value) {
      setProgress(0);
      fail();
      return;
    }

    const next = progress + 1;
    setProgress(next);
    setError('');

    if (next >= sequence.length) {
      onComplete();
    }
  };

  const renderMathMission = () => (
    <>
      <Text style={styles.prompt}>Resuelve para apagar</Text>
      <Text style={styles.problem}>{mathProblem.question} = ?</Text>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        keyboardType="numeric"
        placeholder="Respuesta"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
      />
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => checkTextAnswer(mathProblem.answer)}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>Confirmar</Text>
      </TouchableOpacity>
    </>
  );

  const renderWritingMission = () => (
    <>
      <Text style={styles.prompt}>Escribe la frase exacta</Text>
      <Text style={styles.phrase}>{writingPhrase}</Text>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        placeholder="Escribe aqui"
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        style={styles.input}
      />
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => checkTextAnswer(writingPhrase)}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>Confirmar</Text>
      </TouchableOpacity>
    </>
  );

  const renderColorMission = () => (
    <>
      <Text style={styles.prompt}>Toca el color correcto</Text>
      <Text style={styles.phrase}>{colorTarget.label}</Text>
      <View style={styles.optionGrid}>
        {COLOR_OPTIONS.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[styles.colorButton, { backgroundColor: option.color }]}
            onPress={() => option.value === colorTarget.value ? onComplete() : fail()}
            activeOpacity={0.85}
          >
            <Text style={styles.colorButtonText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderSequenceMission = () => (
    <>
      <Text style={styles.prompt}>Repite la secuencia</Text>
      <Text style={styles.sequencePreview}>{sequence.join('  ')}</Text>
      <Text style={styles.progressText}>
        {progress} / {sequence.length}
      </Text>
      <View style={styles.numberGrid}>
        {Array.from({ length: 9 }, (_, index) => index + 1).map(value => (
          <TouchableOpacity
            key={value}
            style={styles.numberButton}
            onPress={() => handleSequencePress(value)}
            activeOpacity={0.85}
          >
            <Text style={styles.numberButtonText}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  const renderWordMission = () => (
    <>
      <Text style={styles.prompt}>Completa las letras faltantes</Text>
      <Text style={styles.wordPreview}>{renderMaskedWord(wordChallenge)}</Text>
      <Text style={styles.progressText}>
        {wordChallenge.missingIndexes.length} letra
        {wordChallenge.missingIndexes.length > 1 ? 's' : ''} faltante
        {wordChallenge.missingIndexes.length > 1 ? 's' : ''}
      </Text>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        placeholder={Array(wordChallenge.missingIndexes.length).fill('_').join('')}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="characters"
        maxLength={wordChallenge.missingIndexes.length}
        style={styles.input}
      />
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          if (WordCompletionService.validateAnswer(wordChallenge, answer)) {
            onComplete();
            return;
          }
          fail();
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryButtonText}>Confirmar</Text>
      </TouchableOpacity>
    </>
  );

  const content = type === 'math'
    ? renderMathMission()
    : type === 'writing'
      ? renderWritingMission()
    : type === 'color'
      ? renderColorMission()
      : type === 'wordCompletion'
        ? renderWordMission()
        : renderSequenceMission();

  return (
    <View style={styles.card}>
      <Text style={styles.badge}>{MISSION_LABELS[type]}</Text>
      {content}
      {error.length > 0 && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 560,
    backgroundColor: '#101727',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1A2741',
    padding: 18,
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    color: Colors.primaryLight,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  prompt: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  problem: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  phrase: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    color: Colors.text,
    fontSize: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  optionGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorButton: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  colorButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  sequencePreview: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  wordPreview: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 3,
  },
  progressText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  numberGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  numberButton: {
    flexBasis: '30%',
    flexGrow: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    paddingVertical: 14,
    alignItems: 'center',
  },
  numberButtonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
});
