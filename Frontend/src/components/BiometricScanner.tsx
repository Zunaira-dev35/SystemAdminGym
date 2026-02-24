import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Scan, Fingerprint, CreditCard, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BiometricScannerProps {
  type: 'facial' | 'fingerprint' | 'rfid';
  onClose: () => void;
}

export default function BiometricScanner({ type, onClose }: BiometricScannerProps) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const getIcon = () => {
    switch (type) {
      case 'facial':
        return <Scan className="h-16 w-16" />;
      case 'fingerprint':
        return <Fingerprint className="h-16 w-16" />;
      case 'rfid':
        return <CreditCard className="h-16 w-16" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'facial':
        return 'Facial Recognition Scanner';
      case 'fingerprint':
        return 'Fingerprint Scanner';
      case 'rfid':
        return 'RFID Card Scanner';
    }
  };

  const getInstructions = () => {
    switch (type) {
      case 'facial':
        return 'Position your face within the frame';
      case 'fingerprint':
        return 'Place your finger on the scanner';
      case 'rfid':
        return 'Tap your RFID card on the reader';
    }
  };

  const handleStartScan = () => {
    setStatus('scanning');
    
    setTimeout(() => {
      const success = Math.random() > 0.2;
      if (success) {
        setStatus('success');
        toast({
          title: 'Attendance Marked',
          description: 'Successfully verified and attendance recorded',
        });
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setStatus('error');
        toast({
          title: 'Verification Failed',
          description: 'Unable to verify identity. Please try again.',
          variant: 'destructive',
        });
      }
    }, 2000);
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'scanning':
        return <Loader2 className="h-16 w-16 animate-spin text-chart-2" />;
      case 'success':
        return <CheckCircle2 className="h-16 w-16 text-chart-3" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-chart-5" />;
      default:
        return getIcon();
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'scanning':
        return 'Scanning... Please wait';
      case 'success':
        return 'Verification Successful!';
      case 'error':
        return 'Verification Failed';
      default:
        return getInstructions();
    }
  };

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          <h3 className="text-lg font-semibold">{getTitle()}</h3>
          
          <div className="relative">
            <div className={`rounded-lg border-4 p-12 ${
              status === 'scanning' ? 'border-chart-2 animate-pulse' :
              status === 'success' ? 'border-chart-3' :
              status === 'error' ? 'border-chart-5' :
              'border-dashed border-muted-foreground/30'
            }`}>
              {getStatusIcon()}
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className={`font-medium ${
              status === 'success' ? 'text-chart-3' :
              status === 'error' ? 'text-chart-5' :
              'text-muted-foreground'
            }`}>
              {getStatusMessage()}
            </p>
            {type === 'facial' && status === 'idle' && (
              <p className="text-xs text-muted-foreground">
                Note: This is a placeholder. Connect your camera device to enable scanning.
              </p>
            )}
            {type === 'fingerprint' && status === 'idle' && (
              <p className="text-xs text-muted-foreground">
                Note: This is a placeholder. Connect your fingerprint device to enable scanning.
              </p>
            )}
            {type === 'rfid' && status === 'idle' && (
              <p className="text-xs text-muted-foreground">
                Note: This is a placeholder. Connect your RFID reader to enable scanning.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {status === 'idle' && (
              <>
                <Button onClick={handleStartScan} data-testid="button-start-scan">
                  Start Scan
                </Button>
                <Button variant="outline" onClick={onClose} data-testid="button-cancel-scan">
                  Cancel
                </Button>
              </>
            )}
            {status === 'error' && (
              <>
                <Button onClick={handleStartScan} data-testid="button-retry-scan">
                  Retry
                </Button>
                <Button variant="outline" onClick={onClose} data-testid="button-close-scanner">
                  Close
                </Button>
              </>
            )}
            {status === 'scanning' && (
              <Button variant="outline" onClick={() => setStatus('idle')} data-testid="button-cancel-scanning">
                Cancel Scan
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
