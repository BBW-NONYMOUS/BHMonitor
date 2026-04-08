import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Home, MapPin, BedDouble, CheckCircle2, ArrowRight, Sparkles, X } from 'lucide-react';

const ONBOARDING_STEPS = [
    {
        id: 'create-bh',
        title: 'Create Your First Boarding House',
        description: 'Add your boarding house listing with address and location',
        icon: Home,
        link: '/boarding-houses/create',
        linkText: 'Add Boarding House',
    },
    {
        id: 'add-location',
        title: 'Set Location on Map',
        description: 'Mark your exact location so students can find you easily',
        icon: MapPin,
        tip: 'Use the location picker when creating your boarding house',
    },
    {
        id: 'add-rooms',
        title: 'Add Your Rooms',
        description: 'List available rooms with prices and capacity',
        icon: BedDouble,
        tip: 'After creating a boarding house, click "Manage Rooms" to add rooms',
    },
];

export function OwnerOnboarding({ boardingHouses = [], onDismiss }) {
    const { clearNewOwnerFlag } = useAuth();
    
    // Calculate completion based on boarding houses data
    const hasBoardingHouse = boardingHouses.length > 0;
    const hasLocation = boardingHouses.some(bh => bh.latitude && bh.longitude);
    const hasRooms = boardingHouses.some(bh => (bh.total_rooms || 0) > 0);
    
    const completedSteps = [hasBoardingHouse, hasLocation, hasRooms].filter(Boolean).length;
    const progress = Math.round((completedSteps / ONBOARDING_STEPS.length) * 100);
    
    const isStepComplete = (stepId) => {
        switch (stepId) {
            case 'create-bh': return hasBoardingHouse;
            case 'add-location': return hasLocation;
            case 'add-rooms': return hasRooms;
            default: return false;
        }
    };

    const handleDismiss = () => {
        clearNewOwnerFlag();
        if (onDismiss) onDismiss();
    };

    // If all steps complete, show success and auto-dismiss option
    if (completedSteps === ONBOARDING_STEPS.length) {
        return (
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 mb-6">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-green-900">You're All Set! 🎉</h3>
                                <p className="text-sm text-green-700">
                                    Your boarding house is now visible to students on the public map.
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleDismiss}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 mb-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-blue-900">Welcome to Boarders Monitor!</CardTitle>
                            <CardDescription className="text-blue-700">
                                Complete these steps to make your boarding house visible to students
                            </CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-blue-600 hover:text-blue-800">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-blue-800">Setup Progress</span>
                        <span className="text-blue-600">{completedSteps} of {ONBOARDING_STEPS.length} complete</span>
                    </div>
                    <Progress value={progress} className="h-2" indicatorClassName="bg-blue-600" />
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid gap-3">
                    {ONBOARDING_STEPS.map((step, index) => {
                        const StepIcon = step.icon;
                        const complete = isStepComplete(step.id);
                        
                        return (
                            <div 
                                key={step.id}
                                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                                    complete 
                                        ? 'bg-green-100/50 border border-green-200' 
                                        : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                }`}
                            >
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                                    complete ? 'bg-green-100' : 'bg-slate-100'
                                }`}>
                                    {complete ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <StepIcon className="h-5 w-5 text-slate-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                            complete ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            Step {index + 1}
                                        </span>
                                        {complete && <span className="text-xs text-green-600 font-medium">Complete</span>}
                                    </div>
                                    <h4 className={`font-medium mt-1 ${complete ? 'text-green-800' : 'text-slate-900'}`}>
                                        {step.title}
                                    </h4>
                                    <p className={`text-sm mt-0.5 ${complete ? 'text-green-600' : 'text-slate-500'}`}>
                                        {step.description}
                                    </p>
                                    {!complete && step.tip && (
                                        <p className="text-xs text-blue-600 mt-1 italic">
                                            💡 {step.tip}
                                        </p>
                                    )}
                                </div>
                                {!complete && step.link && (
                                    <Link to={step.link}>
                                        <Button size="sm" className="shrink-0">
                                            {step.linkText}
                                            <ArrowRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
