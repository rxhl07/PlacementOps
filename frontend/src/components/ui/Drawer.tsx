import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-[2px] flex justify-end">
            <div className="bg-white border-l border-surface-border w-full max-w-md h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
                <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between shrink-0">
                    <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5 flex-1 overflow-y-auto space-y-4">{children}</div>
            </div>
        </div>
    );
};