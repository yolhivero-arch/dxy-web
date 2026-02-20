import { Product, CalculatedFields, ProductStatus } from './types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const calculateProductMetrics = (product: Product): CalculatedFields => {
  const realCost = (product.providerCost || 0) + (product.freightCost || 0);
  const cashPrice = realCost * (1 + (product.markupPercent || 0) / 100);
  const listPriceTN = cashPrice * (1 + (product.cardSurchargePercent || 0) / 100);
  const netProfit = cashPrice - realCost;
  const inventoryValue = (product.currentStock || 0) * realCost;
  const wholesalePrice = realCost * 1.05;
  
  let status: ProductStatus = 'OK';
  if (product.currentStock === 0) {
    status = 'AGOTADO';
  } else if (product.currentStock <= product.minStock) {
    status = 'PEDIR';
  }

  return { realCost, cashPrice, listPriceTN, netProfit, inventoryValue, wholesalePrice, status };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatPercent = (value: number) => `${value}%`;

export const exportInventoryToCSV = (products: Product[]) => {
  if (products.length === 0) {
    alert('No hay datos para exportar.');
    return;
  }
  const headers = ['Producto', 'Marca', 'Sabor', 'Stock', 'Costo_Neto', 'Unidades_Por_Caja', 'Margen_Personalizado', 'Costo_Envio_Unitario', 'Precio_Efectivo', 'Precio_Tarjeta'];
  const rows = products.map(p => {
    const metrics = calculateProductMetrics(p);
    return [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.brand || 'N/A').replace(/"/g, '""')}"`,
      `"${(p.flavors && p.flavors.length > 0 ? p.flavors.join(', ') : 'N/A').replace(/"/g, '""')}"`,
      p.currentStock, p.providerCost, p.unitsPerBox || 1, p.markupPercent, p.freightCost, metrics.cashPrice, metrics.listPriceTN
    ].join(',');
  });
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'DXY_Inventario_Maestro.csv';
  link.click();
};

export const exportWholesaleCatalogToCSV = (products: Product[]) => {
  if (products.length === 0) {
    alert('No hay productos en el catálogo para exportar.');
    return;
  }
  const headers = ['Marca', 'Producto', 'Sabor', 'Precio_Mayorista'];
  const rows = products.map(p => {
    const metrics = calculateProductMetrics(p);
    return [
      `"${(p.brand || 'N/A').replace(/"/g, '""')}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${(p.flavors && p.flavors.length > 0 ? p.flavors.join(', ') : 'N/A').replace(/"/g, '""')}"`,
      metrics.wholesalePrice
    ].join(',');
  });
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'DXY_Catalogo_Mayorista.csv';
  link.click();
};

export const copyToClipboardAsTSV = (data: any[]) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(obj => headers.map(header => obj[header]).join('\t'));
  const tsv = [headers.join('\t'), ...rows].join('\n');
  navigator.clipboard.writeText(tsv).then(() => alert('Copiado al portapapeles'));
};

export const exportElementAsPDF = async (elementId: string, filename: string): Promise<void> => {
  const input = document.getElementById(elementId);
  if (!input) {
    alert("Error: No se encontró el elemento para exportar a PDF.");
    return;
  }
  const actionButtons = input.querySelectorAll('.print-hidden-pdf');
  actionButtons.forEach(btn => (btn as HTMLElement).style.display = 'none');
  try {
    const canvas = await html2canvas(input, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;
    const width = pdfWidth;
    const height = width / ratio;
    let position = 0;
    let heightLeft = height;
    pdf.addImage(imgData, 'PNG', 0, position, width, height);
    heightLeft -= pdfHeight;
    while (heightLeft > 0) {
      position = heightLeft - height;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, width, height);
      heightLeft -= pdfHeight;
    }
    pdf.save(filename);
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    alert("Error al generar el PDF.");
  } finally {
    actionButtons.forEach(btn => (btn as HTMLElement).style.display = '');
  }
};

