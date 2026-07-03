'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { medicineService } from '@/lib/firestore-service';
import { Medicine } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, Info } from 'lucide-react';

// Common drug interactions database
const drugInteractionsDatabase: Record<string, { name: string; severity: 'low' | 'moderate' | 'severe'; description: string }[]> = {
  'aspirin': [
    { name: 'ibuprofen', severity: 'moderate', description: 'Increased risk of gastrointestinal bleeding' },
    { name: 'warfarin', severity: 'severe', description: 'Increased risk of bleeding' },
  ],
  'metformin': [
    { name: 'contrast dye', severity: 'moderate', description: 'Risk of lactic acidosis' },
    { name: 'alcohol', severity: 'moderate', description: 'Risk of lactic acidosis' },
  ],
  'lisinopril': [
    { name: 'potassium', severity: 'moderate', description: 'Risk of hyperkalemia' },
    { name: 'ibuprofen', severity: 'moderate', description: 'Reduced effectiveness' },
  ],
};

export default function InteractionsPage() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactions, setInteractions] = useState<any[]>([]);

  useEffect(() => {
    if (user?.uid) {
      loadMedicines();
    }
  }, [user]);

  const loadMedicines = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const data = await medicineService.getUserMedicines(user.uid);
      setMedicines(data);
      checkInteractions(data);
    } catch (error) {
      console.error('Failed to load medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkInteractions = (medicinesList: Medicine[]) => {
    const foundInteractions: any[] = [];
    
    for (let i = 0; i < medicinesList.length; i++) {
      for (let j = i + 1; j < medicinesList.length; j++) {
        const med1 = medicinesList[i].name.toLowerCase();
        const med2 = medicinesList[j].name.toLowerCase();

        // Check database for interactions
        if (drugInteractionsDatabase[med1]) {
          const interaction = drugInteractionsDatabase[med1].find(
            (inter) => inter.name === med2
          );
          if (interaction) {
            foundInteractions.push({
              medicine1: medicinesList[i].name,
              medicine2: medicinesList[j].name,
              severity: interaction.severity,
              description: interaction.description,
            });
          }
        }

        if (drugInteractionsDatabase[med2]) {
          const interaction = drugInteractionsDatabase[med2].find(
            (inter) => inter.name === med1
          );
          if (interaction) {
            foundInteractions.push({
              medicine1: medicinesList[j].name,
              medicine2: medicinesList[i].name,
              severity: interaction.severity,
              description: interaction.description,
            });
          }
        }
      }
    }

    setInteractions(foundInteractions);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  const getSeverityColor = (severity: 'low' | 'moderate' | 'severe') => {
    switch (severity) {
      case 'severe':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900';
      case 'moderate':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900';
      case 'low':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900';
    }
  };

  const getSeverityTextColor = (severity: 'low' | 'moderate' | 'severe') => {
    switch (severity) {
      case 'severe':
        return 'text-red-600';
      case 'moderate':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Drug Interactions</h1>
        <p className="text-muted-foreground mt-1">Check for potential interactions between your medicines</p>
      </div>

      {medicines.length < 2 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Add at least 2 medicines</h3>
            <p className="text-muted-foreground">
              You need to add at least 2 medicines to check for interactions
            </p>
          </CardContent>
        </Card>
      ) : interactions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
              <CardContent className="p-6 text-center">
                <div className="text-green-600 font-semibold">No interactions detected</div>
                <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                  Your current medicines appear to be compatible
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interactions.map((interaction, idx) => (
            <Card key={idx} className={`border-2 ${getSeverityColor(interaction.severity)}`}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className={`w-6 h-6 ${getSeverityTextColor(interaction.severity)}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {interaction.medicine1} + {interaction.medicine2}
                    </h3>
                    <p className={`text-sm font-medium mt-1 ${getSeverityTextColor(interaction.severity)}`}>
                      {interaction.severity.toUpperCase()} Severity
                    </p>
                    <p className="text-sm text-foreground mt-2">
                      {interaction.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Your Medicines List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Medicines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {medicines.map((medicine) => (
              <div key={medicine.id} className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{medicine.name}</p>
                <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
