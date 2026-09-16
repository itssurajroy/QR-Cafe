// Copyright (c) 2026 QRslice. All rights reserved.

/**
 * Web Bluetooth thermal printer interface.
 * Connects to ESC/POS thermal printers via Bluetooth GATT.
 */

// Web Bluetooth API types (not in standard lib.dom.d.ts)
interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTService {
  uuid: string;
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

interface BluetoothRemoteGATTCharacteristic {
  uuid: string;
  properties: {
    read: boolean;
    write: boolean;
    writeWithoutResponse: boolean;
    notify: boolean;
  };
  maxWriteLength: number;
  writeValue(value: BufferSource): Promise<void>;
}

interface Navigator {
  bluetooth?: {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  };
}

interface BluetoothDevice {
  id: string;
  name: string;
  gatt?: BluetoothRemoteGATTServer;
}

interface RequestDeviceOptions {
  acceptAllDevices?: boolean;
  optionalServices?: string[];
}

export interface BluetoothPrinterDevice {
  id: string;
  name: string;
  gatt?: BluetoothRemoteGATTServer;
  service?: BluetoothRemoteGATTService;
  characteristic?: BluetoothRemoteGATTCharacteristic;
}

export interface PrinterCapabilities {
  paperWidth: "58mm" | "80mm";
  supportsQR: boolean;
  supportsBarcode: boolean;
  supportsImage: boolean;
  maxChunkSize: number;
}

const ESCPOS_SERVICE_UUID = "000018f0-0000-1000-8000-00805f9b34fb"; // Generic ESC/POS service
const ESCPOS_WRITE_UUID = "00002af1-0000-1000-8000-00805f9b34fb"; // Write characteristic

// Common thermal printer service UUIDs
const KNOWN_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Generic
  "0000fff0-0000-1000-8000-00805f9b34fb", // Common (RFStar, etc.)
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // iOS/Star
  "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10 / BLE modules
  "000018f0-0000-1000-8000-00805f9b34fb", // ESC/POS standard
];

export class BluetoothPrinter {
  private device: BluetoothPrinterDevice | null = null;
  private capabilities: PrinterCapabilities = {
    paperWidth: "80mm",
    supportsQR: true,
    supportsBarcode: true,
    supportsImage: false,
    maxChunkSize: 20,
  };
  private onStatusChange: ((status: string) => void) | null = null;

  setStatusCallback(cb: ((status: string) => void) | null): this {
    this.onStatusChange = cb;
    return this;
  }

  private notify(status: string) {
    this.onStatusChange?.(status);
  }

  async requestDevice(): Promise<BluetoothPrinterDevice> {
    this.notify("Requesting Bluetooth device...");

    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth API not supported. Use Chrome/Edge on Android or ChromeOS.");
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_SERVICES,
      });

      this.device = {
        id: device.id,
        name: device.name || "Unknown Printer",
        gatt: device.gatt,
      };

      this.notify(`Selected: ${this.device.name}`);
      return this.device;
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotFoundError") {
        throw new Error("No printer selected. Please try again.");
      }
      throw err;
    }
  }

  async connect(): Promise<void> {
    if (!this.device?.gatt) {
      throw new Error("No device selected. Call requestDevice() first.");
    }

    this.notify("Connecting to printer...");

    try {
      const server = await this.device.gatt.connect();
      this.notify("Connected. Discovering services...");

      // Try known services
      let service: BluetoothRemoteGATTService | null = null;
      for (const uuid of KNOWN_SERVICES) {
        try {
          service = await server.getPrimaryService(uuid);
          this.notify(`Found service: ${uuid}`);
          break;
        } catch {
          // Try next
        }
      }

      if (!service) {
        // Fallback: get all services
        const services = await server.getPrimaryServices();
        service = services[0];
        this.notify(`Using fallback service: ${service?.uuid}`);
      }

      if (!service) {
        throw new Error("No compatible service found on printer");
      }

      this.device.service = service;

      // Find write characteristic
      const characteristics = await service.getCharacteristics();
      const writeChar = characteristics.find(
        (c) => c.properties.write || c.properties.writeWithoutResponse
      );

      if (!writeChar) {
        throw new Error("No writable characteristic found");
      }

      this.device.characteristic = writeChar;
      this.capabilities.maxChunkSize = writeChar.maxWriteLength || 20;

      this.notify("Printer ready!");
    } catch (err) {
      this.notify(`Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
      this.notify("Disconnected");
    }
    this.device = null;
  }

  isConnected(): boolean {
    return this.device?.gatt?.connected === true;
  }

  getDeviceName(): string {
    return this.device?.name || "Not connected";
  }

  setPaperWidth(width: "58mm" | "80mm"): this {
    this.capabilities.paperWidth = width;
    return this;
  }

  async print(data: Uint8Array): Promise<void> {
    if (!this.device?.characteristic) {
      throw new Error("Printer not connected");
    }

    this.notify("Sending print data...");

    const chunkSize = Math.min(this.capabilities.maxChunkSize, 180); // Safe chunk size
    const chunks = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    for (let i = 0; i < chunks.length; i++) {
      try {
        await this.device.characteristic.writeValue(chunks[i]);
        // Small delay to prevent buffer overflow
        if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 10));
      } catch (err) {
        throw new Error(`Write failed at chunk ${i + 1}: ${err instanceof Error ? err.message : "Unknown"}`);
      }
    }

    this.notify("Print complete!");
  }

  async printBase64(base64: string): Promise<void> {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    await this.print(bytes);
  }

  async testPrint(): Promise<void> {
    const { generateTestPrint } = await import("./thermal-printer");
    const escpos = generateTestPrint({ paperWidth: this.capabilities.paperWidth });
    await this.print(escpos.build());
  }
}

/**
 * React hook for Bluetooth printer management
 */
import { useState, useCallback, useRef, useEffect } from "react";

export function useBluetoothPrinter() {
  const [printer] = useState(() => new BluetoothPrinter());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    printer.setStatusCallback(setStatus);
    return () => {
      printer.setStatusCallback(null);
    };
  }, [printer]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await printer.requestDevice();
      await printer.connect();
      setIsConnected(true);
      setDeviceName(printer.getDeviceName());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [printer]);

  const disconnect = useCallback(async () => {
    await printer.disconnect();
    setIsConnected(false);
    setDeviceName("");
  }, [printer]);

  const print = useCallback(
    async (data: Uint8Array | string) => {
      if (!isConnected) throw new Error("Printer not connected");
      setError(null);
      try {
        if (typeof data === "string") {
          await printer.printBase64(data);
        } else {
          await printer.print(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Print failed");
        throw err;
      }
    },
    [printer, isConnected]
  );

  const testPrint = useCallback(async () => {
    if (!isConnected) throw new Error("Printer not connected");
    await printer.testPrint();
  }, [printer, isConnected]);

  return {
    connect,
    disconnect,
    print,
    testPrint,
    isConnecting,
    isConnected,
    deviceName,
    status,
    error,
    setPaperWidth: (width: "58mm" | "80mm") => printer.setPaperWidth(width),
  };
}