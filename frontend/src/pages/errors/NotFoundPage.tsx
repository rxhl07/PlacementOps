import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-surface-background flex flex-col items-center justify-center p-4">
            <div className="bg-white border border-surface-border rounded-xl p-8 max-w-md w-full shadow-subtle text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                    <FileQuestion className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">404 - Page Not Found</h1>
                    <p className="text-xs text-slate-500 mt-1">
                        The requested operational route does not exist or has been moved.
                    </p>
                </div>
                <Button icon={ArrowLeft} onClick={() => navigate('/dashboard')} className="w-full">
                    Return to Dashboard
                </Button>
            </div>
        </div>
    );
};