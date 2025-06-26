import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { statistics, dateRange } = await request.json()

    // Erstelle eine druckoptimierte HTML-Seite für PDF-Export
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Statistiken Export - Orderman System</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
          }
          h1 { 
            color: #2563eb; 
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 30px;
          }
          h2 { 
            color: #1f2937; 
            margin-top: 30px;
            margin-bottom: 15px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          th, td { 
            border: 1px solid #e5e7eb; 
            padding: 12px 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f3f4f6; 
            font-weight: 600;
            color: #374151;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .metric { 
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            padding: 20px; 
            margin: 20px 0;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
          }
          .metric h2 {
            margin-top: 0;
            color: #1e40af;
          }
          .metric p {
            margin: 8px 0;
            font-size: 16px;
          }
          .header-info {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
          }
          .footer {
            margin-top: 40px; 
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px; 
            color: #6b7280;
            text-align: center;
          }
          .print-btn {
            background-color: #2563eb;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 20px;
            font-size: 14px;
          }
          .print-btn:hover {
            background-color: #1d4ed8;
          }
        </style>
        <script>
          function printPage() {
            window.print();
          }
          window.onload = function() {
            // Auto-print nach 1 Sekunde
            setTimeout(function() {
              window.print();
            }, 1000);
          }
        </script>
      </head>
      <body>
        <button class="print-btn no-print" onclick="printPage()">Als PDF drucken</button>
        
        <h1>📊 Statistiken Export - Orderman System</h1>
        
        <div class="header-info">
          <strong>Berichtszeitraum:</strong> ${new Date(dateRange.from).toLocaleDateString('de-DE')} bis ${new Date(dateRange.to).toLocaleDateString('de-DE')}<br>
          <strong>Erstellt am:</strong> ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}<br>
          <strong>Erstellt von:</strong> ${session.user.name} (${session.user.role === 'ADMIN' ? 'Administrator' : 'Kellner'})
        </div>
        
        <div class="metric">
          <h2>📈 Übersicht</h2>
          <p><strong>Gesamte Bestellungen:</strong> ${statistics.totalOrders}</p>
          <p><strong>Gesamtumsatz:</strong> €${statistics.totalRevenue.toFixed(2)}</p>
          <p><strong>Durchschnittlicher Bestellwert:</strong> €${statistics.averageOrderValue.toFixed(2)}</p>
          <p><strong>Aktive Verkaufstage:</strong> ${statistics.revenueByDay.length}</p>
        </div>

        <h2>🏆 Top Produkte</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 60px;">Rang</th>
              <th>Produkt</th>
              <th style="width: 120px;">Verkaufte Menge</th>
              <th style="width: 100px;">Umsatz</th>
              <th style="width: 80px;">Anteil</th>
            </tr>
          </thead>
          <tbody>
            ${statistics.topProducts.map((product: any, index: number) => `
              <tr>
                <td style="text-align: center; font-weight: 600;">${index + 1}</td>
                <td><strong>${product.name}</strong></td>
                <td style="text-align: center;">${product.quantity}x</td>
                <td style="text-align: right; font-weight: 600;">€${product.revenue.toFixed(2)}</td>
                <td style="text-align: center;">${((product.revenue / statistics.totalRevenue) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>📅 Täglicher Umsatz</h2>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Wochentag</th>
              <th style="width: 100px;">Bestellungen</th>
              <th style="width: 100px;">Umsatz</th>
              <th style="width: 120px;">Ø pro Bestellung</th>
            </tr>
          </thead>
          <tbody>
            ${statistics.revenueByDay.map((day: any) => `
              <tr>
                <td>${new Date(day.date).toLocaleDateString('de-DE')}</td>
                <td>${new Date(day.date).toLocaleDateString('de-DE', { weekday: 'long' })}</td>
                <td style="text-align: center;">${day.orders}</td>
                <td style="text-align: right; font-weight: 600;">€${day.revenue.toFixed(2)}</td>
                <td style="text-align: right;">€${(day.revenue / day.orders).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>🍕 Kategorien-Analyse</h2>
        <table>
          <thead>
            <tr>
              <th>Kategorie</th>
              <th style="width: 120px;">Verkaufte Menge</th>
              <th style="width: 100px;">Umsatz</th>
              <th style="width: 80px;">Anteil</th>
            </tr>
          </thead>
          <tbody>
            ${statistics.categoryStats.map((category: any) => `
              <tr>
                <td><strong>${category.category}</strong></td>
                <td style="text-align: center;">${category.quantity}x</td>
                <td style="text-align: right; font-weight: 600;">€${category.revenue.toFixed(2)}</td>
                <td style="text-align: center;">${((category.revenue / statistics.totalRevenue) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Orderman Restaurant Management System - Statistiken Export</p>
          <p>Generiert am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}</p>
        </div>
      </body>
      </html>
    `

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="statistiken-${dateRange.from}-${dateRange.to}.html"`
      }
    })

  } catch (error) {
    console.error('Fehler beim Exportieren der Statistiken:', error)
    return NextResponse.json(
      { error: 'Fehler beim Exportieren der Statistiken' },
      { status: 500 }
    )
  }
} 