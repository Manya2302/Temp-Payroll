import React, { useEffect } from "react";

export default function PayPalPayrollButton({
  payrollData,
  onSuccess,
  onError,
  onCancel
}) {
  const createOrder = async () => {
    try {
      console.log('[paypal-payroll] Creating order with payroll data:', payrollData);
      const response = await fetch(`/api/payroll/paypal-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payrollData })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[paypal-payroll] Order creation failed:', response.status, errorText);
        throw new Error(`Failed to create order: ${response.status} - ${errorText}`);
      }
      
      const output = await response.json();
      console.log('[paypal-payroll] Order created successfully:', output);
      
      if (!output.id) {
        throw new Error('Order ID missing from response');
      }
      
      return { orderId: output.id };
    } catch (error) {
      console.error('[paypal-payroll] Error in createOrder:', error);
      throw error;
    }
  };

  const captureOrder = async (orderId) => {
    try {
      console.log('[paypal-payroll] Capturing order:', orderId);
      const response = await fetch(`/api/payroll/paypal-capture/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ payrollData })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[paypal-payroll] Order capture failed:', response.status, errorText);
        throw new Error(`Failed to capture order: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[paypal-payroll] Order captured successfully:', data);
      return data;
    } catch (error) {
      console.error('[paypal-payroll] Error in captureOrder:', error);
      throw error;
    }
  };

  const onApprove = async (data) => {
    console.log("onApprove", data);
    const orderData = await captureOrder(data.orderId);
    console.log("Capture result", orderData);
    
    if (onSuccess) {
      onSuccess(orderData);
    }
  };

  const onCancelHandler = async (data) => {
    console.log("onCancel", data);
    if (onCancel) {
      onCancel(data);
    }
  };

  const onErrorHandler = async (data) => {
    console.log("onError", data);
    if (onError) {
      onError(data);
    }
  };

  useEffect(() => {
    const loadPayPalSDK = async () => {
      try {
        console.log('[paypal-payroll] fetching /api/paypal/setup');
        const setupResp = await fetch('/api/paypal/setup', { credentials: 'include' });
        const setup = await setupResp.json().catch(e => {
          console.error('[paypal-payroll] failed to parse /api/paypal/setup response', e, setupResp);
          throw e;
        });

        const clientToken = setup?.clientToken;
        const mode = (setup?.mode || 'sandbox').toLowerCase();

        console.log('[paypal-payroll] setup received', { mode, hasClientToken: !!clientToken });

        const sdkUrl = mode === 'production'
          ? 'https://www.paypal.com/web-sdk/v6/core'
          : 'https://www.sandbox.paypal.com/web-sdk/v6/core';

        if (!clientToken) {
          throw new Error('[paypal-payroll] Missing client token from /api/paypal/setup');
        }

        if (!window.paypal) {
          console.log('[paypal-payroll] injecting SDK script', sdkUrl);
          const script = document.createElement('script');
          script.src = sdkUrl;
          script.async = true;
          script.onload = () => {
            console.log('[paypal-payroll] SDK script loaded');
            initPayPal(clientToken).catch(err => console.error('[paypal-payroll] initPayPal error after script load', err));
          };
          script.onerror = (err) => {
            console.error('[paypal-payroll] SDK script failed to load', err);
            if (onError) onError(err);
          };
          document.body.appendChild(script);
        } else {
          console.log('[paypal-payroll] window.paypal already present, initializing');
          await initPayPal(clientToken);
        }
      } catch (e) {
        console.error('[paypal-payroll] Failed to load PayPal SDK/setup', e);
        if (onError) onError(e);
      }
    };

    loadPayPalSDK();
  }, []);

  const initPayPal = async (clientToken) => {
    try {
      if (!clientToken) {
        throw new Error('[paypal-payroll] Missing client token for PayPal initialization');
      }

      console.log('[paypal-payroll] creating SDK instance');
      let sdkInstance;
      try {
        sdkInstance = await window.paypal.createInstance({
          clientToken,
          components: ['paypal-payments'],
        });
      } catch (err) {
        console.error('[paypal-payroll] window.paypal.createInstance failed', err);
        throw err;
      }

      let paypalCheckout;
      try {
        paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove,
          onCancel: onCancelHandler,
          onError: onErrorHandler,
        });
      } catch (err) {
        console.error('[paypal-payroll] createPayPalOneTimePaymentSession failed', err);
        throw err;
      }

      const onClick = async () => {
        try {
          console.log('[paypal-payroll] button clicked - starting checkout');
          const checkoutOptionsPromise = createOrder();
          try {
            await paypalCheckout.start(
              { paymentFlow: "auto" },
              checkoutOptionsPromise,
            );
          } catch (err) {
            console.error('[paypal-payroll] paypalCheckout.start failed', err);
            throw err;
          }
        } catch (e) {
          console.error('[paypal-payroll] Payment error:', e);
          if (onError) {
            onError(e);
          }
        }
      };

      const paypalButton = document.getElementById("paypal-payroll-button");

      if (paypalButton) {
        paypalButton.addEventListener("click", onClick);
      }

      return () => {
        if (paypalButton) {
          paypalButton.removeEventListener("click", onClick);
        }
      };
    } catch (e) {
      console.error('[paypal-payroll] initPayPal error:', e);
      if (onError) {
        onError(e);
      }
    }
  };

  return (
    <paypal-button id="paypal-payroll-button" style={{ cursor: 'pointer' }}>
      Pay with PayPal
    </paypal-button>
  );
}
