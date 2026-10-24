import type {
  BookingRecord,
  DepartmentType,
  HealthPackage,
  LabSettings,
  LabTest,
  ReviewRecord,
} from '../src/types.ts';

// Complete extracted test catalog from Test_Name__2125ee6d.pdf (all 13 pages)
const RAW_PDF_TESTS: string[] = [
  '17- H Hydro Progestrone',
  '24 Hour Urinary Estrodiol',
  '24 Hour Urine Albumin',
  '24 Hour Urine Catecholamines',
  '24 Hours Urinary Amylase',
  '24 Hours Urinary Calcium',
  '24 Hours Urinary Citrate',
  '24 Hours Urinary Copper',
  '24 Hours Urinary Cortisol',
  '24 Hours Urinary Creatinine',
  '24 Hours Urinary Magnesium',
  '24 Hours Urinary Oxalate',
  '24 Hours Urinary Phosphorus',
  '24 Hours Urinary Protein',
  '24 Hours Urinary Uric Acid',
  '24 Hours Urine for VMA',
  '25 Hydroxy Progestrone(OHP)',
  'A/G Ratio',
  'ABGs (Arterial Blood Gases)',
  'Acanthocytes',
  'ACE LEVEL',
  'Acetyl Cholinesterase Receptor Antibody',
  'ACTH',
  'AFB Culture Report',
  'AFB Staining',
  'AFB Staining (Day 1)',
  'AFB Staining (Day 2)',
  'AFB Staining (Day 3)',
  'Albumin',
  'Alcohol Test',
  'Aldolase',
  'Aldosterone',
  'Alkaline Phosphatase',
  'Alpha Feto Protein',
  'Alpha-1-Antitrysin',
  'ALT (SGPT)',
  'Amoebic Serology',
  'Amonia Level',
  'Amylase (Serum)',
  'ANA (ANF)',
  'ANA (Anti Nuclear Antibodies)',
  'ANA Quantrix IgG',
  'ANCA-C.',
  'ANCA-P.',
  'Anesthesia Single Region',
  'Anti - RO',
  'Anti Acetylcholine Receptor Antibodies',
  'Anti ACH Antibody',
  'Anti B2 Glycoprotein IgG',
  'Anti B2 Glycoprotein IgM',
  'Anti Cardiolipin Antibodies (IgG)',
  'Anti Cardiolipin Antibodies (IgM)',
  'Anti CCP',
  'Anti CCP Antibody',
  'Anti Centromere Antibodies',
  'Anti D Antibodies',
  'Anti DGP IgG',
  'Anti ds DNA Ab',
  'Anti Endomyseal IgA',
  'Anti Endomysial IgG',
  'Anti Endomysial IgM',
  'Anti GBM',
  'Anti Gliadin Ab (IgA, IgG)',
  'Anti Gliadin IgA',
  'Anti Gliadin IgG',
  'Anti kidney Liver Microsoml Antibodies (KLM)',
  'Anti Mitochondrial Antibody',
  'Anti Mullerian Hormone',
  'Anti Mumps IgM',
  'Anti Nuclear Antibodies',
  'Anti Phospholipid IgG',
  'Anti Phospholipid IgG,IgM',
  'Anti Phospholipid IgM',
  'Anti PLA 2 Receptor',
  'Anti SCL-30',
  'Anti SCL-70',
  'Anti Smooth muscle Antibody',
  'Anti Sperm Antibody',
  'Anti Thrombin III Plasma',
  'Anti Thyroglobulin Antibodies',
  'Anti TPO',
  'Anti Trypsin Level',
  'Anti TTG IgA',
  'Anti TTG IgG',
  'Anti TTG IgM',
  'Anti- LA',
  'APTT',
  'Aquaporin-4 IgG Antibody',
  'Ascitic Fluid for ADA Level',
  'Ascitic Fluid for C/S',
  'Ascitic Fluid R/E',
  'ASO',
  'ASOT Quantitative',
  'Assessment Follow Up',
  'Assessment Session',
  'AST (SGOT)',
  'Autoimmune Encephalitis Antibodies Profile',
  'Autoimmune Liver Disease Panal',
  'Autoimmune Profile (AIP)',
  'B-2 Microglobulin',
  'B.T.',
  'B12 LEVEL',
  'Bence Jones Protein',
  'Beta HCG',
  'Bicarbonate (HCO3)',
  'Bile Acid',
  'Bile Pigment',
  'Bile Salt',
  'Bilirubin (Direct & Indirect)',
  'Bilirubin - Direct',
  'Bilirubin - Indirect',
  'Bilirubin Total',
  'Bleaching (Whiteing)',
  'Blood Alcohal Level',
  'Blood for C/S',
  'Blood Grouping',
  'BLOOD UREA',
  'Blood X Match 2',
  'BNP (B-type Natriuretic Peptide)',
  'Bone Age Xray',
  'Bone Marrow Aspiration',
  'Bone Marrow Trephine Biopsy',
  'Braces Full Treatment (Instalment)',
  'Brucella Antibody',
  'BSF',
  'BSR',
  'BSR (Post/after Lunch)',
  'BT',
  'BT & CT',
  'BUN (Blood Urea Nitrogen)',
  'c peptide levels',
  'C1 Esterase',
  'C3',
  'C4',
  'CA 125',
  'CA 15-3',
  'CA 19-9',
  'Calcium',
  'calcium oxalate',
  'Cardiac Enzymes (CPK, LDH, AST, CKMB)',
  'CEA Level',
  'CEPH',
  'Chem 7',
  'Chlamydia Antigen Detection In Urine',
  'Chloride',
  'Cholesterol',
  'CKMB',
  'CONSULTANCY',
  'Coombs Test (Direct and Indirect)',
  'Coombs Test (Direct)',
  'Coombs Test (Indirect)',
  'Copper Serum',
  'Cortisol',
  'Cortisol AM / PM',
  'Cougulation Profile',
  'Covid - 19 Antibodies by Elisa',
  'Covid Rapid Antigen',
  'Covid-19 IgG,IgM',
  'Covid-19 Spike Ab',
  'CP - Blood Complete Picture',
  'CP ESR- Blood Complete Picture',
  'CP for Degue Patient',
  'CP Print',
  'CPK',
  'Creatinine',
  'Creatinine Clearance Test',
  'Crown Type Porcelain Per Unit',
  'CRP (Quantitative)',
  'CSF Culture',
  'CSF Protein',
  'CSF R/E',
  'culture bootle',
  'Culture Sensitivity',
  'Cyclosporine Level',
  'CYTOLOGY',
  'Cytomegalovirus igG',
  'Cytomegalovirus igM',
  'D.Dimmer',
  'DEHA SO4',
  'Dehydroepiandrosterone DHEA',
  'Dengue Elisa IgG',
  'Dengue Elisa IgM',
  'Dengue NS1',
  'Dengue NS1 by Elisa',
  'Dengue Profile',
  'Dengue Virus Screening (IgG, IgM)',
  'Dengue Virus Screening - IgG',
  'Dengue Virus Screening - IgM',
  'Dental Implant',
  'Differential Leucocyte Count',
  'Digoxin Level',
  'DIHYDROTESTOSTERONE',
  'DOPE TEST',
  'Dressing',
  'Drug Of abuse profile (Urine).',
  'Ear Culture',
  'ECG',
  'Echinococcus Antibodies',
  'Elastase in Stool',
  'Electrolytes (Na+, K+)',
  'Electrolytes in Urine',
  'Emax Veneers',
  'ENA PROFILE',
  'Endometrial Biopsy',
  'Eosinophil Count',
  'ESR',
  'Estradioal',
  'Estrogen',
  'ETT CULTURE',
  'Extraction Normal',
  'Factor II Gene Mutation',
  'Factor V Leiden Mutation',
  'Factor Viii Level',
  'FDP Level',
  'Ferritin',
  'FFP',
  'FFP 2',
  'FFP3',
  'FFP4',
  'Fibrinogen',
  'Filling Laser',
  'Filling Normal',
  'Fluid for C/S',
  'Fluid For Gram Stain',
  'Fluid RE',
  'FMR',
  'FNAC',
  'FOLATE LEVEL',
  'Folic Acid',
  'Free Andiogen Index',
  'Free Androgen Index (FAI)',
  'Free T3',
  'Free T4',
  'FSH',
  'Fungus Culture',
  'G-6-P-D Screening Test',
  'Gamma Glutamyl-Transferase',
  'GBM AB',
  'Gene expert',
  'Globulin Level',
  'Glomerular Filtration Rate (GFR)',
  'Glucose (2 hrs. P.P)',
  'Glucose (After Dinner)',
  'Glucose (After Lunch)',
  'Glucose (Before Dinner)',
  'Glucose (Before Lunch)',
  'Glucose (F)',
  'Glucose (R)',
  'Glucose Challenge Test',
  'Glucose Tolerance Test',
  'Gram Stain',
  'Growth Hormones',
  'H Pylori Elisa IgG',
  'H Pylori Elisa IgM',
  'H Pylori IgA by Elisa',
  'H Pylori IgG by Elisa',
  'H. Pylori Antibody',
  'H. Pylori Stool Antigen',
  'Haemoglobin (HB)',
  'HAL B-27',
  'Hb Electrophoresis',
  'HBA1C',
  'Hbs A Screening',
  'HBsAg ELISA',
  'HBsAg (Screening)',
  'HCV Ab Elisa',
  'HCV Ab Screening',
  'HCV Genotyping',
  'HCV PCR Qualitative',
  'HCV PCR Quantitative',
  'HDL-Cholesterol',
  'HDV Antibody',
  'Hep A Screening',
  'Hep A Virus IgG',
  'Hep A Virus IgM',
  'Hep B Core IgM',
  'Hep B Core Total',
  'Hep B PCR Qualitative',
  'Hep B PCR Quantitative',
  'Hep B Surface Antibody',
  'Hep Be Ag',
  'Hep Be Antibody',
  'Hep E Serology',
  'Hep E Virus IgG',
  'Hep E Virus IGM',
  'Herpes (HSV 1 & 2) PCR (Qualitative)',
  'Herpes Simplex Virus (IgG & IgM) Antibody',
  'Herpes Simplex Virus (IgG) Antibody',
  'Herpes Simplex Virus (IgM) Antibody',
  'Histopatholgy Extra Large',
  'Histopathology (Large)',
  'Histopathology (Medium)',
  'Histopathology (Small)',
  'HIV I & II Antibody - Elisa',
  'HIV Screening',
  'Home Visit Charges',
  'Homocystein',
  'HVS Culture',
  'HVS Microscopic Examination',
  'Hydated Cyst Antibodies',
  'Hydrocele Fluid for C/S',
  'Hydrocele Fluid for RE',
  'ICT - MP',
  'ICT - TB (Mycodot)',
  'IGF',
  'IGF(Insulin-Like Growth Factor-1)',
  'IGF-BP3',
  'Immunoglobulin A (IgA)',
  'Immunoglobulin E (IgE)',
  'Immunoglobulin G (IgG)',
  'Immunoglobulin M (IgM)',
  'Immunohistochemistry 1 slide',
  'Immunohistochemistry 2 slide',
  'Immunohistochemistry 3 slides',
  'Immunohistochemistry 4 slides',
  'Inhalant Allergic Profile',
  'Injection Charges',
  'Insulin Level',
  'Insulin Level (2 Hr pp)',
  'Insulin Level (Fasting)',
  'Interleukin-6',
  'Ionized Calcium',
  'Iron',
  'Iron & TIBC',
  'Janus Kinase 2 Mutations',
  'Ketone Bodies - Blood',
  'LACTATE LEVEL',
  'LDH',
  'LDL-Cholesterol-S',
  'LE Cell',
  'LH',
  'Lipase',
  'Lipid Profile',
  'LIPOPROTEIN LEVEL',
  'Lithium',
  'Liver Function Test',
  'LUPUS ANTICOAGULANT',
  'Magnesium',
  'Mantoux Test',
  'Measles Antibodies',
  'MEDICAL FITNESS CERTIFICATE',
  'Monospot',
  'Morphine',
  'Morphine(MoP)',
  'MP (Malarial Parasite Smear)',
  'Muscle Enzymes',
  'MYCODOT',
  'Nasal SWAB for Culture',
  'NT-Pro BNP',
  'Osmolality in Plasma',
  'Osmolality in Urine',
  'Osmotic Fragility',
  'Osmotic Fragility Test',
  'Pap Smear',
  'Parathyroid Hormone (PTH)',
  'Parietal Cell Antibody',
  'PCV (HCT)',
  'PEG Tube Placement',
  'Pericardial Fluid for C/S',
  'Pericardial Fluid for M Cells',
  'Pericardial Fluid for RE',
  'Peripheral Blood Film',
  'Peripheral Smear for sickle cell',
  'phosphate',
  'PHOSPHORUS',
  'Physiotherapy Consultation',
  'Platelet Aggregation',
  'Platelet Count',
  'Platelets',
  'Pleural Fluid Cultue',
  'Pleural Fluid For ADA Level',
  'Pleural Fluid RE',
  'PORTABLE X-RAY',
  'Potassium',
  'Pregnancy Test',
  'PRO INSULIN',
  'Procalcitonin Level',
  'Prof S. Hashim Raza Consultation Fee',
  'Progesterone',
  'Prolactin',
  'Protein - Total',
  'Protein Electrophoresis',
  'PROTEIN F',
  'Protien C',
  'Protien S',
  'PSA - Prostate Specific Antigen',
  'PT & APTT',
  'PT - Prothrombin Time',
  'PT INR',
  'Pus Culture',
  'Pus for RE',
  'RA Factor',
  'RA Factor Quantitative',
  'Rapid Covid-19 Antigen',
  'RCC BLOOD',
  'RCC BLOOD 2',
  'Renal Function Test',
  'REPORTING CHARGES',
  'REPORTING FEE',
  'Reticulocytes Count',
  'Rh Antibodies',
  'Rh Antibody Titer',
  'RNS',
  'Root Canal Anterior',
  'RPR (Rapid Plasma Reagin).',
  'Rubella (IgG)',
  'Rubella (IgM)',
  'SAAG TEST',
  'Scalling and Polishing',
  'Semen Analysis',
  'Semen Culture.',
  'SERUM AMONIA',
  'Serum Androgen',
  'Serum Calcitonin',
  'Serum Carbamezepine Level',
  'Serum Ceruloplasmin Level',
  'Serum Electrophoresis',
  'Serum For ADA Level',
  'Serum Gastrin Level',
  'Serum IgA',
  'SERUM INSULIN',
  'Serum phosphorus',
  'Serum Renin Level',
  'Serum Zinc Level',
  'SerumbCalcitonin',
  'Sex Hormone Binding Globulin (SHBG)',
  'Sickle Cell Test',
  'Single Rooted Extraction',
  'Slide for Review',
  'Sodium',
  'Sputam AFB',
  'SPUTUM AFB FOR 2 DAYS',
  'SPUTUM AFB FOR 3 DAYS',
  'Sputum for Culture',
  'Sputum for Fungal Hyphae',
  'Sputum for Fungus Culture',
  'Sputum RE',
  'Stone Analysis',
  'Stool C/S',
  'Stool For Calprotectin Level',
  'Stool for Clostridium Difficile Toxin',
  'Stool for Fat Globules',
  'Stool For H Pylori',
  'Stool For Occult Blood',
  'Stool for PH',
  'Stool for Reducing Substance',
  'Stool R/E',
  'Surgical Extraction Type A',
  'Surgical Extraction Type B',
  'Synovial Fluid for C/S',
  'Synovial Fluid for M Cells',
  'Synovial Fluid for RE',
  'T-SPOT TB Test',
  'T3',
  'T4',
  'TB',
  'TB by Elisa (IgG, IgM)',
  'TB ELISA',
  'TB GOLD TEST',
  'TB PCR',
  'Testosterone',
  'Tetanus Vaccine',
  'Tg',
  'Throat Swab Culture',
  'Thyroid Anti Bodies',
  'Thyroid Function Test / Thyroid Profile',
  'TIBC',
  'Tissue Culture',
  'TLC',
  'Torch Profile (IgG)',
  'Torch Profile (IgM)',
  'Torch Profile IgG,IgM',
  'Total Lipids',
  'Toxoplasma IgG',
  'Toxoplasma IgM',
  'TPHA',
  'TPO',
  'TPO(Thyroid Peroxidase Antibody)',
  'Tracheal C/S',
  'Transferrin Saturation',
  'Triglycerides',
  'Troponin I',
  'Troponine - T',
  'TSH',
  'TSH Receptor Antibody',
  'Typhidot ( Ig M)',
  'Typhidot (IgG & IgM)',
  'Ultra Sound Guided Biopsy',
  'Unionized Calcium',
  'Urea',
  'Urea & Creatinine',
  'Uric Acid',
  'Urinary Albumin',
  'Urinary Amylase',
  'Urinary Chloride',
  'Urinary Creatinine',
  'Urinary Electrolytes',
  'Urinary Lipase',
  'Urinary Potassium',
  'Urinary Sodium',
  'Urinary Spot Calcium',
  'Urine Calcium Creatinine Ratio',
  'URINE CANABIS',
  'Urine Culture and Sensitivity',
  'URINE FOR AMPHETAMINE',
  'Urine For Benz Jones Protein',
  'Urine For Bile Salt',
  'URINE FOR CANNAGIS',
  'Urine For Metabolism',
  'Urine For Metanephrine',
  'Urine for Microalbumin',
  'URINE FOR OPIATE',
  'Urine For Reducing Substances',
  'Urine For T.L.C',
  'Urine Microscopic Examination',
  'Urine PH',
  'Urine Protein',
  'Urine protein/Creatinine Ratio',
  'Urine R/E',
  'Urine Suger',
  'Vaccination',
  'Vaccination T.C',
  'Vaccine Hep B',
  'Valporic Acid (Epival)',
  'Varicella Antibodies',
  'VDRL',
  'Vitamin B12',
  'Vitamin D3',
  'Von Willebrand Factor',
  'WBC Count',
  'Widal Test',
  'X Match',
  'X-Ray Chest PA View',
  'Z.N Stain',
  'Zirconia Manual',
];

