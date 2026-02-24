import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { emailVerificationAsyncThunk } from '@/redux/pagesSlices/generalSlice';
import { RootState } from '@/redux/store';
import { toast } from '@/hooks/use-toast';

export default function EmailVerification() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const [showResult, setShowResult] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const { loadings, emailVerification } = useSelector((state: RootState) => state.general);
  const isVerifying = loadings.emailVerification;
  // console.log("emailVerification", emailVerification);

  useEffect(() => {
    // const company_email = searchParams.get('company_email');
    // const company_name = searchParams.get('company_name');
    // const package_type = searchParams.get('package_type');
    // const package_id = searchParams.get('package_id');
    // const deposit_method = searchParams.get('deposit_method');
    const token = searchParams.get('token');

    if (!token) {
      setShowResult(true);
      setIsSuccess(false);
      setMessage(emailVerification?.errors || "Verification failed.");
      navigate('/verification-failed', { replace: true });
      return;
    }

    const payload: any = {
      // company_email,
      // company_name,
      // package_type,
      token
    };

    // if (package_id) payload.package_id = package_id;
    // if (deposit_method) payload.deposit_method = deposit_method;

    dispatch(emailVerificationAsyncThunk(payload));
  }, [dispatch, searchParams]);

  useEffect(() => {
    if (isVerifying || !emailVerification || Object.keys(emailVerification).length === 0) {
      return;
    }

    setShowResult(true);

    if (emailVerification?.status === "success") {
      setIsSuccess(true);
      setMessage(emailVerification.message || "Account activated successfully!");
      toast({
        title: "Success!",
        description: emailVerification?.message || "Please Check Your Email",
        variant: "default"
      });

      navigate('/verified-success', { replace: true });
    } else {
      setIsSuccess(false);
      setMessage(
        emailVerification.message ||
        emailVerification?.error ||
        "Verification failed. The link may be invalid or expired."
      );
      navigate('/verification-failed', { replace: true });
    }
  }, [isVerifying, emailVerification]);

  if (isVerifying) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <h2 className="text-lg font-semibold text-gray-900">
          Verifying your email
        </h2>
        <p className="text-sm text-gray-500">
          Please wait, this may take a few seconds.
        </p>
      </div>
    </div>
  );
}


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center">
        {isSuccess ? (
          <div className="space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
            <p className="text-gray-700">{message}</p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="text-red-600 font-medium">{message}</p>
            <p className="text-sm text-gray-500">Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
}