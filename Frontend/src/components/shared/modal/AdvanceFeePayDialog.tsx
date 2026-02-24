import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { payAdvanceFeeCollectionAsyncThunk } from "@/redux/pagesSlices/feeCollectionSlice";
import { useState } from "react";
import { useDispatch } from "react-redux";
export default function AdvanceFeePayDialog({ 
  open, 
  onClose, 
  collection, 
//   onConfirmPayment, 
  loading 
}: {
  open: boolean;
  onClose: () => void;
  collection: any;
//   onConfirmPayment: () => void;
  loading: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const dispatch= useDispatch()
  const handleConfirmPayment = async () => {
    if (!collection ) return;

    try {
      const formData = new FormData();
      formData.append("plan_start_date", selectedDate);
      formData.append("advance_payment_id", collection.id);

      await dispatch(
        payAdvanceFeeCollectionAsyncThunk(
          formData
        )
      ).unwrap();

      toast({ title: "Payment processed successfully" });
    //   setSelectedCollectionForPayment(null);
      setSelectedDate("");
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.errors || error.message || "Failed to process payment",
        variant: "destructive",
      });
    }
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Advance Fee</DialogTitle>
          <DialogDescription>
            Process payment for {collection?.user?.name}'s advance fee of {collection?.amount}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Plan start date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmPayment} disabled={loading}>
            {loading ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}