const POPULAR_EXACT = new Set([
  'CP - Blood Complete Picture',
  'Liver Function Test',
  'Renal Function Test',
  'Lipid Profile',
  'HBA1C',
  'Thyroid Function Test / Thyroid Profile',
  'TSH',
  'Glucose (F)',
  'BSR',
  'Urine R/E',
  'Vitamin D3',
  'Vitamin B12',
  'Uric Acid',
  'Dengue NS1',
  'Typhidot (IgG & IgM)',
  'HBsAg (Screening)',
  'HCV Ab Screening',
  'Electrolytes (Na+, K+)',
  'CRP (Quantitative)',
  'Ferritin',
]);

const EXACT_PRICE_OVERRIDES: Record<string, number> = {
  'CP - Blood Complete Picture': 650,
  'CP ESR- Blood Complete Picture': 800,
  'Liver Function Test': 1200,
  'Renal Function Test': 1200,
  'Lipid Profile': 1500,
  'HBA1C': 1500,
  'Thyroid Function Test / Thyroid Profile': 2700,
  'TSH': 1100,
  'Free T3': 1100,
  'Free T4': 1100,
  'T3': 950,
  'T4': 950,
  'Glucose (F)': 250,
  'Glucose (R)': 250,
  'BSF': 250,
  'BSR': 250,
  'Urine R/E': 300,
  'Stool R/E': 350,
  'Vitamin D3': 2800,
  'Vitamin B12': 2400,
  'B12 LEVEL': 2400,
  'Uric Acid': 450,
  'Creatinine': 450,
  'Urea': 450,
  'BLOOD UREA': 450,
  'Urea & Creatinine': 800,
  'ALT (SGPT)': 450,
  'AST (SGOT)': 450,
  'Alkaline Phosphatase': 450,
  'Bilirubin Total': 450,
  'Cholesterol': 450,
  'Triglycerides': 550,
  'Calcium': 500,
  'Electrolytes (Na+, K+)': 1100,
  'CRP (Quantitative)': 1200,
  'ESR': 300,
  'Haemoglobin (HB)': 300,
  'Blood Grouping': 300,
  'Dengue NS1': 1500,
  'Dengue Profile': 2800,
  'Typhidot (IgG & IgM)': 1100,
  'Widal Test': 500,
  'HBsAg (Screening)': 600,
  'HCV Ab Screening': 700,
  'HIV Screening': 800,
  'HCV PCR Quantitative': 5800,
  'HCV PCR Qualitative': 4200,
  'Hep B PCR Quantitative': 6000,
  'Blood for C/S': 2400,
  'Urine Culture and Sensitivity': 2000,
  'Ferritin': 1800,
  'PSA - Prostate Specific Antigen': 2200,
  'Beta HCG': 1600,
  'Pregnancy Test': 350,
  'Semen Analysis': 1000,
  'ECG': 600,
  'X-Ray Chest PA View': 1000,
  'Home Visit Charges': 300,
};

