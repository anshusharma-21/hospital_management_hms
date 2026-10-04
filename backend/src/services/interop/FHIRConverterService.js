const AuditLog = require('../../models/AuditLog');

/**
 * Service to map internal Hospital Vision records to HL7 FHIR R4 standard resources
 * for future ABDM / Health Information Exchange interoperability.
 */
class FHIRConverterService {
  /**
   * Convert Patient model to FHIR R4 Patient resource
   */
  toFHIRPatient(patient) {
    if (!patient) return null;
    return {
      resourceType: 'Patient',
      id: patient._id.toString(),
      identifier: [
        {
          use: 'official',
          system: 'https://hospitalvision.org/fhir/uhid',
          value: patient.uhid
        },
        ...(patient.abhaId ? [{
          use: 'secondary',
          system: 'https://abdm.gov.in/abha',
          value: patient.abhaId
        }] : [])
      ],
      name: [
        {
          use: 'official',
          family: patient.lastName || '',
          given: [patient.firstName || '']
        }
      ],
      telecom: [
        {
          system: 'phone',
          value: patient.phone,
          use: 'mobile'
        }
      ],
      gender: (patient.gender || 'unknown').toLowerCase(),
      birthDate: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : undefined
    };
  }

  /**
   * Convert User model to FHIR R4 Practitioner resource
   */
  toFHIRPractitioner(user) {
    if (!user) return null;
    return {
      resourceType: 'Practitioner',
      id: user._id.toString(),
      identifier: [
        {
          system: 'https://hospitalvision.org/fhir/practitioner',
          value: user.employeeId || user._id.toString()
        }
      ],
      name: [
        {
          use: 'official',
          text: user.name
        }
      ],
      telecom: [
        {
          system: 'email',
          value: user.email
        }
      ]
    };
  }

  /**
   * Convert Encounter model to FHIR R4 Encounter resource
   */
  toFHIREncounter(encounter, patient, doctor) {
    if (!encounter) return null;
    return {
      resourceType: 'Encounter',
      id: encounter._id.toString(),
      status: encounter.status === 'Completed' ? 'finished' : 'in-progress',
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: encounter.encounterType === 'Inpatient' ? 'IMP' : 'AMB',
        display: encounter.encounterType || 'Ambulatory'
      },
      subject: {
        reference: `Patient/${encounter.patient || patient?._id}`,
        display: patient ? `${patient.firstName} ${patient.lastName || ''}`.trim() : undefined
      },
      participant: doctor ? [
        {
          individual: {
            reference: `Practitioner/${doctor._id}`,
            display: doctor.name
          }
        }
      ] : [],
      period: {
        start: encounter.createdAt || new Date().toISOString()
      }
    };
  }

  /**
   * Convert Vital model to FHIR R4 Observation resource
   */
  toFHIRObservation(vital, patient) {
    if (!vital) return null;
    const components = [];
    if (vital.bloodPressureSystolic && vital.bloodPressureDiastolic) {
      components.push({
        code: { text: 'Systolic Blood Pressure' },
        valueQuantity: { value: vital.bloodPressureSystolic, unit: 'mmHg' }
      });
      components.push({
        code: { text: 'Diastolic Blood Pressure' },
        valueQuantity: { value: vital.bloodPressureDiastolic, unit: 'mmHg' }
      });
    }
    if (vital.heartRate) {
      components.push({
        code: { text: 'Heart Rate' },
        valueQuantity: { value: vital.heartRate, unit: 'beats/min' }
      });
    }
    if (vital.temperature) {
      components.push({
        code: { text: 'Body Temperature' },
        valueQuantity: { value: vital.temperature, unit: 'F' }
      });
    }

    return {
      resourceType: 'Observation',
      id: vital._id.toString(),
      status: 'final',
      category: [{ text: 'vital-signs' }],
      subject: {
        reference: `Patient/${vital.patient || patient?._id}`
      },
      effectiveDateTime: vital.recordedAt || vital.createdAt,
      component: components
    };
  }

  /**
   * Convert Prescription model to FHIR R4 MedicationRequest
   */
  toFHIRMedicationRequest(prescription, patient, doctor) {
    if (!prescription) return null;
    return {
      resourceType: 'MedicationRequest',
      id: prescription._id.toString(),
      status: 'active',
      intent: 'order',
      subject: {
        reference: `Patient/${prescription.patient || patient?._id}`
      },
      requester: doctor ? {
        reference: `Practitioner/${doctor._id}`,
        display: doctor.name
      } : undefined,
      medicationCodeableConcept: {
        text: prescription.medications?.map(m => `${m.medicineName} (${m.dosage})`).join('; ') || 'Prescribed Meds'
      },
      dosageInstruction: prescription.medications?.map(m => ({
        text: `${m.dosage} ${m.frequency || ''} for ${m.duration || ''}`,
        timing: { code: { text: m.frequency } }
      }))
    };
  }

  /**
   * Export FHIR Bundle with explicit consent and audit hook
   */
  async exportPatientBundleWithConsent({ tenantId, patient, clinicalData = {}, consentArtifact, authorizedBy }) {
    if (!tenantId) {
      throw new Error('[FHIRConverterService] tenantId is required for tenant isolation.');
    }
    if (!consentArtifact || !consentArtifact.consentId || consentArtifact.status !== 'GRANTED') {
      throw new Error('[FHIRConverterService] ABDM/FHIR Data export rejected: Missing or invalid patient consent.');
    }

    const fhirPatient = this.toFHIRPatient(patient);
    const entries = [{ resource: fhirPatient }];

    if (clinicalData.vitals && Array.isArray(clinicalData.vitals)) {
      clinicalData.vitals.forEach(v => {
        entries.push({ resource: this.toFHIRObservation(v, patient) });
      });
    }

    if (clinicalData.prescriptions && Array.isArray(clinicalData.prescriptions)) {
      clinicalData.prescriptions.forEach(p => {
        entries.push({ resource: this.toFHIRMedicationRequest(p, patient) });
      });
    }

    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      meta: {
        consentReference: consentArtifact.consentId,
        security: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }]
      },
      entry: entries
    };

    // Audit Logging
    await AuditLog.create({
      tenant: tenantId,
      user: authorizedBy?._id || undefined,
      action: 'FHIR/ABDM Data Export',
      module: 'Clinical / EMR',
      entityType: 'Patient',
      entityId: patient._id.toString(),
      details: `Generated FHIR Bundle containing ${entries.length} resources under Consent ID ${consentArtifact.consentId}`,
      timestamp: new Date()
    });

    return {
      success: true,
      bundle,
      resourceCount: entries.length,
      consentVerified: true
    };
  }
}

module.exports = new FHIRConverterService();
