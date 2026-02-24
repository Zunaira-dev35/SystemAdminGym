<?php

namespace App\Http\Controllers;

use App\Models\Gym;
use App\Models\Invoice;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InvoiceController extends Controller
{
    function invoices(Request $request){
        try{
            $search = trim($request->query('search'));
            $filterStatus = $request->query('filter_payment_status');
            $filterGymId = $request->query('filter_gym_id');
            $filterDepositMethod = $request->query('filter_deposit_method');
            $disablePaginateParam = $request->disable_page_param;
            $invoiceQuery = Invoice::with('gym','package')->when($search , function($query) use ($search){
                $query->where(function($q) use ($search){
                    $q->where('reference_num','like',"%{$search}%")
                    ->orWhereHas('gym',function($gq) use ($search){
                        $gq->where('reference_num','like',"%{$search}%");
                    });
                });
            })->when($filterStatus , function($query) use ($filterStatus){
                $query->where('payment_status' , $filterStatus);
            })->when($filterGymId , function($query) use ($filterGymId){
                $query->where('gym_id' , $filterGymId);
            })->when($filterDepositMethod , function($query) use ($filterDepositMethod){
                $query->where('deposit_method' , $filterDepositMethod);
            }) 
            ->orderBy('id', 'desc');
            if($disablePaginateParam && $disablePaginateParam == 1){
                $invoices = $invoiceQuery->get();
            }else{
                $invoices = $invoiceQuery->paginate($request->limit ?? 10);
            }
            return apiSuccess($invoices , 'Invoices fetched successfully' , 200);
       }catch(Exception $e){
            return apiError('Failed to fetch invoices' , 500 , $e->getMessage());
       }
    }

    function invoiceEdit(Request $request){
        $validator = Validator::make($request->all() , [
            'invoice_id'    =>  'required|exists:invoices,id',
            'discount_percent'  =>  'nullable|numeric|gte:0|lte:100',
            'description'   =>  'nullable|string',
            'deposit_method'    =>  'required|in:cash,card',
            'payment_status'    =>  'required|in:pending,paid'
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $invoice = Invoice::find($request->invoice_id);
            if($invoice->payment_status == 'paid'){
                return apiError('Failed to update invoice' , 422 , 'Paid invoice cannot be updated');
            }
            $grandTotal = $invoice->grand_total;
            $invoiceSubTotal = $invoice->sub_total;
            $discountPercent = $request->discount_percent;
            if($discountPercent && $discountPercent > 0){
                $grandTotal = $invoiceSubTotal - ($invoiceSubTotal * $discountPercent / 100);
                $grandTotal = round($grandTotal, 2);
            }
            $invoice->update(['discount_percent' => $discountPercent ? $discountPercent : 0 , 'grand_total' => $grandTotal , 'desctiption'  =>  $request->description , 'deposit_method'    =>  $request->deposit_method , 'payment_status' =>  $request->payment_status]);
            if($request->payment_status == 'paid'){
                $invoiceGym = Gym::where('invoice_id',$invoice->id)->first();
                if($invoiceGym){
                    $invoiceGymDefaultUser = User::where('gym_id',$invoiceGym->id)->where('type','default')->first();
                    $invoiceGym->update(['status' => 'active']);
                    if($invoiceGymDefaultUser){
                        $invoiceGymDefaultUser->update(['status' => 'active']);
                    }
                }
            }
            return apiSuccess($invoice , 'Invoice updated successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to update invoice' , 500 , $e->getMessage());
        }
    }

    function invoiceView(Request $request){
        $validator = Validator::make($request->all() , [
            'invoice_id'    =>  'required|exists:invoices,id',
        ]);

        if($validator->fails()){
            return apiError('Validation failed' , 422 , $validator->errors()->first());
        }

        try{
            $invoice = Invoice::with('gym','package')->where('id',$request->invoice_id)->first();
            return apiSuccess($invoice , 'Invoice fetched successfully' , 200);
        }catch(Exception $e){
            return apiError('Failed to view invoice' , 500 , $e->getMessage());
        }
    }
}
