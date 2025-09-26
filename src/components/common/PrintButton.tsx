import React, { useState } from 'react';
import { getPrintTemplate, getPrintData, generatePrintHtml, openPrintPreview, PrintTemplate } from '../../services/print';

interface PrintButtonProps {
  documentType: PrintTemplate;
  documentId: string;
}

export default function PrintButton({ documentType, documentId }: PrintButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const [template, data] = await Promise.all([
        getPrintTemplate(documentType),
        getPrintData(documentType, documentId),
      ]);
      const finalHtml = generatePrintHtml(template, data);
      openPrintPreview(finalHtml);
    } catch (error) {
      console.error('Printing failed:', error);
      alert('Ocurrió un error al generar el documento para imprimir.');
    } finally {
      setLoading(false);
    }
  };
  
  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    backgroundColor: '#6b7280', // gray-500
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  };
  
  const disabledStyle: React.CSSProperties = {
      ...buttonStyle,
      opacity: 0.7,
      cursor: 'not-allowed'
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading || !documentId}
      style={(loading || !documentId) ? disabledStyle : buttonStyle}
    >
      {loading ? 'Imprimiendo...' : 'Imprimir'}
    </button>
  );
}