export const exportWholesaleCatalogToPDF = async (products: Product[]): Promise<void> => {
  const availableProducts = products.filter(p => p.currentStock > 0);
  if (availableProducts.length === 0) {
    alert('No hay productos con stock para exportar.');
    return;
  }
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  const brandYellow: [number, number, number] = [249, 216, 90];
  const brandGray: [number, number, number] = [87, 87, 86];
  const white: [number, number, number] = [255, 255, 255];
  const lightGray: [number, number, number] = [248, 250, 252];
  const today = new Date();
  const validUntil = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const formatDateLocal = (d: Date) => d.toLocaleDateString('es-AR');

  const drawHeader = () => {
    pdf.setFillColor(...brandGray);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(...white);
    pdf.text('DX', margin, 16);
    pdf.setTextColor(...brandYellow);
    pdf.text('Y', margin + 14, 16);
    pdf.setFontSize(10);
    pdf.setTextColor(...white);
    pdf.text('CATÁLOGO MAYORISTA', margin + 28, 12);
    pdf.setFontSize(7);
    pdf.text('Suplementos Deportivos', margin + 28, 18);
    pdf.setFontSize(6);
    pdf.setTextColor(...brandYellow);
    pdf.text(`Válido: ${formatDateLocal(validUntil)}`, pageWidth - margin - 30, 12);
    pdf.setTextColor(...white);
    pdf.text(`${formatDateLocal(today)}`, pageWidth - margin - 30, 17);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    pdf.setFillColor(...brandGray);
    pdf.rect(0, pageHeight - 8, pageWidth, 8, 'F');
    pdf.setFontSize(6);
    pdf.setTextColor(...white);
    pdf.text('DXY Suplementos • Morteros, Córdoba', margin, pageHeight - 3);
    pdf.text(`${pageNum}/${totalPages}`, pageWidth - margin - 8, pageHeight - 3);
  };

  const productsByBrand: Record<string, Product[]> = {};
  availableProducts.forEach(p => {
    const brand = p.brand || 'Sin Marca';
    if (!productsByBrand[brand]) productsByBrand[brand] = [];
    productsByBrand[brand].push(p);
  });

  const brands = Object.keys(productsByBrand).sort();
  let y = 30;
  let currentPage = 1;
  const rowHeight = 5;
  const totalProducts = availableProducts.length;
  const estimatedPages = Math.ceil((totalProducts * rowHeight + brands.length * 10) / (pageHeight - 50)) + 1;

  drawHeader();

  brands.forEach((brand) => {
    const brandProducts = productsByBrand[brand];
    if (y + 12 > pageHeight - 12) {
      drawFooter(currentPage, estimatedPages);
      pdf.addPage();
      currentPage++;
      drawHeader();
      y = 30;
    }
    pdf.setFillColor(...brandYellow);
    pdf.rect(margin, y, contentWidth, 5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...brandGray);
    pdf.text(brand.toUpperCase(), margin + 2, y + 3.5);
    y += 6;
    pdf.setFillColor(...brandGray);
    pdf.rect(margin, y, contentWidth, 4, 'F');
    pdf.setFontSize(6);
    pdf.setTextColor(...white);
    pdf.text('PRODUCTO', margin + 2, y + 2.8);
    pdf.text('SABOR', margin + 95, y + 2.8);
    pdf.text('PRECIO', margin + contentWidth - 18, y + 2.8);
    y += 5;

    brandProducts.forEach((product, index) => {
      if (y + rowHeight > pageHeight - 12) {
        drawFooter(currentPage, estimatedPages);
        pdf.addPage();
        currentPage++;
        drawHeader();
        y = 30;
        pdf.setFillColor(...brandYellow);
        pdf.rect(margin, y, contentWidth, 5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(...brandGray);
        pdf.text(`${brand.toUpperCase()} (cont.)`, margin + 2, y + 3.5);
        y += 6;
        pdf.setFillColor(...brandGray);
        pdf.rect(margin, y, contentWidth, 4, 'F');
        pdf.setFontSize(6);
        pdf.setTextColor(...white);
        pdf.text('PRODUCTO', margin + 2, y + 2.8);
        pdf.text('SABOR', margin + 95, y + 2.8);
        pdf.text('PRECIO', margin + contentWidth - 18, y + 2.8);
        y += 5;
      }
      if (index % 2 === 0) {
        pdf.setFillColor(...lightGray);
        pdf.rect(margin, y - 0.5, contentWidth, rowHeight, 'F');
      }
      const metrics = calculateProductMetrics(product);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...brandGray);
      let productName = product.name;
      if (productName.length > 55) productName = productName.substring(0, 52) + '...';
      pdf.text(productName, margin + 2, y + 3);
      const flavor = product.flavors?.join(', ') || '-';
      pdf.setFontSize(6);
      pdf.text(flavor.length > 18 ? flavor.substring(0, 15) + '...' : flavor, margin + 95, y + 3);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text(formatCurrency(metrics.wholesalePrice), margin + contentWidth - 18, y + 3);
      y += rowHeight;
    });
    y += 3;
  });

  drawFooter(currentPage, currentPage);
  pdf.save(`DXY_Catalogo_Mayorista_${today.toISOString().slice(0, 10)}.pdf`);
};

