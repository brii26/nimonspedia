import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card.js';
import Button from '../components/ui/Button.js';
import Spinner from '../components/ui/Spinner.js';
import { useAuth } from '../../context/AuthContext.js';

interface PaymentTransaction {
    transaction_id: number;
    user_id: number;
    amount: string;
    status: 'pending' | 'success' | 'failed' | 'expired';
    payment_type: 'topup' | 'order_payment';
    order_id?: number;
}

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const externalId = searchParams.get('external_id');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'expired'>('loading');
    const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return; // Wait for auth to load

        if (!externalId) {
            setErrorMessage('Invalid Payment URL: Missing External ID');
            setStatus('failed');
            return;
        }

        let intervalId: NodeJS.Timeout | undefined;

        const checkStatus = async () => {
            if (['success', 'failed', 'expired'].includes(status)) {
                if (intervalId) clearInterval(intervalId);
                return;
            }

            try {
                const response = await fetch(`/api/node/payment/status/${externalId}`);
                
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        console.error("Access Denied: Not logged in or unauthorized to view this transaction.");
                        setErrorMessage("You are not authorized to view this payment status or your session has expired.");
                        setStatus('failed');
                        window.location.href = '/';
                        return;
                    }
                    if (response.status === 404) {
                        console.log('Transaction not found yet (404), continuing to poll...');
                        return;
                    }
                    throw new Error(`Failed to fetch payment status: ${response.statusText}`);
                }

                const result = await response.json();
                if (result.success && result.data) {
                    const tx = result.data as PaymentTransaction;
                    
                    // Security Check: Ensure transaction belongs to logged-in user
                    // user.id from AuthContext might be string or number, tx.user_id is number
                    if (!user || Number(user.id) !== tx.user_id) {
                         console.error(`Transaction owner mismatch. Current User ID: ${user?.id}, Transaction User ID: ${tx.user_id}`);
                         setErrorMessage("This payment status does not belong to your account.");
                         setStatus('failed');
                         window.location.href = '/'; // Hard redirect for security mismatch
                         return;
                    }

                    setTransaction(tx);

                    if (tx.status === 'success') {
                        setStatus('success');
                        if (intervalId) clearInterval(intervalId); // Stop polling
                    } else if (tx.status === 'failed') {
                        setStatus('failed');
                        if (intervalId) clearInterval(intervalId); // Stop polling
                    } else if (tx.status === 'expired') {
                        setStatus('expired');
                        if (intervalId) clearInterval(intervalId); // Stop polling
                    }
                } else {
                    setErrorMessage(result.message || 'An unknown error occurred.');
                    setStatus('failed');
                    if (intervalId) clearInterval(intervalId);
                }
            } catch (err: any) {
                console.error('Error checking status:', err);
                setErrorMessage(err.message || 'Network error occurred while checking status.');
                setStatus('failed');
                if (intervalId) clearInterval(intervalId);
            }
        };

        checkStatus();
        intervalId = setInterval(checkStatus, 3000);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [externalId, status, user, authLoading, navigate]); 

    const handleContinue = () => {
        if (transaction?.payment_type === 'order_payment' && transaction.order_id) {
            window.location.href = `/orders?id=${transaction.order_id}`;
        } else {
            window.location.href = '/profile';
        }
    };

    if (authLoading) {
         return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Spinner size="lg" />
            </div>
         );
    }
    
    if (!isAuthenticated && !externalId) {
        window.location.href = '/';
        return null;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle>Payment Status</CardTitle>
                </CardHeader>
                <CardBody className="space-y-6">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Spinner size="lg" className="mb-4" />
                            <p className="text-gray-600">Verifying your payment...</p>
                            <p className="text-sm text-gray-400">Please do not close this window.</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">✅</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
                            <p className="text-gray-600 mb-6">
                                Your transaction has been processed successfully.
                                {transaction?.amount && ` Amount: Rp ${parseInt(transaction.amount).toLocaleString('id-ID')}`}
                            </p>
                            <Button onClick={handleContinue} className="w-full">
                                Continue
                            </Button>
                        </div>
                    )}

                    {(status === 'failed' || status === 'expired') && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-3xl">❌</span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment {status === 'expired' ? 'Expired' : 'Failed'}</h3>
                            <p className="text-gray-600 mb-6">
                                {errorMessage || "We couldn't process your payment. Please try again."}
                            </p>
                            <Button onClick={handleContinue} variant="ghost" className="w-full">
                                Return to Dashboard
                            </Button>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default PaymentStatus;