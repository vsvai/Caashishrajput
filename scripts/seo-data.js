// scripts/seo-data.js — Central SEO content model for the site.
// Drives scripts/seo-overhaul.js. FAQ answers are shown on-page and in
// FAQPage JSON-LD word-for-word (the generator uses these exact strings for both).
// NOTE: All factual claims (thresholds, due dates, fees) must be verified by a
// practising Chartered Accountant before this content goes live.

module.exports = [
  /* ============================================================
     CORE PAGES
  ============================================================ */
  {
    file: 'index.html',
    title: 'Chartered Accountant Sahibabad, Ghaziabad | CA Ashish Rajput',
    description: 'Chartered Accountant in Sahibabad, Ghaziabad (201005). GST registration, ITR filing and tax audit handled by a practising CA. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    breadcrumbs: null,
    faq: null
  },
  {
    file: 'services.html',
    title: 'CA Services in Sahibabad, Ghaziabad | GST, ITR, Audit & ROC',
    description: 'CA services in Sahibabad, Ghaziabad: GST registration, ITR filing, tax audit, company registration and accounting in Ghaziabad. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    breadcrumbs: [{ label: 'Home', href: 'index.html' }, { label: 'Services' }],
    faq: [
      {
        id: 'faq-svc-list',
        q: 'What services does your CA firm offer in Ghaziabad?',
        a: 'We offer income tax and GST compliance, statutory, internal and tax audits, company, LLP, trust and NGO registration, MSME, FSSAI, IEC and LEI registrations, accounting and bookkeeping, business plans and financial projections, asset valuation, and corporate representation. Every service is handled by a practising Chartered Accountant.'
      },
      {
        id: 'faq-svc-choose',
        q: 'Which service do I need for my new business?',
        a: 'For a new business, the common starting points are company or LLP registration, MSME Udyam registration, and GST registration once your turnover crosses the threshold. Accounting and bookkeeping usually follow. If you are unsure, describe your business to us and we will recommend the right starting point.'
      },
      {
        id: 'faq-svc-fees',
        q: 'How are your service fees charged?',
        a: 'We quote a fixed fee per engagement after understanding your requirement — no hidden charges. Registrations and compliance work are quoted as one-time fees, while recurring work like bookkeeping, GST return filing, or payroll support is priced as a monthly or annual plan.'
      },
      {
        id: 'faq-svc-turnaround',
        q: 'How long do your services take?',
        a: 'Timelines vary by service — GST and MSME registrations are typically fast, company incorporation takes around 7-10 working days, and audits are completed before their statutory deadlines. We confirm the expected timeline at the start of every engagement and keep you updated.'
      },
      {
        id: 'faq-svc-docs',
        q: 'Do you help collect the documents needed?',
        a: 'Yes. For every service, we give you a clear document checklist in advance, review the documents as you share them, and tell you if anything is missing. For most services you can share documents online, and we prepare the applications or filings from them.'
      },
      {
        id: 'faq-svc-combined',
        q: 'Can you handle all my compliance in one place?',
        a: 'Yes. Many clients use us for an annual compliance plan that covers income tax, GST, accounting, audits, and regulatory filings together. This keeps your due dates organised in one calendar, avoids missed deadlines, and often works out more economical than separate engagements.'
      },
      {
        id: 'faq-svc-beyond',
        q: 'Do you serve clients outside Sahibabad and Ghaziabad?',
        a: 'Yes. While our office is in Sahibabad, Ghaziabad, most services are delivered online and we work with clients across Delhi NCR and other cities in India. For matters that require physical presence, such as certain audits, we confirm the location with you before engagement.'
      }
    ]
  },
  {
    file: 'about.html',
    title: 'About CA Ashish Rajput | Chartered Accountant, Sahibabad',
    description: 'About CA Ashish Rajput, practising Chartered Accountant in Sahibabad, Ghaziabad. ICAI member handling GST, ITR, audit and compliance. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    breadcrumbs: [{ label: 'Home', href: 'index.html' }, { label: 'About' }]
  },
  {
    file: 'contact.html',
    title: 'Contact CA Ashish Rajput | Chartered Accountant Sahibabad',
    description: 'Contact CA Ashish Rajput, Chartered Accountant in Sahibabad, Ghaziabad. LG-3, S-14, Krishna Plaza, Vrindavan Garden, Sahibabad. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    breadcrumbs: [{ label: 'Home', href: 'index.html' }, { label: 'Contact' }],
    faq: [
      {
        id: 'faq-contact-phone',
        q: 'What is the best way to reach your office?',
        a: 'Call us at +91 88025 86988 during office hours (Monday to Saturday, 10:00 to 19:00), or message us on WhatsApp with your query. For detailed requirements, send an enquiry through the contact form and we will get back to you. Email at ca.ashishrajput@outlook.com also works.'
      },
      {
        id: 'faq-contact-visit',
        q: 'Where is your office located?',
        a: 'Our office is at LG-3, S-14, Krishna Plaza, Vrindavan Garden, Sahibabad, Ghaziabad, Uttar Pradesh 201005. Krishna Plaza is a short distance from the main Sahibabad road, and the office is easy to reach from Vaishali, Vasundhara, and Indirapuram. A map is available on this page.'
      },
      {
        id: 'faq-contact-hours',
        q: 'What are your office hours?',
        a: 'We work Monday to Saturday, 10:00 AM to 7:00 PM, and remain closed on Sundays and public holidays. For clients who cannot visit during these hours, we can schedule a video call or arrange document submission online. Urgent notices are acknowledged as soon as they are shared.'
      },
      {
        id: 'faq-contact-form',
        q: 'How quickly do you respond to enquiries?',
        a: 'We respond to enquiries within one working day, and usually much sooner during office hours. The enquiry form sends your message to us on WhatsApp, so it reaches us immediately. If your matter is urgent, calling us directly is the fastest option.'
      },
      {
        id: 'faq-contact-services-enquiry',
        q: 'What should I include in my enquiry?',
        a: 'Tell us the service you need — such as GST registration, ITR filing, or an audit — your business type, and any deadlines you are working with. The more detail you share about your requirement, the faster we can confirm the documents, timeline, and fee quote.'
      },
      {
        id: 'faq-contact-remote',
        q: 'Can I work with you remotely?',
        a: 'Yes. Most of our services are delivered online — documents are shared digitally and filings are completed on the government portals. Many clients across Ghaziabad and Delhi NCR never need to visit the office. You can engage us from anywhere in India.'
      }
    ]
  },
  {
    file: 'blog.html',
    title: 'Tax, GST & Compliance Updates | CA in Sahibabad, Ghaziabad',
    description: 'Tax, GST and compliance updates from a Chartered Accountant in Sahibabad, Ghaziabad. Due dates, filing guides and practical advice. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    breadcrumbs: [{ label: 'Home', href: 'index.html' }, { label: 'Blog' }]
  },
  {
    file: 'resources.html',
    title: 'Tax & GST Resources | CA in Sahibabad, Ghaziabad',
    description: 'Tax, GST and compliance resources from a Chartered Accountant in Sahibabad, Ghaziabad: due date calendars, tables and official links. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    breadcrumbs: [{ label: 'Home', href: 'index.html' }, { label: 'Resources' }]
  },

  /* ============================================================
     SERVICE PAGES
  ============================================================ */
  {
    file: 'services/gst.html',
    title: 'GST Registration & Return Filing in Sahibabad, Ghaziabad',
    description: 'GST registration and return filing in Sahibabad, Ghaziabad by a practising Chartered Accountant. GSTR-1, GSTR-3B and GSTR-9 filing. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'GST registration, return filing and compliance',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'GST Registration & Return Filing' }
    ],
    related: [
      { name: 'Income tax return (ITR) filing', href: 'income-tax.html' },
      { name: 'Accounting & bookkeeping services', href: 'accounting-bookkeeping.html' },
      { name: 'Company & LLP registration', href: 'company-llp-registration.html' },
      { name: 'FSSAI registration for food businesses', href: 'fssai-registration.html' }
    ],
    faq: [
      {
        id: 'faq-gst-cost',
        q: 'How much does GST registration cost in Sahibabad?',
        a: 'GST registration fees depend on the structure of your business — a proprietorship, partnership, company, or LLP. We quote a fixed fee after a quick review of your business documents, and there are no hidden charges. You will also need to budget for professional fees for return filing, which are quoted separately. Call our Sahibabad office to confirm your quote before we start.'
      },
      {
        id: 'faq-gst-time',
        q: 'How long does GST registration take in Ghaziabad?',
        a: 'Once the required documents are ready, a GST registration application is usually submitted within 24-48 hours. The GST portal typically issues the registration certificate within 7 working days of application, provided the officer does not raise a query. If a clarification is asked, the timeline extends by a few days. We track the status for you until the certificate is issued.'
      },
      {
        id: 'faq-gst-documents',
        q: 'What documents do I need for GST registration for a proprietorship?',
        a: 'For a proprietorship you need the proprietor\u2019s PAN and Aadhaar, a bank account statement or cancelled cheque, a passport-size photograph, and proof of the business address — such as an electricity bill, rent agreement, or property tax receipt. If the business is run from home, a self-declaration may also be required. We prepare and submit the full application for you.'
      },
      {
        id: 'faq-gst-40lakh',
        q: 'Do I need GST registration if my turnover is under 40 lakh?',
        a: 'If your turnover is below \u20B940 lakh for goods (or \u20B920 lakh for services), GST registration is generally not mandatory in Uttar Pradesh, provided all supplies are intra-state. However, you may still need registration if you make inter-state sales, sell on an e-commerce platform, or are liable under reverse charge. Voluntary registration is also possible if you want input tax credit.'
      },
      {
        id: 'faq-gst-filing',
        q: 'Can you file my GSTR-1 and GSTR-3B every month?',
        a: 'Yes. We handle GSTR-1 and GSTR-3B on a monthly basis for regular taxpayers, and quarterly under the QRMP scheme for eligible businesses. You share your sales and purchase data with us, we reconcile it with GSTR-2B, compute the tax payable, and file the returns before the due dates. We also track due dates and remind you in advance.'
      },
      {
        id: 'faq-gst-missed',
        q: 'What happens if I miss a GST return due date?',
        a: 'If you file GSTR-3B late, you must pay interest at 18% per annum on the unpaid tax, plus a late fee of up to \u20B950 per day (\u20B920 for NIL returns) for both GSTR-1 and GSTR-3B. You can still file the return after the due date using the GST portal. We can help you file belated returns and, where possible, apply for a waiver or reduction of the late fee.'
      },
      {
        id: 'faq-gst-itc',
        q: 'What is Input Tax Credit (ITC) and how do I claim it?',
        a: 'Input tax credit is the GST you pay on purchases that you can set off against the GST you collect on sales. To claim ITC you need a valid tax invoice, the goods or services must be received, and the supplier must have filed GSTR-1. We reconcile your ITC with GSTR-2B to ensure you claim only eligible credit and don\u2019t face issues later.'
      },
      {
        id: 'faq-gst-cancel',
        q: 'Can I cancel a GST registration I no longer need?',
        a: 'Yes. If you have stopped business or no longer cross the registration threshold, you can apply for cancellation of GST registration on the GST portal in Form REG-16. Any pending returns must be filed and taxes paid before cancellation is approved. We can check your eligibility, draft the application, and handle the process for you.'
      }
    ]
  },
  {
    file: 'services/income-tax.html',
    title: 'Income Tax Return (ITR) Filing in Sahibabad, Ghaziabad',
    description: 'Income tax return (ITR) filing in Sahibabad, Ghaziabad by a practising Chartered Accountant. ITR-1 to ITR-7 before 31 July 2026. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Income tax return filing, tax planning and assessment support',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Income Tax Return (ITR) Filing' }
    ],
    related: [
      { name: 'GST registration & return filing', href: 'gst.html' },
      { name: 'Tax audit under Section 44AB', href: 'tax-audit.html' },
      { name: 'Accounting & bookkeeping services', href: 'accounting-bookkeeping.html' },
      { name: 'Tax notice & assessment representation', href: 'corporate-representation.html' }
    ],
    faq: [
      {
        id: 'faq-itr-cost',
        q: 'What are your fees for ITR filing?',
        a: 'ITR filing fees depend on the form you need and the sources of income. A simple salary return with Form 16 costs less than a return with capital gains, rental income, or business income. We give you a fixed quote after a quick call, with no hidden charges. Fees for tax audit cases or multiple years of returns are quoted separately.'
      },
      {
        id: 'faq-itr-deadline',
        q: 'When is the last date to file income tax returns?',
        a: 'For individuals and firms not requiring a tax audit, the ITR due date for FY 2025-26 (AY 2026-27) is 31 July 2026. If a tax audit applies, the deadline is 31 October 2026. Returns can be filed late with a fee under Section 234F, and belated returns are allowed until 31 December 2026 in many cases.'
      },
      {
        id: 'faq-itr-forms',
        q: 'Which ITR form do I need to file?',
        a: 'ITR-1 is for resident individuals with salary, house property, and other income. ITR-2 covers capital gains and foreign assets. ITR-3 is for business and professional income, ITR-4 for presumptive income under Sections 44AD/44ADA, ITR-5 for firms and LLPs, ITR-6 for companies, and ITR-7 for trusts. We confirm the correct form from your income details.'
      },
      {
        id: 'faq-itr-online',
        q: 'Can you file my ITR if I live outside Sahibabad?',
        a: 'Yes. ITR filing is fully online using the income tax e-filing portal, so distance is not a problem. You share your income documents securely, we prepare the return, and you review and e-verify it using Aadhaar OTP or net banking. Clients across Ghaziabad, Delhi NCR, and other states use this service regularly.'
      },
      {
        id: 'faq-itr-refund',
        q: 'How do I get my income tax refund?',
        a: 'After you file your return and it is processed, any excess tax or TDS deducted is refunded directly to your bank account by the Income Tax Department. Ensure your bank account is linked to your PAN and your bank details are validated in your e-filing profile. We help you track refund status and respond to any refund-related intimations.'
      },
      {
        id: 'faq-itr-notice',
        q: 'I got an income tax notice. Can you help?',
        a: 'Yes. We handle income tax notices, including intimation under Section 143(1), scrutiny under 143(2), and demand notices. We review the notice, reconcile your return with the department\u2019s records, draft the response, and file it on the e-filing portal before the deadline. Representation during assessment proceedings can also be arranged.'
      },
      {
        id: 'faq-itr-44ad',
        q: 'Can I pay presumptive tax under Section 44AD?',
        a: 'A resident individual, HUF, or partnership firm (not LLP) whose business turnover is up to \u20B92 crore can declare income at 6% or 8% of turnover under Section 44AD and avoid maintaining books of accounts. There are conditions — for example, at least 95% of payments must be digital. We can confirm whether you qualify and file accordingly.'
      },
      {
        id: 'faq-itr-docs',
        q: 'What documents do I need for ITR filing?',
        a: 'Typically you need your Form 16 and Form 26AS for salary and TDS, bank statements or interest certificates, details of capital gains, rent receipts or home loan statements, and Aadhaar. If you have business income, provide your books or profit and loss figures. We share a simple document checklist after you get in touch.'
      }
    ]
  },
  {
    file: 'services/tax-audit.html',
    title: 'Tax Audit under Section 44AB in Sahibabad, Ghaziabad',
    description: 'Tax audit under Section 44AB in Sahibabad, Ghaziabad by a practising Chartered Accountant. Form 3CA/3CB for turnover over Rs 1 crore. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Tax audit under Section 44AB with Form 3CA/3CB/3CD reporting',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Tax Audit under Section 44AB' }
    ],
    related: [
      { name: 'Income tax return (ITR) filing', href: 'income-tax.html' },
      { name: 'Statutory audit services', href: 'statutory-audit.html' },
      { name: 'Internal audit services', href: 'internal-audit.html' },
      { name: 'Tax notice & assessment representation', href: 'corporate-representation.html' }
    ],
    faq: [
      {
        id: 'faq-taxaudit-who',
        q: 'Who is required to get a tax audit done?',
        a: 'A tax audit under Section 44AB is mandatory if your business turnover exceeds \u20B91 crore in a year. The limit is \u20B910 crore if at least 95% of receipts and payments are digital. A profession with gross receipts above \u20B950 lakh also requires an audit. We assess your turnover and confirm whether the audit applies before you engage us.'
      },
      {
        id: 'faq-taxaudit-forms',
        q: 'Which form do you use for the tax audit report?',
        a: 'We prepare Form 3CA when accounts are already audited under the Companies Act or other law, and Form 3CB when no statutory audit exists, along with Form 3CD which contains the detailed statement of particulars. Both are signed by the Chartered Accountant and uploaded on the income tax portal before the audit report due date.'
      },
      {
        id: 'faq-taxaudit-deadline',
        q: 'When is the tax audit report due?',
        a: 'For FY 2025-26, the tax audit report under Section 44AB is due by 30 September 2026. If you also need to file the return, the ITR for audit cases is due by 31 October 2026. Filing after these dates attracts a late fee under Section 271F. We track these dates for our clients and complete the work in advance.'
      },
      {
        id: 'faq-taxaudit-docs',
        q: 'What documents do you need for the tax audit?',
        a: 'We need your trial balance, books of accounts, bank statements, purchase and sales registers, fixed asset schedule, loan statements, and details of outstanding debtors and creditors. For digital transaction checks, we also need the cash versus bank receipt and payment summary. A complete checklist is shared once you engage us.'
      },
      {
        id: 'faq-taxaudit-cost',
        q: 'How much does a tax audit cost in Ghaziabad?',
        a: 'Tax audit fees depend on the size of your business, the volume of transactions, and whether books are already maintained in a usable format. We quote a fixed fee after reviewing your turnover and records, with no hidden charges. You will also need to budget separately for the income tax return filing fee.'
      },
      {
        id: 'faq-taxaudit-disallow',
        q: 'What common disallowances do you check in a tax audit?',
        a: 'We review items that auditors commonly flag — cash payments above the prescribed limit under Section 40A(3), interest on borrowed capital, unpaid statutory dues, personal expenses, depreciation claims, and any non-business expenditure. Catching these during the audit helps you avoid questions from the department during assessment.'
      },
      {
        id: 'faq-taxaudit-44ad',
        q: 'Can I avoid a tax audit by opting for presumptive tax?',
        a: 'If you are eligible for presumptive taxation under Section 44AD (turnover up to \u20B92 crore) or Section 44ADA (profession receipts up to \u20B975 lakh), you can declare income at the prescribed percentage and avoid a tax audit. There are conditions, such as the digital payment requirement under 44AD. We confirm your eligibility first.'
      }
    ]
  },
  {
    file: 'services/statutory-audit.html',
    title: 'Statutory Audit Services in Sahibabad, Ghaziabad',
    description: 'Statutory audit services in Sahibabad, Ghaziabad by a practising Chartered Accountant. Companies Act 2013 audit reports on time. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Statutory audit of companies, LLPs and trusts under applicable law',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Statutory Audit Services' }
    ],
    related: [
      { name: 'Internal audit services', href: 'internal-audit.html' },
      { name: 'Tax audit under Section 44AB', href: 'tax-audit.html' },
      { name: 'Accounting & bookkeeping services', href: 'accounting-bookkeeping.html' },
      { name: 'Tax notice & assessment representation', href: 'corporate-representation.html' }
    ],
    faq: [
      {
        id: 'faq-stataudit-who',
        q: 'Which companies need a statutory audit?',
        a: 'Every company registered under the Companies Act 2013 must appoint an auditor and have its financial statements audited each year, regardless of turnover. LLPs with turnover above \u20B940 lakh or capital contribution above \u20B925 lakh, and trusts whose income exceeds prescribed limits, may also need an audit under applicable law.'
      },
      {
        id: 'faq-stataudit-process',
        q: 'How does a statutory audit work?',
        a: 'We plan the audit, review your books and supporting documents, test internal controls, and verify balances with third parties such as banks and debtors. We then prepare the audit report in the prescribed format and present it to the board. The Companies Act timelines — a maximum of 180 days between the financial year-end and the AGM — are tracked by us.'
      },
      {
        id: 'faq-stataudit-cost',
        q: 'How much does a statutory audit cost in Sahibabad?',
        a: 'Statutory audit fees depend on the size of the company, number of transactions, number of locations, and the complexity of your accounts. We give a fixed quote after understanding your business. Because the statutory audit is a legal requirement, we complete it in time for the Companies Act filing deadlines.'
      },
      {
        id: 'faq-stataudit-docs',
        q: 'What documents do I need for a company audit?',
        a: 'We need the trial balance, books of accounts, bank statements, statutory registers, minutes of board meetings, loan and investment agreements, and details of related parties. If it is your first audit, incorporation documents and share certificates are also needed. A detailed checklist is shared once we are appointed.'
      },
      {
        id: 'faq-stataudit-report',
        q: 'What is included in your audit report?',
        a: 'The audit report includes our opinion on whether the financial statements give a true and fair view, the basis of that opinion, key audit matters where applicable, and observations on matters like internal financial controls. We also help with the connected annual filings such as MGT-7/AOC-4 where required.'
      },
      {
        id: 'faq-stataudit-appointment',
        q: 'When should the auditor be appointed for a new company?',
        a: 'Under the Companies Act 2013, the first auditor of a company must be appointed within 30 days of incorporation by the board, and the appointment is confirmed by members at the first AGM. Subsequent auditors are appointed at each AGM to hold office until the next. We guide you through the appointment and filing of Form ADT-1.'
      }
    ]
  },
  {
    file: 'services/internal-audit.html',
    title: 'Internal Audit Services in Sahibabad, Ghaziabad',
    description: 'Internal audit services in Sahibabad, Ghaziabad by a practising Chartered Accountant. Process reviews and internal controls testing. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Internal audit, process review and controls testing',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Internal Audit Services' }
    ],
    related: [
      { name: 'Statutory audit services', href: 'statutory-audit.html' },
      { name: 'Tax audit under Section 44AB', href: 'tax-audit.html' },
      { name: 'Accounting & bookkeeping services', href: 'accounting-bookkeeping.html' }
    ],
    faq: [
      {
        id: 'faq-intaudit-why',
        q: 'Why does my business need an internal audit?',
        a: 'An internal audit reviews your processes, checks whether controls are working, and identifies risks such as errors, fraud, or wastage before they become serious. Unlike a statutory audit, it is not just about compliance — it helps improve how your business runs. Growing businesses in Ghaziabad use internal audits to strengthen finance and operations.'
      },
      {
        id: 'faq-intaudit-diff',
        q: 'What is the difference between internal and statutory audit?',
        a: 'A statutory audit is legally required for companies and checks whether financial statements are true and fair. An internal audit is a management tool that reviews processes, controls, and risks across the business. It is usually voluntary and its scope is defined by you. We can carry out both — separately or together.'
      },
      {
        id: 'faq-intaudit-scope',
        q: 'What areas does your internal audit cover?',
        a: 'We typically cover purchases and payments, sales and collections, inventory, cash and bank, payroll, fixed assets, and compliance with internal policies. We also review IT and operational controls where relevant. After the audit, you get a findings report with practical recommendations and a priority list for fixing issues.'
      },
      {
        id: 'faq-intaudit-freq',
        q: 'How often should an internal audit be done?',
        a: 'Most businesses run an internal audit quarterly or half-yearly so issues are caught early and corrective action can be verified. Some prefer an annual cycle if the risk level is low. We help you design a frequency that matches your transaction volume, industry risk, and management needs.'
      },
      {
        id: 'faq-intaudit-cost',
        q: 'How much does an internal audit cost?',
        a: 'Internal audit fees depend on the number of locations, transaction volume, and the breadth of processes to be reviewed. We quote a fixed annual or per-audit fee after an initial scoping call. Since it is a recurring exercise, we can also offer a multi-period engagement at a discounted rate.'
      },
      {
        id: 'faq-intaudit-report',
        q: 'What will I receive after the internal audit?',
        a: 'You receive a written internal audit report with our findings, risk ratings for each issue, and practical recommendations. We also present the findings to you or your management, prioritise action items, and can follow up on the implementation of fixes in the next cycle.'
      },
      {
        id: 'faq-intaudit-fraud',
        q: 'Can an internal audit help detect fraud?',
        a: 'Yes. An internal audit tests controls around cash, payments, procurement, and inventory that are common fraud risk areas. When weaknesses are found, we recommend controls such as segregation of duties and approval limits. If you suspect fraud, we can also carry out a focused investigation with your consent.'
      }
    ]
  },
  {
    file: 'services/company-llp-registration.html',
    title: 'Company & LLP Registration in Sahibabad, Ghaziabad',
    description: 'Company and LLP registration in Sahibabad, Ghaziabad by a practising Chartered Accountant. Incorporation with ROC annual compliance. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Company and LLP incorporation with ROC compliance',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Company & LLP Registration' }
    ],
    related: [
      { name: 'Trust, society & NGO registration', href: 'trust-society-ngo-registration.html' },
      { name: 'MSME Udyam registration', href: 'msme-udyam-registration.html' },
      { name: 'GST registration & return filing', href: 'gst.html' },
      { name: 'Accounting & bookkeeping services', href: 'accounting-bookkeeping.html' }
    ],
    faq: [
      {
        id: 'faq-company-type',
        q: 'What is the difference between a private limited company and an LLP?',
        a: 'A private limited company has shareholders, directors, and compliance under the Companies Act; an LLP has partners and is governed by the LLP Act. Both give limited liability, but an LLP has lighter compliance and no requirement for a minimum paid-up capital. We help you choose the structure that fits your business, tax, and growth plans.'
      },
      {
        id: 'faq-company-time',
        q: 'How long does company registration take in Ghaziabad?',
        a: 'Once documents and the digital signature certificates (DSC) are ready, a private limited company can typically be incorporated within 7-10 working days, depending on MCA processing. LLP registration is usually faster. We handle name approval, SPICe+ filing, PAN and TAN application, and the certificate of incorporation end to end.'
      },
      {
        id: 'faq-company-cost',
        q: 'How much does it cost to register a company?',
        a: 'The cost includes government fees and stamp duty, which depend on the state and authorised capital, plus professional fees for preparing documents, digital signatures, and filing. We give you a complete quote covering both government and professional charges before we begin, so there are no surprises later.'
      },
      {
        id: 'faq-company-docs',
        q: 'What documents are needed for company registration?',
        a: 'You need PAN and address proof of the proposed directors, passport-size photographs, proof of the registered office address such as an electricity bill and rent agreement, and Aadhaar for DSC issuance. For a foreign director, passport and other documents are required. We prepare the incorporation forms from these.'
      },
      {
        id: 'faq-company-opc',
        q: 'Can one person incorporate a company in India?',
        a: 'Yes. A one-person company (OPC) allows a single person to incorporate a company with limited liability. Only an individual who is an Indian citizen and resident is eligible. If your business is likely to have multiple promoters soon, a private limited company with two directors may be a better fit.'
      },
      {
        id: 'faq-company-post',
        q: 'What compliance is required after incorporation?',
        a: 'A company must file annual returns, hold board meetings, and maintain statutory registers; an LLP files annual Form 8 and Form 11 returns. Compliances start from the first year. We offer a company secretarial and compliance plan that keeps your filings done on time and avoids penalties.'
      },
      {
        id: 'faq-company-govtfee',
        q: 'What are the government fees for company registration?',
        a: 'Government fees depend on the state of registration, the type of entity, and authorised capital. Stamp duty also varies by state. For example, the fee for a private limited company is based on authorised capital slabs set by the MCA. We calculate the exact government charges applicable to your case and include them in your quote.'
      }
    ]
  },
  {
    file: 'services/trust-society-ngo-registration.html',
    title: 'Trust, Society & NGO Registration in Ghaziabad | 12A, 80G',
    description: 'Trust, society and NGO registration in Sahibabad, Ghaziabad by a practising Chartered Accountant. 12A and 80G registration support. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Trust, society and Section 8 company registration with 12A/80G support',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Trust, Society & NGO Registration' }
    ],
    related: [
      { name: 'Company & LLP registration', href: 'company-llp-registration.html' },
      { name: 'Trust & NGO audit services', href: 'charities-trust-audits.html' },
      { name: 'MSME Udyam registration', href: 'msme-udyam-registration.html' }
    ],
    faq: [
      {
        id: 'faq-ngo-types',
        q: 'What is the difference between a trust, society, and Section 8 company?',
        a: 'A trust is created by a trust deed and registered with the sub-registrar. A society is formed by a memorandum of association with at least seven members and registered with the registrar of societies. A Section 8 company is incorporated under the Companies Act. All three are non-profit structures with different rules and compliance levels.'
      },
      {
        id: 'faq-ngo-12a',
        q: 'How do I get 12A and 80G registration for my NGO?',
        a: '12A registration exempts the trust\u2019s income from tax, and 80G lets donors claim a deduction for their donations. Both are applied for on the income tax portal in Form 10A, followed by a second form (10AB) once the initial approval expires. We prepare the application with the required documents and track the department\u2019s processing.'
      },
      {
        id: 'faq-ngo-time',
        q: 'How long does NGO registration take in Ghaziabad?',
        a: 'A trust registration with the sub-registrar is usually completed within 2-4 weeks once the trust deed is ready. Society registration is similar. Section 8 company incorporation depends on MCA processing, typically 2-3 weeks. 12A and 80G applications are handled separately on the income tax portal.'
      },
      {
        id: 'faq-ngo-docs',
        q: 'What documents do I need to register a trust or society?',
        a: 'For a trust you need the trust deed with the names of the trustees and a photograph and ID of each trustee. For a society, you need the memorandum and rules with at least seven members. Address proof of the registered office and a declaration of the objects are also required. We draft the documents for you.'
      },
      {
        id: 'faq-ngo-80g-benefit',
        q: 'What are the benefits of 80G registration for donors?',
        a: 'With 80G registration, donors can claim a deduction of 50% (or 100% in specified cases) of their donation while computing taxable income. This makes fundraising easier for the organisation. Note that 80G is a renewal-based approval that must be maintained, and not all donations qualify unless they meet the prescribed conditions.'
      },
      {
        id: 'faq-ngo-compliance',
        q: 'What annual compliance does an NGO have to follow?',
        a: 'A registered trust or society with income above the exempt threshold must file income tax returns, and those claiming 12A/80G benefits must file annual returns in Form 10B or 10BB where audit applies. Books of account and donor records must be maintained. We handle these filings so your exemptions stay intact.'
      }
    ]
  },
  {
    file: 'services/msme-udyam-registration.html',
    title: 'MSME Udyam Registration in Sahibabad, Ghaziabad',
    description: 'MSME Udyam registration in Sahibabad, Ghaziabad by a practising Chartered Accountant. Udyam certificate with MSME scheme benefits. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'MSME Udyam registration and classification',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'MSME Udyam Registration' }
    ],
    related: [
      { name: 'FSSAI registration for food businesses', href: 'fssai-registration.html' },
      { name: 'Company & LLP registration', href: 'company-llp-registration.html' },
      { name: 'Import Export Code (IEC) registration', href: 'import-export-code-iec.html' }
    ],
    faq: [
      {
        id: 'faq-msme-why',
        q: 'Why should I register my business under Udyam?',
        a: 'Udyam registration classifies your business as micro, small, or medium and gives access to benefits under the MSMED Act — priority lending, lower interest rates on some schemes, eligibility for government tenders, and protection against delayed payments. It is a simple online registration and there is no government fee for it.'
      },
      {
        id: 'faq-msme-cost',
        q: 'How much does MSME Udyam registration cost?',
        a: 'The Udyam registration itself is free on the official portal. If you use a professional service to prepare and submit the application, you pay only a modest service fee. We keep our fee for Udyam registration low because the process is straightforward — no hidden or government charges are passed on to you.'
      },
      {
        id: 'faq-msme-time',
        q: 'How long does Udyam registration take in Ghaziabad?',
        a: 'Udyam registration is a quick online process. Once we have your PAN, Aadhaar, and business details, the application can be submitted the same day, and the Udyam certificate is usually issued immediately. If a correction or reclassification is needed, we handle the rectification on the portal.'
      },
      {
        id: 'faq-msme-eligibility',
        q: 'Who is eligible for Udyam registration?',
        a: 'Any business — proprietorship, partnership, company, or LLP — engaged in manufacturing or providing services is eligible, based on investment in plant and machinery or equipment and annual turnover. The definitions of micro, small, and medium are set out in the MSMED Act based on investment and turnover.'
      },
      {
        id: 'faq-msme-docs',
        q: 'What documents are needed for Udyam registration?',
        a: 'Udyam registration is based on self-declaration. You need your PAN and Aadhaar, the business name and address, and details of investment in plant and machinery or equipment and annual turnover. For most cases, no supporting documents need to be uploaded. We confirm the classification before submission.'
      },
      {
        id: 'faq-msme-benefits',
        q: 'What government schemes can an Udyam-registered business access?',
        a: 'Registered MSMEs can access schemes such as priority sector lending, collateral-free loans under CGTMSE, subsidies under schemes like PMEGP, and interest subvention on some loans. Udyam registration also improves your eligibility for government procurement tenders and delayed payment protection.'
      },
      {
        id: 'faq-msme-update',
        q: 'Do I need to update my Udyam registration details?',
        a: 'Yes. The Udyam portal allows you to update business details and reclassify as your investment or turnover changes. Updating your registration keeps it accurate and protects your eligibility for MSME benefits. We can help you make updates and check that your classification reflects your current turnover.'
      }
    ]
  },
  {
    file: 'services/import-export-code-iec.html',
    title: 'Import Export Code (IEC) Registration in Ghaziabad',
    description: 'Import export code (IEC) registration in Sahibabad, Ghaziabad by a practising Chartered Accountant. DGFT IEC in 2-3 working days. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Import Export Code (IEC) registration and modification with DGFT',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Import Export Code (IEC) Registration' }
    ],
    related: [
      { name: 'MSME Udyam registration', href: 'msme-udyam-registration.html' },
      { name: 'Company & LLP registration', href: 'company-llp-registration.html' },
      { name: 'FSSAI registration for food businesses', href: 'fssai-registration.html' }
    ],
    faq: [
      {
        id: 'faq-iec-who',
        q: 'Who needs an Import Export Code (IEC)?',
        a: 'Any business importing or exporting goods or services from India needs an IEC, issued by DGFT. It is a mandatory requirement under the Foreign Trade Policy for customs clearance. A PAN is a prerequisite. The IEC is valid for a lifetime, so it is a one-time registration for most businesses.'
      },
      {
        id: 'faq-iec-time',
        q: 'How long does IEC registration take in Ghaziabad?',
        a: 'The IEC application is submitted online on the DGFT portal. Once the application is complete and verified, an IEC is typically issued within a couple of working days. We check your documents, submit the application, and follow up with DGFT if there is any query or delay.'
      },
      {
        id: 'faq-iec-docs',
        q: 'What documents do I need for IEC registration?',
        a: 'You need the PAN card of the business or proprietor, bank account details in the name of the business, address proof, and a self-certified copy of your business registration. Aadhaar-based processing speeds things up. We prepare the application from these documents and verify them before submission.'
      },
      {
        id: 'faq-iec-cost',
        q: 'How much does IEC registration cost?',
        a: 'The DGFT fee for IEC registration is a fixed government charge. Beyond that you pay a professional service fee for preparing and submitting the application. We keep the professional fee modest and confirm the total cost, including government charges, before we begin.'
      },
      {
        id: 'faq-iec-update',
        q: 'When do I need to update or change my IEC?',
        a: 'You must update your IEC when details change — such as the business name, address, bank account, or constitution. DGFT has also mandated annual reporting of the IEC where applicable. We handle IEC modifications and the annual reporting requirement so your export documents stay valid.'
      },
      {
        id: 'faq-iec-adcode',
        q: 'Do I need a separate AD Code for exports?',
        a: 'Yes. To receive export proceeds, your bank must add an Authorised Dealer (AD) code linked to your IEC. The bank does this on your request, and the details appear on the customs platform. We guide you on the AD code process and coordinate the documents needed for your bank.'
      },
      {
        id: 'faq-iec-before',
        q: 'Can I export before getting an IEC?',
        a: 'No. An IEC is mandatory before goods or services can be exported from India, and the customs authorities will not clear shipments without it. Some exporters in SEZ units or special categories have exemptions, but for most businesses the IEC must be in place first. We can process yours quickly if you are ready to start.'
      }
    ]
  },
  {
    file: 'services/fssai-registration.html',
    title: 'FSSAI Registration & Food License in Ghaziabad',
    description: 'FSSAI registration in Sahibabad, Ghaziabad by a practising Chartered Accountant. State and central food business licences. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'FSSAI registration and food business licence',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'FSSAI Registration & Food License' }
    ],
    related: [
      { name: 'MSME Udyam registration', href: 'msme-udyam-registration.html' },
      { name: 'Trust, society & NGO registration', href: 'trust-society-ngo-registration.html' },
      { name: 'Company & LLP registration', href: 'company-llp-registration.html' }
    ],
    faq: [
      {
        id: 'faq-fssai-who',
        q: 'Who needs an FSSAI registration or licence?',
        a: 'Any food business operator — from home bakers and small retailers to restaurants, manufacturers, and importers — must register or obtain a licence under FSSAI. The requirement depends on annual turnover: small businesses get a basic registration, medium and large businesses need a state or central licence.'
      },
      {
        id: 'faq-fssai-types',
        q: 'What is the difference between FSSAI registration and a licence?',
        a: 'A basic FSSAI registration is for small food businesses with turnover up to \u20B912 lakh, and a state licence covers turnover between \u20B912 lakh and \u20B920 crore. A central licence is required for turnover above \u20B920 crore or for specified categories such as importers and large manufacturers. Each has a different form and fee.'
      },
      {
        id: 'faq-fssai-time',
        q: 'How long does FSSAI registration take in Ghaziabad?',
        a: 'A basic FSSAI registration is usually issued quickly once the application is complete, often within a few working days. State and central licences can take a few weeks because an inspection may be involved. We prepare the application, complete the technical data, and follow up on processing for you.'
      },
      {
        id: 'faq-fssai-docs',
        q: 'What documents are needed for FSSAI registration?',
        a: 'You need proof of identity and address of the business, the food business activity details, a site or floor plan, and a declaration. For licences, additional documents such as a water analysis report, partnership deed or incorporation certificate, and NOCs may be required. We give you a complete checklist.'
      },
      {
        id: 'faq-fssai-fee',
        q: 'How much does FSSAI registration cost?',
        a: 'FSSAI charges a government fee that depends on the type of registration or licence and your annual turnover. On top of that you pay a professional service fee. We confirm the applicable government fee for your category and give you a total quote before the work starts.'
      },
      {
        id: 'faq-fssai-renewal',
        q: 'When do I need to renew my FSSAI licence?',
        a: 'An FSSAI licence is issued for a specific period and must be renewed before expiry, with renewal applications typically submitted well in advance of the expiry date. Operating with an expired licence attracts penalties. We track your licence validity and prepare the renewal application in time.'
      },
      {
        id: 'faq-fssai-turnover',
        q: 'What if my food business turnover crosses the licence limit?',
        a: 'If your turnover crosses the threshold for your current registration, you must upgrade — for example, from a basic registration to a state licence. Upgrading involves a fresh application with the applicable fee. We review your turnover and ensure your FSSAI category is always compliant.'
      }
    ]
  },
  {
    file: 'services/lei-certificate.html',
    title: 'LEI Certificate Registration & Renewal in Ghaziabad',
    description: 'LEI certificate registration in Sahibabad, Ghaziabad by a practising Chartered Accountant. LEI for RBI and bank transactions. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'LEI registration, renewal and annual update',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'LEI Certificate Registration & Renewal' }
    ],
    related: [
      { name: 'Accounting & bookkeeping services', href: 'accounting-bookkeeping.html' },
      { name: 'Import Export Code (IEC) registration', href: 'import-export-code-iec.html' },
      { name: 'Virtual CFO & business advisory', href: 'business-advisory.html' }
    ],
    faq: [
      {
        id: 'faq-lei-what',
        q: 'What is a Legal Entity Identifier (LEI)?',
        a: 'An LEI is a 20-character alphanumeric code that uniquely identifies a legal entity that participates in financial transactions. It is required for entities dealing in large-value transactions under RBI directions, such as borrowing above the prescribed threshold, and is used by banks and regulators to track exposures.'
      },
      {
        id: 'faq-lei-who',
        q: 'Who is required to obtain an LEI?',
        a: 'Under RBI directions, entities undertaking specified large-value transactions — for example, loans above a set limit or transactions in OTC derivatives — must have an LEI. The requirement also extends to entities with exposures above the threshold in certain markets. We confirm whether your transaction size makes an LEI mandatory.'
      },
      {
        id: 'faq-lei-time',
        q: 'How long does LEI registration take?',
        a: 'LEI registration is processed by an accredited LOU after your application and KYC documents are verified. Depending on the LOU and completeness of documents, it is typically issued within a few working days. We complete the application accurately to avoid verification queries and speed up issuance.'
      },
      {
        id: 'faq-lei-docs',
        q: 'What documents are needed for LEI registration?',
        a: 'You need the entity\u2019s registration certificate, PAN, address proof, and details of the directors or partners, along with their identification documents. A supporting bank letter may be needed in some cases. We prepare the KYC pack and submit the application to the LOU for you.'
      },
      {
        id: 'faq-lei-renewal',
        q: 'When must an LEI be renewed?',
        a: 'An LEI must be renewed annually before its expiry date, and the renewal process requires the entity\u2019s data to be re-verified. An expired LEI means the code is no longer valid for transactions that require it. We track your LEI expiry and prepare the renewal well in advance.'
      },
      {
        id: 'faq-lei-cost',
        q: 'How much does LEI registration cost?',
        a: 'The LEI fee is set by the issuing LOU and is payable per registration and per annual renewal, plus a professional service fee for preparing the application and KYC documents. We confirm the LOU fee for the currency and type of entity before you proceed.'
      }
    ]
  },
  {
    file: 'services/accounting-bookkeeping.html',
    title: 'Accounting & Bookkeeping Services in Sahibabad, Ghaziabad',
    description: 'Accounting and bookkeeping services in Sahibabad, Ghaziabad by a practising Chartered Accountant. Monthly books, ledgers and reports. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Accounting and bookkeeping with monthly financial reporting',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Accounting & Bookkeeping Services' }
    ],
    related: [
      { name: 'Income tax return (ITR) filing', href: 'income-tax.html' },
      { name: 'GST registration & return filing', href: 'gst.html' },
      { name: 'Virtual CFO & business advisory', href: 'business-advisory.html' },
      { name: 'Tax notice & assessment representation', href: 'corporate-representation.html' }
    ],
    faq: [
      {
        id: 'faq-accounts-what',
        q: 'What does your accounting and bookkeeping service include?',
        a: 'We maintain your books of accounts — recording sales, purchases, receipts, and payments — and prepare ledgers, bank reconciliations, trial balances, and periodic financial statements. We also track debtors and creditors and prepare GST-ready data. You receive regular reports on the financial health of your business.'
      },
      {
        id: 'faq-accounts-software',
        q: 'Which accounting software do you work with?',
        a: 'We work with commonly used platforms such as Tally and Excel, and we can also work with cloud tools like Zoho Books or QuickBooks where the data is shared digitally. We match the way you maintain data and take over the monthly accounting process with minimal disruption to your team.'
      },
      {
        id: 'faq-accounts-time',
        q: 'How often will I receive reports?',
        a: 'We prepare financial reports monthly or quarterly, depending on your preference. Monthly reports typically include the profit and loss account, balance sheet, and a cash flow summary, so you can track performance without waiting for the year-end. Annual accounts are finalised for the statutory filing.'
      },
      {
        id: 'faq-accounts-cost',
        q: 'How much does bookkeeping cost per month in Sahibabad?',
        a: 'Monthly bookkeeping fees depend on the number of transactions, the number of bank accounts, and the complexity of your business. We offer fixed monthly packages for proprietorships, partnerships, and small companies. You get a clear monthly fee with no per-transaction surprises.'
      },
      {
        id: 'faq-accounts-data',
        q: 'How do I share my data with you?',
        a: 'You can share data online — bank statements, invoices, and purchase bills — through a secure channel or a shared drive, or by handing over physical records if you prefer. Many clients send scanned documents monthly. We then process them and confirm the entries before reports are generated.'
      },
      {
        id: 'faq-accounts-diff',
        q: 'What is the difference between bookkeeping and accounting?',
        a: 'Bookkeeping is the day-to-day recording of transactions — sales, purchases, receipts, and payments. Accounting takes that data further: preparing financial statements, analysing performance, computing tax liabilities, and advising on decisions. We do both, so you get accurate records and meaningful financial information together.'
      },
      {
        id: 'faq-accounts-audit',
        q: 'Will my books be ready for audit if you maintain them?',
        a: 'Yes. We maintain books in a format that meets audit requirements, with proper ledgers, reconciliations, and supporting documents. If a statutory or tax audit applies, the trial balance and schedules are audit-ready. This is especially important for businesses in Ghaziabad that cross the audit turnover thresholds.'
      }
    ]
  },
  {
    file: 'services/business-advisory.html',
    title: 'Virtual CFO & Business Advisory in Ghaziabad, NCR',
    description: 'Virtual CFO and business advisory in Sahibabad, Ghaziabad by a practising Chartered Accountant. Budgeting, cash flow and MIS reporting. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Virtual CFO, budgeting, cash flow and management reporting',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Virtual CFO & Business Advisory' }
    ],
    related: [
      { name: 'Accounting & bookkeeping services', href: 'accounting-bookkeeping.html' },
      { name: 'Business plan & financial projections', href: 'business-plan-financial-projections.html' },
      { name: 'Asset inventory & valuation services', href: 'asset-valuation.html' }
    ],
    faq: [
      {
        id: 'faq-advisory-vcfo',
        q: 'What is a virtual CFO service?',
        a: 'A virtual CFO is an outsourced senior finance professional who works part-time with your business — budgeting, cash flow planning, management reporting, and financial decision support, without the cost of a full-time CFO. We act as your finance partner while your in-house team handles the day-to-day accounting.'
      },
      {
        id: 'faq-advisory-suitable',
        q: 'Is virtual CFO service suitable for a small business in Ghaziabad?',
        a: 'Yes. Virtual CFO support is particularly useful for growing businesses that need financial structure but cannot justify a full-time CFO. Whether you are raising funds, planning to expand, or trying to improve margins, a part-time finance expert helps you make better decisions at a fraction of the cost.'
      },
      {
        id: 'faq-advisory-deliverables',
        q: 'What will I get from a business advisory engagement?',
        a: 'You get a budget and cash flow forecast, monthly management accounts with commentary, KPI tracking, cost and margin analysis, and strategic advice on pricing, funding, and expansion. We also review your finance processes and recommend improvements, and we support you during fund-raising or loan applications.'
      },
      {
        id: 'faq-advisory-cost',
        q: 'How much does a virtual CFO cost?',
        a: 'Virtual CFO fees depend on the size of your business and the depth of support you need — from a few hours a month for light advisory to a structured retainer with monthly deliverables. We design a scope that fits your budget, and you can scale it up as your business grows.'
      },
      {
        id: 'faq-advisory-growth',
        q: 'Can you help me get funding or a business loan?',
        a: 'Yes. We help you prepare the financial projections, business plan, and the financial data banks need, and we review your loan application package for weaknesses. For equity or investor funding, we help you present your financials clearly and answer investor due diligence questions.'
      },
      {
        id: 'faq-advisory-accounting',
        q: 'Is advisory the same as my regular accounting?',
        a: 'No. Accounting records the past — maintaining books and preparing statements. Advisory focuses on the future — planning, budgeting, forecasting, and decisions. Many clients start with our accounting service and add advisory support as they grow, and we can combine both into a single engagement.'
      },
      {
        id: 'faq-advisory-dashboard',
        q: 'Will you provide management dashboards?',
        a: 'We provide simple management dashboards covering sales, profitability, cash position, and key ratios, updated as part of the monthly reporting cycle. The dashboards are designed for business owners who want to see the health of the business at a glance, not for accountants.'
      }
    ]
  },
  {
    file: 'services/business-plan-financial-projections.html',
    title: 'Business Plan & Financial Projections in Ghaziabad',
    description: 'Business plans and financial projections in Sahibabad, Ghaziabad by a practising Chartered Accountant. Bank and investor-ready plans. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Business plan and financial projection preparation',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Business Plan & Financial Projections' }
    ],
    related: [
      { name: 'Virtual CFO & business advisory', href: 'business-advisory.html' },
      { name: 'Asset inventory & valuation services', href: 'asset-valuation.html' },
      { name: 'Company & LLP registration', href: 'company-llp-registration.html' }
    ],
    faq: [
      {
        id: 'faq-plan-what',
        q: 'What is included in a business plan?',
        a: 'A business plan typically covers your business model, products or services, market analysis, operations, management team, and financial projections. It is used for bank loans, investor meetings, or as an internal roadmap. We structure it for the audience you are approaching — banks, investors, or your own management.'
      },
      {
        id: 'faq-plan-lenders',
        q: 'Do banks accept your business plans for loans?',
        a: 'Yes. We prepare business plans and financial projections in a format banks and financial institutions expect, including realistic profit and loss, balance sheet, and cash flow projections and repayment capacity analysis. A well-prepared plan significantly strengthens a loan application, especially for MSME and term loans.'
      },
      {
        id: 'faq-plan-docs',
        q: 'What information do you need from me?',
        a: 'We need details of your business model, historical financials where available, the purpose of the funding, and your assumptions about sales, costs, and working capital. If you are a new business without history, we work from your market research and projections. We guide you through what to provide.'
      },
      {
        id: 'faq-plan-time',
        q: 'How long does it take to prepare a business plan?',
        a: 'A business plan with financial projections is typically delivered within one to two weeks, depending on the completeness of the information you share. If financial modelling or market research is required, it may take a little longer. We agree on a timeline before starting.'
      },
      {
        id: 'faq-plan-cost',
        q: 'How much does a business plan cost in Ghaziabad?',
        a: 'The fee depends on the complexity of the business, the depth of the financial model, and whether market research is required. We quote a fixed fee after understanding your requirement — for a bank loan plan, an investor plan, or an internal plan. No hidden charges.'
      },
      {
        id: 'faq-plan-projections',
        q: 'What are financial projections and how far ahead do you project?',
        a: 'Financial projections estimate your future revenue, expenses, profit, and cash flow, typically for three to five years. They are built on assumptions about growth, pricing, and costs, and are presented month-wise for the first year. Banks and investors rely on these to assess repayment and returns.'
      },
      {
        id: 'faq-plan-investors',
        q: 'Can I use the same plan for investors and banks?',
        a: 'A bank plan focuses on repayment capacity and security; an investor plan focuses on growth, valuation, and exit. We adjust the emphasis, assumptions, and presentation for each audience. If you are raising funds and taking a loan together, we prepare one consistent set of projections for both.'
      }
    ]
  },
  {
    file: 'services/asset-valuation.html',
    title: 'Asset Inventory & Valuation Services in Ghaziabad',
    description: 'Asset valuation services in Sahibabad, Ghaziabad by a practising Chartered Accountant. Asset registers and valuations for loans. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Asset inventory and valuation reporting',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Asset Inventory & Valuation Services' }
    ],
    related: [
      { name: 'Accounting & bookkeeping services', href: 'accounting-bookkeeping.html' },
      { name: 'Business plan & financial projections', href: 'business-plan-financial-projections.html' },
      { name: 'Virtual CFO & business advisory', href: 'business-advisory.html' }
    ],
    faq: [
      {
        id: 'faq-valuation-what',
        q: 'What is asset valuation and when is it needed?',
        a: 'Asset valuation estimates the fair value of assets such as plant and machinery, equipment, vehicles, or an entire business. It is commonly needed for loans, insurance, partnership or company restructuring, mergers and acquisitions, and regulatory filings. The valuation method depends on the asset type and purpose.'
      },
      {
        id: 'faq-valuation-why',
        q: 'Why do banks ask for an asset valuation report?',
        a: 'Banks ask for valuation reports to confirm that the asset being offered as security is worth the loan amount. The report, prepared by a qualified valuer, sets the value used for the loan sanction. We prepare inventory and valuation reports in the format banks accept, including for MSME and machinery loans.'
      },
      {
        id: 'faq-valuation-methods',
        q: 'What valuation methods do you use?',
        a: 'We use methods appropriate to the asset and purpose — the cost approach based on depreciated replacement value, the market approach based on comparable sales, and the income approach based on earnings or cash flows for businesses. The choice of method is documented in the report with the basis of valuation.'
      },
      {
        id: 'faq-valuation-docs',
        q: 'What documents do I need for a valuation?',
        a: 'You need details and proof of the assets being valued — purchase invoices, depreciation schedules, and current asset registers — and, for a business valuation, financial statements for the recent years. If physical inspection is needed, we schedule a visit to the location in Ghaziabad or the site where assets are held.'
      },
      {
        id: 'faq-valuation-time',
        q: 'How long does a valuation take?',
        a: 'A straightforward asset inventory and valuation is usually completed within a few working days after the site inspection and document review. A full business valuation may take longer because of the financial analysis involved. We agree on the timeline when the scope is confirmed.'
      },
      {
        id: 'faq-valuation-legal',
        q: 'Is a valuation report legally valid?',
        a: 'A report prepared by a qualified and independent valuer, following recognised valuation standards, is acceptable to banks, regulators, and courts for the stated purpose. The report records the valuation date, basis, method, and assumptions, so the value can be defended if questioned.'
      },
      {
        id: 'faq-valuation-cost',
        q: 'How much does an asset valuation cost?',
        a: 'Fees depend on the number of assets, their nature, whether a site visit is required, and the purpose of the valuation. We quote a fixed fee after a quick scope call. For ongoing needs, such as annual valuation for a finance company, we can offer a retainer arrangement.'
      }
    ]
  },
  {
    file: 'services/charities-trust-audits.html',
    title: 'Trust & NGO Audit Services in Ghaziabad | 12A, 80G, FCRA',
    description: 'Trust and NGO audit services in Sahibabad, Ghaziabad by a practising Chartered Accountant. 12A, 80G and FCRA compliance support. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Audit of trusts and NGOs with Form 10B/10BB reporting',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Trust & NGO Audit Services' }
    ],
    related: [
      { name: 'Trust, society & NGO registration', href: 'trust-society-ngo-registration.html' },
      { name: 'Statutory audit services', href: 'statutory-audit.html' },
      { name: 'Accounting & bookkeeping services', href: 'accounting-bookkeeping.html' }
    ],
    faq: [
      {
        id: 'faq-trustaudit-who',
        q: 'Which trusts and NGOs need an audit?',
        a: 'A trust or NGO whose income exceeds the prescribed limits must get its accounts audited under the Income Tax Act. Audit is also required under the Companies Act for Section 8 companies, and for entities claiming 12A/80G benefits in many cases. We confirm which audit applies based on your income and registration type.'
      },
      {
        id: 'faq-trustaudit-12a80g',
        q: 'How is a trust audit different from a regular audit?',
        a: 'A trust audit under the Income Tax Act has two parts: the normal audit of accounts and a special report in Form 10B (or 10BB for certain taxpayers) that certifies the trust is applying its income for charitable purposes. This is what protects the 12A/80G exemptions. We prepare both parts together.'
      },
      {
        id: 'faq-trustaudit-forms',
        q: 'Which forms are used in a trust audit?',
        a: 'A trust audit report is filed in Form 10B, with Form 10BB for taxpayers who opt for the alternative regime. The audit also covers the maintenance of books and the application of income for charitable or religious purposes. We ensure the forms are completed accurately and uploaded before the due date.'
      },
      {
        id: 'faq-trustaudit-compliance',
        q: 'What annual compliance does a registered NGO need?',
        a: 'A trust or NGO must maintain books of accounts, file income tax returns, file the audit report where applicable, and, if registered under 12A/80G, file the annual return in Form 10B or 10BB. Donation receipts must be issued to donors. Missing these filings can lead to cancellation of exemptions.'
      },
      {
        id: 'faq-trustaudit-cost',
        q: 'How much does a trust audit cost in Ghaziabad?',
        a: 'Trust audit fees depend on the size of the trust, the number of transactions, and whether the Form 10B special report is involved. We quote a fixed fee after reviewing the accounts. Because exemptions depend on the audit, we complete it in time for the prescribed filing deadline.'
      },
      {
        id: 'faq-trustaudit-docs',
        q: 'What documents do I need for a trust audit?',
        a: 'We need the trust deed and registration documents, books of accounts, bank statements, income and expenditure details, donation receipts, and records showing how income was applied for charitable purposes. For 12A/80G entities, we also review the compliance with exemption conditions.'
      },
      {
        id: 'faq-trustaudit-fcra',
        q: 'Do FCRA-registered NGOs have separate audit rules?',
        a: 'Yes. An NGO registered under FCRA must have its foreign contribution accounts audited and file an annual return in Form FC-4 on the FCRA portal. This audit is separate from the income tax audit. If your NGO receives foreign funds, we handle both audits to keep every filing compliant.'
      }
    ]
  },
  {
    file: 'services/corporate-representation.html',
    title: 'Tax Notice & Assessment Representation in Ghaziabad',
    description: 'Tax notice and assessment representation in Sahibabad, Ghaziabad by a practising Chartered Accountant. Notice replies and appeals. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    serviceType: 'Representation before tax and regulatory authorities',
    breadcrumbs: [
      { label: 'Home', href: '../index.html' },
      { label: 'Services', href: '../services.html' },
      { label: 'Tax Notice & Assessment Representation' }
    ],
    related: [
      { name: 'Income tax return (ITR) filing', href: 'income-tax.html' },
      { name: 'GST registration & return filing', href: 'gst.html' },
      { name: 'Tax audit under Section 44AB', href: 'tax-audit.html' }
    ],
    faq: [
      {
        id: 'faq-rep-notice',
        q: 'I received an income tax notice. What should I do?',
        a: 'First, check the notice type — an intimation under Section 143(1), a scrutiny notice under 143(2), or a demand notice. Do not ignore it, because deadlines apply. We review the notice, match it with your return and records, prepare the response, and file it on the e-filing portal within the time allowed.'
      },
      {
        id: 'faq-rep-services',
        q: 'What representation services do you provide?',
        a: 'We represent clients before the Income Tax Department and other authorities for assessments, rectifications, appeals, and compliance-related proceedings. We draft responses to notices, appear for hearings where authorised, and coordinate the required documents and evidence with the department.'
      },
      {
        id: 'faq-rep-assessment',
        q: 'What happens during an income tax assessment?',
        a: 'During assessment, the officer examines your return and supporting records, and may ask for explanations on specific items. We prepare the submissions, provide the documents, and respond to queries raised in the proceedings. Our role is to present the facts correctly so the assessment concludes favourably.'
      },
      {
        id: 'faq-rep-fee',
        q: 'How much does notice representation cost?',
        a: 'Fees depend on the complexity of the case — a simple 143(1) intimation response costs less than a scrutiny assessment or an appeal. We quote a fixed fee after reviewing the notice, with no hidden charges. Complex cases spanning multiple hearings may be quoted on a staged basis.'
      },
      {
        id: 'faq-rep-appeal',
        q: 'Can you help with a tax appeal?',
        a: 'Yes. We prepare appeal grounds, draft the appeal memorandum, and file it with the Commissioner (Appeals) or the appropriate appellate authority within the time limit. We present your case, respond to the department\u2019s position, and follow the matter through the appeal proceedings.'
      },
      {
        id: 'faq-rep-docs',
        q: 'What documents do I need for representation?',
        a: 'We need a copy of the notice or order, your income tax returns, the assessment file if available, and supporting documents such as bank statements, agreements, and reconciliations relevant to the disputed items. We then prepare a response that addresses each point raised.'
      },
      {
        id: 'faq-rep-time',
        q: 'How long does representation take?',
        a: 'The duration depends on the case type. Simple notice responses can be resolved in weeks; scrutiny assessments and appeals depend on the department\u2019s hearing schedule, which can take several months. We keep you informed at each stage and ensure every deadline is met on our side.'
      }
    ]
  },

  /* ============================================================
     BLOG POSTS  (metadata + schema only; H1/content untouched)
  ============================================================ */
  {
    file: 'blog/gst-due-dates-july-2026.html',
    title: 'GST Due Dates July 2026 | CA Ashish Rajput, Ghaziabad',
    description: 'GST due dates for July 2026: GSTR-1, GSTR-3B, GSTR-5, GSTR-6, GSTR-8 and IFF deadlines from a Chartered Accountant in Ghaziabad. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'article',
    article: {
      headline: 'GST Return Filing Due Dates — July 2026',
      datePublished: '2026-07-01',
      dateModified: '2026-08-10'
    },
    breadcrumbs: [
      { label: 'Home', href: 'index.html' },
      { label: 'Blog', href: 'blog.html' },
      { label: 'GST Return Filing Due Dates — July 2026' }
    ]
  },
  {
    file: 'blog/income-tax-advance-tax-instalments-fy2025-26.html',
    title: 'Advance Tax Instalments FY 2025-26 | CA in Ghaziabad',
    description: 'Advance tax instalments for FY 2025-26: due dates of 15 June, 15 September, 15 December and 15 March with Section 234B/234C interest. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'article',
    article: {
      headline: 'Advance Tax Instalments — FY 2025-26',
      datePublished: '2026-06-15',
      dateModified: '2026-08-10'
    },
    breadcrumbs: [
      { label: 'Home', href: 'index.html' },
      { label: 'Blog', href: 'blog.html' },
      { label: 'Advance Tax Instalments — FY 2025-26' }
    ]
  },
  {
    file: 'blog/llp-annual-compliance-requirements-2026.html',
    title: 'LLP Annual Compliance 2026 | CA Ashish Rajput, Ghaziabad',
    description: 'LLP annual compliance in 2026: Form 8, Form 11, agreement and MCA penalties explained by a practising CA in Ghaziabad. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'article',
    article: {
      headline: 'LLP Annual Compliance Requirements — 2026',
      datePublished: '2026-05-01',
      dateModified: '2026-08-10'
    },
    breadcrumbs: [
      { label: 'Home', href: 'index.html' },
      { label: 'Blog', href: 'blog.html' },
      { label: 'LLP Annual Compliance Requirements — 2026' }
    ]
  },
  {
    file: 'blog/icai-code-of-ethics-2026-website-rules.html',
    title: 'ICAI Code of Ethics 2026 Website Rules | CA, Ghaziabad',
    description: 'ICAI Code of Ethics 13th edition website rules effective 1 April 2026: what changed for CA websites, explained by a CA in Ghaziabad. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'article',
    article: {
      headline: 'ICAI Code of Ethics — Updated Website & Advertising Rules (2026)',
      datePublished: '2026-04-01',
      dateModified: '2026-08-10'
    },
    breadcrumbs: [
      { label: 'Home', href: 'index.html' },
      { label: 'Blog', href: 'blog.html' },
      { label: 'ICAI Code of Ethics — Updated Website & Advertising Rules (2026)' }
    ]
  },
  {
    file: 'blog/gst-annual-return-gstr9-fy2025-26.html',
    title: 'GSTR-9 Annual Return FY 2025-26 | CA Ashish Rajput',
    description: 'GSTR-9 annual return for FY 2025-26: who must file, due date of 31 December, key sections and common errors, from a CA in Ghaziabad. Call +91 88025 86988.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'article',
    article: {
      headline: 'GST Annual Return (GSTR-9) — FY 2025-26 Filing Guide',
      datePublished: '2026-07-15',
      dateModified: '2026-08-10'
    },
    breadcrumbs: [
      { label: 'Home', href: 'index.html' },
      { label: 'Blog', href: 'blog.html' },
      { label: 'GST Annual Return (GSTR-9) — FY 2025-26 Filing Guide' }
    ]
  },

  /* ============================================================
     UTILITY PAGES
  ============================================================ */
  {
    file: 'pages/privacy-policy.html',
    title: 'Privacy Policy | CA Ashish Rajput, Sahibabad',
    description: 'Privacy policy of Ashish Jayalata and Associates, Chartered Accountant in Sahibabad, Ghaziabad. How we collect, use and protect your personal data.',
    h1: 'CA near me for GST, ITR, Best CA in Sahibabad, Ghaziabad',
    ogType: 'website',
    breadcrumbs: [{ label: 'Home', href: '../../index.html' }, { label: 'Privacy Policy' }]
  },
  {
    file: 'pages/404.html',
    title: 'Page Not Found | CA Ashish Rajput, Sahibabad, Ghaziabad',
    description: '404 page not found. Return to Ashish Jayalata & Associates, Chartered Accountant in Sahibabad, Ghaziabad. Explore CA services or call +91 88025 86988.',
    h1: null,
    ogType: 'website',
    breadcrumbs: null
  }
];
