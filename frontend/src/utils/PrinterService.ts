export class PrinterService {
  device: any = null;
  server: any = null;
  characteristic: any = null;

  async connectBluetooth() {
    try {
      const nav: any = navigator;
      if (!nav.bluetooth) {
        throw new Error("Web Bluetooth API is not supported in this browser.");
      }

      this.device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2']
      });

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      this.characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      
      return true;
    } catch (err: any) {
      console.error("Bluetooth Connection Error:", err);
      throw err;
    }
  }

  async connectUSB() {
    try {
      const nav: any = navigator;
      if (!nav.serial) {
        throw new Error("Web Serial API is not supported in this browser.");
      }
      
      const port = await nav.serial.requestPort();
      await port.open({ baudRate: 9600 });
      this.device = port;
      
      return true;
    } catch (err: any) {
      console.error("USB Connection Error:", err);
      throw err;
    }
  }

  async printReceipt(billText: string, type: 'bluetooth' | 'usb') {
    try {
      const encoder = new TextEncoder();
      // ESC/POS commands for basic text and cut
      const ESC_INIT = new Uint8Array([0x1b, 0x40]); // Initialize
      const GS_CUT = new Uint8Array([0x1d, 0x56, 0x00]); // Cut paper
      
      const textData = encoder.encode(billText + '\n\n\n\n');
      
      const printData = new Uint8Array(ESC_INIT.length + textData.length + GS_CUT.length);
      printData.set(ESC_INIT, 0);
      printData.set(textData, ESC_INIT.length);
      printData.set(GS_CUT, ESC_INIT.length + textData.length);
      
      if (type === 'bluetooth') {
        if (!this.characteristic) throw new Error("Printer not connected");
        const CHUNK_SIZE = 512;
        for (let i = 0; i < printData.length; i += CHUNK_SIZE) {
          const chunk = printData.slice(i, i + CHUNK_SIZE);
          await this.characteristic.writeValue(chunk);
        }
      } else if (type === 'usb') {
        if (!this.device) throw new Error("Printer not connected");
        const writer = this.device.writable.getWriter();
        await writer.write(printData);
        writer.releaseLock();
      }
      return true;
    } catch (err: any) {
      console.error("Print Error:", err);
      throw err;
    }
  }
}

export const printerService = new PrinterService();