export const exportWholesaleCatalogToPDFBlob = async (products: Product[]): Promise<Blob> => {
  const availableProducts = products.filter(p => p.currentStock > 0);
  if (availableProducts.length === 0) throw new Error('No hay productos con stock.');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  const brandYellow: [number, number, number] = [249, 216, 90];
  const brandGray: [number, number, number] = [87, 87, 86];
  const white: [number, number, number] = [255, 255, 255];
  const lightGray: [number, number, number] = [248, 250, 252];
  const today = new Date();
  const validUntil = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const formatDateLocal = (d: Date) => d.toLocaleDateString('es-AR');

  const drawHeader = () => {
    pdf.setFillColor(...brandGray);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(...white);
    pdf.text('DX', margin, 16);
    pdf.setTextColor(...brandYellow);
    pdf.text('Y', margin + 14, 16);
    pdf.setFontSize(10);
    pdf.setTextColor(...white);
    pdf.text('CATÁLOGO MAYORISTA', margin + 28, 12);
    pdf.setFontSize(7);
    pdf.text('Suplementos Deportivos', margin + 28, 18);
    pdf.setFontSize(6);
    pdf.setTextColor(...brandYellow);
    pdf.text(`Válido: ${formatDateLocal(validUntil)}`, pageWidth - margin - 30, 12);
    pdf.setTextColor(...white);
    pdf.text(`${formatDateLocal(today)}`, pageWidth - margin - 30, 17);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    pdf.setFillColor(...brandGray);
    pdf.rect(0, pageHeight - 8, pageWidth, 8, 'F');
    pdf.setFontSize(6);
    pdf.setTextColor(...white);
    pdf.text('DXY Suplementos • Morteros, Córdoba', margin, pageHeight - 3);
    pdf.text(`${pageNum}/${totalPages}`, pageWidth - margin - 8, pageHeight - 3);
  };

  const productsByBrand: Record<string, Product[]> = {};
  availableProducts.forEach(p => {
    const brand = p.brand || 'Sin Marca';
    if (!productsByBrand[brand]) productsByBrand[brand] = [];
    productsByBrand[brand].push(p);
  });

  const brands = Object.keys(productsByBrand).sort();
  let y = 30;
  let currentPage = 1;
  const rowHeight = 5;
  const totalProducts = availableProducts.length;
  const estimatedPages = Math.ceil((totalProducts * rowHeight + brands.length * 10) / (pageHeight - 50)) + 1;

  drawHeader();

  brands.forEach((brand) => {
    const brandProducts = productsByBrand[brand];
    if (y + 12 > pageHeight - 12) {
      drawFooter(currentPage, estimatedPages);
      pdf.addPage();
      currentPage++;
      drawHeader();
      y = 30;
    }
    pdf.setFillColor(...brandYellow);
    pdf.rect(margin, y, contentWidth, 5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...brandGray);
    pdf.text(brand.toUpperCase(), margin + 2, y + 3.5);
    y += 6;
    pdf.setFillColor(...brandGray);
    pdf.rect(margin, y, contentWidth, 4, 'F');
    pdf.setFontSize(6);
    pdf.setTextColor(...white);
    pdf.text('PRODUCTO', margin + 2, y + 2.8);
    pdf.text('SABOR', margin + 95, y + 2.8);
    pdf.text('PRECIO', margin + contentWidth - 18, y + 2.8);
    y += 5;

    brandProducts.forEach((product, index) => {
      if (y + rowHeight > pageHeight - 12) {
        drawFooter(currentPage, estimatedPages);
        pdf.addPage();
        currentPage++;
        drawHeader();
        y = 30;
        pdf.setFillColor(...brandYellow);
        pdf.rect(margin, y, contentWidth, 5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(...brandGray);
        pdf.text(`${brand.toUpperCase()} (cont.)`, margin + 2, y + 3.5);
        y += 6;
        pdf.setFillColor(...brandGray);
        pdf.rect(margin, y, contentWidth, 4, 'F');
        pdf.setFontSize(6);
        pdf.setTextColor(...white);
        pdf.text('PRODUCTO', margin + 2, y + 2.8);
        pdf.text('SABOR', margin + 95, y + 2.8);
        pdf.text('PRECIO', margin + contentWidth - 18, y + 2.8);
        y += 5;
      }
      if (index % 2 === 0) {
        pdf.setFillColor(...lightGray);
        pdf.rect(margin, y - 0.5, contentWidth, rowHeight, 'F');
      }
      const metrics = calculateProductMetrics(product);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...brandGray);
      let productName = product.name;
      if (productName.length > 55) productName = productName.substring(0, 52) + '...';
      pdf.text(productName, margin + 2, y + 3);
      const flavor = product.flavors?.join(', ') || '-';
      pdf.setFontSize(6);
      pdf.text(flavor.length > 18 ? flavor.substring(0, 15) + '...' : flavor, margin + 95, y + 3);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.text(formatCurrency(metrics.wholesalePrice), margin + contentWidth - 18, y + 3);
      y += rowHeight;
    });
    y += 3;
  });

  drawFooter(currentPage, currentPage);
  return pdf.output('blob');
};