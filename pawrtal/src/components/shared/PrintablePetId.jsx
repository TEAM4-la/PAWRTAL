import React from 'react';
import logo from '@/assets/LOGO.png';
import background from '@/assets/background.png';
import { format } from 'date-fns';

export default function PrintablePetId({ pet, user, qrCodeUrl }) {
  if (!pet || !user) return null;

  const birthday = pet.date_of_birth ? format(new Date(pet.date_of_birth), 'MM/dd/yy') : 'N/A';
  const sex = pet.gender === 'male' ? 'M' : pet.gender === 'female' ? 'F' : 'N/A';
  const color = pet.color || 'N/A';

  return (
    <div className="hidden print:block w-full">
      <style>
        {`
          @media print {
            @page {
              size: 3.375in 2.125in landscape;
              margin: 0;
            }
            body * {
              visibility: hidden;
            }
            #printable-pet-id, #printable-pet-id * {
              visibility: visible;
            }
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
        {/* Front Page */}
        <div 
          className="w-[3.375in] h-[2.125in] mx-auto border-2 border-gray-300 relative bg-white overflow-hidden"
          style={{ 
            pageBreakAfter: 'always', 
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact',
            backgroundImage: `url(${background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Header */}
          <div className="bg-[#f97316] h-[0.5in] w-full flex items-center justify-center relative">
            {/* Logo overlapping header slightly */}
            <div className="absolute -left-2 -top-1 w-[0.8in] h-[0.8in]">
               <img src={logo} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="text-white text-center ml-12">
              <h1 className="font-bold text-sm leading-tight tracking-wide">VM VETERINARY CLINIC</h1>
              <p className="text-[0.45rem] font-medium">Petshop & Spa - Pet Grooming Center</p>
            </div>
          </div>

          {/* Body */}
          <div className="flex p-2 gap-3 h-[calc(100%-0.5in)] relative">
             {/* Pet Photo */}
             <div className="w-[1.2in] h-[1.3in] rounded-md border-2 border-black overflow-hidden bg-gray-100 z-10 flex-shrink-0 mt-2">
               {pet.photo_url ? (
                 <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Photo</div>
               )}
             </div>

             {/* Pet Details */}
             <div className="flex-1 mt-2 z-10 text-[#432c1a]">
               <h2 className="font-black text-2xl leading-none truncate">{pet.name?.toUpperCase()}</h2>
               <p className="font-bold text-[#f97316] text-sm mb-2 leading-none truncate">{pet.breed || pet.species}</p>
               
               <div className="grid grid-cols-2 gap-y-1 gap-x-2 mt-1">
                  <div>
                    <p className="text-[0.5rem] font-medium text-gray-500">Birthday</p>
                    <p className="text-xs font-bold leading-none">{birthday}</p>
                  </div>
                  <div>
                    <p className="text-[0.5rem] font-medium text-gray-500">Sex</p>
                    <p className="text-xs font-bold leading-none">{sex}</p>
                  </div>
                  <div>
                    <p className="text-[0.5rem] font-medium text-gray-500">Color</p>
                    <p className="text-xs font-bold leading-none truncate">{color}</p>
                  </div>
               </div>
             </div>
          </div>
        </div>

        {/* Back Page */}
        <div 
          className="w-[3.375in] h-[2.125in] mx-auto border-2 border-gray-300 relative bg-white overflow-hidden mt-8"
          style={{ 
            printColorAdjust: 'exact',
            WebkitPrintColorAdjust: 'exact',
            backgroundImage: `url(${background})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Header */}
          <div className="bg-[#f97316] h-[0.5in] w-full flex items-center justify-center relative">
            <div className="absolute -left-2 -top-1 w-[0.8in] h-[0.8in]">
               <img src={logo} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            <div className="text-white text-center ml-12">
              <h1 className="font-bold text-sm leading-tight tracking-wide">VM VETERINARY CLINIC</h1>
              <p className="text-[0.45rem] font-medium">Petshop & Spa - Pet Grooming Center</p>
            </div>
          </div>

          {/* Body */}
          <div className="p-2 h-[calc(100%-0.65in)] flex flex-col justify-center">
            <h3 className="text-[0.6rem] font-bold text-[#8c5a35] mb-1 ml-4">IF FOUND, PLEASE CONTACT</h3>
            
            <div className="bg-[#fff1e5] border border-[#fbd3b1] rounded-2xl p-2 flex justify-between items-center mx-1">
              <div className="space-y-1 flex-1 pr-1">
                <div>
                  <h4 className="text-[0.6rem] font-bold text-[#8c5a35] leading-tight">Owner Information</h4>
                  <div className="flex justify-between text-[#111]">
                    <div className="w-1/2 pr-1">
                      <p className="text-[0.45rem] text-gray-500">Name</p>
                      <p className="text-[0.55rem] font-bold truncate">{user.full_name || 'N/A'}</p>
                    </div>
                    <div className="w-1/2">
                      <p className="text-[0.45rem] text-gray-500">Contact Number</p>
                      <p className="text-[0.55rem] font-bold truncate">{user.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[0.6rem] font-bold text-[#8c5a35] leading-tight mt-1">Clinic Information</h4>
                  <div className="flex justify-between text-[#111]">
                    <div className="w-1/2 pr-1">
                      <p className="text-[0.45rem] text-gray-500">Clinic Name</p>
                      <p className="text-[0.55rem] font-bold truncate">VM Veterinary Clinic</p>
                    </div>
                    <div className="w-1/2">
                      <p className="text-[0.45rem] text-gray-500">Contact Number</p>
                      <p className="text-[0.55rem] font-bold truncate">09491270283</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* QR Code */}
              <div className="bg-white p-0.5 rounded flex-shrink-0">
                 {qrCodeUrl ? (
                   <img src={qrCodeUrl} alt="QR Code" className="w-[0.9in] h-[0.9in] object-contain" />
                 ) : (
                   <div className="w-[0.9in] h-[0.9in] bg-gray-200"></div>
                 )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-1 w-[calc(100%-2rem)] text-center border-t border-gray-400 mx-4 px-2">
            <p className="text-[0.5rem] font-bold text-[#664125] pt-0.5">
              powered by <span className="text-[#f97316]">PAWRTAL</span> - VM Veterinary Clinic
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
