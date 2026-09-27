import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building,
  Upload,
  Lock,
} from 'lucide-react';
import { useProviderWorkspaceStore } from '../../../store/useProviderWorkspaceStore';

export function VerificationView() {
  const { verification, profile } = useProviderWorkspaceStore();

  const isVerified = verification?.is_verified ?? true;
  const docs = verification?.documents || [
    { id: 1, document_type: 'Business PAN Card', document_number: 'AABCH7821K', status: 'approved', submitted_at: '2026-09-16' },
    { id: 2, document_type: 'GSTIN Registration', document_number: '27AABCH7821K1ZM', status: 'approved', submitted_at: '2026-09-16' },
    { id: 3, document_type: 'Government Identity Proof', document_number: 'Aadhaar (XXXX-XXXX-9912)', status: 'approved', submitted_at: '2026-09-16' },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Verification Status Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#065F46] shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#059669]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-[#12213B]">
                KYC Level-2 Trust Badge Active
              </h3>
              <span className="text-[10px] font-mono uppercase font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                Verified Partner
              </span>
            </div>
            <p className="text-xs text-[#556275]">
              Your business identity and settlement bank have been certified by LOKIVA Compliance.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] flex items-center gap-2.5 text-xs font-heading">
            <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0" />
            <span className="font-bold text-[#12213B]">Zero Payout Holdbacks</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] flex items-center gap-2.5 text-xs font-heading">
            <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0" />
            <span className="font-bold text-[#12213B]">Verified Search Pin</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E5DFD5] flex items-center gap-2.5 text-xs font-heading">
            <CheckCircle2 className="w-4 h-4 text-[#065F46] shrink-0" />
            <span className="font-bold text-[#12213B]">Priority Solver Ranking</span>
          </div>
        </div>
      </div>

      {/* Submitted Legal Documents */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5DFD5] shadow-2xs space-y-4">
        <h4 className="text-base font-display font-bold text-[#12213B]">
          Submitted Business & Legal Documents
        </h4>

        <div className="divide-y divide-[#E5DFD5]/60">
          {docs.map((d: any) => (
            <div key={d.id} className="py-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-[#065F46]" />
                <div>
                  <div className="font-bold text-[#12213B]">
                    {d.document_type?.replace('_', ' ')}
                  </div>
                  <div className="text-[11px] font-mono text-[#556275]">
                    Ref: {d.document_number}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-[#556275]">
                  Verified {d.submitted_at}
                </span>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  Approved
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
