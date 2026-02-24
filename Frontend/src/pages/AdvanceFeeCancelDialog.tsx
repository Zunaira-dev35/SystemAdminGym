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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  cancelAdvanceFeePaymentAsyncThunk,
  payAdvanceFeeCollectionAsyncThunk,
} from "@/redux/pagesSlices/feeCollectionSlice";
import { getBanksAsyncThunk } from "@/redux/pagesSlices/financeSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function AdvanceFeeCancelDialog({
  open,
  onClose,
  collection,
  //   onConfirmCancel,
  onReasonChange,
  reason,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  collection: any;
  //   onConfirmCancel: () => void;
  onReasonChange: (reason: string) => void;
  reason: string;
  loading: boolean;
}) {
  const [depositMethod, setDepositMethod] = useState("");
  const dispatch = useDispatch();
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  const [errors, setErrors] = useState("");


  const { user } = useSelector((state: any) => state.auth);

  const handleConfirmCancel = async () => {
console.log("123")

    if (!collection) return;
console.log("1234")
    try {
      const formData = new FormData();
      formData.append("refund_method", depositMethod);
      formData.append("advance_payment_id", collection.id);
      if (depositMethod === "bank") {
        if (!selectedBankId) {
          setErrors("Please select a bank account for bank transfer");
          return;
        } else formData.append("bank_id", selectedBankId);
      }
      await dispatch(cancelAdvanceFeePaymentAsyncThunk(formData)).unwrap();

      toast({ title: "Cancel Advance Fee successfully" });
      //   setSelectedCollectionForPayment(null);
      setSelectedBankId("");
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.errors ||
          error.message ||
          "Failed to Cancel Advance Fee",
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    // if (hasPermission(PERMISSIONS.BANK_VIEW)) { // optional: add permission check
    dispatch(
      getBanksAsyncThunk({
        disable_page_param: 1,
        filter_branch_id: user?.logged_branch?.id,
      }),
    )
      .unwrap()
      .then((response: any) => {
        console.log("response?.data", response?.data);
        setBanks(response?.data || []); // adjust according to your API response structure
      })
      .catch((err) => {
        console.error("Failed to load banks:", err);
        toast({
          title: "Error",
          description: err.response.data.errors || "Failed to load bank list",
          variant: "destructive",
        });
      });
    // }
  }, [dispatch, user?.logged_branch?.id]);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Advance Fee</DialogTitle>
          <DialogDescription>
            Cancel advance fee collection for {collection?.user?.name} (ID:{" "}
            {collection?.user?.reference_num}).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Deposit Method</Label>
            <Select value={depositMethod} onValueChange={setDepositMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
            {/* Bank selection - only shown when Bank Transfer is selected */}
            {depositMethod === "bank" && (
              <div className="space-y-2 mt-6 animate-fade-in">
                <Label className="flex items-center gap-2">
                  {/* <Building2 className="h-4 w-4" /> */}
                  Select Bank
                  <span className="text-red-500">*</span>
                </Label>

                {banks.length > 0 ? (
                  <Select
                    value={selectedBankId}
                    onValueChange={setSelectedBankId}
                    required
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose bank account" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank: any) => (
                        <SelectItem key={bank.id} value={bank.id.toString()}>
                          {bank.reference_num}
                          {bank.name && ` - ${bank.name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                    No bank accounts found for this branch
                  </div>
                )}
              </div>
            )}
          </div>
          
          {
            errors && <p className="text-red-500 text-sm mt-2">{errors}</p>
          }
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmCancel} disabled={loading}>
            {loading ? "Canceling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
