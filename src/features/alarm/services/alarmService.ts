export interface AlarmSoundOption {
	id: string;
	label: string;
	uri: string | null;
	emoji: string;
}

export const ALARM_SOUND_OPTIONS: AlarmSoundOption[] = [
	{ id: 'silent', label: 'Silencio', uri: null, emoji: '🔕' },
	{ id: 'classic', label: 'Clásico', uri: 'sound://classic', emoji: '⏰' },
	{ id: 'digital', label: 'Digital', uri: 'sound://digital', emoji: '📟' },
	{ id: 'nature', label: 'Naturaleza', uri: 'sound://nature', emoji: '🌿' },
	{ id: 'energetic', label: 'Energético', uri: 'sound://energetic', emoji: '⚡' },
];

export function getAlarmSoundLabel(soundUri: string | null): string {
	const option = ALARM_SOUND_OPTIONS.find(s => s.uri === soundUri);
	return option?.label ?? 'Personalizado';
}