function classifyTest(name: string): {
  department: DepartmentType;
  sampleType: string;
  turnaround: string;
  fastingRequired: boolean;
  price: number;
} {
  const lower = name.toLowerCase();

  let department: DepartmentType = 'Biochemistry';
  let sampleType = 'Blood (Serum)';
  let turnaround = 'Same Day (4–6 Hrs)';
  let fastingRequired = false;
  let price = 1200;

  // Histopathology & Biopsy
  if (
    lower.includes('histopath') ||
    lower.includes('biopsy') ||
    lower.includes('immunohistochemistry') ||
    lower.includes('slide for review')
  ) {
    department = 'Histopathology';
    sampleType = 'Tissue / Biopsy';
    turnaround = '3–8 Days';
    price = lower.includes('extra large')
      ? 7500
      : lower.includes('large')
      ? 5500
      : lower.includes('small')
      ? 3500
      : 4500;
  }
  // Cytology
  else if (
    lower.includes('cytology') ||
    lower.includes('pap smear') ||
    lower.includes('fnac') ||
    lower.includes('m cells')
  ) {
    department = 'Cytology';
    sampleType = 'Smear / Aspirate';
    turnaround = '3–5 Days';
    price = 2800;
  }
  // Microbiology & PCR (3-8 Days per visiting card!)
  else if (
    lower.includes('culture') ||
    lower.includes('c/s') ||
    lower.includes('afb') ||
    lower.includes('gram stain') ||
    lower.includes('z.n stain') ||
    lower.includes('fungus') ||
    lower.includes('fungal') ||
    lower.includes('sputum') ||
    lower.includes('sputam') ||
    lower.includes('swab') ||
    lower.includes('hvs') ||
    lower.includes('pus ') ||
    lower.includes('gene expert') ||
    lower.includes('pcr') ||
    lower.includes('genotyping')
  ) {
    department = 'Microbiology';
    sampleType = lower.includes('urine')
      ? 'Sterile Urine'
      : lower.includes('blood')
      ? 'Whole Blood'
      : lower.includes('stool')
      ? 'Stool Sample'
      : 'Swab / Specimen';
    turnaround =
      lower.includes('pcr') ||
      lower.includes('culture') ||
      lower.includes('c/s') ||
      lower.includes('genotyping') ||
      lower.includes('fungus')
        ? '3–8 Days'
        : '24 Hours';
    price = lower.includes('pcr') || lower.includes('genotyping')
      ? 5200
      : lower.includes('culture') || lower.includes('c/s')
      ? 2200
      : 900;
  }
  // Procedures, Dental, X-Ray, Consultancy
  else if (
    lower.includes('xray') ||
    lower.includes('x-ray') ||
    lower.includes('ecg') ||
    lower.includes('dental') ||
    lower.includes('extraction') ||
    lower.includes('filling') ||
    lower.includes('crown') ||
    lower.includes('braces') ||
    lower.includes('bleaching') ||
    lower.includes('scalling') ||
    lower.includes('root canal') ||
    lower.includes('zirconia') ||
    lower.includes('veneer') ||
    lower.includes('consultation') ||
    lower.includes('consultancy') ||
    lower.includes('dressing') ||
    lower.includes('injection') ||
    lower.includes('vaccine') ||
    lower.includes('vaccination') ||
    lower.includes('home visit') ||
    lower.includes('anesthesia') ||
    lower.includes('peg tube') ||
    lower.includes('certificate') ||
    lower.includes('ceph') ||
    lower.includes('reporting')
  ) {
    department = 'Procedures & X-Ray';
    sampleType = 'Clinical / On-Site';
    turnaround = 'Same Day';
    price = lower.includes('implant') || lower.includes('braces') || lower.includes('zirconia') || lower.includes('veneer')
      ? 12000
      : lower.includes('root canal') || lower.includes('crown')
      ? 6500
      : lower.includes('x-ray') || lower.includes('xray')
      ? 1200
      : 800;
  }
  // Hormone
  else if (
    lower.includes('progest') ||
    lower.includes('estro') ||
    lower.includes('acth') ||
    lower.includes('aldosterone') ||
    lower.includes('mullerian') ||
    lower.includes('beta hcg') ||
    lower.includes('cortisol') ||
    lower.includes('dhea') ||
    lower.includes('deha') ||
    lower.includes('testosterone') ||
    lower.includes('fsh') ||
    lower.includes('lh') ||
    lower === 't3' ||
    lower === 't4' ||
    lower.includes('free t3') ||
    lower.includes('free t4') ||
    lower.includes('tsh') ||
    lower.includes('thyroid') ||
    lower.includes('growth hormone') ||
    lower.includes('igf') ||
    lower.includes('insulin') ||
    lower.includes('parathyroid') ||
    lower.includes('prolactin') ||
    lower.includes('androgen') ||
    lower.includes('shbg') ||
    lower.includes('renin') ||
    lower.includes('calcitonin')
  ) {
    department = 'Hormone';
    sampleType = 'Blood (Serum)';
    turnaround = '24 Hours';
    fastingRequired = lower.includes('fasting');
    price = 1850;
  }
  // Haematology
  else if (
    lower.includes('cp ') ||
    lower.includes('complete picture') ||
    lower.includes('aptt') ||
    lower.includes('pt ') ||
    lower === 'bt' ||
    lower === 'b.t.' ||
    lower.includes('bt & ct') ||
    lower.includes('coagulation') ||
    lower.includes('cougulation') ||
    lower.includes('blood grouping') ||
    lower.includes('x match') ||
    lower.includes('bone marrow') ||
    lower.includes('coombs') ||
    lower.includes('d.dimmer') ||
    lower.includes('leucocyte') ||
    lower.includes('eosinophil') ||
    lower === 'esr' ||
    lower.includes('factor ') ||
    lower.includes('fdp') ||
    lower.includes('fibrinogen') ||
    lower.includes('g-6-p-d') ||
    lower.includes('haemoglobin') ||
    lower.includes('hb electrophoresis') ||
    lower.includes('le cell') ||
    lower.includes('lupus anticoagulant') ||
    lower.includes('malarial') ||
    lower.includes('ict - mp') ||
    lower.includes('osmotic fragility') ||
    lower.includes('pcv') ||
    lower.includes('peripheral') ||
    lower.includes('platelet') ||
    lower.includes('protien c') ||
    lower.includes('protien s') ||
    lower.includes('rcc blood') ||
    lower.includes('reticulocytes') ||
    lower.includes('rh antibod') ||
    lower.includes('sickle cell') ||
    lower === 'tlc' ||
    lower.includes('wbc') ||
    lower.includes('willebrand') ||
    lower.includes('acanthocytes') ||
    lower.includes('ffp')
  ) {
    department = 'Haematology';
    sampleType = 'Blood (EDTA / Citrate)';
    turnaround = lower.includes('electrophoresis') || lower.includes('bone marrow') ? '3–5 Days' : 'Same Day (4–6 Hrs)';
    price = 850;
  }
  // Clinical Pathology (Urine, Stool, Semen, Body Fluids R/E)
  else if (
    lower.includes('urine') ||
    lower.includes('urinary') ||
    lower.includes('stool') ||
    lower.includes('semen') ||
    lower.includes('fluid r') ||
    lower.includes('csf r/e') ||
    lower.includes('pregnancy test') ||
    lower.includes('stone analysis') ||
    lower.includes('bence jones')
  ) {
    department = 'Clinical Pathology';
    sampleType = lower.includes('stool')
      ? 'Stool Sample'
      : lower.includes('semen')
      ? 'Semen Sample'
      : lower.includes('24')
      ? '24-Hour Urine'
      : lower.includes('fluid') || lower.includes('csf')
      ? 'Body Fluid'
      : 'Spot Urine';
    turnaround = lower.includes('24') || lower.includes('stone') ? '24 Hours' : 'Same Day (2–4 Hrs)';
    price = lower.includes('24') ? 1100 : 500;
  }
  // Immunology & Serology
  else if (
    lower.includes('anti') ||
    lower.includes('ana ') ||
    lower.includes('anca') ||
    lower.includes('aso') ||
    lower.includes('autoimmune') ||
    lower.includes('brucella') ||
    lower.includes('c3') ||
    lower.includes('c4') ||
    lower.includes('ca 125') ||
    lower.includes('ca 15-3') ||
    lower.includes('ca 19-9') ||
    lower.includes('cea') ||
    lower.includes('alpha feto') ||
    lower.includes('covid') ||
    lower.includes('crp') ||
    lower.includes('cytomegalovirus') ||
    lower.includes('dengue') ||
    lower.includes('ena ') ||
    lower.includes('gbm') ||
    lower.includes('pylori') ||
    lower.includes('hal b-27') ||
    lower.includes('hbs') ||
    lower.includes('hcv') ||
    lower.includes('hdv') ||
    lower.includes('hep ') ||
    lower.includes('herpes') ||
    lower.includes('hiv') ||
    lower.includes('immunoglobulin') ||
    lower.includes('allergic') ||
    lower.includes('interleukin') ||
    lower.includes('measles') ||
    lower.includes('monospot') ||
    lower.includes('mycodot') ||
    lower.includes('psa') ||
    lower.includes('ra factor') ||
    lower.includes('rpr') ||
    lower.includes('rubella') ||
    lower.includes('tb ') ||
    lower === 'tb' ||
    lower.includes('torch') ||
    lower.includes('toxoplasma') ||
    lower.includes('tpha') ||
    lower.includes('tpo') ||
    lower.includes('typhidot') ||
    lower.includes('varicella') ||
    lower.includes('vdrl') ||
    lower.includes('widal') ||
    lower.includes('amoebic')
  ) {
    department = 'Immunology';
    sampleType = 'Blood (Serum)';
    turnaround = lower.includes('elisa') || lower.includes('profile') || lower.includes('panel') || lower.includes('panal')
      ? '24 Hours'
      : 'Same Day (4–6 Hrs)';
    price = 1600;
  }
  // Biochemistry
  else {
    department = 'Biochemistry';
    sampleType = 'Blood (Serum / Fluoride)';
    turnaround = 'Same Day (4–6 Hrs)';
    fastingRequired =
      lower.includes('lipid') ||
      lower.includes('glucose (f)') ||
      lower.includes('bsf') ||
      lower.includes('cholesterol') ||
      lower.includes('triglycerides');
    price = 750;
  }

  if (EXACT_PRICE_OVERRIDES[name] !== undefined) {
    price = EXACT_PRICE_OVERRIDES[name];
  }

  return {department, sampleType, turnaround, fastingRequired, price};
}

