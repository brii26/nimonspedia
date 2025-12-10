import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardBody } from '../components/ui/Card.js'; // Fixed import: Added CardBody
import Button from '../components/ui/Button.js';
import Spinner from '../components/ui/Spinner.js';

interface PaymentTransaction {
    transaction_id: number;
    amount: string;
    status: 'pending' | 'success' | 'failed' | 'expired';
    payment_type: 'topup' | 'order_payment';
    order_id?: number;
}

const PaymentStatus = () => {
    const [searchParams] = useSearchParams();
    const externalId = searchParams.get('external_id');
    
    const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'expired'>('loading');
    const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!externalId) {
            setError('Invalid Payment URL: Missing External ID');
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
                    if (response.status === 404) {
                        console.log('Transaction not found yet, continuing to poll...');
                        return;
                    }
                    throw new Error('Failed to fetch payment status');
                }

                const result = await response.json();
                if (result.success && result.data) {
                    const tx = result.data as PaymentTransaction;
                    setTransaction(tx);

                    if (tx.status === 'success') {
                        setStatus('success');
                        if (intervalId) clearInterval(intervalId);
                    } else if (tx.status === 'failed') {
                        setStatus('failed');
                        if (intervalId) clearInterval(intervalId);
                    } else if (tx.status === 'expired') {
                        setStatus('expired');
                        if (intervalId) clearInterval(intervalId);
                    }
                } else {
                    setError(result.message || 'An unknown error occurred.');
                    setStatus('failed');
                    if (intervalId) clearInterval(intervalId);
                }
            } catch (err: any) {
                console.error('Error checking status:', err);
                setError(err.message || 'Network error.');
                setStatus('failed');
                if (intervalId) clearInterval(intervalId);
            }
        };

        checkStatus();
        intervalId = setInterval(checkStatus, 3000);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [externalId, status]);

    const handleContinue = () => {
        if (transaction?.payment_type === 'order_payment' && transaction.order_id) {
            window.location.href = `/orders?id=${transaction.order_id}`;
        } else {
            window.location.href = '/profile';
        }
    };

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
                                {error || "We couldn't process your payment. Please try again."}
                            </p>
                            <Button onClick={handleContinue} variant="ghost" className="w-full"> {/* Changed variant to "ghost" */}
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