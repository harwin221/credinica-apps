
'use server';

import { numeroALetras, formatCedulaForPagare } from '@/lib/utils';
import type { CreditDetail, PaymentFrequency } from '@/lib/types';
import { getCredit } from '@/services/credit-service-server';
import { getClient } from '@/services/client-service-server';
import { PDFDocument, rgb, StandardFonts, PDFFont, PageSizes } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { promises as fs } from 'fs';
import path from 'path';
import { getUserByName } from '@/services/user-service-server';
import { toNicaraguaTime, nowInNicaragua } from '@/lib/date-utils';

interface DocumentOutput {
    pdfDataUri?: string;
    error?: string;
}

function getNumberOfInstallments(termMonths: number, frequency: PaymentFrequency): number {
    switch (frequency) {
        case 'Diario': return Math.round(termMonths * 20);
        case 'Semanal': return Math.round(termMonths * 4);
        case 'Catorcenal': return Math.round(termMonths * 2);
        case 'Quincenal': return Math.round(termMonths * 2);
        default: return 0;
    }
}


export async function generatePromissoryNotePdf(creditId: string): Promise<DocumentOutput> {
    try {
        const creditData = await getCredit(creditId);
        if (!creditData) return { error: 'Crédito no encontrado.' };
        
        const client = await getClient(creditData.clientId);
        if (!client) return { error: 'Cliente no encontrado.' };

        const pdfDoc = await PDFDocument.create();
        pdfDoc.registerFontkit(fontkit);
        
        // Logo embebido en base64 (funciona en todos los entornos)
        // TODO: Ejecutar "node scripts/convert-logo-to-base64.js" para generar el base64
        // y reemplazar LOGO_BASE64 con el valor generado
        const LOGO_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAABSMAAAGBCAYAAACdLaRKAAAAA3NCSVQICAjb4U/gAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAqwelRYdFJhdyBwcm9maWxlIHR5cGUgQVBQMQAAWIW9mN2OHLsNhO/9FOcRJFEipceh/oIDBElw3v8iH3vG67VjB/BF0o2d6VF364csVpX2y9/OP85ff64//vXXP++ffz9f/uAo1vRLHXUUTyn19DokpVxSjm8+X8f7WzJXhQt7/y6vbx3dUv30nL++17vPxhMqmo2/1wvxMV791K/DSuGkD08/GzvFJD+N8TFj+UV7+77d33MqyWusobzbe0/fHcyhi4rxmVREtHBWfo+nbUj67+d7kNe45dv6WuHd/m77ft35472vsZEf4q/vUDgt7Vt71tdVnj+0n9dV6T/0Uz5iWj7Hprz7ofW79rEjSd+O2j/e/+nve3e/9zwN1auCLX1+5I+n8vu5ydsxs8b86nMK16+r9pxKlBa5tPd50+QcaeWcbi6c8R2HZM0rG981e25PW+d259fmvM8p2UoptZR8SuX5Q9v5mEl+j2rPuIdxezo8U+mr5vO/P+9dEZ4c6A2oPlWQS2QsVkoe45On6pPvVyTliW3+hP3PxyuGlR5Lkteb8oJ9fqKeH8BmntLPAHwjV55MKOsvyQrhy9IIdGWGEUYjvCNi06Q0asRzkSqtvmc43rOSX84uPXdjDGbweqvQ4RuF5T27+szk+yM/EeEeM2uvmTENYqXM6SZjXpO0k+C7I5TrmcUrjhFFggEGtbk+49VdIsydI0VLNHEken01ff1+bu3yeite+vrWb13mWstvvvK6bOC9M61PM/zPy5bN1uq6mgaZzrVP6WUv9bzapPIIn8hUOVptbF2eChVjstO2lptRIOrFZy/uIsQQFodP7vHk54fhk7Oary3bj05vumVP35e+drOS+hmcYnUWmXt4YsiVa7sm87i2q+aNdLU6dE9bdq3PNsroe0CMUBBdrX3nOpav5kv3s8zr5lm2tzK298V62pRyvd9WOynrMcZyK1BEOy3WvVijzdr61bK7WEu+bJSd6bredfZed7Q6x2RmMES1A7bmXUMOisCzzYZacMS2AJwQmjLSLGNFYd2591QL9Ps5Zrfm2da63pa21rUdL3cW2/MOIUSbocjJHv16vZDSNuPFM4njXpNE+N31qPW1yyYieqU1067Jxafe0vOmUuLjdtU58t2DGTNmHqs77Fev9umrMdnZ5uqrNtIkt52TUCPoeo1KhIldn4PaqXOfMZBrJjGHd/NOMntT30NToKtNOJMA1u5zqKZqlAKlpE3ulOwk/bCyrjL6YXUZBJ6RtlS/eQJMomADwuOK9NoarR+cyIU+7NC5+7Bc52GtgO/0LnnpOGCiJEA7Lz0IiIEo7RzfOqzutWdjBGY8r7lRB8fbJlsXCdrbcTmNiQ6f57QDn3G7tXVSmwYO2rlmrHidc+vJxr2p6s1rJ6u34JGEhRvDJzpo4sCUlpMcDJLALvWCwW1n0Z7rbqu0mMaGaqhFOHbLrFCJQiV1n0sC+525EDDvuwpFShXOqKOB0+inlwrFplWgxV0IiM8GUNUIVDVKdiyhoQPabLumM4UuspxZq/WznPcYAqXrUkCiStFGsKbpsW4aNZEudLZ1nt5Aa/Y1GS+X0yItgMrJR2DeLJ+ldY10iHI6fljNHShoIaBqURt1WbEzZrO2wbWDITF+NtALKeRWdt2p0lpqvYaGwxKtE3JIQoB6JPXqtt48w0PXBzlvwtqNmgUijLV09TbWA1BCCCloMP0AYmPCEhKrgkNEx501q23TVVgZ86hHeDGDdmOlOS3lpXFc0pSeS7gZMvm4AsRiXlm77VEbQ1dM2qRyCfpU6ApqYsxt29cmF3SSzqKcibzzGsDZeDzB/WwyDKDJsA4nLa6R/kRxSYZWtgDmS3CuowqL...'; // Reemplazar con el base64 real
            
            let logoImage: any;
        let logoDims: any;
        
        try {
            if (LOGO_BASE64 === 'PLACEHOLDER') {
                // Intentar cargar desde filesystem (solo desarrollo)
                console.log('⚠️ Logo base64 no configurado, intentando filesystem');
                const logoPath = path.join(process.cwd(), 'public', 'CrediNica.png');
                const logoBytes = await fs.readFile(logoPath);
                logoImage = await pdfDoc.embedPng(logoBytes);
                logoDims = logoImage.scale(0.2);
                console.log('✅ Logo cargado desde filesystem (desarrollo)');
            } else {
                // Usar logo embebido en base64 (producción)
                console.log('📦 Usando logo embebido en base64');
                const logoBytes = Buffer.from(LOGO_BASE64, 'base64');
                logoImage = await pdfDoc.embedPng(logoBytes);
                logoDims = logoImage.scale(0.2);
                console.log('✅ Logo embebido cargado');
            }
        } catch (error: any) {
            console.error('❌ ERROR al cargar logo:', error);
            throw new Error(`No se pudo cargar el logo: ${error.message}. Por favor, ejecuta "node scripts/convert-logo-to-base64.js" y actualiza el código.`);
        }

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const page1 = pdfDoc.addPage(PageSizes.Letter);
        const { width, height } = page1.getSize();
        const margin = 50;
        const contentWidth = width - margin * 2;
        let y = height - margin;

        // --- Header Section ---
        const headerY = y;
        
        // Dibujar logo CrediNica
        page1.drawImage(logoImage, {
            x: margin,
            y: headerY - logoDims.height + 10,
            width: logoDims.width,
            height: logoDims.height,
        });

        const titleText = "PAGARÉ A LA ORDEN";
        const titleWidth = fontBold.widthOfTextAtSize(titleText, 14);
        page1.drawText(titleText, { 
            x: (width - titleWidth) / 2, 
            y: headerY - 5, // Ajustado para alinearse mejor
            font: fontBold, 
            size: 14 
        });
        
        const totalAmount = creditData.totalAmount ?? creditData.amount ?? 0;
        const valorText = `VALOR: C$ ${totalAmount.toLocaleString('es-NI', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        const valorWidth = fontBold.widthOfTextAtSize(valorText, 11);
        page1.drawText(valorText, { 
            x: width - margin - valorWidth, 
            y: headerY,
            font: fontBold, 
            size: 11 
        });

        // Ajustar Y después del logo
        y = headerY - logoDims.height - 30;
        // --- End Header Section ---


        const drawRichText = (
            page: any, text: string, initialY: number, fontRegular: PDFFont, fontBold: PDFFont,
            fontSize: number, maxWidth: number, lineHeight: number, isJustified: boolean
        ) => {
            // FIX: Clean up text to remove problematic characters before processing.
            const cleanedText = text.split('\n').join(' ').split('\r').join(' ');
            const parts = cleanedText.split(/(\*\*.*?\*\*)/g).filter(p => p);
            const processedWords: { text: string; width: number; font: PDFFont }[] = [];

            parts.forEach(part => {
                const isBold = part.startsWith('**') && part.endsWith('**');
                const cleanPart = part.replace(/\*\*/g, '');
                const currentFont = isBold ? fontBold : fontRegular;
                cleanPart.split(' ').forEach(word => {
                    if (word) {
                        processedWords.push({ text: word, width: currentFont.widthOfTextAtSize(word, fontSize), font: currentFont });
                    }
                });
            });

            let currentY = initialY;
            let line: typeof processedWords = [];
            let lineWidth = 0;
            const spaceWidth = fontRegular.widthOfTextAtSize(' ', fontSize);

            const drawLine = (currentLine: typeof processedWords, isLastLineOfParagraph: boolean) => {
                let currentX = margin;
                let spacing = spaceWidth;
                if (isJustified && !isLastLineOfParagraph && currentLine.length > 1) {
                    const totalWidthOfWords = currentLine.reduce((sum, word) => sum + word.width, 0);
                    const totalSpacing = maxWidth - totalWidthOfWords;
                    spacing = totalSpacing / (currentLine.length - 1);
                }

                currentLine.forEach(word => {
                    page.drawText(word.text, { x: currentX, y: currentY, font: word.font, size: fontSize, color: rgb(0,0,0) });
                    currentX += word.width + spacing;
                });
                currentY -= lineHeight;
            };
            
            processedWords.forEach((word) => {
                if (lineWidth + word.width + (line.length > 0 ? spaceWidth : 0) > maxWidth) {
                    drawLine(line, false);
                    line = [word];
                    lineWidth = word.width;
                } else {
                    lineWidth += word.width + (line.length > 0 ? spaceWidth : 0);
                    line.push(word);
                }
            });

            if (line.length > 0) drawLine(line, true);
            return currentY;
        };

        const clientName = (client?.name || '____________________').toUpperCase();
        const clientId = client ? formatCedulaForPagare(client.cedula) : '____________________';
        const clientAddress = [
            client?.department,
            client?.municipality,
            client?.neighborhood,
            client?.address
        ].filter(Boolean).join(', ').toUpperCase();

        const totalAmountInWords = numeroALetras(totalAmount).toUpperCase();
        const numberOfInstallments = getNumberOfInstallments(creditData.termMonths, creditData.paymentFrequency);
        const documentDate = creditData.deliveryDate && isValid(parseISO(creditData.deliveryDate)) ? parseISO(creditData.deliveryDate) : toNicaraguaTime(nowInNicaragua());

        const paragraphs = [
            `YO, **${clientName}**, mayor de edad, debidamente identificado con cédula de identidad número **${clientId}** y del domicilio de **${clientAddress || '____________________'}**, en lo sucesivo denominado únicamente como EL DEUDOR.`,
            `Por este PAGARÉ A LA ORDEN pagaré AL SEÑOR **ULBERT ALEJANDRO MARTINEZ LOPEZ**, con cédula de identidad número **001-010179-0012K**, conocido comercialmente como: **CREDINIC** y que en lo sucesivo denominaré como EL ACREEDOR o a su orden en sus oficinas situadas en la ciudad de León, con dirección Villa Casteleon boulevard 1c al este 1c al norte, la cantidad de **C$ ${totalAmount.toLocaleString('es-NI', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${totalAmountInWords})** que confieso haber recibido a entera satisfacción.`,
            `La forma de pago, será mediante la amortización de pago de **${numberOfInstallments} cuotas** en frecuencias de pagos **${creditData.paymentFrequency.toUpperCase()}**, las cuales comprenden el principal e intereses pactados. Las fechas y montos de pago de cada cuota de amortización se estipularan en el Plan de pago que AL SEÑOR: **ULBERT ALEJANDRO MARTINEZ/CREDINIC** me ha hecho de mi conocimiento. Para los efectos del presente pagaré a la orden renuncio al domicilio sin costo legal de la República de Nicaragua, sujeto a jurisdicción y tribunales de la ciudad de León. Hago constar que la firma expuesta en el presente pagaré es la que utilizo en todos y para todos los fines de ley.`,
            `El plazo del presente pagaré a la orden se dará como finalizado anticipadamente sin excepción, a elección DEL SEÑOR: **ULBERT ALEJANDRO MARTINEZ/CREDINIC**, si se entablare por otra persona acción judicial en mi contra o de mis fiadores o también si incumpliere con el pago de dos de las cuotas de pago arriba señaladas, o bien si dejase de cumplir con cualquier otra obligación contraída con EL SEÑOR: **ULBERT ALEJANDRO MARTINEZ/CREDINIC**. En caso de que faltare el pago de una sola de las cuotas en la fecha señalada o el solo hecho del incumplimiento sin necesidad de requerimiento judicial, quedando en libertad EL ACREEDOR de solicitarme de forma completa e inmediata el pago por medio de la correspondiente ejecución. En virtud de lo anterior, me someto a los juzgados civiles del departamento de León y acepto los gastos de cobranza judicial y extrajudicial, así como también los intereses legales de ser necesario.`,
            `Para los efectos legales renuncio al fuero tributo y de la fuerza mayor, cuyos riesgos acepto, por imprevistos o inesperados que estos sean, o de igual forma, autorizo AL ACREEDOR en caso de incumplimiento parcial o total del presente pagaré a retirar los bienes puestos en garantía, de los cuales soy custodio, y autorizo al ACREEDOR a que se adjudique dichos bienes en activo que yo sea representado por el mismo y a favor de él en caso de ejecución por el incumplimiento y lo acepto en todo el sentido.`
        ];
        
        paragraphs.forEach(p => {
            y = drawRichText(page1, p, y, font, fontBold, 11, contentWidth, 14, true);
            y -= 8; 
        });
        
        y -= 10;
        const fechaCiudad = `${(client?.municipality || 'León').toUpperCase()}, ${format(documentDate, "dd 'de' MMMM 'del' yyyy", { locale: es })}.`;
        page1.drawText(fechaCiudad, { x: margin, y, font, size: 11 });
        y -= 80;

        const signatureLineText = "___________________________";
        const signatureLineWidth = font.widthOfTextAtSize(signatureLineText, 12);
        
        page1.drawText(signatureLineText, { x: margin, y: y, font: font, size: 12 });
        page1.drawText(signatureLineText, { x: width - margin - signatureLineWidth, y: y, font: font, size: 12 });
        y -= 20;

        const clientNameText = (client?.name || 'FIRMA CLIENTE').toUpperCase();
        const clientNameWidth = fontBold.widthOfTextAtSize(clientNameText, 10);
        page1.drawText(clientNameText, { x: margin + (signatureLineWidth - clientNameWidth) / 2, y: y, font: fontBold, size: 10 });

        const creditorNameText = "ULBERT ALEJANDRO MARTÍNEZ";
        const creditorNameWidth = fontBold.widthOfTextAtSize(creditorNameText, 10);
        page1.drawText(creditorNameText, { x: (width - margin - signatureLineWidth) + (signatureLineWidth - creditorNameWidth) / 2, y: y, font: fontBold, size: 10 });
        
        if (creditData.guarantors && creditData.guarantors.length > 0) {
            const fiador = creditData.guarantors[0];
            const page2 = pdfDoc.addPage(PageSizes.Letter);
            let y2 = height - 50;

            const titleFiador = "DEUDOR SOLIDARIO";
            page2.drawText(titleFiador, { x: width / 2 - fontBold.widthOfTextAtSize(titleFiador, 14) / 2, y: y2, font: fontBold, size: 14 });
            y2 -= 40;
            
            const fiadorParagraphs = [
                `Yo, **${fiador.name.toUpperCase()}**, mayor de edad, identificado con cédula de identidad número **${formatCedulaForPagare(fiador.cedula)}** del domicilio de **${fiador.address.toUpperCase()}** en mi propio e interés me constituyo como DEUDOR SOLIDARIO Y FIADOR de **${(client?.name || '').toUpperCase()}**, para con EL ACREEDOR: **ULBERT ALEJANDRO MARTÍNEZ LÓPEZ**, conocido como **CREDINIC**, a fin de garantizar el pago total y extensivo de la cantidad de **C$ ${totalAmount.toLocaleString('es-NI', {minimumFractionDigits: 2, maximumFractionDigits: 2})}** estipulado en el pagaré a la orden que antecede. Acepto hacer propia dicha obligación.`,
                `En fe de lo anterior firmo en la ciudad de **${(client?.municipality || 'León').toUpperCase()}**, el día **${format(documentDate, "dd 'de' MMMM 'del' yyyy", { locale: es })}**.`
            ];
            
            fiadorParagraphs.forEach(p => {
                y2 = drawRichText(page2, p, y2, font, fontBold, 11, contentWidth, 14, true);
                y2 -= 8;
            });

            y2 -= 70;
            
            const fiadorNameText = fiador.name.toUpperCase();
            const fiadorNameWidth = fontBold.widthOfTextAtSize(fiadorNameText, 10);
            page2.drawText(signatureLineText, { x: margin, y: y2, font: font, size: 12 });
            y2 -= 20;
            page2.drawText(fiadorNameText, { x: margin + (signatureLineWidth - fiadorNameWidth) / 2, y: y2, font: fontBold, size: 10 });
        }
        
        const pdfBytes = await pdfDoc.save();
        const pdfDataUri = `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`;
        
        return { pdfDataUri };

    } catch (e: any) {
        console.error("PDF Generation Error (Promissory Note):", e);
        return { error: `Error al generar el pagaré: ${e.message}` };
    }
}

    