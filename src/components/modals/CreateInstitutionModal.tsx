
import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2 } from 'lucide-react';

interface CreateInstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateInstitutionModal: React.FC<CreateInstitutionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { contractService } = useWallet();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    treasury: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractService) return;

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Institution name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.treasury.trim()) {
      toast({
        title: "Error", 
        description: "Treasury address is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contractService.daftarInstitusi(formData.name, formData.treasury);
      
      toast({
        title: "Transaction Submitted",
        description: "Creating institution...",
      });

      await tx.wait();
      
      toast({
        title: "Success!",
        description: "Institution created successfully",
      });

      setFormData({ name: '', treasury: '' });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating institution:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create institution",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Create New Institution
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Institution Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter institution name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treasury">Treasury Address</Label>
            <Input
              id="treasury"
              value={formData.treasury}
              onChange={(e) => handleInputChange('treasury', e.target.value)}
              placeholder="0x..."
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Address where institution funds will be managed
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Institution'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInstitutionModal;
