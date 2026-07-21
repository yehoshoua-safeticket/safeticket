import { getFaqs } from '@/lib/faqs';
import HowItWorksContent from './HowItWorksContent';

/**
 * Server component so the FAQ copy is fetched before render and ships in the
 * initial HTML; everything interactive lives in HowItWorksContent.
 */
export default async function HowItWorksPage() {
  const faqs = await getFaqs();
  return <HowItWorksContent faqs={faqs} />;
}
