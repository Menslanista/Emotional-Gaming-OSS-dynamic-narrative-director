/**
 * Represents a single EEG sample.
 * @property {number} timestamp - The time the sample was received.
 * @property {number[]} channels - The EEG channel data.
 * @property {DataView} raw - The raw data from the device.
 * @property {number} [sequence] - The sequence number of the sample.
 */
export type EEGSample = {
  timestamp: number;
  channels: number[];
  raw: DataView;
  sequence?: number;
};

/**
 * Configuration for the MuseConnector.
 * @property {string} [deviceNamePrefix] - The prefix of the device name to filter by.
 * @property {BluetoothServiceUUID} [serviceUUID] - The UUID of the Bluetooth service.
 * @property {BluetoothCharacteristicUUID[]} [eegCharacteristicUUIDs] - The UUIDs of the EEG characteristics.
 * @property {boolean} [enableMock] - Whether to enable the mock stream.
 * @property {number} [mockSampleRate] - The sample rate of the mock stream in Hz.
 * @property {number} [mockChannels] - The number of channels for the mock stream.
 */
export interface MuseConnectorConfig {
  deviceNamePrefix?: string;
  serviceUUID?: BluetoothServiceUUID;
  eegCharacteristicUUIDs?: BluetoothCharacteristicUUID[];
  enableMock?: boolean;
  mockSampleRate?: number; // Hz
  mockChannels?: number; // number of EEG channels to emit
}

/**
 * A class for connecting to and streaming data from a Muse EEG device.
 */
export class MuseConnector {
  private config: Required<MuseConnectorConfig>;
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristics: BluetoothRemoteGATTCharacteristic[] = [];
  private listeners: Set<(sample: EEGSample) => void> = new Set();
  private mockTimer: number | null = null;
  private mockSequence = 0;

  /**
   * Creates an instance of MuseConnector.
   * @param {MuseConnectorConfig} [config] - The configuration for the connector.
   */
  constructor(config?: MuseConnectorConfig) {
    const defaults: Required<MuseConnectorConfig> = {
      deviceNamePrefix: 'Muse',
      serviceUUID: undefined as unknown as BluetoothServiceUUID,
      eegCharacteristicUUIDs: [],
      enableMock: false,
      mockSampleRate: 256,
      mockChannels: 4,
    };
    this.config = { ...defaults, ...(config || {}) };
  }

  /**
   * Checks if Web Bluetooth is available in the current environment.
   * @returns {boolean} Whether Web Bluetooth is available.
   */
  static isAvailable(): boolean {
    // Web Bluetooth is only available in secure contexts and certain browsers
    return typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;
  }

  /**
   * Registers a handler for EEG samples.
   * @param {(sample: EEGSample) => void} handler - The handler to register.
   */
  onSample(handler: (sample: EEGSample) => void): void {
    this.listeners.add(handler);
  }

  /**
   * Unregisters a handler for EEG samples.
   * @param {(sample: EEGSample) => void} handler - The handler to unregister.
   */
  offSample(handler: (sample: EEGSample) => void): void {
    this.listeners.delete(handler);
  }

  /**
   * Emits an EEG sample to all registered listeners.
   * @param {EEGSample} sample - The sample to emit.
   */
  private emit(sample: EEGSample): void {
    for (const handler of this.listeners) handler(sample);
  }

  /**
   * Requests a device and connects to it.
   * @returns {Promise<void>}
   */
  async requestAndConnect(): Promise<void> {
    if (!MuseConnector.isAvailable()) {
      if (this.config.enableMock) {
        this.startMockStream();
        return;
      }
      throw new Error('Web Bluetooth is not available in this environment.');
    }

    const filters = this.config.deviceNamePrefix
      ? [{ namePrefix: this.config.deviceNamePrefix }]
      : undefined;

    const device = await (navigator as any).bluetooth.requestDevice({
      filters,
      acceptAllDevices: !filters,
      optionalServices: this.config.serviceUUID ? [this.config.serviceUUID] : [],
    });

    this.device = device as BluetoothDevice;
    this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);
    await this.connectGatt();
  }

  private async connectGatt(): Promise<void> {
    if (!this.device) throw new Error('No device selected');
    if (!this.device.gatt) throw new Error('GATT not supported on this device');

    this.server = await this.device.gatt.connect();

    if (!this.config.serviceUUID) {
      // Service UUID must be provided to subscribe to characteristics
      throw new Error('Missing serviceUUID in MuseConnector configuration');
    }

    const service = await this.server.getPrimaryService(this.config.serviceUUID);

    this.characteristics = [];
    for (const uuid of this.config.eegCharacteristicUUIDs) {
      const characteristic = await service.getCharacteristic(uuid);
      await characteristic.startNotifications();
      characteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleNotification as EventListener,
      );
      this.characteristics.push(characteristic);
    }
  }

  private handleNotification = (event: Event): void => {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    if (!value) return;
    const dv = value as DataView;
    const sample = this.parseEEG(dv);
    this.emit(sample);
  };

  /**
   * Handles the disconnection of the GATT server.
   */
  private handleDisconnect = (): void => {
    this.server = null;
    this.characteristics = [];
  };

  /**
   * Disconnects from the device.
   * @returns {Promise<void>}
   */
  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristics = [];
    this.stopMockStream();
  }

  // Naive parser: interpret DataView as little-endian int16 samples and scale to microvolts
  private parseEEG(dv: DataView): EEGSample {
    const length = Math.floor(dv.byteLength / 2);
    const channels: number[] = new Array(length);
    for (let i = 0; i < length; i++) {
      const v = dv.getInt16(i * 2, true);
      channels[i] = v * 0.1; // placeholder scaling
    }
    return {
      timestamp: Date.now(),
      channels,
      raw: dv,
      sequence: this.mockSequence++,
    };
  }

  /**
   * Starts a mock stream of EEG data.
   */
  // Mock stream for non-browser/testing environments
  startMockStream(): void {
    if (this.mockTimer !== null) return;
    const rate = this.config.mockSampleRate;
    const intervalMs = Math.max(1, Math.round(1000 / rate));
    const channels = this.config.mockChannels;
    let t = 0;

    this.mockTimer = (setInterval(() => {
      const arr = new Int16Array(channels);
      for (let c = 0; c < channels; c++) {
        const freq = 10 + c * 5; // alpha/beta-ish
        const amp = 100 + c * 10;
        arr[c] = Math.round(amp * Math.sin(2 * Math.PI * freq * (t / rate)));
      }
      t++;
      const dv = new DataView(arr.buffer);
      const sample = this.parseEEG(dv);
      this.emit(sample);
    }, intervalMs) as unknown) as number;
  }

  /**
   * Stops the mock stream of EEG data.
   */
  stopMockStream(): void {
    if (this.mockTimer !== null) {
      clearInterval(this.mockTimer as any);
      this.mockTimer = null;
    }
  }
}