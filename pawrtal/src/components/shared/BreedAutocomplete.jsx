import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, Sparkles } from 'lucide-react';

// Extensive breeds list grouped by species
const BREEDS_BY_SPECIES = {
  dog: [
    'Affenpinscher', 'Afghan Hound', 'Airedale Terrier', 'Akita', 'Alaskan Malamute', 
    'American Bulldog', 'American Pit Bull Terrier', 'American Staffordshire Terrier', 
    'Australian Cattle Dog', 'Australian Shepherd', 'Basenji', 'Basset Hound', 
    'Beagle', 'Bernese Mountain Dog', 'Bichon Frise', 'Bloodhound', 'Border Collie', 
    'Boston Terrier', 'Boxer', 'Bulldog', 'Bullmastiff', 'Cane Corso', 
    'Cavalier King Charles Spaniel', 'Chesapeake Bay Retriever', 'Chihuahua', 'Chow Chow', 
    'Cocker Spaniel', 'Dachshund', 'Dalmatian', 'Doberman Pinscher', 'English Springer Spaniel', 
    'French Bulldog', 'German Shepherd', 'German Shorthaired Pointer', 'Golden Retriever', 
    'Great Dane', 'Great Pyrenees', 'Havanese', 'Irish Setter', 'Italian Greyhound', 
    'Jack Russell Terrier', 'Labrador Retriever', 'Lhasa Apso', 'Maltese', 'Mastiff', 
    'Miniature Pinscher', 'Miniature Schnauzer', 'Newfoundland', 'Papillon', 'Pekingese', 
    'Pembroke Welsh Corgi', 'Pomeranian', 'Poodle (Standard)', 'Poodle (Miniature)', 'Poodle (Toy)', 
    'Pug', 'Rhodesian Ridgeback', 'Rottweiler', 'Saint Bernard', 'Samoyed', 'Schipperke', 
    'Schnauzer', 'Scottish Terrier', 'Shetland Sheepdog', 'Shiba Inu', 'Shih Tzu', 
    'Siberian Husky', 'Staffordshire Bull Terrier', 'Vizsla', 'Weimaraner', 'Welsh Corgi', 
    'West Highland White Terrier', 'Whippet', 'Yorkshire Terrier', 'Mixed Breed (Dog)', 'Askal / Aspin'
  ],
  cat: [
    'Abyssinian', 'American Curl', 'American Shorthair', 'American Wirehair', 
    'Balinese', 'Bengal', 'Birman', 'Bombay', 'British Longhair', 'British Shorthair', 
    'Burmese', 'Chartreux', 'Cornish Rex', 'Devon Rex', 'Egyptian Mau', 'Exotic Shorthair', 
    'Himalayan', 'Japanese Bobtail', 'Korat', 'LaPerm', 'Maine Coon', 'Manx', 
    'Munchkin', 'Norwegian Forest Cat', 'Ocicat', 'Oriental Shorthair', 'Persian', 
    'Ragdoll', 'Russian Blue', 'Scottish Fold', 'Selkirk Rex', 'Siamese', 'Siberian Cat', 
    'Singapura', 'Somali', 'Sphynx', 'Tonkinese', 'Turkish Angora', 'Turkish Van', 
    'Domestic Shorthair (Puspin)', 'Domestic Mediumhair', 'Domestic Longhair', 'Mixed Breed (Cat)'
  ],
  bird: [
    'African Grey Parrot', 'Amazon Parrot', 'Budgerigar (Parakeet)', 'Canary', 
    'Cockatiel', 'Cockatoo', 'Conure', 'Eclectus Parrot', 'Finch', 'Lovebird', 
    'Macaw', 'Pionus Parrot', 'Quaker Parrot', 'Ringneck Parakeet', 'Senegal Parrot'
  ],
  rabbit: [
    'American Fuzzy Lop', 'Californian', 'Dutch', 'English Angora', 'Flemish Giant', 
    'Florida White', 'Holland Lop', 'Lionhead', 'Mini Lop', 'Mini Rex', 'Netherland Dwarf', 
    'New Zealand', 'Polish', 'Rex', 'Satin'
  ],
  hamster: [
    'Chinese Hamster', 'Dwarf Campbell Russian', 'Dwarf Winter White', 'Roborovski Dwarf', 
    'Syrian Hamster', 'Guinea Pig (Abyssinian)', 'Guinea Pig (American)', 'Guinea Pig (Peruvian)', 
    'Guinea Pig (Silkie)', 'Chinchilla'
  ],
  fish: [
    'Angelfish', 'Betta (Siamese Fighting Fish)', 'Clownfish', 'Discus', 'Goldfish (Comet)', 
    'Goldfish (Fantail)', 'Goldfish (Oranda)', 'Guppy', 'Molly', 'Neon Tetra', 'Platy', 
    'Swordtail', 'Zebra Danio'
  ],
  reptile: [
    'Ball Python', 'Bearded Dragon', 'Chameleon', 'Corn Snake', 'Crested Gecko', 
    'Green Iguana', 'Leopard Gecko', 'Red-Eared Slider Turtle', 'Russian Tortoise'
  ]
};

// Flattened list of all breeds for fallback search
const ALL_BREEDS = Array.from(new Set(Object.values(BREEDS_BY_SPECIES).flat())).sort();

export default function BreedAutocomplete({
  value = '',
  onChange,
  species = '',
  placeholder = 'e.g., Golden Retriever',
  className = '',
  id = 'breed',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  // Get breed options based on species
  const getAvailableBreeds = () => {
    const key = (species || '').toLowerCase();
    if (key && BREEDS_BY_SPECIES[key]) {
      return BREEDS_BY_SPECIES[key];
    }
    return ALL_BREEDS;
  };

  const availableBreeds = getAvailableBreeds();

  // Filter recommendations based on current typed value
  const filteredBreeds = value.trim() === ''
    ? availableBreeds.slice(0, 8)
    : availableBreeds.filter(b => b.toLowerCase().includes(value.toLowerCase())).slice(0, 10);

  // Handle clicking outside to close popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (breedName) => {
    onChange(breedName);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < filteredBreeds.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredBreeds.length - 1));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredBreeds.length) {
        e.preventDefault();
        handleSelect(filteredBreeds[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.children[highlightedIndex];
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("h-11 transition-all", className)}
        autoComplete="off"
      />

      {isOpen && filteredBreeds.length > 0 && (
        <div 
          className="absolute z-50 w-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 max-h-60 overflow-y-auto animate-in fade-in-50 slide-in-from-top-2 duration-150"
          ref={listRef}
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-teal-600 uppercase bg-teal-50/50 flex items-center gap-1.5 border-b border-gray-100">
            <Sparkles className="w-3 h-3 text-teal-500" />
            Suggested Breeds {species ? `for ${species}` : ''}
          </div>

          {filteredBreeds.map((breed, index) => {
            const isSelected = value.toLowerCase() === breed.toLowerCase();
            const isHighlighted = highlightedIndex === index;

            return (
              <button
                key={breed}
                type="button"
                onClick={() => handleSelect(breed)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "w-full text-left px-3.5 py-2 text-sm flex items-center justify-between transition-colors",
                  isHighlighted ? "bg-teal-50 text-teal-900 font-medium" : "text-gray-700 hover:bg-gray-50",
                  isSelected && "font-semibold text-teal-600"
                )}
              >
                <span>{breed}</span>
                {isSelected && <Check className="w-4 h-4 text-teal-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
