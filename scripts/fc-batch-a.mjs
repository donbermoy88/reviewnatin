/**
 * Flashcard Batch A: Constitution (25 new), RA 6713 (33 new), Peace/HR (14 new), Environment (19 new)
 * Deduplicates against existing cards before inserting.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('/Users/lyndon/reviewnatin/.env.supabase','utf8')
    .split('\n').filter(l=>l&&!l.startsWith('#'))
    .map(l=>[l.split('=')[0].trim(),l.slice(l.indexOf('=')+1).trim()])
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const T = {
  PRO_constitution: '66b572bd-cfb1-469e-84e2-bb73d33b2309',
  PRO_ra6713:       '9a1e25cb-c571-4785-b46b-04255a88261f',
  PRO_peace:        '1c356aaa-aaad-4815-ba83-cddce482201e',
  PRO_environment:  'a22c09fe-a0a0-4c97-ad90-c2944de0dc2e',
  SUB_phil_gov:     'deb97a8a-da6a-4175-af1d-4b4d3eb937f8',
  SUB_laws_ethics:  'bc89d6de-05dd-43ec-9ec4-9a84229e6298',
};

// Pre-load existing fronts per topic to avoid duplicates
async function getExistingFronts(topicId) {
  const { data } = await sb.from('flashcards').select('front').eq('topic_id', topicId).limit(1000);
  return new Set((data||[]).map(r => r.front));
}

const f = (t, fr, bk, premium=false) => ({ topic_id:t, front:fr, back:bk, is_premium:premium });

// ── PHILIPPINE CONSTITUTION (additional 25 cards) ─────────────────────────
const constitution = [
  f(T.PRO_constitution,'Art. I — National Territory: What waters are included in Philippine territory?',
    'Philippine territory includes: (1) the Philippine archipelago; (2) all islands and waters within the baselines; (3) territorial sea, seabed, subsoil, insular shelves, and submarine areas; (4) waters around, between, and connecting islands of the archipelago regardless of breadth and dimensions. (Art. I, 1987 Constitution)'),
  f(T.PRO_constitution,'Art. II, Sec. 7 — State Policies: What is the Philippine policy on foreign relations?',
    'The State shall pursue an independent foreign policy aligned with national interest, self-determination, and the rights of all peoples to equality and self-determination. It shall pursue friendly international relations, especially with neighboring states. (Art. II, Sec. 7)'),
  f(T.PRO_constitution,'Art. II, Sec. 13 — What does the Constitution say about youth?',
    'The State recognizes the vital role of the youth in nation-building and shall promote and protect their physical, moral, spiritual, intellectual, and social well-being. The State shall inculcate in the youth patriotism and nationalism, foster love of humanity, respect for human rights, appreciation of national heroes, participation in civic welfare. (Art. II, Sec. 13)'),
  f(T.PRO_constitution,'Art. II, Sec. 16 — Right to a balanced ecology',
    'The State shall protect and advance the right of the people to a balanced and healthful ecology in accord with the rhythm and harmony of nature. (Art. II, Sec. 16) — This section is the constitutional basis for environmental laws like RA 9003, RA 8749, and RA 9275.'),
  f(T.PRO_constitution,'Art. II, Sec. 17 — Priority of science and technology',
    'The State shall give priority to research and development, invention, innovation, and their utilization; and to science and technology education, training, and services. (Art. II, Sec. 17)'),
  f(T.PRO_constitution,'Art. II, Sec. 18 — Labor as primary social force',
    'The State affirms labor as a primary social and economic force. It shall protect the rights of workers and promote their welfare. (Art. II, Sec. 18) — This underpins all labor protection laws in the Philippines.'),
  f(T.PRO_constitution,'Art. II, Sec. 21 — Role of media and information',
    'The State shall promote comprehensive rural development and agrarian reform. (Art. II, Sec. 21) — Basis for CARP (Comprehensive Agrarian Reform Program).'),
  f(T.PRO_constitution,'Art. III, Sec. 3 — Privacy of communications',
    'The privacy of communication and correspondence shall be inviolable except upon lawful order of the court or when public safety or order requires otherwise. Any evidence obtained in violation of this or the preceding section shall be inadmissible for any purpose in any proceeding. (Art. III, Sec. 3)'),
  f(T.PRO_constitution,'Art. III, Sec. 5 — Freedom of Religion',
    'No law shall be made respecting an establishment of religion, or prohibiting the free exercise thereof. Free exercise and enjoyment of religious profession and worship, without discrimination or preference, shall forever be allowed. (Art. III, Sec. 5) — Two clauses: Non-establishment and Free Exercise.'),
  f(T.PRO_constitution,'Art. III, Sec. 8 — Right to form unions and associations',
    'The right of the people, including those employed in the public and private sectors, to form unions, associations, or societies for purposes not contrary to law shall not be abridged. (Art. III, Sec. 8)'),
  f(T.PRO_constitution,'Art. III, Sec. 9 — Eminent Domain / Just Compensation',
    'Private property shall not be taken for public use without just compensation. (Art. III, Sec. 9) — "Eminent domain" is the power of the State to take private property for public use upon payment of just compensation. Just compensation = fair market value.'),
  f(T.PRO_constitution,'Art. III, Sec. 10 — Non-impairment of Contracts',
    'No law impairing the obligation of contracts shall be passed. (Art. III, Sec. 10) — The government cannot pass a law that eliminates or diminishes the rights of parties in a lawful existing contract. Exception: valid exercise of police power.'),
  f(T.PRO_constitution,'Art. III, Sec. 11 — Free access to courts and legal services',
    'Free access to the courts and quasi-judicial bodies, and adequate legal assistance shall not be denied to any person by reason of poverty. (Art. III, Sec. 11) — PAO (Public Attorney\'s Office) provides free legal assistance to indigent Filipinos.'),
  f(T.PRO_constitution,'Art. VI — What is the bicameral Congress of the Philippines?',
    'The legislative power is vested in the Congress which consists of a Senate (upper house: 24 senators, elected at large, 6-year terms, max 2 consecutive terms) and a House of Representatives (lower house: district + party-list members, 3-year terms, max 3 consecutive terms). (Art. VI, Sec. 1-3)'),
  f(T.PRO_constitution,'Art. VI, Sec. 24 — Appropriations, revenue, and tariff bills',
    'All appropriations, revenue or tariff bills, bills authorizing increase of public debt, bills of local application, and private bills shall originate exclusively in the House of Representatives, but the Senate may propose or concur with amendments. (Art. VI, Sec. 24)'),
  f(T.PRO_constitution,'Art. VII, Sec. 11 — Presidential Succession',
    'When the President dies, is permanently disabled, removed, or resigns, the Vice President becomes President. If the VP is also unable to serve, the Senate President or Speaker acts as President until the incapacity is removed or a President-elect/VP-elect qualifies. (Art. VII, Sec. 11)'),
  f(T.PRO_constitution,'Art. VII, Sec. 17 — Presidential control over executive department',
    'The President shall have control of all the executive departments, bureaus, and offices. The President shall ensure that the laws be faithfully executed. (Art. VII, Sec. 17) — "Control" means authority to alter, reverse, or modify; broader than "supervision."'),
  f(T.PRO_constitution,'Art. VIII — Judicial Power: What is judicial review?',
    'Judicial power includes the duty of the courts of justice to settle actual controversies involving rights and to determine whether any government instrumentality acted with grave abuse of discretion amounting to lack or excess of jurisdiction. (Art. VIII, Sec. 1) — This is the constitutional basis of JUDICIAL REVIEW.'),
  f(T.PRO_constitution,'Art. VIII — Supreme Court composition and tenure',
    'The Supreme Court is composed of a Chief Justice and 14 Associate Justices. They hold office during good behavior until the age of 70 or become incapacitated. Appointments are made by the President from a list of at least 3 nominees by the Judicial and Bar Council (JBC). (Art. VIII, Sec. 4-9)'),
  f(T.PRO_constitution,'Art. IX — What are the three independent Constitutional Commissions?',
    '(1) Civil Service Commission (CSC) — central personnel agency of government\n(2) Commission on Elections (COMELEC) — enforces election laws\n(3) Commission on Audit (COA) — examines, audits, and settles government accounts\nAll have fiscal autonomy; decisions are final unless reversed by the Supreme Court. (Art. IX)'),
  f(T.PRO_constitution,'Art. XI — Ombudsman: powers and composition',
    'The Ombudsman (Tanodbayan) is composed of: the Ombudsman (Tanodbayan), 1 Overall Deputy, at least 1 Deputy for Luzon, Mindanao, and Visayas, and the Special Prosecutor. Powers: investigate acts of public officers; prosecute; impose penalties. (Art. XI, Sec. 5-13)'),
  f(T.PRO_constitution,'Art. XII, Sec. 1 — National economic goals',
    'The State shall protect Filipino enterprises against unfair foreign competition and trade practices. The State shall achieve a more equitable distribution of wealth and raise national income. Economic goals: efficient use of natural resources, promote industrialization, full employment, rising standard of living. (Art. XII, Sec. 1)'),
  f(T.PRO_constitution,'Art. XIV, Sec. 4-5 — Languages: Filipino and English',
    'The national language of the Philippines is Filipino. As it evolves, it shall be further developed and enriched on the basis of existing Philippine and other languages. English and Filipino shall be the official languages for purposes of communication and instruction. (Art. XIV, Sec. 6-7)'),
  f(T.PRO_constitution,'Art. XV — The Family as foundation of the nation',
    'The State recognizes the Filipino family as the foundation of the nation. Accordingly, it shall strengthen its solidarity and actively promote its total development. The State shall defend the right of spouses to found a family and shall protect it from attacks. Marriage is an inviolable social institution. (Art. XV)'),
  f(T.PRO_constitution,'Art. XVII — How can the Constitution be amended or revised?',
    'Three modes: (1) Constituent Assembly — 3/4 of all members of Congress vote to propose; (2) Constitutional Convention — called by 2/3 of all Congress, or by people via election; (3) People\'s Initiative — at least 12% of total registered voters, with 3% per congressional district must sign petition. Ratification requires majority vote in a plebiscite. (Art. XVII)'),
  // Additional Sub-Pro phil-gov cards
  f(T.SUB_phil_gov,'What is the minimum age to vote in Philippine elections?',
    '18 years old. Every Filipino citizen who is at least 18 years of age on or before election day, has resided in the Philippines for at least 1 year, and in the place where the vote is cast for at least 6 months, shall be qualified to vote. (Art. V, Sec. 1, 1987 Constitution)'),
  f(T.SUB_phil_gov,'What does "sovereign" mean in the context of Philippine government?',
    'Sovereignty means supreme, independent political authority. In the Philippines, sovereignty resides in the people and all government authority emanates from them. (Art. II, Sec. 1) This means that the government only exists because the people authorize it — it must serve the people\'s interests.'),
  f(T.SUB_phil_gov,'What is the role of local government units (LGUs)?',
    'LGUs (provinces, cities, municipalities, and barangays) are given autonomy to manage local affairs under the Local Government Code (RA 7160). They may: enact local ordinances, collect local taxes, provide local services, and participate in national development. The national government supervises but does not control LGUs.'),
];

// ── RA 6713 (33 new cards) ────────────────────────────────────────────────────
const ra6713 = [
  f(T.PRO_ra6713,'RA 6713: What are the 8 norms of conduct for public officials?',
    '(1) Commitment to public interest; (2) Professionalism; (3) Justness and sincerity; (4) Political neutrality; (5) Responsiveness to the public; (6) Nationalism and patriotism; (7) Commitment to democracy; (8) Simple living. These norms guide how government employees must behave in all circumstances. (Sec. 4, RA 6713)'),
  f(T.PRO_ra6713,'RA 6713, Sec. 7(a) — What gifts are absolutely prohibited?',
    'Public officials and employees are PROHIBITED from: (a) directly or indirectly receiving any gift, gratuity, favor, entertainment, loan or anything of monetary value from any person in the course of their official duties OR in connection with any operation being regulated by their office. This applies regardless of the occasion.'),
  f(T.PRO_ra6713,'RA 6713: What is the allowable gift value under the exception?',
    'Gifts of NOMINAL VALUE given on the occasion of a festivity or celebration are allowed, provided they are not given in anticipation of, or in exchange for, a favor. The Office of the Ombudsman has set the nominal value at NO MORE THAN ₱5,000 per year from any single source. (Sec. 14, RA 6713)'),
  f(T.PRO_ra6713,'RA 6713, Sec. 7(d) — Disclosure of conflicts of interest',
    'A public official must DISCLOSE their business interests and financial connections. If they have a personal or professional stake in a transaction, they must immediately RECUSE (step away) from the decision. They must make disclosure to their immediate superior and/or the Ethics Committee.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 7(b) — Outside employment restrictions',
    'Public officials and employees shall NOT engage in the private practice of their profession unless authorized by their department heads AND the practice does not conflict with their official functions. Government time, equipment, and resources must NOT be used for private work.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 7(c) — Prohibited financial interests',
    'Public officials are PROHIBITED from having financial or business connections in any enterprise that: (a) is regulated or supervised by their office; (b) transacts business with their office. This prevents conflicts where personal financial gain could influence official decisions.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 8 — Who is required to file SALN?',
    'ALL public officials and employees are required to file a SWORN STATEMENT of Assets, Liabilities, and Net Worth (SALN). This includes: all elected and appointed officials, all government employees (regular, casual, contractual), employees of GOCCs, and state university/college employees. Filing deadline: on or before April 30 each year.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 8 — What must be declared in the SALN?',
    'The SALN must include: (1) Real properties and their current fair market value; (2) Personal properties (cash, vehicles, investments, receivables); (3) All liabilities and obligations; (4) Business interests and financial connections; (5) Names of relatives in government up to 4th degree of consanguinity. Net worth = total assets minus total liabilities.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 9 — Divestment obligation',
    'A public official who acquires by ANY means property that would constitute a conflict of interest with their duties must divert ownership within 30 days after assumption of office OR after acquisition. Divestment means transferring the property to a blind trust, spouse, children, or qualified third parties.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 10 — Review and compliance procedures',
    'Public officials are subject to lifestyle checks conducted by the Office of the Ombudsman and the Civil Service Commission. If their lifestyle appears inconsistent with their declared income and net worth, they may be investigated for unexplained wealth under RA 3019 (Anti-Graft and Corrupt Practices Act) and the Constitution (Art. XI, Sec. 17).'),
  f(T.PRO_ra6713,'RA 6713, Sec. 11 — Administrative penalties for violations',
    'Violations of RA 6713 may result in: (1) ADMINISTRATIVE — demotion, suspension (not exceeding 1 year), dismissal from service with forfeiture of benefits; (2) CRIMINAL — imprisonment of 1 month and 1 day to 6 years; (3) CIVIL — disqualification from public office; (4) FORFEITURE of unlawfully acquired property.'),
  f(T.PRO_ra6713,'RA 6713: What is "simple living" as a norm of conduct?',
    'Public officials must lead modest lives appropriate to their positions and income. They must not indulge in extravagant or ostentatious display of wealth in any form. They shall not maintain excessive or lavish lifestyle. Flashy cars, luxury goods, and expensive vacations inconsistent with salary raise suspicion under RA 6713 and RA 3019.'),
  f(T.PRO_ra6713,'RA 6713: What is "political neutrality" for civil servants?',
    'Civil servants must render service to everyone regardless of party affiliation. They must NOT solicit votes, campaign, or work for any political candidate while in service. They must implement laws and policies regardless of which party is in power. Using government resources, time, or positions for political campaigning is a serious violation.'),
  f(T.PRO_ra6713,'What is the difference between RA 6713 and RA 3019?',
    'RA 6713 (Code of Conduct and Ethical Standards, 1989): focuses on NORMS OF CONDUCT — ethical behavior, gift rules, SALN, lifestyle.\nRA 3019 (Anti-Graft and Corrupt Practices Act, 1960): focuses on CORRUPT ACTS — bribery, kickbacks, using government position for personal gain.\nBoth apply to public officials and employees. RA 3019 carries heavier criminal penalties.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 4(b) — What is "professionalism" under the Code?',
    'Public officials shall perform and discharge their duties with the highest degree of excellence, professionalism, intelligence, and skill. They shall enter public service with dedication to duty and excellence, and give precedence to public interest over personal interest at all times.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 4(c) — Justness and sincerity',
    'Public officials shall remain true to the people at all times and act with justness and sincerity in all their dealings. They shall not discriminate against anyone, especially the poor and underprivileged. They shall at all times respect the rights of others and refrain from doing acts contrary to law, good morals, good customs, public policy, public order, public safety, and public interest.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 4(e) — Responsiveness to the public',
    'Extend prompt, courteous, and adequate service to the public. Unless otherwise provided by law, all public documents must be accessible to, and readily available for, inspection by, the public within reasonable working hours.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 4(h) — Commitment to democracy',
    'Commit to the democratic way of life and values; maintain the principle of public accountability; manifest by deeds the supremacy of civilian authority over the military; and at all times uphold the Constitution and put loyalty to country above loyalty to persons or party.'),
  f(T.PRO_ra6713,'What government agency enforces RA 6713?',
    'Primary enforcement agencies: (1) CIVIL SERVICE COMMISSION (CSC) — for administrative violations by government employees; (2) OFFICE OF THE OMBUDSMAN — for both administrative and criminal violations; (3) PRESIDENTIAL COMMISSION ON ANTI-GRAFT AND CORRUPTION (PCAGC) — for officials appointed by the President. Courts handle criminal cases filed by the Ombudsman.'),
  f(T.PRO_ra6713,'RA 6713: What is the "one-year prohibition" after leaving government?',
    'For 1 year after resignation, retirement, or separation from government service, public officials/employees who approved or granted licenses, permits, or concessions shall NOT engage in practice of private profession in connection with any matter before the office they had been with. This prevents "revolving door" corruption.'),
  f(T.PRO_ra6713,'What is Republic Act 9485 (Anti-Red Tape Act)?',
    'RA 9485 (2007), amended by RA 11032 (ARTA 2018) — the Anti-Red Tape Act. Requires: (1) all government agencies to post their Citizen\'s Charter; (2) simple transactions: 3 working days; complex: 7 days; highly technical: 20 days; (3) officers must not create unnecessary signatories. Violations are grounds for suspension or dismissal.'),
  f(T.PRO_ra6713,'RA 6713: Define "government employee" and "public official"',
    '"PUBLIC OFFICIAL" — includes elective and appointive officials and employees, permanent or temporary, compensated or not, in any branch or instrumentality of government.\n"EMPLOYEE" — any person in the service of the government, whether regular, casual, or contractual.\nBoth are subject to RA 6713 and the Civil Service Law.'),
  f(T.PRO_ra6713,'RA 6713: What is nepotism and is it covered?',
    'Nepotism is the appointment by a public official of a relative within the 3rd degree of consanguinity or affinity to a government position under their jurisdiction. It is prohibited under Sec. 59 of PD 807 (Civil Service Decree) and reinforced by RA 6713\'s norm of justness. Violations: the appointment is VOID and both appointing official and appointee face penalties.'),
  f(T.PRO_ra6713,'RA 6713, Sec. 7(g) — Prohibition against intervention',
    'Public officials shall NOT intervene in any transaction or proceeding involving their personal interest, family member, or business associate. Even the mere act of interceding or "making a phone call" to influence the outcome of a case pending before another official\'s office is a violation.'),
  f(T.PRO_ra6713,'RA 9184 — Government Procurement Law: Key principle',
    'RA 9184 (Government Procurement Reform Act, 2003) establishes that government procurement must be: TRANSPARENT, COMPETITIVE, EFFICIENT, ECONOMICAL, and ACCOUNTABLE. The Bids and Awards Committee (BAC) oversees procurement. PhilGEPS (Philippine Government Electronic Procurement System) is the central procurement portal.'),
  f(T.PRO_ra6713,'RA 9184 — What is the BAC (Bids and Awards Committee)?',
    'The BAC is established in every government agency to manage procurement. Composition: at least 5 regular members including the chairperson. Key function: advertise bids, evaluate bids, recommend award of contracts. All BAC members are liable for violations of procurement rules. BAC decisions are subject to protest and appeal.'),
  f(T.PRO_ra6713,'RA 9184 — What procurement methods are allowed?',
    'Main methods under RA 9184: (1) Competitive Bidding — standard method; (2) Limited Source Bidding; (3) Direct Contracting; (4) Repeat Order; (5) Shopping; (6) Negotiated Procurement. Competitive bidding is the PRIMARY and PREFERRED method. Alternative methods require written justification and are used only in exceptional circumstances.'),
  f(T.SUB_laws_ethics,'RA 6713: What is the main goal of the Code of Conduct?',
    'To establish a high standard of ethics and integrity in public service. Goal: ensure that public officials act in a manner consistent with public trust — honest, efficient, and committed to serving the people. All government employees must uphold this code from the first day of service.'),
  f(T.SUB_laws_ethics,'RA 6713: What is the rule on receiving gifts?',
    'Government employees CANNOT accept gifts, gratuities, favors, or anything of value from persons they regulate or transact with. The only exception: gifts of nominal value (set at ₱5,000 or less per year) given on festive occasions — as long as they are not in exchange for any official favor.'),
  f(T.SUB_laws_ethics,'RA 6713: What is the SALN and why is it important?',
    'SALN = Statement of Assets, Liabilities, and Net Worth. Every government employee files this annually (by April 30) declaring all property, debts, and business interests. It helps detect unexplained wealth and corruption. Failure to file or falsifying SALN = grounds for dismissal from service.'),
  f(T.SUB_laws_ethics,'RA 6713: What does "simple living" mean for public servants?',
    'Government employees must NOT live extravagantly beyond their salaries. Flashy cars, jewelry, and luxury vacations that cannot be explained by declared income are red flags. Simple living = living within one\'s means. The lifestyle check by the Ombudsman uses the SALN to detect inconsistencies.'),
  f(T.SUB_laws_ethics,'What is RA 9485 (Anti-Red Tape Act) in simple terms?',
    'RA 9485 and its updated version RA 11032 (2018) require government offices to: (1) set clear deadlines for all services; (2) post a Citizens\' Charter explaining each service and how long it takes; (3) limit "signatories" to avoid unnecessary delays. Simple transactions: 3 working days. Violations = suspension or dismissal.'),
];

// ── PEACE AND HUMAN RIGHTS (14 new cards) ─────────────────────────────────────
const peace = [
  f(T.PRO_peace,'What are the three generations of human rights?',
    '1st Generation — CIVIL & POLITICAL RIGHTS: right to life, vote, speech, fair trial; negative rights (State must NOT interfere).\n2nd Generation — ECONOMIC, SOCIAL & CULTURAL RIGHTS: right to work, education, health, housing; positive rights (State must provide).\n3rd Generation — SOLIDARITY/COLLECTIVE RIGHTS: right to peace, development, clean environment, self-determination; held by peoples/groups.'),
  f(T.PRO_peace,'What is International Humanitarian Law (IHL)?',
    'IHL (also called the Law of Armed Conflict or Geneva Law) regulates the conduct of armed conflict to limit its effects. Key instruments: Four Geneva Conventions (1949) and their Additional Protocols. Core principles: DISTINCTION (between civilians and combatants), PROPORTIONALITY (force must not exceed military advantage), PRECAUTION (minimize civilian harm).'),
  f(T.PRO_peace,'What is the Comprehensive Agrarian Reform Program (CARP)?',
    'CARP (RA 6657, 1988) redistributes agricultural lands to landless farmers. Key provisions: landholding ceiling reduced to 5 hectares; lands distributed to farmer-beneficiaries; just compensation to landowners. Implementing agency: Department of Agrarian Reform (DAR). CARP was extended by CARPER (RA 9700) to 2014. Goal: social justice and rural development.'),
  f(T.PRO_peace,'What is the Commission on Human Rights (CHR)?',
    'The CHR (created under Art. XIII, Sec. 17 of the 1987 Constitution) is an INDEPENDENT constitutional body. Mandate: investigate violations of civil and political rights, monitor government compliance with international human rights instruments, provide legal assistance to the poor, and recommend legislation. The CHR does NOT have prosecutorial power — it only investigates and recommends.'),
  f(T.PRO_peace,'What is RA 7438 — Rights of Persons Arrested, Detained, or Under Custodial Investigation?',
    'RA 7438 (1992) implements the Miranda rights under Art. III, Sec. 12 of the Constitution. Rights: (1) right to be assisted by counsel at all times; (2) right to remain silent; (3) right to be informed in a language known to the person; (4) right to have counsel of own choice. Violations render any confession or admission INADMISSIBLE in court.'),
  f(T.PRO_peace,'What is the principle of non-refoulement in refugee law?',
    'Non-refoulement is the principle that no country may return or expel a refugee to a territory where they would face persecution or serious harm. It is a cornerstone of the 1951 Refugee Convention and its 1967 Protocol. The Philippines has not formally acceded to the Refugee Convention but implements the principle through UNHCR cooperation.'),
  f(T.PRO_peace,'What is RA 10121 — Philippine Disaster Risk Reduction and Management Act?',
    'RA 10121 (2010) creates the National Disaster Risk Reduction and Management Council (NDRRMC) and establishes a framework for disaster risk reduction. Key shift: from "response" to "risk reduction." LGUs must have Local DRRM Offices and Plans. DRRM Fund: 5% of LGU budget for disaster preparedness. Barangays maintain BDRRM Committees.'),
  f(T.PRO_peace,'What is the Bangsamoro Basic Law (BBL) / BARMM?',
    'The Bangsamoro Autonomous Region in Muslim Mindanao (BARMM) was created under RA 11054 (2018). It replaced ARMM. Governed by the Bangsamoro Parliament and Bangsamoro Government. Covers Maguindanao, Lanao del Sur, Basilan, Sulu, Tawi-Tawi, Cotabato City, and 63 barangays in North Cotabato. Based on the Comprehensive Agreement on the Bangsamoro (CAB) signed in 2014.'),
  f(T.PRO_peace,'What are the key UDHR articles on equality and non-discrimination?',
    'UDHR Article 1: All human beings are born free and equal in dignity and rights. Article 2: Everyone is entitled to all rights without distinction of any kind (race, color, sex, language, religion, political opinion, national or social origin, property, birth, or other status). Article 7: All are equal before the law and entitled to equal protection without discrimination.'),
  f(T.PRO_peace,'What is the Convention on the Elimination of All Forms of Discrimination Against Women (CEDAW)?',
    'CEDAW (1979) is an international treaty ratified by the Philippines that obligates the State to: eliminate discrimination against women in all areas (education, employment, health, law, political participation), enact laws protecting women\'s rights, and submit periodic reports to the CEDAW Committee. The Magna Carta of Women (RA 9710) implements CEDAW in the Philippines.'),
  f(T.PRO_peace,'What is the Special Protection of Children Act (RA 7610)?',
    'RA 7610 (1992) provides special protection to children against abuse, exploitation, and discrimination. Prohibited acts: child prostitution, child trafficking, working children in hazardous conditions, use of children in obscene material. Children under 18 (or older if incapable) are protected. Penalties: reclusion temporal to reclusion perpetua depending on the offense.'),
  f(T.PRO_peace,'What is the Anti-Child Labor Law (RA 9231)?',
    'RA 9231 (2003) amends the Labor Code to eliminate the worst forms of child labor and provide stronger protection for working children. Minimum working age: 15 years old (light, non-hazardous work with parental consent); 18 years old for hazardous work. Children under 15 may work ONLY in family undertakings or in entertainment with permits. Employers of illegal child labor face criminal liability.'),
  f(T.PRO_peace,'What is the Solo Parents Welfare Act (RA 8972)?',
    'RA 8972 (2000) provides benefits to solo parents (one who bears sole parental responsibility). Benefits: 7-day parental leave; priority in housing programs; educational scholarships; medical assistance. Who qualifies: widows/widowers, abandoned spouses, unmarried mothers/fathers, those whose partner is serving prison sentence, migrant worker spouses, etc.'),
  f(T.PRO_peace,'What is the Expanded Senior Citizens Act (RA 9994)?',
    'RA 9994 (2010) expands the benefits of senior citizens (60 years old and above). Key benefits: 20% discount + VAT exemption on medicines, medical, dental, transportation fares, hotels, restaurants, entertainment; monthly stipend for indigent seniors; priority lanes; Expanded Senior Citizens Act also mandates local government support programs.'),
];

// ── ENVIRONMENT MANAGEMENT (19 new cards) ────────────────────────────────────
const environment = [
  f(T.PRO_environment,'What are the 3 Rs of waste management in order of priority?',
    'Under RA 9003 (Ecological Solid Waste Management Act), the hierarchy is:\n1. REDUCE — minimize waste generation at the source\n2. REUSE — use items again before discarding\n3. RECYCLE — convert waste into useful materials\nThis order reflects priority: it is better to generate less waste (reduce) than to recycle it. Disposal in sanitary landfills is the last resort.'),
  f(T.PRO_environment,'What is Environmental Impact Assessment (EIA)?',
    'EIA is the process of evaluating the likely environmental impacts of a proposed project BEFORE it begins. Required by PD 1586 (Philippine EIA System) for "environmentally critical projects" (ECPs) and projects in "environmentally critical areas" (ECAs). The Environmental Compliance Certificate (ECC) is issued by DENR-EMB after a favorable EIA review. No ECC = no project.'),
  f(T.PRO_environment,'What is the DENR\'s mandate regarding natural resources?',
    'The DENR (Department of Environment and Natural Resources) is mandated by EO 192 to: (1) ensure the sustainable use and conservation of natural resources; (2) protect the environment; (3) curb pollution; (4) manage parks, wildlife, and forests; (5) enforce environmental laws. Bureaus under DENR: EMB (Environment Management), FMB (Forestry), PAWB (Protected Areas), BMG (Mines and Geosciences), NAMRIA.'),
  f(T.PRO_environment,'RA 8749 — What is the Clean Air Act\'s key standard?',
    'RA 8749 (Philippine Clean Air Act, 1999) prohibits: (1) incineration of solid waste (open burning); (2) smoking in public places and conveyances; (3) non-compliant vehicle emissions. Sets: National Ambient Air Quality Guideline Values (NAAQGV). Implementing agency: DENR-EMB for stationary sources; DOTC/LTO for mobile sources. Local governments must develop air quality action plans.'),
  f(T.PRO_environment,'RA 9275 — What are the key provisions of the Clean Water Act?',
    'RA 9275 (Philippine Clean Water Act, 2004) prohibits: (1) discharging untreated or inadequately treated sewage into water bodies; (2) dumping of garbage in water bodies. Requires: effluent standards for wastewater; industries must have wastewater treatment facilities. Creates: Water Quality Management Areas (WQMAs) per watershed. Implementing agency: DENR. LGUs responsible for septage management.'),
  f(T.PRO_environment,'RA 9003 — What types of waste does the Ecological Solid Waste Management Act cover?',
    'RA 9003 (2001) classifies waste as: (1) COMPOSTABLE/BIODEGRADABLE — food scraps, garden waste; (2) RECYCLABLE — paper, plastic, glass, metal; (3) RESIDUAL — non-recyclable, non-compostable; (4) SPECIAL/HAZARDOUS — batteries, chemicals, medical waste. All LGUs must segregate at source and establish Material Recovery Facilities (MRFs). Sanitary landfills replace open dumpsites.'),
  f(T.PRO_environment,'What is the NIPAS Act and what does it protect?',
    'RA 7586 (NIPAS Act, 1992) as amended by RA 11038 (2018) establishes the National Integrated Protected Areas System. Protected area categories: strict nature reserve, natural park, natural monument, wildlife sanctuary, protected landscape/seascape, resource reserve, natural biotic area. In protected areas: NO commercial logging, mining, fishing beyond sustainable limits, or conversion of land use. DENR-PAWB administers. Community-based management involves indigenous peoples.'),
  f(T.PRO_environment,'What is the Biodiversity Act (RA 9147)?',
    'RA 9147 (Wildlife Resources Conservation and Protection Act, 2001) conserves and protects wildlife species and their habitats in the Philippines. Prohibits: collection, hunting, killing, and trade of wildlife without permits; poaching of endangered species. Protected species list follows CITES (Convention on International Trade in Endangered Species). Endemic species (e.g., Philippine Eagle, Tamaraw, Tarsier) receive highest protection.'),
  f(T.PRO_environment,'What is the Mining Act (RA 7942) and its key provisions?',
    'RA 7942 (Philippine Mining Act, 1995) allows small-scale and large-scale mining under specific permits. Key concepts: Mineral Production Sharing Agreement (MPSA); Financial or Technical Assistance Agreement (FTAA) for foreign investors; Ore Transport Permits. Mining in ancestral domains requires Free, Prior, and Informed Consent (FPIC) from indigenous communities. DENR-MGB manages mining permits.'),
  f(T.PRO_environment,'What is the Laguna Lake Development Authority (LLDA)?',
    'The LLDA manages the Laguna de Bay region and its surrounding watershed, the country\'s largest lake. Mandate: regulate water use, prevent pollution, manage fisheries, control flooding. Any person or entity discharging waste into Laguna de Bay must have an LLDA permit. The LLDA issues Cease and Desist Orders against polluters. Key law: RA 4850 (LLDA Charter).'),
  f(T.PRO_environment,'What is climate change adaptation vs. mitigation?',
    'ADAPTATION: Adjusting to the actual or expected effects of climate change (e.g., flood barriers, drought-resistant crops, early warning systems, relocating coastal communities).\nMITIGATION: Reducing or preventing greenhouse gas emissions (e.g., renewable energy, energy efficiency, reforestation, carbon capture).\nThe Philippine Climate Change Act (RA 9729) requires both adaptation and mitigation strategies. The Climate Change Commission oversees implementation.'),
  f(T.PRO_environment,'What is the Philippine Green Jobs Act (RA 10771)?',
    'RA 10771 (2016) promotes the creation of "green jobs" — employment in enterprises and activities that contribute to environmental preservation and restoration. Provides incentives (tax deductions) to enterprises that create green jobs. Administered by DOLE in coordination with DENR and DTI. Examples of green jobs: solar panel installation, waste management, eco-tourism, organic farming.'),
  f(T.PRO_environment,'What is RA 9512 — Environmental Awareness and Education Act?',
    'RA 9512 (2008) integrates environmental education into the formal school curriculum at all levels. All schools (elementary through college) must include environmental education in subjects like Science, Health, and Social Studies. Designates November as Environmental Awareness Month. Also promotes non-formal education programs for the general public.'),
  f(T.PRO_environment,'What are Greenhouse Gases (GHGs) and their main sources?',
    'GHGs trap heat in the atmosphere causing global warming. Main GHGs: CO₂ (carbon dioxide — fossil fuel burning, deforestation), CH₄ (methane — livestock, rice paddies, landfills), N₂O (nitrous oxide — fertilizers, livestock), F-gases (industrial processes). The Philippines contributes less than 1% of global GHG emissions but is one of the most climate-vulnerable countries. Philippine GHG inventory is tracked by DENR.'),
  f(T.PRO_environment,'What is the Polluter Pays Principle?',
    'The Polluter Pays Principle holds that whoever causes pollution bears the cost of managing it to prevent damage to human health and the environment. Applied in Philippine environmental laws: polluters pay fines, must install pollution control devices, must remediate contaminated sites. Basis for Environmental User Fee (EUF) under RA 9275 and penalties under RA 8749.'),
  f(T.PRO_environment,'What is RA 6969 — Toxic Substances, Hazardous and Nuclear Wastes Control Act?',
    'RA 6969 (1990) regulates the importation, manufacture, processing, handling, storage, transportation, sale, distribution, use, and disposal of chemical substances and mixtures. Prohibits import of hazardous wastes. DENR-EMB maintains the Philippine Inventory of Chemicals and Chemical Substances (PICCS). Industries must register chemicals and maintain Material Safety Data Sheets (MSDS).'),
  f(T.PRO_environment,'What is the Fisheries Code (RA 8550) and its key provisions?',
    'RA 8550 (1998), as amended by RA 10654 (2015), governs fisheries management. Key provisions: Territorial Waters (0-15km from coastline) reserved for small fishermen; Municipal Waters (0-15km) reserved for municipal fisherfolk; Commercial fishing beyond 15km requires permit; Closed season during spawning. IUU (Illegal, Unreported, Unregulated) fishing is penalized.'),
  f(T.PRO_environment,'What is the National Land Use Act concept (pending legislation)?',
    'While a comprehensive National Land Use Act has not yet been enacted, the Philippines manages land use through existing laws: RA 7160 (LGC) for local zoning, RA 6657 (CARP) for agricultural lands, Forestry Code (PD 705) for forest lands, NIPAS Act for protected areas. The HLURB (now DHSUD) approves Comprehensive Land Use Plans (CLUPs) of LGUs.'),
  f(T.PRO_environment,'What is the Ozone Layer Protection Act (RA 6969 and RA 9729 implications)?',
    'The Philippines is a signatory to the Montreal Protocol (1987), which mandates the phaseout of ozone-depleting substances (ODS) like CFCs, HCFCs (used in air conditioning and refrigeration). DENR-EMB implements the Ozone Layer Protection regulations. By 2030, HCFC use must be eliminated. Technicians handling refrigerants must be certified.'),
];

// ── COMBINE AND INSERT ────────────────────────────────────────────────────────
const allCards = [...constitution, ...ra6713, ...peace, ...environment];

console.log(`\nBatch A: ${allCards.length} cards to process\n`);
console.log(`  Constitution: ${constitution.length}`);
console.log(`  RA 6713 / Ethics: ${ra6713.length}`);
console.log(`  Peace & Human Rights: ${peace.length}`);
console.log(`  Environment: ${environment.length}\n`);

// Group by topic, pre-load existing fronts, then insert new only
const byTopic = {};
for (const card of allCards) {
  if (!byTopic[card.topic_id]) byTopic[card.topic_id] = [];
  byTopic[card.topic_id].push(card);
}

let totalInserted = 0, totalSkipped = 0;
for (const [topicId, cards] of Object.entries(byTopic)) {
  const existing = await getExistingFronts(topicId);
  const newCards = cards.filter(c => !existing.has(c.front));
  const skipped = cards.length - newCards.length;
  if (skipped > 0) process.stdout.write(`  [skip ${skipped} dupes] `);
  if (newCards.length === 0) { process.stdout.write(`  No new cards for ${topicId.slice(0,8)}\n`); continue; }
  const { error } = await sb.from('flashcards').insert(newCards);
  if (error) { console.error(`\n  ERROR ${topicId.slice(0,8)}: ${error.message}`); continue; }
  totalInserted += newCards.length;
  totalSkipped += skipped;
  process.stdout.write(`  ✓ Inserted ${newCards.length} for ${topicId.slice(0,8)}...\n`);
}

const { count } = await sb.from('flashcards').select('*',{count:'exact',head:true});
console.log(`\n✅ Batch A done. Inserted: ${totalInserted}, Skipped (dupes): ${totalSkipped}`);
console.log(`📊 Total flashcards in DB: ${count}`);
