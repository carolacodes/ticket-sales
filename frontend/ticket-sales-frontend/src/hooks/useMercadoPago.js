import { useEffect, useState } from "react";
import {
  getMercadoPagoStatusRequest,
  connectMercadoPagoRequest,
} from "@/api/payments.api";

export function useMercadoPago() {
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  async function loadStatus() {
    try {
      setLoading(true);
      const r = await getMercadoPagoStatusRequest();
      setConnected(r.data?.connected);
    } catch (err) {
      console.log("MP_STATUS_ERR", err);
    } finally {
      setLoading(false);
    }
  }

  async function connect() {
    try {
      const r = await connectMercadoPagoRequest();
      window.location.href = r.data.authUrl;
    } catch (err) {
      console.log("MP_CONNECT_ERR", err);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return {
    loading,
    connected,
    connect,
    reload: loadStatus,
  };
}