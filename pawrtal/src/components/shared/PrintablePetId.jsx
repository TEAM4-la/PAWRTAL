import React from 'react';
import logo from '@/assets/LOGO.png';
import background from '@/assets/background.png';
import { format } from 'date-fns';

export default function PrintablePetId({ pet, user, qrCodeUrl }) {
  if (!pet || !user) return null;

  const birthday = pet.date_of_birth ? format(new Date(pet.date_of_birth), 'MM/dd/yy') : 'N/A';
  const sex = pet.gender === 'male' ? 'M' : pet.gender === 'female' ? 'F' : 'N/A';
  const color = pet.color || 'N/A';

  const cardStyle = {
    width: '85.6mm',
    height: '53.98mm',
    printColorAdjust: 'exact',
    WebkitPrintColorAdjust: 'exact',
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    fontFamily: 'Arial, sans-serif',
  };

  const Header = () => (
    <div
      style={{
        background: '#f97316',
        height: '12mm',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '1mm',
        paddingRight: '3mm',
        gap: '2mm',
        boxSizing: 'border-box',
      }}
    >
      {/* Logo — fully inside the header */}
      <img
        src={logo}
        alt="Logo"
        style={{ width: '11mm', height: '11mm', objectFit: 'contain', flexShrink: 0 }}
      />
      {/* Clinic name */}
      <div style={{ color: '#fff', textAlign: 'center', flex: 1 }}>
        <div style={{ fontWeight: 900, fontSize: '3.8mm', lineHeight: 1.2, letterSpacing: '0.3mm' }}>
          VM VETERINARY CLINIC
        </div>
        <div style={{ fontWeight: 500, fontSize: '1.9mm', lineHeight: 1.2 }}>
          Petshop &amp; Spa - Pet Grooming Center
        </div>
      </div>
    </div>
  );

  return (
    <div className="hidden print:block w-full">
      <style>
        {`
          @media print {
            @page { margin: 10mm; }
            body * { visibility: hidden; }
            #printable-pet-id, #printable-pet-id * { visibility: visible; }
            #printable-pet-id {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>
      <div id="printable-pet-id">

        {/* ===== FRONT PAGE ===== */}
        <div
          style={{ ...cardStyle, pageBreakAfter: 'always', position: 'relative', overflow: 'hidden', border: '1.5px solid #ccc', borderRadius: '3mm' }}
        >
          <Header />

          {/* Body */}
          <div style={{ display: 'flex', padding: '2mm 3mm', gap: '3mm', height: 'calc(100% - 12mm)', boxSizing: 'border-box' }}>
            {/* Pet Photo */}
            <div
              style={{
                width: '26mm',
                height: '30mm',
                flexShrink: 0,
                border: '1.5px solid #333',
                borderRadius: '1.5mm',
                overflow: 'hidden',
                background: '#e5e7eb',
              }}
            >
              {pet.photo_url ? (
                <img src={pet.photo_url} alt={pet.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '2.5mm' }}>
                  No Photo
                </div>
              )}
            </div>

            {/* Pet Details */}
            <div style={{ flex: 1, color: '#432c1a', overflow: 'hidden' }}>
              <div style={{ fontWeight: 900, fontSize: '6.5mm', lineHeight: 1, marginBottom: '1mm', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pet.name?.toUpperCase()}
              </div>
              <div style={{ fontWeight: 700, fontSize: '3mm', color: '#f97316', marginBottom: '3mm', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pet.breed || pet.species}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5mm' }}>
                <div>
                  <div style={{ fontSize: '1.8mm', color: '#6b7280', fontWeight: 500 }}>Birthday</div>
                  <div style={{ fontSize: '2.8mm', fontWeight: 700, lineHeight: 1 }}>{birthday}</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.8mm', color: '#6b7280', fontWeight: 500 }}>Sex</div>
                  <div style={{ fontSize: '2.8mm', fontWeight: 700, lineHeight: 1 }}>{sex}</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.8mm', color: '#6b7280', fontWeight: 500 }}>Color</div>
                  <div style={{ fontSize: '2.8mm', fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{color}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== BACK PAGE ===== */}
        <div
          style={{ ...cardStyle, marginTop: '8mm', position: 'relative', overflow: 'hidden', border: '1.5px solid #ccc', borderRadius: '3mm' }}
        >
          <Header />

          {/* Body */}
          <div style={{ padding: '1.5mm 3mm 1mm', height: 'calc(100% - 16mm)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '2.3mm', fontWeight: 700, color: '#8c5a35', marginBottom: '1.5mm' }}>
              IF FOUND, PLEASE CONTACT
            </div>

            <div style={{
              background: '#fff1e5',
              border: '1px solid #fbd3b1',
              borderRadius: '3mm',
              padding: '2mm 2.5mm',
              display: 'flex',
              alignItems: 'center',
              gap: '2mm',
            }}>
              {/* Info columns */}
              <div style={{ flex: 1 }}>
                {/* Owner */}
                <div style={{ fontSize: '2.3mm', fontWeight: 700, color: '#8c5a35', marginBottom: '0.8mm' }}>Owner Information</div>
                <div style={{ display: 'flex', gap: '2mm', marginBottom: '2mm' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.8mm', color: '#6b7280' }}>Name</div>
                    <div style={{ fontSize: '2.3mm', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name || 'N/A'}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.8mm', color: '#6b7280' }}>Contact Number</div>
                    <div style={{ fontSize: '2.3mm', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.phone || 'N/A'}</div>
                  </div>
                </div>

                {/* Clinic */}
                <div style={{ fontSize: '2.3mm', fontWeight: 700, color: '#8c5a35', marginBottom: '0.8mm' }}>Clinic Information</div>
                <div style={{ display: 'flex', gap: '2mm' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.8mm', color: '#6b7280' }}>Clinic Name</div>
                    <div style={{ fontSize: '2.3mm', fontWeight: 700 }}>VM Veterinary Clinic</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.8mm', color: '#6b7280' }}>Contact Number</div>
                    <div style={{ fontSize: '2.3mm', fontWeight: 700 }}>09491270283</div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div style={{ background: '#fff', padding: '1mm', borderRadius: '1.5mm', flexShrink: 0 }}>
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" style={{ width: '19mm', height: '19mm', objectFit: 'contain', display: 'block' }} />
                ) : (
                  <div style={{ width: '19mm', height: '19mm', background: '#e5e7eb' }} />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            position: 'absolute',
            bottom: '1.5mm',
            left: '4mm',
            right: '4mm',
            borderTop: '0.5px solid #9ca3af',
            paddingTop: '1mm',
            textAlign: 'center',
            fontSize: '2mm',
            fontWeight: 700,
            color: '#664125',
          }}>
            powered by <span style={{ color: '#f97316' }}>PAWRTAL</span> - VM Veterinary Clinic
          </div>
        </div>

      </div>
    </div>
  );
}
