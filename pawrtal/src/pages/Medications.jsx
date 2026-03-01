import React from 'react';
import OwnerSidebar from '@/components/layout/OwnerSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Pill } from 'lucide-react';

export default function Medications() {
  return (
    <OwnerSidebar user={null}>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Pill className="w-6 h-6 text-purple-700" />
          <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
        </div>
        <Card className="border-dashed border-2">
          <CardContent className="py-10 text-center text-gray-500">
            This is a placeholder for the Medications page.
            <br />
            You can list active and past medications for each pet here.
          </CardContent>
        </Card>
      </div>
    </OwnerSidebar>
  );
}

