const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Branch = require('../models/Branch');
const Department = require('../models/Department');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Encounter = require('../models/Encounter');
const Vital = require('../models/Vital');
const Prescription = require('../models/Prescription');
const LabOrder = require('../models/LabOrder');
const RadiologyOrder = require('../models/RadiologyOrder');
const Bed = require('../models/Bed');
const Admission = require('../models/Admission');
const Medicine = require('../models/Medicine');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const InsurancePolicy = require('../models/InsurancePolicy');
const FeatureFlag = require('../models/FeatureFlag');
const ApprovalRequest = require('../models/ApprovalRequest');
const CRMLead = require('../models/CRMLead');
const CorporateAccount = require('../models/CorporateAccount');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Checking existing data...');
    const tenantCount = await Tenant.countDocuments();
    if (tenantCount > 0) {
      console.log('[Seed] Data already exists in database. Skipping seed.');
      return;
    }

    console.log('[Seed] Seeding realistic healthcare enterprise synthetic data...');

    // 1. Create SaaS Super Admin
    const superAdmin = await User.create({
      name: 'Dr. Vikramaditya (Platform Director)',
      email: 'superadmin@hospitalvision.com',
      phone: '+91 99000 11000',
      password: 'Password123!',
      role: 'super_admin',
      status: 'active'
    });

    // 2. Create Primary Hospital Tenant
    const tenant = await Tenant.create({
      name: 'Lifeline Super-Specialty Hospital',
      slug: 'lifeline-hospital',
      legalName: 'Lifeline Healthcare Enterprises Pvt Ltd',
      hospitalType: 'Super-Specialty',
      email: 'contact@lifelinehospital.com',
      phone: '+91 22 2840 5000',
      website: 'https://lifelinehospital.example.com',
      address: {
        street: '42 Health Boulevard, Sector 18',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      branding: {
        primaryColor: '#0d9488',
        accentColor: '#0f766e',
        logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=120&auto=format&fit=crop&q=80'
      },
      subscription: {
        plan: 'Professional (Up to 100 Beds)',
        status: 'active',
        maxBeds: 100,
        maxBranches: 3,
        maxUsers: 50,
        billingCycle: 'annual'
      },
      settings: {
        currency: 'INR (₹)',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        uhidPrefix: 'HV',
        invoicePrefix: 'INV'
      },
      status: 'active'
    });

    // 3. Create Branches
    const mainBranch = await Branch.create({
      tenant: tenant._id,
      name: 'Lifeline Main Tower & Tertiary Center',
      code: 'MAIN',
      branchType: 'Main Hospital',
      isMain: true,
      phone: '+91 22 2840 5001',
      email: 'main@lifelinehospital.com',
      address: {
        street: '42 Health Boulevard',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      bedCapacity: 80,
      hasEmergency: true,
      hasICU: true,
      hasOT: true
    });

    const satelliteBranch = await Branch.create({
      tenant: tenant._id,
      parentBranch: mainBranch._id,
      name: 'Lifeline City Heart Clinic & Daycare',
      code: 'SATELLITE',
      branchType: 'Satellite Clinic',
      isMain: false,
      phone: '+91 22 2840 5050',
      email: 'cityclinic@lifelinehospital.com',
      address: {
        street: '15 High Street Mall, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400050'
      },
      bedCapacity: 20,
      hasEmergency: false,
      hasICU: false,
      hasOT: false
    });

    // 4. Create Departments
    const deptOPD = await Department.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      name: 'Internal Medicine & General OPD',
      code: 'MED-OPD',
      departmentType: 'Clinical',
      floor: 'Ground Floor, Wing A'
    });

    const deptCardio = await Department.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      name: 'Cardiology & Critical Care',
      code: 'CARDIO',
      departmentType: 'Clinical',
      floor: '2nd Floor, Cardiac Wing'
    });

    const deptEmergency = await Department.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      name: 'Emergency & Trauma Center',
      code: 'EMG-TRAUMA',
      departmentType: 'Clinical',
      floor: 'Ground Floor, Direct Access'
    });

    const deptIPD = await Department.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      name: 'Inpatient Wards & ICU',
      code: 'IPD-ICU',
      departmentType: 'Nursing',
      floor: '3rd & 4th Floors'
    });

    const deptLab = await Department.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      name: 'Pathology & Diagnostic Laboratory',
      code: 'DIAG-LAB',
      departmentType: 'Diagnostic',
      floor: 'Basement 1, Diagnostic Center'
    });

    const deptRad = await Department.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      name: 'Radiology & Medical Imaging',
      code: 'DIAG-RAD',
      departmentType: 'Diagnostic',
      floor: 'Basement 1, Imaging Bay'
    });

    const deptPharm = await Department.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      name: 'Central Hospital Pharmacy',
      code: 'PHARM-MAIN',
      departmentType: 'Support',
      floor: 'Ground Floor, Lobby'
    });

    const deptBilling = await Department.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      name: 'Finance & Patient Billing',
      code: 'FIN-BILL',
      departmentType: 'Administrative',
      floor: 'Ground Floor, Reception Counter 4'
    });

    // 5. Create Staff Users across Roles
    // Hospital Administrator
    const hospitalAdmin = await User.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      department: deptBilling._id,
      name: 'Sunil Deshmukh (Hospital COO)',
      email: 'admin@lifelinehospital.com',
      phone: '+91 98200 12345',
      password: 'Password123!',
      role: 'hospital_admin',
      status: 'active'
    });

    // Front Desk / Receptionist
    const receptionist = await User.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      department: deptOPD._id,
      name: 'Pooja Verma (Front Desk Manager)',
      email: 'reception@lifelinehospital.com',
      phone: '+91 98200 23456',
      password: 'Password123!',
      role: 'receptionist',
      status: 'active'
    });

    // Doctors
    const doctorArun = await User.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      department: deptOPD._id,
      name: 'Dr. Arun Joshi, MD (Internal Medicine)',
      email: 'dr.arun@lifelinehospital.com',
      phone: '+91 98200 34567',
      password: 'Password123!',
      role: 'doctor',
      doctorProfile: {
        specialty: 'Internal Medicine & Diabetology',
        qualification: 'MBBS, MD (Medicine), FACP',
        registrationNumber: 'MCI-2012-88741',
        consultationFee: 700,
        opdRoom: 'OPD Room 104',
        schedule: [
          { day: 'Monday', startTime: '09:00 AM', endTime: '02:00 PM', slotDurationMinutes: 15 },
          { day: 'Tuesday', startTime: '09:00 AM', endTime: '02:00 PM', slotDurationMinutes: 15 },
          { day: 'Wednesday', startTime: '09:00 AM', endTime: '02:00 PM', slotDurationMinutes: 15 },
          { day: 'Thursday', startTime: '09:00 AM', endTime: '02:00 PM', slotDurationMinutes: 15 },
          { day: 'Friday', startTime: '09:00 AM', endTime: '02:00 PM', slotDurationMinutes: 15 }
        ]
      },
      status: 'active'
    });

    const doctorPriya = await User.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      department: deptCardio._id,
      name: 'Dr. Priya Nair, DM (Cardiology)',
      email: 'dr.priya@lifelinehospital.com',
      phone: '+91 98200 45678',
      password: 'Password123!',
      role: 'doctor',
      doctorProfile: {
        specialty: 'Interventional Cardiology',
        qualification: 'MBBS, MD, DM (Cardiology)',
        registrationNumber: 'MCI-2015-99231',
        consultationFee: 1200,
        opdRoom: 'Cardio Suite 201',
        schedule: [
          { day: 'Monday', startTime: '11:00 AM', endTime: '04:00 PM', slotDurationMinutes: 20 },
          { day: 'Wednesday', startTime: '11:00 AM', endTime: '04:00 PM', slotDurationMinutes: 20 },
          { day: 'Friday', startTime: '11:00 AM', endTime: '04:00 PM', slotDurationMinutes: 20 }
        ]
      },
      status: 'active'
    });

    // Nurse
    const nurseAnita = await User.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      department: deptIPD._id,
      name: 'Anita George, B.Sc Nursing (Incharge)',
      email: 'nurse.anita@lifelinehospital.com',
      phone: '+91 98200 56789',
      password: 'Password123!',
      role: 'nurse',
      status: 'active'
    });

    // Pharmacist
    const pharmacist = await User.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      department: deptPharm._id,
      name: 'Ramesh Kulkarni, B.Pharm',
      email: 'pharmacist@lifelinehospital.com',
      phone: '+91 98200 67890',
      password: 'Password123!',
      role: 'pharmacist',
      status: 'active'
    });

    // Lab Technician
    const labTech = await User.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      department: deptLab._id,
      name: 'Deepak Sawant, DMLT (Lab Senior Tech)',
      email: 'lab@lifelinehospital.com',
      phone: '+91 98200 78901',
      password: 'Password123!',
      role: 'lab_tech',
      status: 'active'
    });

    // Radiologist
    const radiologist = await User.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      department: deptRad._id,
      name: 'Dr. Shalini Roy, DMRD (Consultant Radiologist)',
      email: 'radiology@lifelinehospital.com',
      phone: '+91 98200 89012',
      password: 'Password123!',
      role: 'radiologist',
      status: 'active'
    });

    // Billing Cashier
    const cashier = await User.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      department: deptBilling._id,
      name: 'Manoj Tiwari (Senior Billing Cashier)',
      email: 'cashier@lifelinehospital.com',
      phone: '+91 98200 90123',
      password: 'Password123!',
      role: 'billing_cashier',
      status: 'active'
    });

    // 6. Create Patients
    const patient1 = await Patient.create({
      tenant: tenant._id,
      primaryBranch: mainBranch._id,
      uhid: 'HV-2026-0001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      fullName: 'Rahul Sharma',
      dob: new Date('1984-06-15'),
      age: 42,
      gender: 'Male',
      bloodGroup: 'B+',
      phone: '9876543210',
      email: 'rahul.sharma84@example.com',
      address: {
        street: 'B-402, Sea View Towers, Worli',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400018'
      },
      emergencyContact: {
        name: 'Meena Sharma',
        relation: 'Spouse',
        phone: '9876543211'
      },
      nationalId: '8912-3456-7890',
      abhaId: 'rahul.sharma@abdm',
      allergies: [
        { allergen: 'Penicillin', severity: 'Severe', reaction: 'Urticaria & Bronchospasm' }
      ],
      chronicConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
      insuranceDetails: {
        provider: 'Star Health & Allied Insurance',
        policyNumber: 'SH-IND-2024-99881',
        tpaName: 'Medi Assist Insurance TPA',
        validUntil: new Date('2027-03-31')
      },
      registeredBy: receptionist._id
    });

    const patient2 = await Patient.create({
      tenant: tenant._id,
      primaryBranch: mainBranch._id,
      uhid: 'HV-2026-0002',
      firstName: 'Ananya',
      lastName: 'Patel',
      fullName: 'Ananya Patel',
      dob: new Date('1995-11-20'),
      age: 31,
      gender: 'Female',
      bloodGroup: 'O+',
      phone: '9811122233',
      email: 'ananya.p@example.com',
      address: {
        street: '12 Emerald Greens, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400069'
      },
      allergies: [],
      chronicConditions: ['Mild Asthma'],
      registeredBy: receptionist._id
    });

    const patient3 = await Patient.create({
      tenant: tenant._id,
      primaryBranch: mainBranch._id,
      uhid: 'HV-2026-0003',
      firstName: 'Kishan',
      lastName: 'Lalwani',
      fullName: 'Kishan Lalwani',
      dob: new Date('1956-02-10'),
      age: 70,
      gender: 'Male',
      bloodGroup: 'AB+',
      phone: '9833344455',
      address: {
        street: 'Flat 5B, Heritage Court, Colaba',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400005'
      },
      allergies: [{ allergen: 'Sulfa Drugs', severity: 'Moderate', reaction: 'Skin Rash' }],
      chronicConditions: ['Coronary Artery Disease', 'Hyperlipidemia'],
      registeredBy: receptionist._id
    });

    // 7. Create Beds
    const beds = [];
    const wardsConfig = [
      { ward: 'ICU (Intensive Care Unit)', type: 'ICU', floor: '3rd Floor', rooms: ['ICU-A', 'ICU-B'], countPerRoom: 2, rate: 6000 },
      { ward: 'General Male Ward', type: 'General Male', floor: '4th Floor', rooms: ['W401', 'W402'], countPerRoom: 3, rate: 1200 },
      { ward: 'Private Deluxe Suite', type: 'Private Deluxe', floor: '5th Floor', rooms: ['P501', 'P502'], countPerRoom: 1, rate: 4500 }
    ];

    for (const wc of wardsConfig) {
      for (const room of wc.rooms) {
        for (let i = 1; i <= wc.countPerRoom; i++) {
          const bedCode = `BED-${room}-${i}`;
          const bed = await Bed.create({
            tenant: tenant._id,
            branch: mainBranch._id,
            building: 'Main Tower',
            floor: wc.floor,
            ward: wc.ward,
            wardType: wc.type,
            roomNumber: room,
            bedNumber: bedCode,
            status: 'Available',
            ratePerDay: wc.rate
          });
          beds.push(bed);
        }
      }
    }

    // 8. Create Medicines with Batches
    await Medicine.create([
      {
        tenant: tenant._id,
        branch: mainBranch._id,
        name: 'Augmentin 625 Duo',
        genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
        category: 'Antibiotics / Antiviral',
        dosageForm: 'Tablet',
        strength: '625 mg',
        manufacturer: 'GSK Pharmaceuticals',
        unitPrice: 220,
        stockQuantity: 450,
        reorderLevel: 50,
        batches: [
          { batchNumber: 'AUG-24B01', expiryDate: new Date('2027-08-31'), quantity: 450, purchaseRate: 155, mrp: 220 }
        ]
      },
      {
        tenant: tenant._id,
        branch: mainBranch._id,
        name: 'Pan-D Capsule',
        genericName: 'Pantoprazole (40mg) + Domperidone (30mg)',
        category: 'Gastrointestinal',
        dosageForm: 'Capsule',
        strength: '40mg + 30mg',
        manufacturer: 'Alkem Laboratories',
        unitPrice: 185,
        stockQuantity: 600,
        reorderLevel: 100,
        batches: [
          { batchNumber: 'PND-25C12', expiryDate: new Date('2027-12-31'), quantity: 600, purchaseRate: 120, mrp: 185 }
        ]
      },
      {
        tenant: tenant._id,
        branch: mainBranch._id,
        name: 'Telma-H 40/12.5',
        genericName: 'Telmisartan (40mg) + Hydrochlorothiazide (12.5mg)',
        category: 'Cardiovascular & Hypertension',
        dosageForm: 'Tablet',
        strength: '40/12.5 mg',
        manufacturer: 'Glenmark Pharma',
        unitPrice: 260,
        stockQuantity: 320,
        reorderLevel: 40,
        batches: [
          { batchNumber: 'TEL-24H89', expiryDate: new Date('2026-11-30'), quantity: 320, purchaseRate: 180, mrp: 260 }
        ]
      },
      {
        tenant: tenant._id,
        branch: mainBranch._id,
        name: 'Glycomet-GP 2',
        genericName: 'Metformin (500mg) + Glimepiride (2mg)',
        category: 'Endocrine & Antidiabetic',
        dosageForm: 'Tablet',
        strength: '500mg / 2mg',
        manufacturer: 'USV Ltd',
        unitPrice: 190,
        stockQuantity: 28, // Low Stock Trigger demo
        reorderLevel: 50,
        batches: [
          { batchNumber: 'GLY-24D05', expiryDate: new Date('2026-06-30'), quantity: 28, purchaseRate: 130, mrp: 190 }
        ]
      },
      {
        tenant: tenant._id,
        branch: mainBranch._id,
        name: 'Paracetamol 650 (Dolo)',
        genericName: 'Paracetamol',
        category: 'Analgesics / Pain Relief',
        dosageForm: 'Tablet',
        strength: '650 mg',
        manufacturer: 'Micro Labs',
        unitPrice: 35,
        stockQuantity: 1200,
        reorderLevel: 200,
        batches: [
          { batchNumber: 'DOL-25A01', expiryDate: new Date('2028-01-31'), quantity: 1200, purchaseRate: 20, mrp: 35 }
        ]
      }
    ]);

    // 9. Create Today's Appointments & Connected Clinical Workflow for Rahul Sharma
    const today = new Date();
    const appt1 = await Appointment.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      patient: patient1._id,
      doctor: doctorArun._id,
      department: deptOPD._id,
      appointmentDate: today,
      slotTime: '10:15 AM',
      tokenNumber: 1,
      type: 'Follow-up',
      priority: 'Normal',
      status: 'Checked-In',
      checkInTime: new Date(Date.now() - 45 * 60 * 1000),
      reasonForVisit: 'Persistent dry cough, mild fever and blood pressure review',
      consultationFee: 700,
      paymentStatus: 'Paid',
      bookedBy: receptionist._id
    });

    const appt2 = await Appointment.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      patient: patient2._id,
      doctor: doctorArun._id,
      department: deptOPD._id,
      appointmentDate: today,
      slotTime: '10:45 AM',
      tokenNumber: 2,
      type: 'New Consultation',
      priority: 'Normal',
      status: 'Scheduled',
      reasonForVisit: 'Severe migraine headache since 3 days',
      consultationFee: 700,
      paymentStatus: 'Pending',
      bookedBy: receptionist._id
    });

    const appt3 = await Appointment.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      patient: patient3._id,
      doctor: doctorPriya._id,
      department: deptCardio._id,
      appointmentDate: today,
      slotTime: '11:30 AM',
      tokenNumber: 1,
      type: 'Routine Checkup',
      priority: 'Senior Citizen',
      status: 'Checked-In',
      checkInTime: new Date(Date.now() - 20 * 60 * 1000),
      reasonForVisit: 'Post-angioplasty 6-month evaluation & ECG',
      consultationFee: 1200,
      paymentStatus: 'Paid',
      bookedBy: receptionist._id
    });

    // 10. Create Encounter & Vitals for Rahul Sharma
    const enc1 = await Encounter.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      patient: patient1._id,
      appointment: appt1._id,
      doctor: doctorArun._id,
      department: deptOPD._id,
      encounterNumber: 'ENC-2026-0001',
      encounterType: 'OPD',
      chiefComplaint: 'Productive cough for 5 days, low-grade evening fever, bilateral wheeze',
      historyOfPresentIllness: 'Known hypertensive and diabetic on medication. Symptoms started after weather change.',
      examinationFindings: 'Throat congested. Chest: bilateral rhonchi on lung auscultation. CVS S1 S2 normal.',
      systemicReview: 'No chest pain, no hemoptysis, no lower limb edema.',
      clinicalNotes: 'Suspected acute bronchitis secondary to viral URI. Monitor blood glucose and SpO2 closely.',
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      followUpInstructions: 'Review in 7 days or sooner if high fever or breathlessness develops.',
      status: 'In-Progress'
    });

    await Vital.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      patient: patient1._id,
      encounter: enc1._id,
      recordedBy: nurseAnita._id,
      bloodPressureSystolic: 138,
      bloodPressureDiastolic: 88,
      pulse: 82,
      temperature: 99.4,
      respiratoryRate: 18,
      spo2: 97,
      height: 174,
      weight: 78,
      bmi: 25.8,
      bloodSugarRandom: 154,
      painScore: 2,
      remarks: 'Mild feverish feeling, vitals otherwise stable.'
    });

    // 11. Create e-Prescription for Rahul Sharma
    const rx1 = await Prescription.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      patient: patient1._id,
      encounter: enc1._id,
      doctor: doctorArun._id,
      prescriptionNumber: 'RX-2026-0001',
      diagnosis: 'Acute Bronchitis with Mild Exacerbation in Type 2 Diabetes',
      medications: [
        {
          medicineName: 'Augmentin 625 Duo',
          genericName: 'Amoxicillin + Clavulanate',
          dosage: '625 mg',
          form: 'Tablet',
          route: 'Oral',
          frequency: 'Twice daily (BD)',
          duration: '5 Days',
          quantity: 10,
          instructions: 'After Food',
          dispensedStatus: 'Pending'
        },
        {
          medicineName: 'Pan-D Capsule',
          genericName: 'Pantoprazole + Domperidone',
          dosage: '40mg + 30mg',
          form: 'Capsule',
          route: 'Oral',
          frequency: 'Once daily (OD)',
          duration: '5 Days',
          quantity: 5,
          instructions: 'Before Food',
          dispensedStatus: 'Pending'
        },
        {
          medicineName: 'Paracetamol 650 (Dolo)',
          genericName: 'Paracetamol',
          dosage: '650 mg',
          form: 'Tablet',
          route: 'Oral',
          frequency: 'As needed (SOS)',
          duration: '3 Days',
          quantity: 6,
          instructions: 'After Food',
          dispensedStatus: 'Pending'
        }
      ],
      dietAdvice: 'Adequate warm oral fluids, light low-salt diet, avoid chilled beverages.',
      generalAdvice: 'Steam inhalation twice daily. Discontinue medication and call hospital if rash develops (penicillin allergy precaution).',
      isFinalized: true,
      signedAt: new Date()
    });

    // 12. Create Lab Order & Radiology Order
    const labOrder1 = await LabOrder.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      patient: patient1._id,
      encounter: enc1._id,
      doctor: doctorArun._id,
      orderNumber: 'LAB-2026-0001',
      tests: [
        {
          testCode: 'CBC-01',
          testName: 'Complete Blood Count (CBC) with ESR',
          category: 'Hematology',
          sampleType: 'Blood (EDTA)',
          resultValue: '11,400',
          unit: '/cumm',
          referenceRange: '4,000 - 11,000',
          isAbnormal: true,
          isCritical: false,
          status: 'Sample Collected'
        },
        {
          testCode: 'CRP-02',
          testName: 'C-Reactive Protein (Quantitative CRP)',
          category: 'Serology',
          sampleType: 'Blood (Serum)',
          resultValue: '18.2',
          unit: 'mg/L',
          referenceRange: '< 5.0 mg/L',
          isAbnormal: true,
          isCritical: false,
          status: 'Sample Collected'
        }
      ],
      sampleBarcode: 'BC-2026-0001-884',
      sampleCollectedAt: new Date(),
      sampleCollectedBy: labTech._id,
      overallStatus: 'Sample Collected',
      criticalAlert: false,
      clinicalNotes: 'Suspected bacterial vs viral respiratory infection'
    });

    const radOrder1 = await RadiologyOrder.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      patient: patient1._id,
      encounter: enc1._id,
      doctor: doctorArun._id,
      orderNumber: 'RAD-2026-0001',
      modality: 'X-Ray',
      bodyPart: 'Chest PA View',
      clinicalIndication: 'Cough and bronchial wheeze. Rule out consolidation or pneumonitis.',
      priority: 'Routine',
      status: 'Worklist'
    });

    // 13. Create Inpatient Admission for Kishan Lalwani in Cardiac ICU
    const icuBed = beds.find(b => b.wardType === 'ICU');
    if (icuBed) {
      const admission = await Admission.create({
        tenant: tenant._id,
        branch: mainBranch._id,
        patient: patient3._id,
        admissionNumber: 'ADM-2026-0001',
        attendingDoctor: doctorPriya._id,
        department: deptCardio._id,
        bed: icuBed._id,
        admissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        admissionType: 'Emergency',
        diagnosisAtAdmission: 'Unstable Angina with Elevated Troponin-T (Rule out NSTEMI)',
        admittingRemarks: 'Admitted from emergency triage under strict telemetry monitoring.',
        initialDeposit: 25000,
        status: 'Admitted'
      });

      icuBed.status = 'Occupied';
      icuBed.currentPatient = patient3._id;
      icuBed.currentAdmission = admission._id;
      await icuBed.save();
    }

    // 14. Create Sample Invoices and Payments
    const invoice1 = await Invoice.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      patient: patient1._id,
      encounter: enc1._id,
      invoiceNumber: 'INV-2026-0001',
      billingType: 'OPD Consultation',
      items: [
        {
          description: 'Specialist Consultation - Dr. Arun Joshi',
          department: 'OPD',
          serviceCategory: 'Consultation',
          quantity: 1,
          unitPrice: 700,
          taxPercent: 0,
          taxAmount: 0,
          totalAmount: 700
        },
        {
          description: 'CBC with ESR Diagnostic Panel',
          department: 'Laboratory',
          serviceCategory: 'Lab Test',
          quantity: 1,
          unitPrice: 550,
          taxPercent: 0,
          taxAmount: 0,
          totalAmount: 550
        }
      ],
      subtotal: 1250,
      totalDiscount: 100,
      discountReason: 'Senior privilege loyalty waiver',
      totalTax: 0,
      grandTotal: 1150,
      paidAmount: 1150,
      balanceDue: 0,
      payerType: 'Self-Pay (Cash / UPI / Card)',
      status: 'Fully Paid',
      isImmutable: true,
      generatedBy: cashier._id
    });

    await Payment.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      receiptNumber: 'REC-2026-0001',
      invoice: invoice1._id,
      patient: patient1._id,
      amountPaid: 1150,
      paymentMethod: 'UPI / QR Code',
      paymentType: 'Bill Settlement',
      transactionReference: 'UPI-AXIS-992381204',
      collectedBy: cashier._id,
      status: 'Completed'
    });

    // 15. Create Insurance Policy Record for Rahul Sharma
    await InsurancePolicy.create({
      tenant: tenant._id,
      patient: patient1._id,
      insuranceProvider: 'Star Health & Allied Insurance',
      tpaName: 'Medi Assist Insurance TPA',
      policyNumber: 'SH-IND-2024-99881',
      policyHolderName: 'Rahul Sharma',
      relationshipToPatient: 'Self',
      sumInsuredLimit: 500000,
      validTill: new Date('2027-03-31'),
      preAuthRequests: [
        {
          preAuthNumber: 'PREAUTH-2026-001',
          requestedAmount: 45000,
          approvedAmount: 40000,
          status: 'Approved in Full',
          tpaRemarks: 'Approved for planned medical management under policy sub-limits',
          requestDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          approvalDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
        }
      ]
    });

    // 16. Initialize Feature Flags for Tenant
    const defaultFlags = [
      'module_laboratory',
      'module_radiology',
      'module_pharmacy',
      'module_ipd_wards',
      'module_emergency',
      'module_ot',
      'module_insurance_tpa',
      'module_patient_portal',
      'module_ai_assistant',
      'module_crm_corporate'
    ];

    for (const flagKey of defaultFlags) {
      await FeatureFlag.create({
        tenant: tenant._id,
        moduleKey: flagKey,
        isEnabled: true
      });
    }

    // 17. Create Pending Approval Request
    await ApprovalRequest.create({
      tenant: tenant._id,
      branch: mainBranch._id,
      requestType: 'Billing Discount',
      requestedBy: cashier._id,
      approverRole: 'hospital_admin',
      amount: 1500,
      reason: 'BPL / Underprivileged patient concession requested for surgical consumable charges',
      status: 'Pending',
      entityReference: {
        entityType: 'Invoice',
        entityId: invoice1._id.toString()
      }
    });

    // 18. Create CRM Lead & Corporate Account
    await CRMLead.create({
      tenant: tenant._id,
      prospectName: 'Sunita Mehra (HR Lead, Techcorp India)',
      phone: '+91 98200 99881',
      email: 'sunita@techcorp.example.com',
      interestCategory: 'Corporate Employee Camp',
      source: 'Website Form',
      status: 'New Inquiry',
      notes: 'Interested in annual executive health checkups for 350 software engineers.'
    });

    await CorporateAccount.create({
      tenant: tenant._id,
      companyName: 'Techcorp India Solutions Pvt Ltd',
      code: 'CORP-TC01',
      contactPerson: 'Sunita Mehra',
      email: 'corporate.wellness@techcorp.example.com',
      phone: '+91 98200 99881',
      creditLimit: 500000,
      currentOutstanding: 125000,
      agreedDiscountPercent: 12,
      creditPeriodDays: 45,
      mouValidTill: new Date('2027-12-31'),
      status: 'active'
    });

    console.log('[Seed] Database seeding completed successfully!');
    console.log('[Seed] Super Admin: superadmin@hospitalvision.com / Password123!');
    console.log('[Seed] Hospital Admin: admin@lifelinehospital.com / Password123!');
    console.log('[Seed] Doctor: dr.arun@lifelinehospital.com / Password123!');
    console.log('[Seed] Receptionist: reception@lifelinehospital.com / Password123!');
    console.log('[Seed] Nurse: nurse.anita@lifelinehospital.com / Password123!');
    console.log('[Seed] Billing Cashier: cashier@lifelinehospital.com / Password123!');
    console.log('[Seed] Pharmacist: pharmacist@lifelinehospital.com / Password123!');
    console.log('[Seed] Lab Tech: lab@lifelinehospital.com / Password123!');
    console.log('[Seed] Radiologist: radiology@lifelinehospital.com / Password123!');
    console.log('[Seed] Patient Portal: Phone 9876543210 (Rahul Sharma, UHID: HV-2026-0001)');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  }
};

module.exports = { seedDatabase };
