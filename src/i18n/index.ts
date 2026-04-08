import { useAuthStore } from '../stores/authStore';
import translations, { Language, Translations } from './translations';

export function useTranslation(): Translations {
  const language = useAuthStore((state) => state.settings.language) as Language;
  return (translations[language] ?? translations.en) as unknown as Translations;
}

export { Language, Translations };
