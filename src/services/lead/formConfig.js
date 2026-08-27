const option = (value, label = value) => ({ value, label });
const options = (values) => values.map((value) => option(value));
const field = (name, label, type = 'text', extra = {}) => ({ name, label, type, storage: 'metadata', ...extra });

const SECTIONS = {
  personalInformation: {
    title: 'Personal Information',
    fields: [
      field('firstName', 'Full Name', 'text', { required: true, storage: 'lead' }),
      field('phone', 'Mobile Number', 'tel', { required: true, storage: 'lead' }),
      field('whatsappNumber', 'WhatsApp Number', 'tel'),
      field('email', 'Email Address', 'email', { required: true, storage: 'lead' }),
      field('gender', 'Gender', 'select', { options: options(['Male', 'Female', 'Other', 'Prefer not to say']) }),
      field('dateOfBirth', 'Date of Birth', 'date'),
      field('maritalStatus', 'Marital Status', 'select', { options: options(['Single', 'Married']) }),
      field('nationality', 'Nationality', 'country-select'),
      field('city', 'Current City', 'text', { storage: 'lead' }),
      field('state', 'State', 'state-select', { storage: 'lead' }),
      field('country', 'Country', 'country-select', { storage: 'lead' }),
    ],
  },
  immigrationRequirement: {
    title: 'Immigration Requirement',
    fields: [field('servicesRequired', 'What service are you looking for?', 'multi-select', { options: options([
      'Permanent Residency (PR)', 'Work Visa', 'Tourist Visa', 'Student Visa', 'Business Visa',
      'Dependent Visa', 'Investor Visa', 'Visit Visa', 'Job Seeker Visa', 'Citizenship',
      'Family Sponsorship', 'IELTS/PTE Coaching', 'Immigration Consultation',
    ]) })],
  },
  destinationCountry: {
    title: 'Destination Country',
    fields: [field('destinationCountries', 'Select Country', 'multi-select', { options: options([
      'Canada', 'Australia', 'New Zealand', 'Germany', 'UK', 'USA', 'Portugal', 'Dubai (UAE)',
      'Singapore', 'Ireland', 'Sweden', 'Denmark', 'Norway', 'Poland', 'Malta', 'Other',
    ]) })],
  },
  education: {
    title: 'Education',
    fields: [
      field('highestQualification', 'Highest Qualification', 'select', { options: options(['10th', '12th', 'Diploma', 'Graduate', 'B.Tech', 'BCA', 'B.Sc', 'MBA', 'MCA', 'Masters', 'PhD']) }),
      field('passingYear', 'Passing Year', 'number'), field('university', 'University'),
      field('percentageOrCgpa', 'Percentage / CGPA'),
    ],
  },
  workExperience: {
    title: 'Work Experience',
    fields: [field('currentCompany', 'Current Company'), field('currentDesignation', 'Current Designation'),
      field('industry', 'Industry'), field('yearsOfExperience', 'Years of Experience', 'number'),
      field('currentSalary', 'Current Salary'), field('relevantExperience', 'Relevant Experience')],
  },
  languageTest: {
    title: 'Language Test',
    fields: [
      field('languageTestTaken', 'Have you taken a language test?', 'select', { options: options(['IELTS', 'PTE', 'TOEFL', 'Duolingo', 'None']) }),
      field('overallScore', 'Overall Score'), field('listeningScore', 'Listening Score'),
      field('readingScore', 'Reading Score'), field('writingScore', 'Writing Score'),
      field('speakingScore', 'Speaking Score'),
    ],
  },
  passport: { title: 'Passport', fields: [field('passportAvailable', 'Passport Available?', 'radio', { options: options(['Yes', 'No']) }), field('passportExpiry', 'Passport Expiry', 'date')] },
  familyInformation: { title: 'Family Information', fields: [field('familyMaritalStatus', 'Marital Status', 'select', { options: options(['Single', 'Married']) }), field('spouseQualification', 'Spouse Qualification'), field('children', 'Children', 'number'), field('dependents', 'Dependents', 'number')] },
  budget: { title: 'Budget', fields: [field('investmentBudget', 'How much can you invest?', 'select', { options: options(['Under 1 Lakh', '1-3 Lakhs', '3-5 Lakhs', '5-10 Lakhs', 'Above 10 Lakhs']) })] },
  timeline: { title: 'Timeline', fields: [field('applicationTimeline', 'When do you plan to apply?', 'select', { options: options(['Immediately', 'Within 1 Month', 'Within 3 Months', 'Within 6 Months', 'Just Researching']) })] },
  documents: { title: 'Documents Upload', fields: [field('resumeUrl', 'Resume', 'file'), field('passportDocumentUrl', 'Passport', 'file'), field('ieltsDocumentUrl', 'IELTS', 'file'), field('educationalCertificateUrls', 'Educational Certificates', 'files'), field('experienceLetterUrls', 'Experience Letters', 'files'), field('bankStatementUrl', 'Bank Statement', 'file')] },
  additionalInformation: { title: 'Additional Information', fields: [field('additionalInformation', 'Additional Information', 'textarea', { placeholder: 'I want PR for Canada under Express Entry.' })] },
  declaration: { title: 'Customer Declaration', fields: [field('consentToCalls', 'I agree to receive calls from verified immigration consultants.', 'checkbox'), field('termsAccepted', 'I accept Terms & Conditions.', 'checkbox', { required: true })] },
};

const CLIENT_LEAD_SECTIONS = [
  'personalInformation',
  'immigrationRequirement',
  'destinationCountry',
  'education',
  'workExperience',
  'languageTest',
  'passport',
  'familyInformation',
  'budget',
  'timeline',
  'documents',
  'additionalInformation',
  'declaration',
];

export const getLeadFormConfig = ({ category, service }) => {
  return {
    category: { id: category.id, name: category.name, slug: category.slug },
    service: { id: service.id, name: service.name },
    sections: CLIENT_LEAD_SECTIONS.map((name) => ({ key: name, ...SECTIONS[name] })),
  };
};
