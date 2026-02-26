import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function sanitizeString(str: string | undefined, maxLength = 200): string {
  if (!str) return '';
  return str.slice(0, maxLength).replace(/[<>]/g, '');
}

function validateEggInput(body: any): { valid: boolean; error?: string } {
  if (!body.farmId || typeof body.farmId !== 'string') {
    return { valid: false, error: 'Invalid farmId' };
  }
  if (!body.cageNo || typeof body.cageNo !== 'string') {
    return { valid: false, error: 'Cage number is required' };
  }
  if (!body.quantity || isNaN(parseInt(body.quantity))) {
    return { valid: false, error: 'Invalid quantity' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validation = validateEggInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    
    const quantity = Math.abs(parseInt(body.quantity));
    const cracks = body.cracks ? Math.abs(parseInt(body.cracks)) : 0;
    
    if (cracks > quantity) {
      return NextResponse.json({ error: 'Cracks cannot exceed quantity' }, { status: 400 });
    }
    
    const record = db.eggs.create({
      farmId: sanitizeString(body.farmId),
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      cageNo: sanitizeString(body.cageNo, 10).toUpperCase(),
      quantity,
      cracks,
      temperature: body.temperature ? Math.min(Math.max(parseFloat(body.temperature), -50), 100) : undefined,
      humidity: body.humidity ? Math.min(Math.max(parseFloat(body.humidity), 0), 100) : undefined,
      notes: sanitizeString(body.notes, 500),
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating egg record:', error);
    return NextResponse.json({ error: 'Failed to create egg record' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const farmId = searchParams.get('farmId');
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const cageNo = searchParams.get('cageNo');
  const export_ = searchParams.get('export');

  try {
    const records = db.eggs.findMany({ 
      farmId: farmId || undefined, 
      cageNo: cageNo || undefined,
      month: month || undefined, 
      year: year || undefined 
    });

    if (export_ === 'csv') {
      const csvHeader = 'Date,Cage,Quantity,Cracks,Temperature,Humidity,Notes';
      const csvRows = records.map(r => 
        `${new Date(r.date).toISOString().split('T')[0]},${r.cageNo},${r.quantity},${r.cracks},${r.temperature || ''},${r.humidity || ''},"${r.notes || ''}"`
      );
      const csv = [csvHeader, ...csvRows].join('\n');
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="eggs.csv"',
        },
      });
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching egg records:', error);
    return NextResponse.json({ error: 'Failed to fetch egg records' }, { status: 500 });
  }
}
