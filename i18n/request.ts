import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type SupportedLocale } from './config';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('locale')?.value;
  const locale = SUPPORTED_LOCALES.includes(raw as SupportedLocale)
    ? (raw as SupportedLocale)
    : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
