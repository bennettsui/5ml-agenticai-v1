// Re-exports from the shared LanguageProvider context.
// All components must be wrapped in <LanguageProvider> (via layout.tsx) for state to be shared.
export { useLanguage, type Lang } from '../components/LanguageProvider';