export function buildInitialTests(): LabTest[] {
  const seen = new Set<string>();
  const list: LabTest[] = [];
  let idx = 1;

  for (const rawName of RAW_PDF_TESTS) {
    const cleanName = rawName.trim();
    if (!cleanName || cleanName === '0') continue;
    const dedupeKey = cleanName.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const meta = classifyTest(cleanName);
    const code = `AHL-${String(idx).padStart(3, '0')}`;
    list.push({
      id: `test-${idx}`,
      code,
      name: cleanName,
      department: meta.department,
      price: meta.price,
      sampleType: meta.sampleType,
      turnaround: meta.turnaround,
      fastingRequired: meta.fastingRequired,
      popular: POPULAR_EXACT.has(cleanName),
      active: true,
    });
    idx++;
  }

  // Sort popular tests first, then alphabetically
  list.sort((a, b) => {
    if (a.popular !== b.popular) return a.popular ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return list;
}

export const INITIAL_SETTINGS: LabSettings = {
  labName: 'Al-Hayat Lab',
  labNameUr: 'الحیات لیب میرپور',
  subtitle: 'Skin Care Center & Laboratory',
  subtitleUr: 'سکن کیئر سینٹر اینڈ لیبارٹری',
  tagline: 'Your Health Deserves the Best',
  taglineUr: 'آپ کی صحت بہترین معیار کی مستحق ہے',
  managingDirector: 'M.D: Toseef Gulistan',
  managingDirectorUr: 'ایم ڈی: توصیف گلستان',
  primaryPhone: '0342-0806062',
  secondaryPhone: '0340-0893437',
  whatsappNumber: '923420806062',
  address: 'Near Bashir Drug House, Opp. DHQ Hospital, Mirpur',
  addressUr: 'نزد بشیر ڈرگ ہاؤس، بالمقابل ڈی ایچ کیو ہسپتال، میرپور',
  timings: '8:00 AM TO 12:00 AM (Mon - Sun)',
  timingsUr: 'صبح 8:00 بجے تا رات 12:00 بجے (پیر تا اتوار)',
  specialNoticeEn:
    'PCR, Blood Culture, Urine Culture, and Histopathology reports require 3–8 days processing time.',
  specialNoticeUr:
    'پی سی آر، بلڈ کلچر، یورین کلچر، ہسٹوپیتھو کی رپورٹ میں پراسیسنگ ٹائم 3-8 دن کا ہے۔',
  homeCollectionFee: 300,
  freeHomeCollectionThreshold: 2500,
};

export const INITIAL_PACKAGES: HealthPackage[] = [
  {
    id: 'pkg-executive',
    code: 'PKG-01',
    name: 'Executive Full Body Wellness Profile',
    nameUr: 'ایگزیکٹو مکمل باڈی چیک اپ پیکیج',
    targetAudience: 'For adults seeking annual preventive screening',
    targetAudienceUr: 'مکمل جسمانی معائنے اور سالانہ صحت چیک اپ کے لیے',
    description:
      'Comprehensive 8-panel blood and urine assessment covering blood counts, liver, kidneys, cholesterol, thyroid, and diabetes.',
    descriptionUr:
      'جگر، گردے، شوگر، کولیسٹرول، تھائی رائیڈ اور خون کا مکمل تجزیہ۔',
    includedTests: [
      'CP - Blood Complete Picture',
      'Liver Function Test',
      'Renal Function Test',
      'Lipid Profile',
      'HBA1C',
      'TSH',
      'Uric Acid',
      'Urine R/E',
    ],
    originalPrice: 8300,
    packagePrice: 5900,
    turnaround: 'Same Day (6–8 Hrs)',
    homeCollectionFree: true,
    active: true,
  },
  {
    id: 'pkg-diabetes-renal',
    code: 'PKG-02',
    name: 'Diabetes & Kidney Care Panel',
    nameUr: 'شوگر اور گردوں کا حفاظتی پیکیج',
    targetAudience: 'For diabetic patients & blood sugar monitoring',
    targetAudienceUr: 'ذیابیطس کے مریضوں اور گردوں کی نگرانی کے لیے',
    description:
      'Evaluates 3-month glycemic control, fasting glucose, renal filtration, and early urinary microalbumin.',
    descriptionUr:
      'تین ماہ کی شوگر (HbA1c)، فاسٹنگ شوگر اور گردوں کے افعال کا مکمل ٹیسٹ۔',
    includedTests: [
      'Glucose (F)',
      'HBA1C',
      'Renal Function Test',
      'Urine for Microalbumin',
      'Urine R/E',
    ],
    originalPrice: 4450,
    packagePrice: 3200,
    turnaround: 'Same Day (4–6 Hrs)',
    homeCollectionFree: true,
    active: true,
  },
  {
    id: 'pkg-cardiac',
    code: 'PKG-03',
    name: 'Healthy Heart & Lipid Risk Profile',
    nameUr: 'دل اور کولیسٹرول اسکریننگ پیکیج',
    targetAudience: 'For blood pressure, chest discomfort & lipid check',
    targetAudienceUr: 'بلڈ پریشر اور دل کی صحت کی جانچ کے لیے',
    description:
      'Complete fasting cholesterol fractions paired with quantitative cardiac inflammation and ECG screening.',
    descriptionUr:
      'کولیسٹرول پروفائل، سی آر پی، بلڈ شوگر اور ای سی جی ٹیسٹ۔',
    includedTests: [
      'Lipid Profile',
      'CRP (Quantitative)',
      'CP - Blood Complete Picture',
      'Glucose (F)',
      'ECG',
    ],
    originalPrice: 4200,
    packagePrice: 3100,
    turnaround: 'Same Day (4–6 Hrs)',
    homeCollectionFree: true,
    active: true,
  },
  {
    id: 'pkg-skin-vitality',
    code: 'PKG-04',
    name: 'Skin, Hair & Vitamin Vitality Panel',
    nameUr: 'جلد، بال اور وٹامن ویلنس پیکیج',
    targetAudience: 'Curated by Al-Hayat Skin Care Center & Lab',
    targetAudienceUr: 'الحیات سکن کیئر اینڈ لیبارٹری کا خصوصی پیکیج',
    description:
      'Identifies nutritional, iron, hormonal, and allergic root causes behind hair fall, acne, and chronic fatigue.',
    descriptionUr:
      'بال گرنے، جلد کے مسائل اور کمزوری کی وجوہات جاننے کے لیے وٹامن اور ہارمون ٹیسٹ۔',
    includedTests: [
      'Vitamin D3',
      'Vitamin B12',
      'Ferritin',
      'TSH',
      'Immunoglobulin E (IgE)',
      'CP - Blood Complete Picture',
    ],
    originalPrice: 9850,
    packagePrice: 7200,
    turnaround: '24 Hours',
    homeCollectionFree: true,
    active: true,
  },
  {
    id: 'pkg-liver-viral',
    code: 'PKG-05',
    name: 'Liver & Hepatitis Screening Bundle',
    nameUr: 'جگر اور ہیپاٹائٹس اسکریننگ پیکیج',
    targetAudience: 'For routine family & pre-medical fitness screening',
    targetAudienceUr: 'جگر کے افعال اور ہیپاٹائٹس بی و سی کی تشخیص کے لیے',
    description:
      'Full liver enzyme & bilirubin panel combined with Hepatitis B and Hepatitis C screening.',
    descriptionUr:
      'ایل ایف ٹی (LFT)، ہیپاٹائٹس بی اور ہیپاٹائٹس سی اسکریننگ۔',
    includedTests: [
      'Liver Function Test',
      'HBsAg (Screening)',
      'HCV Ab Screening',
      'CP - Blood Complete Picture',
    ],
    originalPrice: 3150,
    packagePrice: 2350,
    turnaround: 'Same Day (4–6 Hrs)',
    homeCollectionFree: false,
    active: true,
  },
  {
    id: 'pkg-fever',
    code: 'PKG-06',
    name: 'Acute Fever & Infection Panel',
    nameUr: 'بخار، ڈینگی اور ٹائیفائیڈ پیکیج',
    targetAudience: 'For seasonal fever, body aches & infection workup',
    targetAudienceUr: 'موسمی بخار، ڈینگی، ملیریا اور ٹائیفائیڈ کی فوری تشخیص',
    description:
      'Rapid differential workup for Dengue, Typhoid, Malaria, systemic inflammation, and platelet monitoring.',
    descriptionUr:
      'سی بی سی پلیٹلیٹس، ڈینگی NS1، ٹائیفائیڈ، ملیریا اور سی آر پی۔',
    includedTests: [
      'CP - Blood Complete Picture',
      'Dengue NS1',
      'Typhidot (IgG & IgM)',
      'ICT - MP',
      'CRP (Quantitative)',
    ],
    originalPrice: 5150,
    packagePrice: 3800,
    turnaround: 'Same Day (3–5 Hrs)',
    homeCollectionFree: true,
    active: true,
  },
];

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: 'AHL-2026-1001',
    verificationPin: '4829',
    patientName: 'Chaudhry Tariq Mahmood',
    patientPhone: '0345-5123490',
    patientAge: '46',
    patientGender: 'Male',
    collectionType: 'home_collection',
    address: 'House 42, Sector F-1, Mirpur AJK',
    preferredDate: '2026-10-23',
    preferredTime: '09:30 AM',
    doctorRef: 'Dr. Kamran Aziz (DHQ Hospital Mirpur)',
    notes: 'Fasting sample collected at 9:30 AM.',
    items: [
      {
        id: 'test-cp',
        type: 'test',
        code: 'AHL-161',
        name: 'CP - Blood Complete Picture',
        department: 'Haematology',
        turnaround: 'Same Day (4–6 Hrs)',
        price: 650,
      },
      {
        id: 'test-hba1c',
        type: 'test',
        code: 'AHL-269',
        name: 'HBA1C',
        department: 'Biochemistry',
        turnaround: 'Same Day (4–6 Hrs)',
        price: 1500,
      },
      {
        id: 'test-lipid',
        type: 'test',
        code: 'AHL-337',
        name: 'Lipid Profile',
        department: 'Biochemistry',
        turnaround: 'Same Day (4–6 Hrs)',
        price: 1500,
      },
    ],
    subtotal: 3650,
    homeCollectionFee: 0,
    discount: 150,
    totalAmount: 3500,
    paymentStatus: 'Paid',
    status: 'Report Ready',
    createdAt: '2026-10-23T08:15:00.000Z',
    updatedAt: '2026-10-23T14:20:00.000Z',
    reportPublished: true,
    reportPublishedAt: '2026-10-23T14:20:00.000Z',
    reportResults: [
      {
        parameter: 'Haemoglobin (Hb)',
        result: '14.6',
        unit: 'g/dL',
        referenceRange: '13.5 – 17.5',
        flag: 'Normal',
      },
      {
        parameter: 'Total Leucocyte Count (TLC)',
        result: '7,400',
        unit: '/cmm',
        referenceRange: '4,000 – 11,000',
        flag: 'Normal',
      },
      {
        parameter: 'Platelet Count',
        result: '268,000',
        unit: '/cmm',
        referenceRange: '150,000 – 450,000',
        flag: 'Normal',
      },
      {
        parameter: 'HbA1c (Glycated Haemoglobin)',
        result: '6.1',
        unit: '%',
        referenceRange: 'Non-Diabetic: < 5.7 | Pre-Diabetic: 5.7–6.4',
        flag: 'High',
      },
      {
        parameter: 'Total Cholesterol',
        result: '188',
        unit: 'mg/dL',
        referenceRange: '< 200',
        flag: 'Normal',
      },
      {
        parameter: 'Triglycerides',
        result: '142',
        unit: 'mg/dL',
        referenceRange: '< 150',
        flag: 'Normal',
      },
      {
        parameter: 'HDL Cholesterol',
        result: '46',
        unit: 'mg/dL',
        referenceRange: '> 40',
        flag: 'Normal',
      },
      {
        parameter: 'LDL Cholesterol',
        result: '114',
        unit: 'mg/dL',
        referenceRange: '< 130',
        flag: 'Normal',
      },
    ],
    reportRemarks:
      'Hematology and fasting lipid parameters are within normal physiological limits. HbA1c indicates borderline glycemic elevation; dietary follow-up advised.',
    verifiedBy: 'Toseef Gulistan (M.D — Al-Hayat Lab Mirpur)',
  },
  {
    id: 'AHL-2026-1002',
    verificationPin: '7315',
    patientName: 'Mrs. Robina Kausar',
    patientPhone: '0341-8841205',
    patientAge: '54',
    patientGender: 'Female',
    collectionType: 'lab_visit',
    address: 'Allama Iqbal Road, Mirpur AJK',
    preferredDate: '2026-10-24',
    preferredTime: '11:00 AM',
    doctorRef: 'Self / Walk-in',
    notes: 'Thyroid & Vitamin D follow-up check.',
    items: [
      {
        id: 'pkg-skin-vitality',
        type: 'package',
        code: 'PKG-04',
        name: 'Skin, Hair & Vitamin Vitality Panel',
        turnaround: '24 Hours',
        price: 7200,
      },
    ],
    subtotal: 7200,
    homeCollectionFee: 0,
    discount: 0,
    totalAmount: 7200,
    paymentStatus: 'Paid',
    status: 'Processing',
    createdAt: '2026-10-24T06:10:00.000Z',
    updatedAt: '2026-10-24T06:45:00.000Z',
    reportPublished: false,
    reportResults: [],
  },
];

