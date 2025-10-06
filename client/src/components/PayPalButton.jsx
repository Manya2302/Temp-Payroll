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
        if (!window.paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = () => initPayPal();
          document.body.appendChild(script);
        } else {
          await initPayPal();
        }
      } catch (e) {
        console.error("Failed to load PayPal SDK", e);
      }
    };

    loadPayPalSDK();
  }, []);

  const initPayPal = async () => {
    try {
      const clientToken = await fetch("/api/paypal/setup", {
        credentials: "include"
      })
        .then((res) => res.json())
        .then((data) => {
          return data.clientToken;
        });

      const sdkInstance = await window.paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout =
        sdkInstance.createPayPalOneTimePaymentSession({
          onApprove,
          onCancel: onCancelHandler,
          onError: onErrorHandler,
        });

      const onClick = async () => {
        try {
          const checkoutOptionsPromise = createOrder();
          await paypalCheckout.start(
            { paymentFlow: "auto" },
            checkoutOptionsPromise,
          );
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
