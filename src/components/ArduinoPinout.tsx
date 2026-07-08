import React, { useState } from 'react';
import { Cpu, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Pin {
  label: string;
  name: string;
  type: 'gnd' | 'power' | 'analog' | 'digital' | 'pwm' | 'communication';
  description: string;
}

interface BoardData {
  name: string;
  voltage: string;
  warning: string;
  pinsLeft: Pin[];
  pinsRight: Pin[];
}

const BOARDS: Record<'uno' | 'esp32' | 'esp8266', BoardData> = {
  uno: {
    name: 'Arduino Uno R3',
    voltage: '5V Logic',
    warning: 'Pins output/expect 5V logic. Safe for 5V sensors. Do not connect direct 3.3V sensor data lines without level shifters if they are not 5V tolerant.',
    pinsLeft: [
      { label: 'RESET', name: 'Reset Button Line', type: 'digital', description: 'Reset microcontroller (active low).' },
      { label: '3.3V', name: '3.3V Out', type: 'power', description: 'Provides 3.3V regulated power (Max 150mA).' },
      { label: '5V', name: '5V Out', type: 'power', description: 'Provides 5V regulated power from USB or DC Jack.' },
      { label: 'GND', name: 'Ground', type: 'gnd', description: 'Electrical reference point (0V).' },
      { label: 'GND', name: 'Ground', type: 'gnd', description: 'Electrical reference point (0V).' },
      { label: 'VIN', name: 'Input Voltage', type: 'power', description: 'Input voltage when using external power supply (7-12V).' },
      { label: 'A0', name: 'Analog In 0', type: 'analog', description: 'Analog input pin 0. 10-bit Resolution (0-1023).' },
      { label: 'A1', name: 'Analog In 1', type: 'analog', description: 'Analog input pin 1. 10-bit Resolution (0-1023).' },
      { label: 'A2', name: 'Analog In 2', type: 'analog', description: 'Analog input pin 2. 10-bit Resolution (0-1023).' },
      { label: 'A3', name: 'Analog In 3', type: 'analog', description: 'Analog input pin 3. 10-bit Resolution (0-1023).' },
      { label: 'A4', name: 'Analog In 4 / SDA', type: 'communication', description: 'Analog input 4. Also I2C Data line (SDA).' },
      { label: 'A5', name: 'Analog In 5 / SCL', type: 'communication', description: 'Analog input 5. Also I2C Clock line (SCL).' }
    ],
    pinsRight: [
      { label: 'D0/RX', name: 'Digital 0 / Serial RX', type: 'communication', description: 'Receive serial data (shared with USB connection).' },
      { label: 'D1/TX', name: 'Digital 1 / Serial TX', type: 'communication', description: 'Transmit serial data (shared with USB connection).' },
      { label: 'D2', name: 'Digital 2', type: 'digital', description: 'General purpose digital I/O. Supports external interrupts.' },
      { label: 'D3~', name: 'Digital 3 (PWM)', type: 'pwm', description: 'Digital I/O. Supports 8-bit PWM analogWrite().' },
      { label: 'D4', name: 'Digital 4', type: 'digital', description: 'General purpose digital I/O.' },
      { label: 'D5~', name: 'Digital 5 (PWM)', type: 'pwm', description: 'Digital I/O. Supports 8-bit PWM analogWrite().' },
      { label: 'D6~', name: 'Digital 6 (PWM)', type: 'pwm', description: 'Digital I/O. Supports 8-bit PWM analogWrite().' },
      { label: 'D7', name: 'Digital 7', type: 'digital', description: 'General purpose digital I/O.' },
      { label: 'D8', name: 'Digital 8', type: 'digital', description: 'General purpose digital I/O.' },
      { label: 'D9~', name: 'Digital 9 (PWM)', type: 'pwm', description: 'Digital I/O. Supports 8-bit PWM analogWrite().' },
      { label: 'D10~', name: 'Digital 10 (PWM)', type: 'pwm', description: 'Digital I/O. SPI Slave Select (SS).' },
      { label: 'D11~', name: 'Digital 11 (PWM)', type: 'pwm', description: 'Digital I/O. SPI Master Out Slave In (MOSI).' },
      { label: 'D12', name: 'Digital 12', type: 'digital', description: 'Digital I/O. SPI Master In Slave Out (MISO).' },
      { label: 'D13', name: 'Digital 13 / LED', type: 'digital', description: 'Digital I/O. Tied to built-in board LED. SPI Clock (SCK).' }
    ]
  },
  esp32: {
    name: 'ESP32 DevKit V1',
    voltage: '3.3V Logic ONLY',
    warning: 'CRITICAL: The ESP32 operates at 3.3V. Feeding 5V into ANY GPIO pin will permanently destroy the microcontroller. Always use level shifters!',
    pinsLeft: [
      { label: '3.3V', name: '3.3V Power Out', type: 'power', description: 'Regulated 3.3V output for low power sensors.' },
      { label: 'EN', name: 'Enable / Reset', type: 'digital', description: 'Reset pin (active low, pulls down to restart).' },
      { label: 'VP/G36', name: 'GPIO 36 / ADC1_CH0', type: 'analog', description: 'Analog Input. Input only pin.' },
      { label: 'VN/G39', name: 'GPIO 39 / ADC1_CH3', type: 'analog', description: 'Analog Input. Input only pin.' },
      { label: 'G34', name: 'GPIO 34 / ADC1_CH6', type: 'analog', description: 'Analog Input. Input only pin (no internal pull-up).' },
      { label: 'G35', name: 'GPIO 35 / ADC1_CH7', type: 'analog', description: 'Analog Input. Input only pin (no internal pull-up).' },
      { label: 'G32', name: 'GPIO 32 / ADC1_CH4', type: 'analog', description: 'GPIO. Analog Input. Touch sensor 9.' },
      { label: 'G33', name: 'GPIO 33 / ADC1_CH5', type: 'analog', description: 'GPIO. Analog Input. Touch sensor 8.' },
      { label: 'G25', name: 'GPIO 25 / DAC1', type: 'analog', description: 'GPIO. Digital-to-Analog converter (true analog output).' },
      { label: 'G26', name: 'GPIO 26 / DAC2', type: 'analog', description: 'GPIO. Digital-to-Analog converter (true analog output).' },
      { label: 'G27', name: 'GPIO 27 / ADC2_CH7', type: 'digital', description: 'GPIO. Touch sensor 7. (ADC2 unavailable during WiFi).' },
      { label: 'G14', name: 'GPIO 14 / SPI_CLK', type: 'communication', description: 'GPIO. Hardware SPI clock line (SCK).' },
      { label: 'G12', name: 'GPIO 12 / SPI_MISO', type: 'communication', description: 'GPIO. Hardware SPI MISO line. Boot strapped pin.' },
      { label: 'G13', name: 'GPIO 13 / SPI_MOSI', type: 'communication', description: 'GPIO. Hardware SPI MOSI line.' },
      { label: 'GND', name: 'Ground', type: 'gnd', description: 'Common electrical ground (0V).' }
    ],
    pinsRight: [
      { label: 'VIN', name: '5V Input', type: 'power', description: 'USB 5V supply input (regulated down to 3.3V on-board).' },
      { label: 'GND', name: 'Ground', type: 'gnd', description: 'Common electrical ground (0V).' },
      { label: 'G15', name: 'GPIO 15 / SPI_SS', type: 'communication', description: 'GPIO. Hardware SPI Chip Select (CS).' },
      { label: 'G2', name: 'GPIO 2 / LED', type: 'digital', description: 'GPIO. Connected to on-board blue LED. Boot strap pin.' },
      { label: 'G4', name: 'GPIO 4 / ADC2_CH0', type: 'digital', description: 'GPIO. Touch sensor 0.' },
      { label: 'RX2/G16', name: 'GPIO 16 / RX2', type: 'communication', description: 'GPIO. Hardware UART Serial2 RX pin.' },
      { label: 'TX2/G17', name: 'GPIO 17 / TX2', type: 'communication', description: 'GPIO. Hardware UART Serial2 TX pin.' },
      { label: 'G5', name: 'GPIO 5 / SPI_CS', type: 'communication', description: 'GPIO. SPI Chip Select pin.' },
      { label: 'G18', name: 'GPIO 18 / SPI_SCK', type: 'communication', description: 'GPIO. SPI Clock pin.' },
      { label: 'G19', name: 'GPIO 19 / SPI_MISO', type: 'communication', description: 'GPIO. SPI MISO pin.' },
      { label: 'G21', name: 'GPIO 21 / I2C_SDA', type: 'communication', description: 'GPIO. Default hardware I2C Data (SDA) pin.' },
      { label: 'RX0/G3', name: 'GPIO 3 / RX0', type: 'communication', description: 'GPIO. Hardware UART Serial0 RX (USB serial).' },
      { label: 'TX0/G1', name: 'GPIO 1 / TX0', type: 'communication', description: 'GPIO. Hardware UART Serial0 TX (USB serial).' },
      { label: 'G22', name: 'GPIO 22 / I2C_SCL', type: 'communication', description: 'GPIO. Default hardware I2C Clock (SCL) pin.' },
      { label: 'G23', name: 'GPIO 23 / SPI_MOSI', type: 'communication', description: 'GPIO. SPI MOSI pin.' }
    ]
  },
  esp8266: {
    name: 'NodeMCU ESP8266',
    voltage: '3.3V Logic ONLY',
    warning: 'The ESP8266 core is 3.3V only. Note that digital pins (D0-D10) do not map directly to GPIO numbers in code! E.g. D1 is GPIO 5.',
    pinsLeft: [
      { label: 'A0', name: 'Analog input A0', type: 'analog', description: 'ADC input pin. Max 3.2V input limit on the NodeMCU board.' },
      { label: 'RSV', name: 'Reserved Pin', type: 'gnd', description: 'Reserved by board vendor.' },
      { label: 'RSV', name: 'Reserved Pin', type: 'gnd', description: 'Reserved by board vendor.' },
      { label: 'D0', name: 'GPIO 16 / WAKE', type: 'digital', description: 'GPIO 16. Used to wake chip from Deep Sleep.' },
      { label: 'D1', name: 'GPIO 5 / I2C SCL', type: 'communication', description: 'GPIO 5. Recommended hardware I2C Clock (SCL) pin.' },
      { label: 'D2', name: 'GPIO 4 / I2C SDA', type: 'communication', description: 'GPIO 4. Recommended hardware I2C Data (SDA) pin.' },
      { label: 'D3', name: 'GPIO 0 / FLASH', type: 'digital', description: 'GPIO 0. Pulls low for flashing. Has 10K pull-up on board.' },
      { label: 'D4', name: 'GPIO 2 / TXD1', type: 'digital', description: 'GPIO 2. High at boot. Connected to ESP module blue LED.' },
      { label: '3V3', name: '3.3V Out', type: 'power', description: 'Provides 3.3V power output.' },
      { label: 'GND', name: 'Ground', type: 'gnd', description: 'Common electrical ground (0V).' },
      { label: '3V3', name: '3.3V Out', type: 'power', description: 'Provides 3.3V power output.' },
      { label: 'GND', name: 'Ground', type: 'gnd', description: 'Common electrical ground (0V).' }
    ],
    pinsRight: [
      { label: 'VIN', name: '5V Input', type: 'power', description: 'External 5V supply input (regulated to 3.3V).' },
      { label: 'GND', name: 'Ground', type: 'gnd', description: 'Common electrical ground (0V).' },
      { label: 'RST', name: 'Reset Pin', type: 'digital', description: 'Reset line (active low).' },
      { label: 'EN', name: 'Chip Enable', type: 'digital', description: 'Pulls high by default. Chip functions when high.' },
      { label: 'D5', name: 'GPIO 14 / SPI SCK', type: 'communication', description: 'GPIO 14. Hardware SPI Clock (SCK).' },
      { label: 'D6', name: 'GPIO 12 / SPI MISO', type: 'communication', description: 'GPIO 12. Hardware SPI MISO.' },
      { label: 'D7', name: 'GPIO 13 / SPI MOSI', type: 'communication', description: 'GPIO 13. Hardware SPI MOSI.' },
      { label: 'D8', name: 'GPIO 15 / SPI CS', type: 'communication', description: 'GPIO 15. Hardware SPI Chip Select. Must be low at boot.' },
      { label: 'RX', name: 'GPIO 3 / RXD0', type: 'communication', description: 'GPIO 3. Serial data receive (RX).' },
      { label: 'TX', name: 'GPIO 1 / TXD0', type: 'communication', description: 'GPIO 1. Serial data transmit (TX).' },
      { label: '3V3', name: '3.3V Out', type: 'power', description: 'Provides 3.3V power output.' },
      { label: 'GND', name: 'Ground', type: 'gnd', description: 'Common electrical ground (0V).' }
    ]
  }
};

interface ArduinoPinoutProps {
  activeBoard: 'uno' | 'esp32' | 'esp8266';
  setActiveBoard: (board: 'uno' | 'esp32' | 'esp8266') => void;
}

export const ArduinoPinout: React.FC<ArduinoPinoutProps> = ({ activeBoard, setActiveBoard }) => {
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  
  const board = BOARDS[activeBoard];

  const getPinColorClass = (type: Pin['type']) => {
    switch (type) {
      case 'gnd': return 'pin-gnd';
      case 'power': return 'pin-power';
      case 'analog': return 'pin-analog';
      case 'digital': return 'pin-digital';
      case 'pwm': return 'pin-pwm';
      case 'communication': return 'pin-communication';
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col gap-3 h-full overflow-hidden">
      {/* Board Selector Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Cpu className={`w-5 h-5 ${activeBoard === 'uno' ? 'text-cyan-400' : 'text-amber-500 animate-pulse'}`} />
          <h2 className="text-sm font-bold tracking-wide">Board References</h2>
        </div>
        <div className="flex gap-1.5">
          {(['uno', 'esp32', 'esp8266'] as const).map((b) => (
            <button
              key={b}
              onClick={() => {
                setActiveBoard(b);
                setSelectedPin(null);
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                activeBoard === b
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10'
              }`}
            >
              {b.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Voltage Warning Alert */}
      <div className={`p-1.5 rounded-lg border flex gap-2 items-start text-[11px] ${
        board.voltage.includes('3.3V') 
          ? 'bg-red-950/20 text-red-300 border-red-500/25' 
          : 'bg-cyan-950/20 text-cyan-300 border-cyan-500/25'
      }`}>
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold block mb-0.5">{board.name} ({board.voltage})</span>
          <span className="opacity-80 leading-normal">{board.warning}</span>
        </div>
      </div>

      {/* Microcontroller Schematic Simulator */}
      <div className="board-container p-2 flex flex-col items-center justify-center min-h-[250px] relative flex-shrink-0">
        <div className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest">
          Click Pin to inspect spec
        </div>
        
        {/* PCB Board Outline */}
        <div className="relative border border-slate-700 bg-slate-900 w-full max-w-[280px] rounded-xl py-2 px-1.5 shadow-2xl flex justify-between gap-1 items-stretch">
          
          {/* Microcontroller Chip Drawing in background */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-slate-700 bg-slate-950/60 rounded p-3 w-16 h-28 flex flex-col items-center justify-between text-center pointer-events-none opacity-40">
            <span className="text-[9px] font-mono text-slate-500 font-bold">MCU</span>
            <div className="w-8 h-12 bg-slate-800 rounded border border-slate-700 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-[8px] font-mono text-slate-600">FRIDAY Core</span>
          </div>

          {/* Left Pin Header Column */}
          <div className="flex flex-col gap-1 z-10 w-24">
            {board.pinsLeft.map((pin, i) => (
              <button
                key={`left-${i}`}
                onClick={() => setSelectedPin(pin)}
                className={`pin-badge w-full text-left truncate justify-start transition-all hover:translate-x-1 ${
                  selectedPin?.label === pin.label && selectedPin?.type === pin.type 
                    ? 'ring-2 ring-amber-400 font-bold scale-[1.03]' 
                    : 'hover:brightness-125'
                } ${getPinColorClass(pin.type)}`}
              >
                {pin.label}
              </button>
            ))}
          </div>

          {/* Right Pin Header Column */}
          <div className="flex flex-col gap-1 z-10 w-24 items-end text-right">
            {board.pinsRight.map((pin, i) => (
              <button
                key={`right-${i}`}
                onClick={() => setSelectedPin(pin)}
                className={`pin-badge w-full text-right truncate justify-end transition-all hover:-translate-x-1 ${
                  selectedPin?.label === pin.label && selectedPin?.type === pin.type 
                    ? 'ring-2 ring-amber-400 font-bold scale-[1.03]' 
                    : 'hover:brightness-125'
                } ${getPinColorClass(pin.type)}`}
              >
                {pin.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pin Detail Overlay */}
      <div className="min-h-[80px] border border-white/5 bg-slate-950/40 rounded-xl p-2.5 flex flex-col justify-center">
        {selectedPin ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pin Specifications</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getPinColorClass(selectedPin.type)}`}>
                {selectedPin.type}
              </span>
            </div>
            <h3 className="text-xs font-bold text-amber-300 font-mono mt-0.5">{selectedPin.label} - {selectedPin.name}</h3>
            <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{selectedPin.description}</p>
          </div>
        ) : (
          <div className="text-center text-xs text-slate-500 flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span>Select a Pin on the board schematic to check pin assignments.</span>
          </div>
        )}
      </div>
    </div>
  );
};
