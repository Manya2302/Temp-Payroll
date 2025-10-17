import React, { useEffect } from "react";

export default function PayPalButton({
  loanId,
  onSuccess,
  onError,
  onCancel
}) {
  const createOrder = async () => {
    const response = await fetch(`/api/loans/${loanId}/paypal-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const output = await response.json();
    return { orderId: output.id };
  };

  const captureOrder = async (orderId) => {
    const response = await fetch(`/api/loans/${loanId}/paypal-capture/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    const data = await response.json();

    return data;
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
        // First fetch setup to get clientToken and mode so we load the correct SDK domain
        console.log('[paypal] fetching /api/paypal/setup');
        const setupResp = await fetch('/api/paypal/setup', { credentials: 'include' });
        const setup = await setupResp.json().catch(e => {
          console.error('[paypal] failed to parse /api/paypal/setup response', e, setupResp);
          throw e;
        });

        const clientToken = setup?.clientToken;
        const mode = (setup?.mode || 'sandbox').toLowerCase();

        console.log('[paypal] setup received', { mode, hasClientToken: !!clientToken });

        const sdkUrl = mode === 'production'
          ? 'https://www.paypal.com/web-sdk/v6/core'
          : 'https://www.sandbox.paypal.com/web-sdk/v6/core';

        if (!clientToken) {
          throw new Error('[paypal] Missing client token from /api/paypal/setup');
        }

        if (!window.paypal) {
          console.log('[paypal] injecting SDK script', sdkUrl);
          const script = document.createElement('script');
          script.src = sdkUrl;
          script.async = true;
          script.onload = () => {
            console.log('[paypal] SDK script loaded');
            initPayPal(clientToken).catch(err => console.error('[paypal] initPayPal error after script load', err));
          };
          script.onerror = (err) => {
            console.error('[paypal] SDK script failed to load', err);
            if (onError) onError(err);
          };
          document.body.appendChild(script);
        } else {
          console.log('[paypal] window.paypal already present, initializing');
          await initPayPal(clientToken);
        }
      } catch (e) {
        console.error('[paypal] Failed to load PayPal SDK/setup', e);
        if (onError) onError(e);
      }
    };

    loadPayPalSDK();
  }, []);

  const initPayPal = async (clientToken) => {
    try {
      if (!clientToken) {
        throw new Error('Missing client token for PayPal initialization');
      }

      console.log('[paypal] creating SDK instance');
      let sdkInstance;
      try {
        sdkInstance = await window.paypal.createInstance({
          clientToken,
          components: ['paypal-payments'],
        });
      } catch (err) {
        console.error('[paypal] window.paypal.createInstance failed', err);
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
        console.error('[paypal] createPayPalOneTimePaymentSession failed', err);
        throw err;
      }

      const onClick = async () => {
        try {
          console.log('[paypal] button clicked - starting checkout');
          const checkoutOptionsPromise = createOrder();
          try {
            await paypalCheckout.start(
              { paymentFlow: "auto" },
              checkoutOptionsPromise,
            );
          } catch (err) {
            console.error('[paypal] paypalCheckout.start failed', err);
            throw err;
          }
        } catch (e) {
          console.error(e);
          if (onError) {
            onError(e);
          }
        }
      };

      const paypalButton = document.getElementById("paypal-button");

      if (paypalButton) {
        paypalButton.addEventListener("click", onClick);
      }

      return () => {
        if (paypalButton) {
          paypalButton.removeEventListener("click", onClick);
        }
      };
    } catch (e) {
      console.error(e);
      if (onError) {
        onError(e);
      }
    }
  };

  return (
    <paypal-button id="paypal-button" style={{ cursor: 'pointer' }}>
      Pay with PayPal
    </paypal-button>
  );
}
