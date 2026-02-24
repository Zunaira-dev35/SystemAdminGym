<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Fee Receipt</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }

        .receipt {
            width: 400px;
            margin: auto;
            background: #fff;
            padding: 20px;
            border: 1px solid #ddd;
        }

        .center {
            text-align: center;
        }

        .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .subtitle {
            font-size: 13px;
            color: #555;
            margin-bottom: 15px;
        }

        .receipt-no {
            font-weight: bold;
            margin: 10px 0;
        }

        .section {
            margin-top: 15px;
        }

        .section-title {
            font-weight: bold;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
            margin-bottom: 8px;
            font-size: 13px;
        }

        .row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-bottom: 5px;
        }



        .row span:first-child {
            color: #555;
            padding-right: 5px;
        }

        .total {
            font-size: 16px;
            font-weight: bold;
            margin-top: 10px;
        }

        .footer {
            text-align: center;
            font-size: 11px;
            color: #666;
            margin-top: 20px;
            border-top: 1px dashed #ddd;
            padding-top: 10px;
        }

        .footer-item {
            margin-bottom: 4px;
        }

        .thankyou {
            text-align: center;
            margin-top: 15px;
            font-size: 13px;
            font-weight: bold;
        }
    </style>
</head>
<body>

<div class="receipt">
    <div class="center">
        <div class="title">{{ $systemSettingCompanyName }}</div>
        <div class="subtitle">Fee Collection Receipt</div>
        <div class="receipt-no">#{{$feeCollection->reference_num}}</div>
    </div>

    <div class="section">
        <div class="section-title">Member Details</div>
        <div class="row"><span class="rowSpan">Name</span><span>{{ $feeCollection->member?->name ?? 'Deleted Member' }}</span></div>
        <div class="row"><span>ID</span><span>{{ $feeCollection->member?->reference_num ?? 'Deleted Member' }}</span></div>
    </div>

    <div class="section">
        <div class="section-title">Receipt Details</div>
        <div class="row"><span>Date</span><span>{{ \Carbon\Carbon::parse($feeCollection->generate_date)->format('d M Y')}}</span></div>
        <div class="row"><span>Time</span><span>{{ \Carbon\Carbon::parse($feeCollection->generate_time)->format('h:i A')}}</span></div>
        <div class="row"><span>Branch</span><span>{{ $feeCollection->branch?->reference_num ?? 'Deleted Branch' }} {{ $feeCollection->branch?->name ?? '' }}</span></div>
    </div>

    <div class="section">
        <div class="section-title">Payment Information</div>
        <div class="row"><span>Plan</span><span>{{ $feeCollection->plan?->reference_num ?? 'Deleted Plan' }} {{ $feeCollection->plan?->name ?? '' }}</span></div>
        <div class="row"><span>Plan Start Date</span><span>{{ \Carbon\Carbon::parse($feeCollection->plan_start_date)->format('d M Y') }}</span></div>
        <div class="row"><span>Method</span><span>{{ strtoupper($feeCollection->deposit_method) }}</span></div>
       @if($feeCollection->deposit_method === 'bank' && $feeCollection->transaction?->bank)
            <div class="section-title">Bank Details</div>
            <div class="row">
                <span>Bank Account Number </span>
                <span>{{ strtoupper($feeCollection->transaction->bank->account_number) }}</span>
            </div>
            <div class="row">
                <span>Bank Account Name </span>
                <span>{{ strtoupper($feeCollection->transaction->bank->name) }}</span>
            </div>
        @endif
        <div class="row total"><span>Total Paid </span><span>{{ $systemSettingCurrency }} {{ $feeCollection->amount }}</span></div>
    </div>

    <div class="section">
        <div class="row"><span>Collected By </span><span>{{ $feeCollection->createdByUser?->name ?? 'Deleted User'}}</span></div>
    </div>

    <div class="thankyou">
        Thank you for your payment!.
    </div>

    <div class="footer">
        <div class="footer-item">Email: {{ $systemSettingCompanyEmail }}</div>
        <div class="footer-item">Phone: {{ $systemSettingCompanyPhone }}</div>
        <div class="footer-item">Powered by snowberrysys.com</div>
    </div>
</div>

</body>
</html>
