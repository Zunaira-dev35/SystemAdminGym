<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    function notifications(Request $request){
        
        $validator = Validator::make($request->all(), [
            'type' => 'nullable|in:member,employee,payment,others',
        ]);

        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }

        $req = $request->all();
        $filterBranch = $request->query('filter_branch_id');
        $mainBranchId = Branch::where('type','main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;
        $query = Notification::where('user_id',$request->user()->id);
        // Filter by type
        if (isset($req['type'])) {
            $query->where('type', $req['type']);
        }
        if($request->user()->user_type == 'other'){
            $query->when($filterBranch , function($query) use ($filterBranch){
            $query->where('branch_id',$filterBranch);
        })
        ->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
        });

        }
        $disablePageParam = $request->disable_page_param;
        if($disablePageParam && $disablePageParam == 1){
            $notifications = $query->orderBy('id','desc')->get();
        }else{
            $notifications = $query->orderBy('id','desc')->paginate(100);
        }
       
        if (!$notifications)
            return apiError('No notification found', 404);

        return apiSuccess($notifications, 'Notification fetched successfully', 200);
    }

    function markAllNotificationAsRead(Request $request){
        $mainBranchId = Branch::where('type','main')->where('gym_id',$request->logged_gym_id)->first()?->id ?? null;
        Notification::where('user_id', Auth::id())->when(!($request->logged_branch_id == $mainBranchId && $request->user()->type == 'default'),
            function($query) use ($request){
                $query->where('branch_id', $request->logged_branch_id);
        })->whereNull('read_at')->update([
            'read_at' => now(),
            'is_read' => true,
        ]);
        return apiSuccess(null , 'All notifications marked as read', 200);
    }

    public function markNotificationAsRead(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'notification_id' => 'required|exists:notifications,id',
        ]);
        if ($validator->fails()) {
            return apiError('Validation failed', 422, $validator->errors()->first());
        }
        $notification = Notification::findOrFail($request->notification_id);
        if (!$notification->read_at) {
            $notification->update([ 'read_at' => now(), 'is_read' => true, ]);
        }
        return apiSuccess(null , 'Notification marked as read', 200);
    }
}
