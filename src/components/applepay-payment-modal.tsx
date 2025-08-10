import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ApplePayPaymentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  currency: string;
  symbol: string;
  onPaymentSuccess: () => void;
}

const ApplePayPaymentModal: React.FC<ApplePayPaymentModalProps> = ({ isOpen, onOpenChange, amount, currency, symbol, onPaymentSuccess }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <div className="flex flex-col items-center justify-center p-6">
          <img
            src="/apple-pay.png"
            alt="Apple Pay"
            width={120}
            height={48}
            className="mb-4"
          />
          <h2 className="text-2xl font-bold mb-2">Confirmar pagamento com Apple Pay</h2>
          <p className="mb-4 text-lg">Valor: <span className="font-bold">{symbol} {amount.toFixed(2)} {currency}</span></p>
          <Button className="w-full" onClick={() => { onPaymentSuccess(); onOpenChange(false); }}>
            Confirmar pagamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplePayPaymentModal;
