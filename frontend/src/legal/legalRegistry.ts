// @ts-ignore
import TermsOfService from './TERMS_OF_SERVICE.md?raw';
// @ts-ignore
import PrivacyPolicy from './PRIVACY_POLICY.md?raw';

export interface LegalDocument {
  id: string;
  title: string;
  description: string;
  content: string;
  lastUpdated: string;
  route: string;
}

export const legalDocuments: LegalDocument[] = [
  {
    id: 'terms-of-service',
    title: 'Terms of Service',
    description: 'Terms and conditions for using Allcontext',
    content: TermsOfService,
    lastUpdated: 'September 15, 2025',
    route: '/legal/terms-of-service',
  },
  {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your data',
    content: PrivacyPolicy,
    lastUpdated: 'September 15, 2025',
    route: '/legal/privacy-policy',
  }
];

export const getLegalDocumentById = (id: string): LegalDocument | undefined => {
  return legalDocuments.find(doc => doc.id === id);
};

export const getLegalDocumentByRoute = (route: string): LegalDocument | undefined => {
  return legalDocuments.find(doc => doc.route === route);
};
