import React, { useEffect, useState } from 'react'
import { Note, Fieldset, Button, Divider } from '@geist-ui/core'
import {
  getNavigatorBluetoothAvailability,
  bluetoothAvailableMessage,
  celciusToFahrenheit,
} from './temperature'

const Temperature: React.FC<unknown> = () => {
  const [messageNote, setMessageNote] = useState('')
  const [bluetoothDeviceStatus, setBluetoothDeviceStatus] =
    useState('Not connected')
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice>()
  const [charNotify, setCharNotify] = useState<
    BluetoothRemoteGATTCharacteristic | undefined
  >()
  const [interval, setMyInterval] = useState<number>()
  const [temperatureCelcius, setTemperatureCelcius] = useState<number>(0)
  const [temperatureFahrenheit, setTemperatureFahrenheit] = useState<number>(0)
  const [batteryStatus, setBatteryStatus] = useState<string>('Not available')
  const [batteryValue, setBatteryValue] = useState<number | undefined>()

  let bleDevice: BluetoothDevice
  let characteristicNotify: BluetoothRemoteGATTCharacteristic | undefined

  useEffect(() => {
    async function getBluetoothAvailability() {
      const message = await getNavigatorBluetoothAvailability()
      setMessageNote(message)
    }
    getBluetoothAvailability()
  }, [])

  const type = messageNote === bluetoothAvailableMessage ? 'success' : 'error'
  const disabled = messageNote === bluetoothAvailableMessage ? false : true

  async function handleClickConnect(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault()

    try {
      bleDevice = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'LifeinaBox' }],
        optionalServices: ['0000fee9-0000-1000-8000-00805f9b34fb'],
      })

      bleDevice.addEventListener('gattserverdisconnected', onDisconnected)

      setBluetoothDevice(bleDevice) // async

      const server = await bleDevice?.gatt?.connect()

      server?.connected ? setBluetoothDeviceStatus('Connected') : null

      const service = await server?.getPrimaryService(
        '0000fee9-0000-1000-8000-00805f9b34fb'
      )

      characteristicNotify = await service?.getCharacteristic(
        'd44bc439-abfd-45a2-b575-925416129601'
      )
      await characteristicNotify?.startNotifications()

      characteristicNotify?.addEventListener(
        'characteristicvaluechanged',
        handleNotifications
      )

      setCharNotify(characteristicNotify)

      const characteristic = await service?.getCharacteristic(
        'd44bc439-abfd-45a2-b575-925416129600'
      )

      const myInterval = window.setInterval(async () => {
        await characteristic?.writeValue(
          new Uint8Array([0xaa, 0x8f, 0x01, 0x55])
        )
        await characteristic?.writeValue(
          new Uint8Array([0xaa, 0x8e, 0xff, 0x55])
        )
      }, 1000)

      setMyInterval(myInterval)
    } catch (error) {
      console.log(error)
    }
  }

  function handleClickDisconnect(event: React.MouseEvent<HTMLElement>) {
    event.preventDefault()

    if (!bluetoothDevice) {
      return
    }

    if (bluetoothDevice.gatt?.connected) {
      bluetoothDevice?.removeEventListener(
        'gattserverdisconnected',
        onDisconnected
      )

      charNotify?.removeEventListener(
        'characteristicvaluechanged',
        handleNotifications
      )

      clearInterval(interval)

      bluetoothDevice.gatt.disconnect()

      setBluetoothDeviceStatus('Not connected')
      setBluetoothDevice(undefined)
      setCharNotify(undefined)
      setBatteryStatus('Not available')
      setTemperatureCelcius(0)
      setTemperatureFahrenheit(0)
      setBatteryValue(undefined)
    } else {
      console.log('> Bluetooth Device is already disconnected')
    }
  }

  function onDisconnected() {
    // Object event.target is Bluetooth Device getting disconnected.
  }

  function handleNotifications(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic //cast
    const value = target.value
    const a = []

    // 4 === value.byteLength
    for (let i = 0; i < 4; i++) {
      a.push(('00' + value?.getUint8(i).toString(16)).slice(-2))
    }

    const hexString = a.join('')

    if (hexString.substr(0, 4) === 'aa8f') {
      const hex2dec = parseInt(a[2], 16)
      const celcius = hex2dec / 10

      setTemperatureCelcius(celcius)
      setTemperatureFahrenheit(celciusToFahrenheit(celcius))
    }

    if (hexString.substr(0, 4) === 'aa8e') {
      const binaryBattery = parseInt(a[2], 16).toString(2).padStart(8, '0')

      if (binaryBattery === '10000000') {
        setBatteryStatus('Plugged in main')
      }

      if (binaryBattery < '10000000') {
        setBatteryStatus('Discharging')
        setBatteryValue(
          parseInt(binaryBattery.substr(1), 2) >= 100
            ? 100
            : parseInt(binaryBattery.substr(1), 2)
        )
      }

      if (binaryBattery > '10000000') {
        setBatteryStatus('In Charge')
        setBatteryValue(
          parseInt(binaryBattery.substr(1), 2) >= 100
            ? 100
            : parseInt(binaryBattery.substr(1), 2)
        )
      }
    }
  }

  return (
    <div className="container">
      <Note type={type}>{messageNote}</Note>

      <Fieldset style={{ width: '400px' }}>
        <Divider>Temperature</Divider>
        <Fieldset.Subtitle
          style={{ paddingTop: '10pt', paddingBottom: '10pt' }}
        >
          <div className="container2">
            <div>{temperatureCelcius} °C</div>{' '}
            <div>{temperatureFahrenheit} °F</div>
          </div>
        </Fieldset.Subtitle>
        <Divider>Battery</Divider>
        <Fieldset.Subtitle
          style={{ paddingTop: '10pt', paddingBottom: '10pt' }}
        >
          <div className="container2">
            <div>{batteryStatus}</div> <div>{batteryValue ? `${batteryValue} %` : null}</div>
          </div>
        </Fieldset.Subtitle>
        <Fieldset.Footer>
          {bluetoothDeviceStatus}
          {bluetoothDeviceStatus === 'Not connected' ? (
            <Button
              auto
              scale={1 / 3}
              font="12px"
              onClick={(event: React.MouseEvent<HTMLElement>) =>
                handleClickConnect(event)
              }
              disabled={disabled}
            >
              Pair my LifeinaBox
            </Button>
          ) : (
            <Button
              auto
              scale={1 / 3}
              font="12px"
              onClick={(event: React.MouseEvent<HTMLElement>) =>
                handleClickDisconnect(event)
              }
            >
              Unpair
            </Button>
          )}
        </Fieldset.Footer>
      </Fieldset>
      <style jsx>{`
        .container {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 30px;
          justify-content: space-between;
        }
        .container2 {
          height: 100%;
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          margin-top: 30px;
          justify-content: space-between;
        }
      `}</style>
    </div>
  )
}

export default Temperature
