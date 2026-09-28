import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface DeleteConfirmProps {
  title?: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteConfirm: React.FC<DeleteConfirmProps> = ({
  title = 'Confirmer la suppression',
  message = 'Etes-vous sur de vouloir supprimer cet element ? Cette action est irreversible.',
  onClose,
  onConfirm,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-muted hover:bg-border text-foreground font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
          >
            Supprimer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeleteConfirm;
