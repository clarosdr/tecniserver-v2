import { supabase } from './supabase';
// @ts-ignore - Assuming merge.js is available as a module
import { mergeTemplate } from '../../prints/tools/merge.js';

export type PrintTemplate = 'ot' | 'presupuesto' | 'factura';
export type PrintData = Record<string, any>;

/**
 * Fetches the raw HTML template content from the prints directory.
 */
export async function getPrintTemplate(template: PrintTemplate): Promise<string> {
    const response = await fetch(`/prints/templates/${template}.html`);
    if (!response.ok) {
        throw new Error(`Could not load print template: ${template}.html`);
    }
    // We also need to fetch the CSS to inline it for the print preview
    const cssResponse = await fetch('/prints/styles/print.css');
    const cssText = await cssResponse.text();
    const htmlText = await response.text();
    
    // Inject CSS into the template's head
    return htmlText.replace('</head>', `<style>${cssText}</style></head>`);
}

/**
 * Calls the Supabase RPC function to get the data required for a specific document print.
 */
export async function getPrintData(documentType: PrintTemplate, documentId: string): Promise<PrintData> {
    const { data, error } = await supabase.rpc('fn_get_print_data', {
        p_document_type: documentType,
        p_document_id: documentId
    });

    if (error) {
        console.error('Error fetching print data:', error);
        throw new Error(`Failed to get print data for ${documentType} with ID ${documentId}`);
    }

    return data;
}

/**
 * Merges the HTML template with the provided data.
 */
export function generatePrintHtml(template: string, data: PrintData): string {
    return mergeTemplate(template, data);
}

/**
 * Opens a new browser window/tab to display the HTML content for printing.
 */
export function openPrintPreview(htmlContent: string): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    } else {
        alert('Could not open print preview window. Please check your browser pop-up settings.');
    }
}