export const INITIAL_REVIEWS: ReviewRecord[] = [
  {
    id: 'rev-1',
    patientName: 'Sardar Waqas Ahmed',
    location: 'Sector C-4, Mirpur AJK',
    serviceUsed: 'Home Sample Collection — Executive Wellness Profile',
    rating: 5,
    comment:
      'Booked home blood collection at 8:30 AM for my parents. The phlebotomist arrived on time with sealed vacutainers, and we downloaded the QR-verified PDF report the same afternoon.',
    bookingId: 'AHL-2026-0984',
    verifiedPatient: true,
    approved: true,
    createdAt: '2026-10-18T10:00:00.000Z',
  },
  {
    id: 'rev-2',
    patientName: 'Dr. Ayesha Siddiqui',
    location: 'Opp. DHQ Hospital, Mirpur',
    serviceUsed: 'Haematology, Hormone & PCR Diagnostics',
    rating: 5,
    comment:
      'Reliable analyzer calibration and clean reporting format. Being right opposite DHQ Hospital Mirpur and open until midnight makes urgent evening investigations much easier for patients.',
    verifiedPatient: true,
    approved: true,
    createdAt: '2026-10-15T15:30:00.000Z',
  },
  {
    id: 'rev-3',
    patientName: 'Mohammad Zubair Jarral',
    location: 'Sector F-2, Mirpur AJK',
    serviceUsed: 'Skin, Hair & Vitamin Vitality Panel',
    rating: 5,
    comment:
      'Very clean lab environment and polite staff at the reception desk. M.D Toseef Gulistan guided us properly on fasting requirements and shared the invoice and report straight on WhatsApp.',
    bookingId: 'AHL-2026-0991',
    verifiedPatient: true,
    approved: true,
    createdAt: '2026-10-20T18:10:00.000Z',
  },
];
