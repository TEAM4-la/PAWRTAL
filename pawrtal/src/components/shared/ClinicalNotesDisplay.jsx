import React from 'react';
import { Stethoscope, Pill, Scale, Thermometer } from 'lucide-react';

/**
 * Parses clinical notes to separate Diagnosis, Treatment, Weight, and Temperature
 * into distinct, visually organized blocks instead of a single unreadable text blob.
 */
export default function ClinicalNotesDisplay({ description, className = '' }) {
  if (!description || typeof description !== 'string') return null;

  const raw = description.trim();

  // Try parsing structured consultation patterns
  const diagMatch = raw.match(
    /(?:Clinical Assessment \/ Diagnosis|Assessment \/ Diagnosis|Diagnosis):\s*([\s\S]*?)(?=(?:Treatment & Recommendations|Treatment|Clinical Recommendations|Patient Weight|Body Temperature|$))/i
  );
  const treatMatch = raw.match(
    /(?:Treatment & Recommendations|Clinical Recommendations|Treatment):\s*([\s\S]*?)(?=(?:Patient Weight|Body Temperature|$))/i
  );
  const weightMatch = raw.match(
    /(?:Patient Weight|Weight):\s*([\s\S]*?)(?=(?:Body Temperature|$))/i
  );
  const tempMatch = raw.match(
    /(?:Body Temperature|Temperature):\s*([\s\S]*?)$/i
  );

  const isStructured = Boolean(diagMatch && (treatMatch || weightMatch || tempMatch));

  if (!isStructured) {
    return (
      <p className={`text-xs sm:text-sm text-gray-700 mt-1.5 whitespace-pre-line break-words leading-relaxed ${className}`}>
        {raw}
      </p>
    );
  }

  const diag = diagMatch ? diagMatch[1].trim() : null;
  const treat = treatMatch ? treatMatch[1].trim() : null;
  const weight = weightMatch ? weightMatch[1].trim() : null;
  const temp = tempMatch ? tempMatch[1].trim() : null;

  return (
    <div className={`mt-2 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 sm:p-3 space-y-2 text-xs sm:text-sm ${className}`}>
      {diag && (
        <div className="flex items-start gap-1.5">
          <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-gray-800">Diagnosis / Findings: </span>
            <span className="text-gray-900 font-medium break-words">{diag}</span>
          </div>
        </div>
      )}

      {treat && (
        <div className="flex items-start gap-1.5 border-t border-slate-200/50 pt-1.5">
          <Pill className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-gray-800">Treatment & Plan: </span>
            <span className="text-gray-700 break-words">{treat}</span>
          </div>
        </div>
      )}

      {(weight || temp) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/50">
          {weight && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] sm:text-xs font-medium">
              <Scale className="w-3 h-3 text-amber-600" />
              Weight: <strong className="font-semibold">{weight}</strong>
            </span>
          )}
          {temp && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-200/80 text-[11px] sm:text-xs font-medium">
              <Thermometer className="w-3 h-3 text-rose-600" />
              Temperature: <strong className="font-semibold">{temp}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
