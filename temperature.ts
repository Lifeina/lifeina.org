export const lifeinaboxName = 'LifeinaBox'
export const lifeinaboxService = '0000fee9-0000-1000-8000-00805f9b34fb'
export const lifeinaboxCharacteristicNotify =
  'd44bc439-abfd-45a2-b575-925416129601'
export const lifeinaboxCharacteristic = 'd44bc439-abfd-45a2-b575-925416129600'
export const lastTemperatureBuffer = new Uint8Array([0xaa, 0x8f, 0x01, 0x55])
export const lastBatteryBuffer = new Uint8Array([0xaa, 0x8e, 0xff, 0x55])
export const pollInterval = 1000

export const bluetoothIsNotAvailableMessage =
  'This browser is not compatible with Bluetooth'

export const bluetoothAvailableMessage =
  'This browser is compatible with Bluetooth'

export const celciusToFahrenheit = (temperature: number) => {
  return Math.round((temperature * 9) / 5 + 32)
}

export async function getNavigatorBluetoothAvailability(): Promise<string> {
  try {
    const isBluetoothAvailable = await navigator.bluetooth.getAvailability()
    return isBluetoothAvailable
      ? bluetoothAvailableMessage
      : bluetoothIsNotAvailableMessage
  } catch (err) {
    return bluetoothIsNotAvailableMessage
  }
}