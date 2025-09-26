
import React, { useState } from 'react';
import { Payment } from '../../services/pos';

interface PaymentsBoxProps {
  total: number;
  payments: Payment[];
  onAddPayment: (payment: Payment) => void;
  onRemovePayment: (index: number) => void;
}

export default function PaymentsBox({ total, payments, onAddPayment, onRemovePayment }: PaymentsBoxProps) {
  const [method, setMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'otro'>('efectivo');
  const [amount, setAmount] = useState(0);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = total - totalPaid;

  const handleAddPayment = () => {
    if (amount <= 0) {
      alert('El monto del pago debe ser mayor a cero.');
      return;
    }
    onAddPayment({ method, amount });
    setAmount(0); // Reset amount after adding
  };

  const setFullBalance = () => {
    if (balance > 0) {
      setAmount(balance);
    }
  }

  const containerStyle: React.CSSProperties = { border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', marginTop: '1rem' };
  const totalStyle: React.CSSProperties = { fontSize: '2rem', fontWeight: 'bold', textAlign: 'right', marginBottom: '1rem' };
  const balanceStyle: React.CSSProperties = { fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'right', color: balance > 0 ? '#ef4444' : '#10b981' };
  const paymentRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #eee' };
  const addPaymentStyle: React.CSSProperties = { display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' };

  return (
    <div style={containerStyle}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
        <span style={{fontSize: '1rem', color: '#666'}}>TOTAL A PAGAR:</span>
        <div style={totalStyle}>
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(total)}
        </div>
      </div>

      <div style={{ maxHeight: '100px', overflowY: 'auto', marginBottom: '1rem' }}>
        {payments.map((p, index) => (
          <div key={index} style={paymentRowStyle}>
            <span style={{textTransform: 'capitalize'}}>{p.method}</span>
            <span>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(p.amount)}</span>
            <button onClick={() => onRemovePayment(index)} style={{background: 'none', border: 'none', color: '#999', cursor: 'pointer'}}>&times;</button>
          </div>
        ))}
      </div>
      
      <div style={addPaymentStyle}>
        <select value={method} onChange={(e) => setMethod(e.target.value as any)} style={{padding: '0.5rem'}}>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
          <option value="otro">Otro</option>
        </select>
        <input 
          type="number"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Monto"
          style={{padding: '0.5rem', flex: 1}}
          onClick={e => (e.target as HTMLInputElement).select()}
        />
        <button onClick={setFullBalance} style={{padding: '0.5rem'}} disabled={balance <= 0}>Saldo</button>
        <button onClick={handleAddPayment} style={{padding: '0.5rem 1rem', fontWeight: 'bold', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px'}} disabled={amount <= 0}>
          Agregar Pago
        </button>
      </div>

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #ddd'}}>
        <span style={{fontSize: '1rem', color: '#666'}}>{balance > 0 ? 'FALTANTE:' : 'CAMBIO:'}</span>
        <div style={balanceStyle}>
          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Math.abs(balance))}
        </div>
      </div>
    </div>
  );
}
