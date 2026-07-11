import { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../config/db.js';

export async function exportPDFReport(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Fetch data aggregates
    const [matches, activeIncidents, bookings] = await Promise.all([
      prisma.match.findMany({
        take: 10,
        include: {
          team1: { select: { name: true } },
          team2: { select: { name: true } },
          stadium: { select: { name: true } }
        }
      }),
      prisma.incidentReport.findMany({
        where: { status: { not: 'RESOLVED' } },
        take: 10,
        include: {
          reportedBy: { select: { name: true } }
        }
      }),
      prisma.booking.findMany({
        take: 10,
        include: {
          user: { select: { name: true, email: true } },
          match: {
            include: {
              team1: { select: { name: true } },
              team2: { select: { name: true } }
            }
          }
        }
      })
    ]);

    // 2. Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="stadium_operations_summary.pdf"');

    // 3. Document generation
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(22).fillColor('#4f46e5').text('Smart Stadium Operations Platform', { align: 'center' });
    doc.fontSize(10).fillColor('#64748b').text('AUTOMATED COMPREHENSIVE PERFORMANCE AUDIT REPORT', { align: 'center', paragraphGap: 25 });
    
    doc.strokeColor('#e2e8f0').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Section 1: Active Match Fixtures
    doc.fontSize(14).fillColor('#1e293b').text('I. Scheduled Stadium Fixtures', { underline: true });
    doc.moveDown(0.5);

    if (matches.length === 0) {
      doc.fontSize(10).fillColor('#64748b').text('No scheduled matches in database.', { indent: 15 });
    } else {
      matches.forEach((m, idx) => {
        doc.fontSize(10).fillColor('#334155').text(`${idx + 1}. ${m.team1.name} vs ${m.team2.name} | Venue: ${m.stadium.name} | Status: ${m.status}`, { indent: 15 });
      });
    }

    doc.moveDown(2);

    // Section 2: Active Incident Logs
    doc.fontSize(14).fillColor('#1e293b').text('II. Active Safety & Dispatch Queue', { underline: true });
    doc.moveDown(0.5);

    if (activeIncidents.length === 0) {
      doc.fontSize(10).fillColor('#64748b').text('All clear. No safety issues in queue.', { indent: 15 });
    } else {
      activeIncidents.forEach((inc, idx) => {
        doc.fontSize(10).fillColor('#dc2626').text(`${idx + 1}. Location: ${inc.location} | Severity: ${inc.severity} | Reporter: ${inc.reportedBy?.name || 'Spectator'}`, { indent: 15 });
        doc.fontSize(9).fillColor('#64748b').text(`Description: "${inc.description}"`, { indent: 30 });
      });
    }

    doc.moveDown(2);

    // Section 3: Financial Summary
    doc.fontSize(14).fillColor('#1e293b').text('III. Seating Bookings & Ticketing Ledger', { underline: true });
    doc.moveDown(0.5);

    if (bookings.length === 0) {
      doc.fontSize(10).fillColor('#64748b').text('No ticketing transactions recorded.', { indent: 15 });
    } else {
      bookings.forEach((b, idx) => {
        doc.fontSize(10).fillColor('#059669').text(`${idx + 1}. Customer: ${b.user.name} | Match: ${b.match.team1.name} v ${b.match.team2.name} | Paid: $${b.totalPrice}`, { indent: 15 });
      });
    }

    doc.moveDown(3);
    doc.strokeColor('#e2e8f0').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#94a3b8').text(`Report generated automatically on: ${new Date().toLocaleString()} | Security Sealed`, { align: 'center' });

    // End Document Stream
    doc.end();

  } catch (err) {
    next(err);
  }
}

export async function exportCSVReport(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Fetch bookings
    const bookings = await prisma.booking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        match: {
          include: {
            team1: { select: { name: true } },
            team2: { select: { name: true } },
            stadium: { select: { name: true } }
          }
        }
      }
    });

    // 2. Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="stadium_bookings_ledger.csv"');

    // 3. Create CSV headers
    let csvContent = 'BookingID,CustomerName,CustomerEmail,Matchup,StadiumName,TicketsBooked,PricePaid,Status,CreatedAt\n';

    // 4. Populate rows
    bookings.forEach((b) => {
      const matchup = `"${b.match.team1.name} vs ${b.match.team2.name}"`;
      const stadium = `"${b.match.stadium.name}"`;
      const name = `"${b.user.name}"`;
      csvContent += `${b.id},${name},${b.user.email},${matchup},${stadium},${b.ticketsCount},${b.totalPrice},${b.status},${b.createdAt.toISOString()}\n`;
    });

    res.status(200).send(csvContent);

  } catch (err) {
    next(err);
  }
}
