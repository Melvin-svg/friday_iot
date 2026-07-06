import React, { useState } from 'react';
import { Zap, Calculator } from 'lucide-react';
import { getResistorBands } from '../utils/resistor';

interface CalcResult {
  resistance: number;
  bandColors: string[];
  bandNames: string[];
  formula: string;
}

export const ResistorCalc: React.FC = () => {
  const [voltage, setVoltage] = useState('5');
  const [currentMa, setCurrentMa] = useState('20');
  const [result, setResult] = useState<CalcResult | null>(null);

  const calculate = () => {
    const v = parseFloat(voltage);
    const i = parseFloat(currentMa);
    if (isNaN(v) || isNaN(i) || i <= 0 || v <= 0) return;

    const resistance = v / (i / 1000);
    const bands = getResistorBands(resistance);

    setResult({
      resistance: Math.round(resistance * 100) / 100,
      bandColors: bands.colors,
      bandNames: bands.names,
      formula: `R = ${v}V ÷ ${i}mA = ${Math.round(resistance)}Ω`
    });
  };

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold tracking-wide">Resistor Calculator</h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-white/5 text-slate-400 rounded-full">
          Ohm's Law
        </span>
      </div>

      {/* Inputs */}
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Voltage (V)</label>
          <input
            type="number"
            value={voltage}
            onChange={e => setVoltage(e.target.value)}
            step="0.1"
            min="0"
            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Current (mA)</label>
          <input
            type="number"
            value={currentMa}
            onChange={e => setCurrentMa(e.target.value)}
            step="0.1"
            min="0.1"
            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
      >
        <Calculator className="w-3.5 h-3.5" />
        Calculate
      </button>

      {/* Result */}
      {result && (
        <div className="p-3 rounded-xl border border-amber-500/20 bg-slate-950/40 flex flex-col gap-3">
          <div className="text-center">
            <span className="text-2xl font-bold text-amber-300 font-mono">{result.resistance}Ω</span>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">{result.formula}</div>
          </div>

          {/* Resistor Visual */}
          <div className="flex items-center justify-center gap-1 py-2">
            <div style={{ width: '40px', height: '12px', background: '#d4a574', borderRadius: '6px 0 0 6px' }} />
            {result.bandColors.map((color, i) => (
              <div
                key={i}
                className="resistor-band"
                style={{ backgroundColor: color, width: '14px', height: '32px' }}
                title={result.bandNames[i]}
              />
            ))}
            <div style={{ width: '8px', height: '32px', background: 'transparent' }} />
            <div
              className="resistor-band"
              style={{ backgroundColor: '#FFD700', width: '14px', height: '32px' }}
              title="Tolerance: ±5%"
            />
            <div style={{ width: '40px', height: '12px', background: '#d4a574', borderRadius: '0 6px 6px 0' }} />
          </div>

          {/* Band Labels */}
          <div className="flex items-center justify-center gap-2 text-[9px] text-slate-400">
            {result.bandNames.map((name, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: result.bandColors[i], border: '1px solid rgba(255,255,255,0.2)' }} />
                {name}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#FFD700', border: '1px solid rgba(255,255,255,0.2)' }} />
              Gold (±5%)
            </span>
          </div>
        </div>
      )}

      <div className="text-[10px] text-slate-500 text-center leading-normal">
        💡 You can also ask FRIDAY: <span className="text-slate-400 font-semibold">"What resistor do I need for a 3.3V LED at 15mA?"</span>
      </div>
    </div>
  );
};
